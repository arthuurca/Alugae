/**
 * product.js — Product detail page logic:
 * Carrega produto real do Supabase e consulta datas bloqueadas via RPC segura.
 */

(function () {
  "use strict";

  /* ── State ───────────────────────────────────────────────── */
  const state = {
    product: null,
    selectedSize: "",
    pickupDate: "",
    returnDate: "",
    calendarStep: "start",
    calYear: new Date().getFullYear(),
    calMonth: new Date().getMonth(),
    blockedSet: new Set(),
    wishlist: JSON.parse(localStorage.getItem("pret_wishlist") || "[]"),
  };

  /* ── Init ────────────────────────────────────────────────── */
  async function init() {
    await initPage();

    const id = getParam("id");
    if (!id) {
      window.location.href = "catalogo.html";
      return;
    }

    let p = null;
    if (window.AlugaeAPI) {
      const { data, error } = await window.AlugaeAPI.getProductById(id);
      if (!error && data) {
        p = {
          id: data.id,
          name: data.titulo,
          category: data.categoria,
          categoryLabel: capitalize(data.categoria),
          occasions: [data.categoria],
          sizes: data.tamanhos || [],
          size: (data.tamanhos || []).join(" ao "),
          measurements: data.medidas || {},
          rentalPrice: Number(data.preco_diaria),
          rating: Number(data.rating) || 5.0,
          reviews: data.reviews || 0,
          colorScheme: data.categoria,
          description: data.descricao,
          artType: data.art_type || "dress-midi",
          artColor: data.art_color || "#888",
          imagePath: data.imagens && data.imagens.length > 0 ? data.imagens[0] : null,
          store: data.profiles
            ? {
                name: data.profiles.nome_loja || data.profiles.nome,
                location: data.profiles.cidade || "Brasil",
                description: data.profiles.descricao_loja || "Loja cadastrada na ALUGAÊ",
                rating: 5.0,
                reviews: 12,
              }
            : null,
        };
      }
    }

    // Fallback para data.js caso não esteja conectado ainda
    if (!p && typeof getProductById === "function") {
      p = getProductById(id);
    }

    if (!p) {
      window.location.href = "catalogo.html";
      return;
    }

    state.product = p;

    // Busca datas bloqueadas no Supabase via RPC segura
    await loadBlockedDates(p.id);

    if (p.sizes.length === 1) {
      state.selectedSize = p.sizes[0];
    }

    renderProduct();
    renderCalendar();
    bindEvents();
  }

  async function loadBlockedDates(productId) {
    state.blockedSet = new Set();

    if (window.AlugaeAPI) {
      const { data, error } = await window.AlugaeAPI.getBlockedDates(productId);
      if (!error && Array.isArray(data)) {
        data.forEach((range) => {
          let cur = new Date(range.data_inicio + "T00:00:00");
          const end = new Date(range.data_fim + "T00:00:00");
          while (cur <= end) {
            state.blockedSet.add(cur.toISOString().slice(0, 10));
            cur.setDate(cur.getDate() + 1);
          }
        });
      }
    }

    // Se houver datas bloqueadas no objeto local (fallback):
    if (state.blockedSet.size === 0 && state.product.blockedDates) {
      state.product.blockedDates.forEach((block) => {
        let cur = new Date(block.start + "T00:00:00");
        const end = new Date(block.end + "T00:00:00");
        while (cur <= end) {
          state.blockedSet.add(cur.toISOString().slice(0, 10));
          cur.setDate(cur.getDate() + 1);
        }
      });
    }
  }

  function renderProduct() {
    const p = state.product;
    document.title = `${p.name} — ALUGAÊ`;

    const breadcrumbName = document.getElementById("breadcrumb-name");
    if (breadcrumbName) breadcrumbName.textContent = p.name;

    const galleryMain = document.getElementById("gallery-main");
    if (galleryMain) {
      galleryMain.innerHTML = p.imagePath
        ? `<img class="product-real-image" src="${encodeURI(p.imagePath)}" alt="${escapeHTML(p.name)}" style="width:100%;height:100%;object-fit:cover;border-radius:var(--r-lg);">`
        : `<div class="fashion-art ph-${sanitizeCategoryClass(p.colorScheme)}" style="width:100%;height:100%;padding:2rem">${renderFashionArt(p)}</div>`;
    }

    const nameEl = document.getElementById("product-name");
    if (nameEl) nameEl.textContent = p.name;

    const catEl = document.getElementById("product-category");
    if (catEl) catEl.innerHTML = `<span class="badge badge-orange">${escapeHTML(p.categoryLabel)}</span>`;

    const ratingEl = document.getElementById("product-rating");
    if (ratingEl) {
      ratingEl.innerHTML = `
        <div style="display:flex;align-items:center;gap:0.5rem;">
          ${renderStars(p.rating, 15)}
          <span style="font-weight:700;">${p.rating}</span>
          <span style="color:var(--text-3);font-size:0.85rem;">(${p.reviews} avaliações)</span>
        </div>`;
    }

    const priceEl = document.getElementById("product-price");
    if (priceEl) {
      priceEl.innerHTML = `
        <div style="display:flex;flex-direction:column;gap:0.35rem;margin:1rem 0;">
          <div style="display:flex;align-items:baseline;gap:0.35rem;">
            <span style="font-size:2rem;font-weight:800;color:var(--text);">${formatPrice(p.rentalPrice)}</span>
            <span style="color:var(--text-3);font-size:0.95rem;">por dia</span>
          </div>
          <div style="font-size:0.875rem;color:var(--text-2);">
          </div>
        </div>`;
    }

    const sizesEl = document.getElementById("product-sizes");
    if (sizesEl) {
      sizesEl.innerHTML = p.sizes
        .map(
          (sz) => `
        <button class="product-size-btn${state.selectedSize === sz ? " selected" : ""}"
          data-size="${escapeHTML(sz)}"
          aria-label="Tamanho ${escapeHTML(sz)}"
          aria-pressed="${state.selectedSize === sz}">
          ${escapeHTML(sz)}
        </button>`
        )
        .join("");
    }

    const measEl = document.getElementById("product-measurements");
    if (measEl && p.measurements) {
      const rows = Object.entries(p.measurements)
        .map(
          ([k, v]) => `
        <div style="background:var(--surface-2);padding:0.75rem;border-radius:var(--r-sm);">
          <div style="font-size:0.75rem;color:var(--text-3);text-transform:uppercase;">${escapeHTML(capitalize(k))}</div>
          <div style="font-weight:600;font-size:0.95rem;">${escapeHTML(v)}</div>
        </div>`
        )
        .join("");
      measEl.innerHTML = `<div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(120px, 1fr));gap:0.5rem;margin:0.75rem 0;">${rows}</div>`;
    }

    const descEl = document.getElementById("product-description");
    if (descEl) descEl.textContent = p.description;

    const storeEl = document.getElementById("product-store");
    if (storeEl && p.store) {
      storeEl.innerHTML = `
        <div style="background:var(--surface-2);border:1px solid var(--border);border-radius:var(--r-md);padding:1.25rem;margin-top:1.5rem;">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;">
            <div>
              <h4 style="margin:0;font-size:1.05rem;">${escapeHTML(p.store.name)}</h4>
              <p style="margin:0.25rem 0 0.5rem;font-size:0.85rem;color:var(--text-3);">${escapeHTML(p.store.location)}</p>
            </div>
            <span class="badge badge-orange" style="font-size:0.75rem;">Loja verificada</span>
          </div>
          <p style="margin:0;font-size:0.875rem;color:var(--text-2);">${escapeHTML(p.store.description)}</p>
        </div>`;
    }

    updatePriceEstimate();
  }

  function updatePriceEstimate() {
    const banner = document.getElementById("estimate-banner");
    if (!banner) return;

    if (!state.pickupDate || !state.returnDate) {
      banner.style.display = "none";
      return;
    }

    const days = rentalDays(state.pickupDate, state.returnDate);
    const totalDiarias = state.product.rentalPrice * days;
    const totalGeral = totalDiarias;

    banner.style.display = "block";
    banner.innerHTML = `
      <div style="background:var(--surface-2);border:1px solid var(--border);border-radius:var(--r-md);padding:1rem;margin-top:1rem;">
        <div style="display:flex;justify-content:space-between;font-size:0.9rem;margin-bottom:0.4rem;">
          <span>Período (${days} ${days === 1 ? "dia" : "dias"}):</span>
          <span>${formatPrice(totalDiarias)}</span>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:0.9rem;margin-bottom:0.5rem;color:var(--text-3);">
        </div>
        <div style="display:flex;justify-content:space-between;font-size:1.1rem;font-weight:700;border-top:1px solid var(--border);padding-top:0.5rem;">
          <span>Total previsto:</span>
          <span style="color:var(--orange);">${formatPrice(totalGeral)}</span>
        </div>
      </div>
    `;
  }

  function renderCalendar() {
    const grid = document.getElementById("cal-days-grid");
    const monthLabel = document.getElementById("cal-month-label");
    if (!grid) return;

    const monthNames = [
      "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
      "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];

    if (monthLabel) {
      monthLabel.textContent = `${monthNames[state.calMonth]} de ${state.calYear}`;
    }

    grid.innerHTML = "";

    const firstDay = new Date(state.calYear, state.calMonth, 1).getDay();
    const daysInMonth = new Date(state.calYear, state.calMonth + 1, 0).getDate();
    const today = todayStr();

    for (let i = 0; i < firstDay; i++) {
      const empty = document.createElement("div");
      empty.className = "cal-day empty";
      grid.appendChild(empty);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dayStr = `${state.calYear}-${String(state.calMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const isPast = dayStr < today;
      const isBlocked = state.blockedSet.has(dayStr);
      const isSelectedStart = state.pickupDate === dayStr;
      const isSelectedEnd = state.returnDate === dayStr;
      const isInRange = state.pickupDate && state.returnDate && dayStr > state.pickupDate && dayStr < state.returnDate;

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "cal-day";
      btn.textContent = d;
      btn.dataset.date = dayStr;

      if (isPast || isBlocked) {
        btn.classList.add(isPast ? "disabled" : "blocked");
        btn.disabled = true;
        btn.setAttribute("aria-label", `${d} - ${isPast ? "passado" : "indisponível"}`);
      } else {
        if (isSelectedStart) btn.classList.add("selected-start");
        if (isSelectedEnd) btn.classList.add("selected-end");
        if (isInRange) btn.classList.add("in-range");

        btn.addEventListener("click", () => handleDateClick(dayStr));
      }

      grid.appendChild(btn);
    }
  }

  function handleDateClick(dateStr) {
    if (state.calendarStep === "start" || (state.pickupDate && dateStr < state.pickupDate)) {
      state.pickupDate = dateStr;
      state.returnDate = "";
      state.calendarStep = "end";
    } else {
      // Verifica se há alguma data bloqueada entre a data de início e término
      let check = new Date(state.pickupDate + "T00:00:00");
      const end = new Date(dateStr + "T00:00:00");
      let conflito = false;
      while (check <= end) {
        if (state.blockedSet.has(check.toISOString().slice(0, 10))) {
          conflito = true;
          break;
        }
        check.setDate(check.getDate() + 1);
      }

      if (conflito) {
        showToast("O período selecionado inclui datas indisponíveis. Escolha outro intervalo.", "error");
        state.pickupDate = dateStr;
        state.returnDate = "";
        state.calendarStep = "end";
      } else {
        state.returnDate = dateStr;
        state.calendarStep = "start";
      }
    }

    renderCalendar();
    updateDateDisplay();
    updatePriceEstimate();
  }

  function updateDateDisplay() {
    const pickupEl = document.getElementById("display-pickup");
    const returnEl = document.getElementById("display-return");
    if (pickupEl) pickupEl.textContent = state.pickupDate ? formatDateBR(state.pickupDate) : "Selecione";
    if (returnEl) returnEl.textContent = state.returnDate ? formatDateBR(state.returnDate) : "Selecione";
  }

  function bindEvents() {
    // Seleção de tamanhos
    document.querySelectorAll(".product-size-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".product-size-btn").forEach((b) => b.classList.remove("selected"));
        btn.classList.add("selected");
        state.selectedSize = btn.dataset.size;
      });
    });

    // Navegação do calendário
    const prevMonth = document.getElementById("cal-prev");
    const nextMonth = document.getElementById("cal-next");

    if (prevMonth) {
      prevMonth.addEventListener("click", () => {
        state.calMonth--;
        if (state.calMonth < 0) {
          state.calMonth = 11;
          state.calYear--;
        }
        renderCalendar();
      });
    }

    if (nextMonth) {
      nextMonth.addEventListener("click", () => {
        state.calMonth++;
        if (state.calMonth > 11) {
          state.calMonth = 0;
          state.calYear++;
        }
        renderCalendar();
      });
    }

    // Botão de Reserva
    const reserveBtn = document.getElementById("btn-reserve");
    if (reserveBtn) {
      reserveBtn.addEventListener("click", () => {
        if (!state.selectedSize && state.product.sizes.length > 0) {
          showToast("Por favor, selecione um tamanho antes de reservar.", "error");
          return;
        }

        if (!state.pickupDate || !state.returnDate) {
          showToast("Selecione o período de retirada e devolução no calendário.", "error");
          return;
        }

        // Redireciona para o formulário de reserva com os parâmetros
        const params = {
          id: state.product.id,
          tamanho: state.selectedSize,
          retirada: state.pickupDate,
          devolucao: state.returnDate,
        };

        navigateTo("reserva.html", params);
      });
    }
  }

  document.addEventListener("DOMContentLoaded", init);
})();
