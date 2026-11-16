/**
 * supabaseClient.js — Cliente oficial do Supabase via CDN
 * Carrega a biblioteca global 'supabase' e inicializa a conexão segura.
 */

(function () {
  "use strict";

  // Substitua com as credenciais do seu projeto Supabase:
  // Painel Supabase -> Project Settings -> API -> Project URL & Project API Keys (anon / public)
  const SUPABASE_URL = "https://eatawuplyujqtqarqrev.supabase.co";
  const SUPABASE_ANON_KEY = "sb_publishable_143l_vLZN5MtHPjZX_DlvA_WKV_nQGL";

  if (!window.supabase) {
    console.error("A biblioteca @supabase/supabase-js não foi carregada via CDN.");
    return;
  }

  // Cria cliente Supabase persistente na window
  window.alugaeSupabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: window.localStorage,
    },
  });

  window.ALUGAE_CONFIG = {
    SUPABASE_URL,
    STORAGE_PUBLIC_URL: `${SUPABASE_URL}/storage/v1/object/public/produtos`,
  };
})();
