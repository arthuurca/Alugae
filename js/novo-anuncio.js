/**
 * novo-anuncio.js — Criação de anúncios reais com upload de foto no Supabase Storage.
 * Restrito exclusivamente a perfis do tipo 'anunciante'.
 */

(function () {
  "use strict";

  async function init() {
    await initPage();

    const form = document.getElementById("form-novo-anuncio");
    const feedback = document.getElementById("form-feedback");
    const blockedWarning = document.getElementById("anunciante-blocked-warning");
    if (!form) return;

    // 1. Verificação de autenticação e tipo de perfil
    let user = null;
    if (window.AlugaeAPI) {
      user = await window.AlugaeAPI.getCurrentUser();
    }

    if (!user) {
      // Usuário não logado -> Redireciona para o login com redirect
      window.location.href = `login.html?redirect=${encodeURIComponent("novo-anuncio.html")}`;
      return;
    }

    if (user.profile?.tipo !== "anunciante") {
      // Perfil locatário bloqueado de anunciar
      form.style.display = "none";
      if (blockedWarning) {
        blockedWarning.style.display = "block";
      }
      return;
    }

    // Pré-preenche o nome da loja caso exista no perfil
    const lojaInput = document.getElementById("loja");
    if (lojaInput && user.profile?.nome_loja) {
      lojaInput.value = user.profile.nome_loja;
      lojaInput.disabled = true; // vinculada ao perfil
    }

    // 2. Envio do formulário
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      feedback.textContent = "";
      feedback.className = "ad-form-feedback";

      if (!form.checkValidity()) {
        feedback.textContent = "Revise os campos obrigatórios antes de publicar.";
        feedback.classList.add("is-error");
        form.reportValidity();
        return;
      }

      const sizes = document
        .getElementById("tamanhos")
        .value.split(",")
        .map((size) => size.trim().toUpperCase())
        .filter(Boolean);

      if (sizes.length === 0) {
        feedback.textContent = "Informe pelo menos um tamanho disponível.";
        feedback.classList.add("is-error");
        return;
      }

      const imageFile = document.getElementById("foto").files[0];
      if (!imageFile) {
        feedback.textContent = "Adicione uma foto para publicar o anúncio.";
        feedback.classList.add("is-error");
        return;
      }

      const submitBtn = form.querySelector("button[type='submit']");
      submitBtn.disabled = true;
      submitBtn.textContent = "Fazendo upload e publicando peça...";

      try {
        const { data, error } = await window.AlugaeAPI.createProduct({
          titulo: document.getElementById("titulo").value.trim(),
          categoria: document.getElementById("categoria").value,
          tamanhos: [...new Set(sizes)],
          preco_diaria: Number(document.getElementById("preco").value),
          caucao: Number(document.getElementById("caucao").value) || 0,
          descricao: document.getElementById("descricao").value.trim(),
          imageFile,
        });

        if (error) {
          throw new Error(error.message || "Erro ao publicar no banco de dados.");
        }

        feedback.className = "ad-form-feedback is-success";
        feedback.textContent = "Peça cadastrada e publicada no catálogo com sucesso!";

        setTimeout(() => {
          window.location.href = "catalogo.html?anuncio=criado";
        }, 1500);
      } catch (err) {
        console.error("Erro na publicação:", err);
        feedback.textContent = err.message || "Não foi possível publicar a peça. Tente novamente.";
        feedback.classList.add("is-error");
        submitBtn.disabled = false;
        submitBtn.textContent = "Publicar peça";
      }
    });
  }

  document.addEventListener("DOMContentLoaded", init);
})();
