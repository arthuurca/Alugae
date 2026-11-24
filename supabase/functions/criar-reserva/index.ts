// supabase/functions/criar-reserva/index.ts
// Edge Function: Criação de Reserva e Preferência Mercado Pago Checkout Pro
// Executa com JWT do usuário (usuário logado obrigatório)

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const PIX_DISCOUNT_RATE = 0.01; // 1% de desconto no Pix Direto

function formatTlv(id: string, value: string): string {
  const len = String(value.length).padStart(2, "0");
  return `${id}${len}${value}`;
}

function sanitizePixText(text: string, maxLen: number): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z0-9 ]/g, "")
    .trim()
    .toUpperCase()
    .slice(0, maxLen) || "ALUGAE";
}

function crc16Ccitt(payload: string): string {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = (crc & 0x8000) !== 0 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

function buildPixBrCode({
  pixKey,
  merchantName,
  merchantCity,
  amount,
  txid,
}: {
  pixKey: string;
  merchantName: string;
  merchantCity: string;
  amount: number;
  txid: string;
}): string {
  const gui = formatTlv("00", "br.gov.bcb.pix");
  const key = formatTlv("01", pixKey.trim());
  const merchantAccount = formatTlv("26", `${gui}${key}`);

  const cleanTxid = txid.replace(/[^A-Za-z0-9]/g, "").slice(0, 25) || "ALUGAE";
  const additionalData = formatTlv("62", formatTlv("05", cleanTxid));

  const payloadWithoutCrc = [
    formatTlv("00", "01"),
    merchantAccount,
    formatTlv("52", "0000"),
    formatTlv("53", "986"),
    formatTlv("54", amount.toFixed(2)),
    formatTlv("58", "BR"),
    formatTlv("59", sanitizePixText(merchantName, 25)),
    formatTlv("60", sanitizePixText(merchantCity, 15)),
    additionalData,
    "6304",
  ].join("");

  return `${payloadWithoutCrc}${crc16Ccitt(payloadWithoutCrc)}`;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Usuário não autenticado." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const mpAccessToken = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN") ?? "";
    const siteUrl = Deno.env.get("SITE_URL") ?? "http://localhost:5500";

    if (!supabaseServiceKey || !mpAccessToken) {
      console.error("Configurações do servidor incompletas.");
      return new Response(JSON.stringify({ error: "Configuração do servidor pendente." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Cliente autenticado para obter dados do usuário do token JWT
    const jwt = authHeader.replace(/^Bearer\s+/i, "");
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(jwt);

    if (userError || !user) {
      console.error("Erro auth.getUser:", userError);
      return new Response(JSON.stringify({ error: "Sessão inválida ou expirada. Faça login novamente." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { product_id, data_inicio, data_fim, tamanho, notes, payment_method } = body;
    const paymentMethod = payment_method === "pix_direto" ? "pix_direto" : "mercadopago";

    if (!product_id || !data_inicio || !data_fim) {
      return new Response(JSON.stringify({ error: "Parâmetros obrigatórios ausentes." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validação de datas
    const startDate = new Date(data_inicio + "T00:00:00");
    const endDate = new Date(data_fim + "T00:00:00");
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return new Response(JSON.stringify({ error: "Datas inválidas." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (startDate < today) {
      return new Response(JSON.stringify({ error: "A data de início não pode ser no passado." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (endDate < startDate) {
      return new Response(JSON.stringify({ error: "A data de término deve ser posterior ou igual à de início." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const diffDays = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    if (diffDays <= 0 || diffDays > 60) {
      return new Response(JSON.stringify({ error: "Período de locação inválido (máx. 60 dias)." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1. Busca produto no banco (NUNCA confia no preço enviado pelo frontend)
    const { data: product, error: prodError } = await supabaseAdmin
      .from("products")
      .select("id, titulo, preco_diaria, ativo, owner_id")
      .eq("id", product_id)
      .single();

    if (prodError || !product || !product.ativo) {
      return new Response(JSON.stringify({ error: "Peça indisponível ou não encontrada." }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Limpa reservas expiradas antes de checar conflito
    await supabaseAdmin.rpc("expirar_reservas_vencidas");

    // 3. Verifica se o período já está ocupado por outra reserva ativa ('paga' ou 'aguardando_pagamento' não expirada)
    const { data: conflitos, error: confError } = await supabaseAdmin
      .from("reservations")
      .select("id")
      .eq("product_id", product.id)
      .in("status", ["paga", "aguardando_pagamento"])
      .gt("expires_at", new Date().toISOString())
      .lte("data_inicio", data_fim)
      .gte("data_fim", data_inicio);

    if (confError) {
      console.error("Erro ao verificar conflito:", confError);
      return new Response(JSON.stringify({ error: "Falha ao verificar disponibilidade." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (conflitos && conflitos.length > 0) {
      return new Response(
        JSON.stringify({ error: "A peça já está reservada para as datas selecionadas. Escolha outro período." }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 4. Cálculo do valor total no servidor
    const precoDiaria = Number(product.preco_diaria);
    const valorDiarias = Number((precoDiaria * diffDays).toFixed(2));
    const isPixDireto = paymentMethod === "pix_direto";
    const descontoPix = isPixDireto ? Number((valorDiarias * PIX_DISCOUNT_RATE).toFixed(2)) : 0;
    const valorTotal = Number((valorDiarias - descontoPix).toFixed(2));
    const taxaPlataforma = Number((valorTotal * 0.10).toFixed(2));
    const valorRepasse = Number((valorTotal - taxaPlataforma).toFixed(2));

    // Código da reserva amigável único: RES-XXXXX
    const codigo = "RES-" + Math.random().toString(36).substring(2, 7).toUpperCase();

    // Expiração em 30 minutos para pagamento
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

    // 5. Criação da reserva no banco
    const { data: reservation, error: resError } = await supabaseAdmin
      .from("reservations")
      .insert({
        codigo,
        product_id: product.id,
        renter_id: user.id,
        tamanho: tamanho || null,
        data_inicio,
        data_fim,
        dias: diffDays,
        valor_diarias: valorDiarias,
        valor_caucao: 0,
        valor_total: valorTotal,
        valor_bruto: valorDiarias,
        taxa_plataforma: taxaPlataforma,
        taxa_mercado_pago: 0,
        valor_repasse: valorRepasse,
        metodo_pagamento: isPixDireto ? "pix_direto" : null,
        status: "aguardando_pagamento",
        expires_at: expiresAt.toISOString(),
        notes: notes || null,
      })
      .select()
      .single();

    if (resError) {
      console.error("Erro ao salvar reserva:", resError);
      return new Response(JSON.stringify({ error: "Não foi possível criar a reserva. Tente novamente." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (isPixDireto) {
      const pixKey = Deno.env.get("PIX_KEY") || "contato@alugae.com.br";
      const pixMerchantName = Deno.env.get("PIX_MERCHANT_NAME") || "ALUGAE MODA";
      const pixMerchantCity = Deno.env.get("PIX_MERCHANT_CITY") || "SAO PAULO";
      const pixPayload = buildPixBrCode({
        pixKey,
        merchantName: pixMerchantName,
        merchantCity: pixMerchantCity,
        amount: valorTotal,
        txid: codigo,
      });

      return new Response(
        JSON.stringify({
          success: true,
          payment_method: "pix_direto",
          reservation_id: reservation.id,
          codigo,
          valor_diarias: valorDiarias,
          desconto_pix: descontoPix,
          valor_total: valorTotal,
          pix_payload: pixPayload,
          pix_configured: Boolean(Deno.env.get("PIX_KEY")),
          redirect_url: `confirmacao.html?ref=${codigo}&method=pix`,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // 6. Criação da Preferência no Mercado Pago Checkout Pro
    const webhookUrl = `${supabaseUrl}/functions/v1/webhook-mercadopago`;
    const backSuccessUrl = `${siteUrl.replace(/\/$/, "")}/confirmacao.html?ref=${codigo}&status=success`;
    const backFailureUrl = `${siteUrl.replace(/\/$/, "")}/confirmacao.html?ref=${codigo}&status=failure`;
    const backPendingUrl = `${siteUrl.replace(/\/$/, "")}/confirmacao.html?ref=${codigo}&status=pending`;

    const mpItems = [
      {
        id: String(product.id),
        title: `Aluguel: ${product.titulo} (${diffDays} ${diffDays === 1 ? "dia" : "dias"})`,
        description: `Período de ${data_inicio} a ${data_fim}`,
        category_id: "fashion",
        quantity: 1,
        currency_id: "BRL",
        unit_price: valorDiarias,
      },
    ];


    const preferencePayload = {
      items: mpItems,
      payer: {
        email: user.email,
      },
      back_urls: {
        success: backSuccessUrl,
        failure: backFailureUrl,
        pending: backPendingUrl,
      },
      auto_return: "approved",
      external_reference: reservation.id,
      notification_url: webhookUrl,
      expires: true,
      expiration_date_to: expiresAt.toISOString(),
      statement_descriptor: "ALUGAE MODA",
      payment_methods: {
        excluded_payment_types: [],
        installments: 6,
      },
    };

    const mpRes = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${mpAccessToken}`,
      },
      body: JSON.stringify(preferencePayload),
    });

    if (!mpRes.ok) {
      const errText = await mpRes.text();
      console.error("Erro Mercado Pago Preference:", errText);
      // Remove reserva para não prender a data
      await supabaseAdmin.from("reservations").delete().eq("id", reservation.id);
      return new Response(JSON.stringify({ error: "Erro ao gerar checkout de pagamento." }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const mpData = await mpRes.json();
    const isTestToken = mpAccessToken.startsWith("TEST-");
    const checkoutUrl = isTestToken
      ? (mpData.sandbox_init_point || mpData.init_point)
      : mpData.init_point;

    // Atualiza a reserva com o ID da preferência do Mercado Pago
    await supabaseAdmin
      .from("reservations")
      .update({ mp_preference_id: mpData.id })
      .eq("id", reservation.id);

    return new Response(
      JSON.stringify({
        success: true,
        reservation_id: reservation.id,
        codigo,
        init_point: mpData.init_point,
        sandbox_init_point: mpData.sandbox_init_point,
        checkout_url: checkoutUrl,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err: any) {
    console.error("Exceção não tratada:", err);
    return new Response(JSON.stringify({ error: err.message || "Erro interno do servidor." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
