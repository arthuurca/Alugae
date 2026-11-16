/**
 * auth.js — Lógica de cadastro, login, logout e redefinição de senha
 */

(function () {
  "use strict";

  // Inicializa eventos ao carregar a página
  document.addEventListener("DOMContentLoaded", () => {
    initRegisterPage();
    initLoginPage();
    initResetPasswordPage();
  });

  /* ── 1. CADASTRO (cadastro.html) ─────────────────────────── */
  function initRegisterPage() {
    const form = document.getElementById("form-cadastro");
    if (!form) return;

    const cards = document.querySelectorAll(".account-type-card");
    const anuncianteFields = document.getElementById("anunciante-fields");
    const feedbackEl = document.getElementById("auth-feedback");
    let selectedType = "locatario";

    // Alternar seleção entre Locatário e Anunciante
    cards.forEach((card) => {
      card.addEventListener("click", () => {
        cards.forEach((c) => {
          c.classList.remove("active");
          c.setAttribute("aria-checked", "false");
        });
        card.classList.add("active");
        card.setAttribute("aria-checked", "true");
        selectedType = card.dataset.type;

        if (selectedType === "anunciante") {
          anuncianteFields.style.display = "block";
          document.getElementById("nome-loja").required = true;
          document.getElementById("cidade").required = true;
        } else {
          anuncianteFields.style.display = "none";
          document.getElementById("nome-loja").required = false;
          document.getElementById("cidade").required = false;
        }
      });
    });

    // Máscara de telefone
    const phoneInput = document.getElementById("telefone");
    if (phoneInput) {
      phoneInput.addEventListener("input", () => {
        let v = phoneInput.value.replace(/\D/g, "").slice(0, 11);
        if (v.length > 6) {
          v = `(${v.slice(0, 2)}) ${v.slice(2, 7)}-${v.slice(7)}`;
        } else if (v.length > 2) {
          v = `(${v.slice(0, 2)}) ${v.slice(2)}`;
        }
        phoneInput.value = v;
      });
    }

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      feedbackEl.textContent = "";
      feedbackEl.className = "auth-feedback";

      const nome = document.getElementById("nome").value.trim();
      const email = document.getElementById("email").value.trim();
      const telefone = document.getElementById("telefone")?.value.trim() || "";
      const senha = document.getElementById("senha").value;
      const senhaConfirm = document.getElementById("senha-confirm").value;
      const nomeLoja = document.getElementById("nome-loja")?.value.trim() || null;
      const cidade = document.getElementById("cidade")?.value.trim() || null;
      const descLoja = document.getElementById("descricao-loja")?.value.trim() || null;

      if (senha.length < 8) {
        showError(feedbackEl, "A senha deve ter no mínimo 8 caracteres.");
        return;
      }

      if (senha !== senhaConfirm) {
        showError(feedbackEl, "As senhas não coincidem.");
        return;
      }

      if (selectedType === "anunciante" && (!nomeLoja || !cidade)) {
        showError(feedbackEl, "Por favor, preencha o nome da sua loja e cidade.");
        return;
      }

      const submitBtn = form.querySelector("button[type='submit']");
      submitBtn.disabled = true;
      submitBtn.textContent = "Criando sua conta...";

      try {
        const { data, error } = await window.AlugaeAPI.signUp({
          email,
          password: senha,
          nome,
          telefone,
          tipo: selectedType,
          nome_loja: nomeLoja,
          cidade,
          descricao_loja: descLoja,
        });

        if (error) {
          console.error("Erro no cadastro:", error);
          if (error.message.includes("already registered") || error.message.includes("User already registered")) {
            showError(feedbackEl, "Este e-mail já está cadastrado. Faça login ou use outro e-mail.");
          } else {
            showError(feedbackEl, error.message || "Erro ao criar conta. Tente novamente.");
          }
          submitBtn.disabled = false;
          submitBtn.textContent = "Criar minha conta";
          return;
        }

        // Se o Supabase exigir confirmação por e-mail:
        if (data?.user && !data.session) {
          feedbackEl.className = "auth-feedback is-success";
          feedbackEl.innerHTML = `
            <strong>Conta criada com sucesso!</strong><br>
            Enviamos um link de confirmação para <strong>${email}</strong>.<br>
            Acesse seu e-mail e clique no link para ativar sua conta antes de fazer login.
          `;
          form.reset();
          return;
        }

        // Se logou direto (confirmação desativada):
        window.location.href = getParam("redirect") || (selectedType === "anunciante" ? "novo-anuncio.html" : "catalogo.html");
      } catch (err) {
        console.error("Erro inesperado:", err);
        showError(feedbackEl, "Ocorreu um erro inesperado ao cadastrar.");
        submitBtn.disabled = false;
        submitBtn.textContent = "Criar minha conta";
      }
    });
  }

  /* ── 2. LOGIN (login.html) ───────────────────────────────── */
  function initLoginPage() {
    const form = document.getElementById("form-login");
    if (!form) return;

    const feedbackEl = document.getElementById("auth-feedback");
    const toggleSenhaBtn = document.getElementById("toggle-senha");
    const senhaInput = document.getElementById("senha");

    if (toggleSenhaBtn && senhaInput) {
      toggleSenhaBtn.addEventListener("click", () => {
        const isPassword = senhaInput.type === "password";
        senhaInput.type = isPassword ? "text" : "password";
        toggleSenhaBtn.textContent = isPassword ? "Ocultar" : "Mostrar";
      });
    }

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      feedbackEl.textContent = "";
      feedbackEl.className = "auth-feedback";

      const email = document.getElementById("email").value.trim();
      const senha = document.getElementById("senha").value;

      const submitBtn = form.querySelector("button[type='submit']");
      submitBtn.disabled = true;
      submitBtn.textContent = "Entrando...";

      try {
        const { data, error } = await window.AlugaeAPI.signIn(email, senha);

        if (error) {
          console.warn("Falha no login:", error);
          // Mensagem de erro genérica por segurança
          showError(feedbackEl, "E-mail ou senha incorretos.");
          submitBtn.disabled = false;
          submitBtn.textContent = "Entrar";
          return;
        }

        const redirect = getParam("redirect");
        window.location.href = redirect ? decodeURIComponent(redirect) : "catalogo.html";
      } catch (err) {
        console.error("Erro no login:", err);
        showError(feedbackEl, "Erro ao conectar com o servidor.");
        submitBtn.disabled = false;
        submitBtn.textContent = "Entrar";
      }
    });
  }

  /* ── 3. RECUPERAÇÃO DE SENHA (redefinir-senha.html) ──────── */
  function initResetPasswordPage() {
    const formRequest = document.getElementById("form-reset-request");
    const formUpdate = document.getElementById("form-reset-update");

    // Etapa 1: Solicitar link
    if (formRequest) {
      const feedbackEl = document.getElementById("reset-request-feedback");
      formRequest.addEventListener("submit", async (e) => {
        e.preventDefault();
        feedbackEl.textContent = "";
        feedbackEl.className = "auth-feedback";

        const email = document.getElementById("email-reset").value.trim();
        const submitBtn = formRequest.querySelector("button[type='submit']");
        submitBtn.disabled = true;
        submitBtn.textContent = "Enviando link...";

        try {
          const { error } = await window.AlugaeAPI.resetPassword(email);
          if (error) {
            showError(feedbackEl, "Não foi possível enviar o e-mail. Verifique o endereço digitado.");
            submitBtn.disabled = false;
            submitBtn.textContent = "Enviar link de recuperação";
            return;
          }

          feedbackEl.className = "auth-feedback is-success";
          feedbackEl.innerHTML = `
            Link de recuperação enviado para <strong>${email}</strong>!<br>
            Abra seu e-mail e clique no link para definir sua nova senha.
          `;
        } catch (err) {
          showError(feedbackEl, "Erro ao processar solicitação.");
          submitBtn.disabled = false;
          submitBtn.textContent = "Enviar link de recuperação";
        }
      });
    }

    // Etapa 2: Definir nova senha (quando acessado pelo link do e-mail com hash/token)
    if (formUpdate) {
      const feedbackEl = document.getElementById("reset-update-feedback");

      // O Supabase Auth injeta a sessão pelo hash da URL
      window.alugaeSupabase?.auth.onAuthStateChange(async (event, session) => {
        if (event === "PASSWORD_RECOVERY") {
          document.getElementById("update-password-card").style.display = "block";
          if (document.getElementById("request-password-card")) {
            document.getElementById("request-password-card").style.display = "none";
          }
        }
      });

      formUpdate.addEventListener("submit", async (e) => {
        e.preventDefault();
        feedbackEl.textContent = "";
        feedbackEl.className = "auth-feedback";

        const novaSenha = document.getElementById("nova-senha").value;
        const confSenha = document.getElementById("confirma-nova-senha").value;

        if (novaSenha.length < 8) {
          showError(feedbackEl, "A nova senha deve ter no mínimo 8 caracteres.");
          return;
        }

        if (novaSenha !== confSenha) {
          showError(feedbackEl, "As senhas não coincidem.");
          return;
        }

        const submitBtn = formUpdate.querySelector("button[type='submit']");
        submitBtn.disabled = true;
        submitBtn.textContent = "Atualizando senha...";

        try {
          const { error } = await window.AlugaeAPI.updatePassword(novaSenha);
          if (error) {
            showError(feedbackEl, error.message || "Erro ao redefinir senha.");
            submitBtn.disabled = false;
            submitBtn.textContent = "Salvar nova senha";
            return;
          }

          feedbackEl.className = "auth-feedback is-success";
          feedbackEl.innerHTML = `
            <strong>Senha alterada com sucesso!</strong><br>
            Você já pode acessar com sua nova senha. Redirecionando para o login...
          `;

          setTimeout(() => {
            window.location.href = "login.html";
          }, 2500);
        } catch (err) {
          showError(feedbackEl, "Erro ao atualizar senha.");
          submitBtn.disabled = false;
          submitBtn.textContent = "Salvar nova senha";
        }
      });
    }
  }

  function showError(el, message) {
    if (!el) return;
    el.className = "auth-feedback is-error";
    el.textContent = message;
  }
})();
