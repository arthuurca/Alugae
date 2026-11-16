/**
 * reservation.js — Lógica de checkout e reserva real:
 * Exige login, valida datas e chama a Edge Function criar-reserva com Checkout Pro Mercado Pago.
 */

(function () {
  "use strict";

  /* ── Init ────────────────────────────────────────────────── */
  async function init() {
    await initPage();

    const id = getParam("id");
    const size = getParam("tamanho");
    const pickup = getParam("retirada");
    const returnD = getParam("devolucao");

    if (!id || !pickup || !returnD) {
      window.location.href = "catalogo.html";
      return;
    }

    // 1. Controle de acesso: exige login obrigatório antes de prosseguir com a reserva
    let user = null;
    if (window.AlugaeAPI) {
      user = await window.AlugaeAPI.getCurrentUser();
    }

    if (!user) {
      // Redireciona para o login preservando todos os parâmetros da reserva atual
      const currentUrl = `reserva.html${window.location.search}`;
      window.location.href = `login.html?redirect=${encodeURIComponent(currentUrl)}`;
      return;
    }

    // 2. Busca o produto
    let product = null;
    if (window.AlugaeAPI) {
      const { data } = await window.AlugaeAPI.getProductById(id);
      if (data) {
        product = {
          id: data.id,
          name: data.titulo,
          categoryLabel: capitalize(data.categoria),
          rentalPrice: Number(data.preco_diaria),
          deposit: Number(data.caucao) || 0,
          colorScheme: data.categoria,
          artType: data.art_type || "dress-midi",
          artColor: data.art_color || "#888",
          imagePath: data.imagens && data.imagens.length > 0 ? data.imagens[0] : null,
        };
      }
    }

    if (!product && typeof getProductById === "function") {
      product = getProductById(id);
    }

    if (!product) {
      window.location.href = "catalogo.html";
      return;
    }

    // Preenche campos do formulário com dados do usuário logado e da URL
    const nameInput = document.getElementById("field-name");
    const emailInput = document.getElementById("field-email");
    const phoneInput = document.getElementById("field-phone");
    const sizeInput = document.getElementById("field-size");
    const pickupInput = document.getElementById("field-pickup");
    const returnInput = document.getElementById("field-return");

    if (nameInput) nameInput.value = user.profile?.nome || "";
    if (emailInput) {
      emailInput.value = user.email || "";
      emailInput.disabled = true; // Email oficial autenticado
    }
    if (phoneInput && user.profile?.telefone) phoneInput.value = user.profile.telefone;
    if (sizeInput && size) sizeInput.value = size;
    if (pickupInput && pickup) pickupInput.value = pickup;
    if (returnInput && returnD) returnInput.value = returnD;

    // Atualiza resumo
    renderSummary(product, size, pickup, returnD);

    // Validação e Submit para o Checkout Pro
    const form = document.getElementById("reservation-form");
    if (form) {
      form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const termsEl = document.getElementById("field-terms");
        if (termsEl && !termsEl.checked) {
          showToast("Você precisa aceitar os termos de locação.", "error");
          return;
        }

        const notes = document.getElementById("field-notes")?.value.trim() || "";
        const submitBtn = document.getElementById("submit-btn");

        try {
          await window.AlugaePayment.iniciarCheckout({
            productId: product.id,
            dataInicio: pickup,
            dataFim: returnD,
            tamanho: size,
            notes,
            btnElement: submitBtn,
          });
        } catch (err) {
          showToast(err.message || "Erro ao processar reserva.", "error");
        }
      });
    }
  }

  function renderSummary(product, size, pickup, returnD) {
    const imgEl = document.getElementById("summary-product-img");
    if (imgEl) {
      imgEl.innerHTML = product.imagePath
        ? `<img src="${encodeURI(product.imagePath)}" style="width:100%;height:100%;object-fit:cover;border-radius:var(--r-md);" alt="${escapeHTML(product.name)}">`
        : `<div class="fashion-art ph-${sanitizeCategoryClass(product.colorScheme)}" style="width:100%;height:100%;padding:0.5rem">${renderFashionArt(product)}</div>`;
    }

    const nameEl = document.getElementById("summary-product-name");
    if (nameEl) nameEl.textContent = product.name;

    const catEl = document.getElementById("summary-product-cat");
    if (catEl) catEl.textContent = product.categoryLabel;

    const sizeEl = document.getElementById("summary-size");
    if (sizeEl) sizeEl.textContent = size || "Padrão";

    const pickupEl = document.getElementById("summary-pickup");
    if (pickupEl) pickupEl.textContent = formatDateBR(pickup);

    const returnEl = document.getElementById("summary-return");
    if (returnEl) returnEl.textContent = formatDateBR(returnD);

    const days = rentalDays(pickup, returnD);
    const effectiveDays = days > 0 ? days : 1;

    const daysEl = document.getElementById("summary-days");
    if (daysEl) daysEl.textContent = `${effectiveDays} ${effectiveDays === 1 ? "dia" : "dias"}`;

    const calculatedRentalPrice = product.rentalPrice * effectiveDays;

    const rentalEl = document.getElementById("summary-rental");
    if (rentalEl) rentalEl.textContent = formatPrice(calculatedRentalPrice);

    const depositEl = document.getElementById("summary-deposit");
    if (depositEl) depositEl.textContent = formatPrice(product.deposit);

    const totalEl = document.getElementById("summary-total");
    if (totalEl) totalEl.textContent = formatPrice(calculatedRentalPrice + product.deposit);
  }

  document.addEventListener("DOMContentLoaded", init);
})();
