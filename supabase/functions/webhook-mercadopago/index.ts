// supabase/functions/webhook-mercadopago/index.ts
// Edge Function: Webhook do Mercado Pago para confirmação real de pagamentos
// Configurada com deploy: --no-verify-jwt (requisição pública originada do Mercado Pago)

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type, x-signature, x-request-id",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

/**
 * Validação de assinatura HMAC SHA-256 do Mercado Pago
 * Header: x-signature (ts=...,v1=...)
 */
async function verifyMercadoPagoSignature(
  xSignature: string | null,
  requestId: string | null,
  dataId: string | null,
  secret: string
): Promise<boolean> {
  if (!xSignature || !secret) {
    return false;
  }

  try {
    const parts = xSignature.split(",").reduce((acc: Record<string, string>, cur) => {
      const [k, v] = cur.trim().split("=");
      if (k && v) acc[k] = v;
      return acc;
    }, {});

    const ts = parts["ts"];
    const hash = parts["v1"];

    if (!ts || !hash) return false;

    // Manifesto de validação do Mercado Pago: id:[data.id_url];request-id:[x-request-id];ts:[ts];
    let manifest = "";
    if (dataId) {
      manifest += `id:${dataId};`;
    }
    if (requestId) {
      manifest += `request-id:${requestId};`;
    }
    manifest += `ts:${ts};`;

    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const signatureBytes = await crypto.subtle.sign("HMAC", key, encoder.encode(manifest));
    const calculatedHash = Array.from(new Uint8Array(signatureBytes))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    return calculatedHash === hash;
  } catch (err) {
    console.error("Erro ao validar assinatura:", err);
    return false;
  }
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const mpAccessToken = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN") ?? "";
    const webhookSecret = Deno.env.get("MERCADO_PAGO_WEBHOOK_SECRET") ?? "";

    if (!supabaseServiceKey || !mpAccessToken) {
      console.error("Configurações ausentes para processar webhook.");
      return new Response("Configuração pendente", { status: 500 });
    }

    const url = new URL(req.url);
    const xSignature = req.headers.get("x-signature");
    const requestId = req.headers.get("x-request-id");

    const bodyText = await req.text();
    let body: any = {};
    try {
      body = bodyText ? JSON.parse(bodyText) : {};
    } catch {
      body = {};
    }

    // Mercado Pago pode enviar ID pelo corpo (body.data.id) ou pela URL (?data.id=... ou ?id=...)
    const paymentId =
      body?.data?.id ||
      url.searchParams.get("data.id") ||
      url.searchParams.get("id") ||
      body?.id;

    const action = body?.action || body?.type || url.searchParams.get("type");

    console.log(`[Webhook MP] Evento: ${action}, PaymentID: ${paymentId}`);

    // Quando configurado, o segredo deve ser obrigatório para qualquer evento.
    if (webhookSecret) {
      if (!xSignature || !requestId) {
        console.warn("[Webhook MP] Assinatura ausente.");
        return new Response("Assinatura ausente", { status: 401 });
      }

      const isValid = await verifyMercadoPagoSignature(
        xSignature,
        requestId,
        paymentId ? String(paymentId) : null,
        webhookSecret
      );
      if (!isValid) {
        console.warn("[Webhook MP] Assinatura x-signature inválida.");
        return new Response("Assinatura inválida", { status: 401 });
      }
    }

    // Se não for evento de pagamento, responde 200 para liberar o webhook
    if (action && !action.includes("payment") && action !== "payment.created" && action !== "payment.updated") {
      return new Response(JSON.stringify({ status: "ignored" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!paymentId) {
      return new Response(JSON.stringify({ status: "no_payment_id" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 1. Sempre consulta o status oficial do pagamento diretamente na API do Mercado Pago (Segurança Zero Trust)
    const mpPaymentRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: {
        Authorization: `Bearer ${mpAccessToken}`,
      },
    });

    if (!mpPaymentRes.ok) {
      console.error(`[Webhook MP] Falha ao consultar pagamento ${paymentId}: ${mpPaymentRes.status}`);
      return new Response("Falha na consulta ao Mercado Pago", { status: 502 });
    }

    const payment = await mpPaymentRes.json();
    const externalReference = payment.external_reference; // UUID da reserva
    const mpStatus = payment.status; // 'approved', 'rejected', 'in_process', 'cancelled', 'refunded'
    const paymentMethodId = payment.payment_method_id || payment.payment_type_id || "desconhecido";

    console.log(`[Webhook MP] Pagamento ${paymentId}: Status='${mpStatus}', ExternalRef='${externalReference}'`);

    if (!externalReference) {
      console.warn("[Webhook MP] Pagamento sem external_reference associado.");
      return new Response(JSON.stringify({ status: "sem_external_reference" }), { status: 200 });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // 2. Busca a reserva no banco de dados
    const { data: reservation, error: resErr } = await supabaseAdmin
      .from("reservations")
      .select("id, status, codigo")
      .eq("id", externalReference)
      .single();

    if (resErr || !reservation) {
      console.error(`[Webhook MP] Reserva ${externalReference} não encontrada no banco.`);
      return new Response(JSON.stringify({ status: "reserva_nao_encontrada" }), { status: 200 });
    }

    // 3. Idempotência: Se já está paga, não reprocessa
    if (reservation.status === "paga" && mpStatus === "approved") {
      console.log(`[Webhook MP] Reserva ${reservation.codigo} já estava como 'paga'. Nenhuma alteração.`);
      return new Response(JSON.stringify({ status: "already_paid" }), { status: 200 });
    }

    // 4. Mapeia e atualiza o status no banco
    let newStatus = reservation.status;
    if (mpStatus === "approved") {
      newStatus = "paga";
    } else if (mpStatus === "cancelled") {
      newStatus = "cancelada";
    } else if (mpStatus === "rejected") {
      // Mantém 'aguardando_pagamento' até expirar, permitindo ao usuário tentar pagar novamente
      newStatus = "aguardando_pagamento";
    }

    const { error: updateErr } = await supabaseAdmin
      .from("reservations")
      .update({
        status: newStatus,
        mp_payment_id: String(paymentId),
        metodo_pagamento: paymentMethodId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", reservation.id);

    if (updateErr) {
      console.error("[Webhook MP] Erro ao atualizar status da reserva:", updateErr);
      return new Response("Erro de banco", { status: 500 });
    }

    console.log(`[Webhook MP] Reserva ${reservation.codigo} atualizada com sucesso para status: ${newStatus}`);

    return new Response(JSON.stringify({ success: true, newStatus }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("[Webhook MP] Exceção:", err);
    return new Response(JSON.stringify({ error: err.message || "Erro interno" }), { status: 500 });
  }
});
