/**
 * api.js — Camada de abstração para dados, autenticação e pagamentos.
 * Isola as chamadas ao Supabase e às Edge Functions do restante da interface.
 */

(function () {
  "use strict";

  const getClient = () => window.alugaeSupabase;

  window.AlugaeAPI = {
    // ── AUTHENTICATION ────────────────────────────────────────

    /**
     * Retorna a sessão ativa atual
     */
    async getSession() {
      const client = getClient();
      if (!client) return null;
      const { data, error } = await client.auth.getSession();
      if (error) return null;
      return data.session;
    },

    /**
     * Retorna o usuário logado e seu perfil completo da tabela profiles
     */
    async getCurrentUser() {
      const client = getClient();
      if (!client) return null;
      const { data: { user }, error } = await client.auth.getUser();
      if (error || !user) return null;

      const { data: profile } = await client
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      return {
        ...user,
        profile: profile || {
          nome: user.user_metadata?.nome || user.email?.split("@")[0],
          tipo: user.user_metadata?.tipo || "locatario",
          nome_loja: user.user_metadata?.nome_loja,
          cidade: user.user_metadata?.cidade,
          descricao_loja: user.user_metadata?.descricao_loja,
        },
      };
    },

    /**
     * Cadastro de novo usuário com dados de perfil nos metadados
     */
    async signUp({ email, password, nome, telefone, tipo, nome_loja, cidade, descricao_loja }) {
      const client = getClient();
      return await client.auth.signUp({
        email,
        password,
        options: {
          data: {
            nome,
            telefone,
            tipo: tipo || "locatario",
            nome_loja: nome_loja || null,
            cidade: cidade || null,
            descricao_loja: descricao_loja || null,
          },
        },
      });
    },

    /**
     * Login por e-mail e senha
     */
    async signIn(email, password) {
      const client = getClient();
      return await client.auth.signInWithPassword({ email, password });
    },

    /**
     * Logout
     */
    async signOut() {
      const client = getClient();
      return await client.auth.signOut();
    },

    /**
     * Solicitação de redefinição de senha por e-mail
     */
    async resetPassword(email) {
      const client = getClient();
      const redirectUrl = `${window.location.origin}/redefinir-senha.html`;
      return await client.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });
    },

    /**
     * Atualização de senha para usuário autenticado via link de recuperação
     */
    async updatePassword(newPassword) {
      const client = getClient();
      return await client.auth.updateUser({ password: newPassword });
    },

    /**
     * Atualização dos dados do próprio perfil
     */
    async updateProfile(updates) {
      const client = getClient();
      const user = (await client.auth.getUser()).data.user;
      if (!user) throw new Error("Usuário não autenticado");

      // Proteção de segurança: nunca envia o campo 'tipo' para evitar violação do trigger
      const cleanUpdates = { ...updates };
      delete cleanUpdates.tipo;
      delete cleanUpdates.id;

      return await client
        .from("profiles")
        .update(cleanUpdates)
        .eq("id", user.id);
    },

    // ── PRODUCTS ──────────────────────────────────────────────

    /**
     * Busca todos os produtos ativos com dados da loja associada
     */
    async getProducts() {
      const client = getClient();
      if (!client) return { data: [], error: "Supabase não inicializado" };

      const { data, error } = await client
        .from("products")
        .select(`
          *,
          profiles:owner_id (
            id, nome, nome_loja, cidade, descricao_loja
          )
        `)
        .eq("ativo", true)
        .order("id", { ascending: true });

      return { data, error };
    },

    /**
     * Busca um produto específico pelo ID
     */
    async getProductById(id) {
      const client = getClient();
      if (!client) return { data: null, error: "Supabase não inicializado" };

      const { data, error } = await client
        .from("products")
        .select(`
          *,
          profiles:owner_id (
            id, nome, nome_loja, cidade, descricao_loja
          )
        `)
        .eq("id", id)
        .single();

      return { data, error };
    },

    /**
     * Busca produtos criados pelo anunciante logado
     */
    async getMyProducts() {
      const client = getClient();
      const user = (await client.auth.getUser()).data.user;
      if (!user) return { data: [], error: "Não autenticado" };

      return await client
        .from("products")
        .select("*")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false });
    },

    /**
     * Ativa ou desativa um produto do anunciante
     */
    async toggleProductStatus(productId, ativo) {
      const client = getClient();
      return await client
        .from("products")
        .update({ ativo })
        .eq("id", productId);
    },

    /**
     * Criação de novo anúncio com upload de imagem para o Storage
     */
    async createProduct({ titulo, categoria, tamanhos, preco_diaria, caucao, descricao, imageFile }) {
      const client = getClient();
      const user = (await client.auth.getUser()).data.user;
      if (!user) throw new Error("Você precisa estar logado para publicar uma peça.");

      let imagensUrls = [];

      // 1. Upload da foto para o bucket 'produtos' dentro da pasta do anunciante
      if (imageFile) {
        if (!imageFile.type.startsWith("image/")) {
          throw new Error("O arquivo selecionado deve ser uma imagem válida.");
        }
        if (imageFile.size > 5 * 1024 * 1024) {
          throw new Error("A imagem deve ter no máximo 5 MB.");
        }

        const ext = imageFile.name.split(".").pop() || "jpg";
        const filePath = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;

        const { error: uploadErr } = await client.storage
          .from("produtos")
          .upload(filePath, imageFile, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadErr) {
          console.error("Erro no upload da foto:", uploadErr);
          throw new Error("Falha ao salvar a foto da peça. Verifique suas permissões.");
        }

        const { data: pubUrl } = client.storage.from("produtos").getPublicUrl(filePath);
        imagensUrls.push(pubUrl.publicUrl);
      }

      // 2. Insere o produto no banco
      const artType = categoria === "social" ? "suit" : "dress-midi";

      return await client
        .from("products")
        .insert({
          owner_id: user.id,
          titulo,
          categoria,
          tamanhos,
          preco_diaria: Number(preco_diaria),
          caucao: Number(caucao) || 0,
          descricao,
          medidas: { padrao: "Medidas sob consulta" },
          imagens: imagensUrls,
          art_type: artType,
          art_color: "#888485",
          ativo: true,
        })
        .select()
        .single();
    },

    // ── CALENDAR & AVAILABILITY ───────────────────────────────

    /**
     * Busca apenas as datas bloqueadas de um produto (Seguro: RPC sem expor dados pessoais)
     */
    async getBlockedDates(productId) {
      const client = getClient();
      if (!client) return { data: [], error: "Supabase não inicializado" };

      const { data, error } = await client.rpc("get_datas_ocupadas", {
        p_product_id: productId,
      });

      return { data: data || [], error };
    },

    // ── RESERVATIONS & PAYMENT ────────────────────────────────

    /**
     * Cria reserva e obtém preferência de checkout no Mercado Pago chamando a Edge Function
     */
    async createReservationAndCheckout({ product_id, data_inicio, data_fim, tamanho, notes }) {
      const client = getClient();
      const { data: sessionData } = await client.auth.getSession();
      const session = sessionData?.session;
      if (!session || !session.access_token) {
        throw new Error("Faça login para concluir sua reserva.");
      }

      const { data, error } = await client.functions.invoke("criar-reserva", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: {
          product_id,
          data_inicio,
          data_fim,
          tamanho,
          notes,
        },
      });

      if (error) {
        console.error("Erro na Edge Function criar-reserva:", error);
        let msg = error.message;
        try {
          if (error.context && typeof error.context.json === "function") {
            const bodyErr = await error.context.json();
            if (bodyErr?.error) msg = bodyErr.error;
          }
        } catch (_) {}
        throw new Error(msg || "Não foi possível iniciar o pagamento.");
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      return data;
    },

    /**
     * Busca detalhes de uma reserva pelo código de referência RES-XXXXX
     */
    async getReservationByCode(codigo) {
      const client = getClient();
      return await client
        .from("reservations")
        .select(`
          *,
          product:product_id (
            id, titulo, categoria, imagens, preco_diaria, caucao, art_type, art_color
          )
        `)
        .eq("codigo", codigo)
        .single();
    },

    /**
     * Lista reservas feitas pelo locatário logado
     */
    async getMyRenterReservations() {
      const client = getClient();
      const user = (await client.auth.getUser()).data.user;
      if (!user) return { data: [], error: "Não autenticado" };

      return await client
        .from("reservations")
        .select(`
          *,
          product:product_id (
            id, titulo, imagens, categoria
          )
        `)
        .eq("renter_id", user.id)
        .order("created_at", { ascending: false });
    },

    /**
     * Lista reservas recebidas para os produtos do anunciante logado
     */
    async getMyOwnerReservations() {
      const client = getClient();
      const user = (await client.auth.getUser()).data.user;
      if (!user) return { data: [], error: "Não autenticado" };

      return await client
        .from("reservations")
        .select(`
          *,
          product:product_id!inner (
            id, titulo, owner_id
          ),
          renter:renter_id (
            id, nome, telefone
          )
        `)
        .eq("product.owner_id", user.id)
        .order("created_at", { ascending: false });
    },
  };
})();
