import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

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
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const jwt = authHeader.replace("Bearer ", "").trim();
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(jwt);

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Sessão inválida ou expirada." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { reservation_id } = await req.json();
    if (!reservation_id) {
      return new Response(JSON.stringify({ error: "ID da reserva ausente." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: reservation, error: resErr } = await supabaseAdmin
      .from("reservations")
      .select(`
        id, status, data_fim,
        product:product_id ( id, owner_id )
      `)
      .eq("id", reservation_id)
      .single();

    if (resErr || !reservation) {
      return new Response(JSON.stringify({ error: "Reserva não encontrada." }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ownerId = (reservation as any).product?.owner_id;
    if (ownerId !== user.id) {
      return new Response(JSON.stringify({ error: "Apenas a loja dona da peça pode confirmar este pagamento." }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (reservation.status === "paga") {
      return new Response(JSON.stringify({ success: true, already_paid: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (reservation.status !== "aguardando_pagamento") {
      return new Response(JSON.stringify({ error: "Somente reservas aguardando pagamento podem ser confirmadas." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { error: updateErr } = await supabaseAdmin
      .from("reservations")
      .update({
        status: "paga",
        repasse_status: "pendente",
        repasse_previsto_para: new Date(`${reservation.data_fim}T23:59:59Z`).toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", reservation_id);

    if (updateErr) {
      return new Response(JSON.stringify({ error: "Não foi possível confirmar o pagamento." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("Erro confirmar-pagamento-loja:", err);
    return new Response(JSON.stringify({ error: err.message || "Erro interno do servidor." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
