import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-admin-token",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const ADMIN_USERNAME = "admin";
const ADMIN_EMAIL = "admin@alugae.com.br";
const TOKEN_TTL_MS = 12 * 60 * 60 * 1000; // 12 horas

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

async function signAdminToken(secret: string): Promise<string> {
  const payload = btoa(JSON.stringify({ role: "admin", exp: Date.now() + TOKEN_TTL_MS }));
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return `${payload}.${toHex(sig)}`;
}

async function verifyAdminToken(token: string, secret: string): Promise<boolean> {
  const parts = token.split(".");
  if (parts.length !== 2) return false;
  const [payload, providedSig] = parts;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const expectedBuf = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  const expectedSig = toHex(expectedBuf);

  if (!timingSafeEqual(providedSig, expectedSig)) return false;

  try {
    const parsed = JSON.parse(atob(payload));
    return parsed?.role === "admin" && typeof parsed?.exp === "number" && parsed.exp > Date.now();
  } catch {
    return false;
  }
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const adminPassword = Deno.env.get("ADMIN_PASSWORD") ?? "";
    const tokenSecret = Deno.env.get("ADMIN_TOKEN_SECRET") || `${supabaseServiceKey}:${adminPassword}`;

    if (!adminPassword) {
      return new Response(JSON.stringify({ error: "Senha de administrador não configurada no servidor." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { action } = body;

    if (action === "login") {
      const username = String(body.username || "").trim().toLowerCase();
      const password = String(body.password || "");

      const validUser = username === ADMIN_USERNAME || username === ADMIN_EMAIL;
      const validPass = timingSafeEqual(password, adminPassword);

      if (!validUser || !validPass) {
        return new Response(JSON.stringify({ error: "Usuário ou senha de administrador inválidos." }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const token = await signAdminToken(tokenSecret);
      return new Response(JSON.stringify({ success: true, token }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminToken = req.headers.get("x-admin-token") || "";
    const isAuthorized = await verifyAdminToken(adminToken, tokenSecret);
    if (!isAuthorized) {
      return new Response(JSON.stringify({ error: "Sessão administrativa inválida ou expirada." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    if (action === "confirm_payment") {
      const reservationId = String(body.reservation_id || "").trim();
      if (!reservationId) {
        return new Response(JSON.stringify({ error: "ID da reserva ausente." }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: res, error: fetchErr } = await supabaseAdmin
        .from("reservations")
        .select("id, status, data_fim")
        .eq("id", reservationId)
        .single();

      if (fetchErr || !res) {
        return new Response(JSON.stringify({ error: "Reserva não encontrada." }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { error: updateErr } = await supabaseAdmin
        .from("reservations")
        .update({
          status: "paga",
          repasse_status: "pendente",
          repasse_previsto_para: new Date(`${res.data_fim}T23:59:59Z`).toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", reservationId);

      if (updateErr) {
        return new Response(JSON.stringify({ error: "Erro ao confirmar pagamento." }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "complete_sale") {
      const reservationId = String(body.reservation_id || "").trim();
      if (!reservationId) {
        return new Response(JSON.stringify({ error: "ID da reserva ausente." }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: res, error: fetchErr } = await supabaseAdmin
        .from("reservations")
        .select("id, status")
        .eq("id", reservationId)
        .single();

      if (fetchErr || !res) {
        return new Response(JSON.stringify({ error: "Reserva não encontrada." }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (res.status !== "paga") {
        return new Response(JSON.stringify({ error: "Confirme o pagamento antes de concluir a venda." }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { error: updateErr } = await supabaseAdmin
        .from("reservations")
        .update({
          repasse_status: "repassado",
          updated_at: new Date().toISOString(),
        })
        .eq("id", reservationId);

      if (updateErr) {
        return new Response(JSON.stringify({ error: "Erro ao concluir venda." }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "cancel_reservation") {
      const reservationId = String(body.reservation_id || "").trim();
      if (!reservationId) {
        return new Response(JSON.stringify({ error: "ID da reserva ausente." }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { error: updateErr } = await supabaseAdmin
        .from("reservations")
        .update({
          status: "cancelada",
          repasse_status: "nao_aplicavel",
          updated_at: new Date().toISOString(),
        })
        .eq("id", reservationId);

      if (updateErr) {
        return new Response(JSON.stringify({ error: "Erro ao cancelar reserva." }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "dashboard") {
      await supabaseAdmin.rpc("expirar_reservas_vencidas");

      const [
        { data: reservations, error: resErr },
        { count: productsCount },
        { count: usersCount },
      ] = await Promise.all([
        supabaseAdmin
          .from("reservations")
          .select(`
            id, codigo, data_inicio, data_fim, dias,
            valor_diarias, valor_total, valor_bruto,
            taxa_plataforma, taxa_mercado_pago, valor_repasse,
            status, metodo_pagamento, repasse_status, created_at,
            product:product_id ( id, titulo, owner:owner_id ( id, nome, nome_loja ) ),
            renter:renter_id ( id, nome, telefone )
          `)
          .order("created_at", { ascending: false }),
        supabaseAdmin.from("products").select("id", { count: "exact", head: true }).eq("ativo", true),
        supabaseAdmin.from("profiles").select("id", { count: "exact", head: true }),
      ]);

      if (resErr) {
        return new Response(JSON.stringify({ error: "Erro ao carregar dados do painel." }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const list = reservations || [];
      const paid = list.filter((r: any) => r.status === "paga");
      const pending = list.filter((r: any) => r.status === "aguardando_pagamento");

      const round2 = (n: number) => Number(n.toFixed(2));
      const gmv = round2(paid.reduce((s: number, r: any) => s + Number(r.valor_total || 0), 0));
      const lucroAlugae = round2(paid.reduce((s: number, r: any) => s + Number(r.taxa_plataforma || 0), 0));
      const totalRepasse = round2(paid.reduce((s: number, r: any) => s + Number(r.valor_repasse || 0), 0));
      const totalTaxasMp = round2(paid.reduce((s: number, r: any) => s + Number(r.taxa_mercado_pago || 0), 0));
      const ticketMedio = paid.length > 0 ? round2(gmv / paid.length) : 0;

      const pixPaid = paid.filter((r: any) => r.metodo_pagamento === "pix_direto");
      const mpPaid = paid.filter((r: any) => r.metodo_pagamento !== "pix_direto");

      return new Response(
        JSON.stringify({
          success: true,
          metrics: {
            total_vendas: paid.length,
            reservas_pendentes: pending.length,
            total_reservas: list.length,
            gmv,
            lucro_alugae: lucroAlugae,
            total_repasse: totalRepasse,
            total_taxas_mp: totalTaxasMp,
            ticket_medio: ticketMedio,
            produtos_ativos: productsCount || 0,
            total_usuarios: usersCount || 0,
            por_metodo: {
              pix_direto: {
                quantidade: pixPaid.length,
                total: round2(pixPaid.reduce((s: number, r: any) => s + Number(r.valor_total || 0), 0)),
                lucro: round2(pixPaid.reduce((s: number, r: any) => s + Number(r.taxa_plataforma || 0), 0)),
              },
              mercadopago: {
                quantidade: mpPaid.length,
                total: round2(mpPaid.reduce((s: number, r: any) => s + Number(r.valor_total || 0), 0)),
                lucro: round2(mpPaid.reduce((s: number, r: any) => s + Number(r.taxa_plataforma || 0), 0)),
              },
            },
          },
          reservations: list,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ error: "Ação inválida." }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("Erro admin-panel:", err);
    return new Response(JSON.stringify({ error: err.message || "Erro interno do servidor." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
