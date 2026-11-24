/**
 * catalog.js — Catalog page logic:
 * Renders product grid from Supabase products table with local fallback.
 */

(function () {
  "use strict";

  /* ── State ───────────────────────────────────────────────── */
  const state = {
    occasion: getParam("ocasiao") || "",
    date: getParam("data") || "",
    sizes: [],
    maxPrice: 500,
    sortBy: "relevance",
    wishlist: JSON.parse(localStorage.getItem("pret_wishlist") || "[]"),
    products: [],
    loading: true,
  };

  /* ── DOM refs ────────────────────────────────────────────── */
  let productsGrid;
  let activeFiltersBar;
  let countLabel;
  let sortSelect;
  let priceSlider;
  let priceLabelEl;

  /* ── Init ────────────────────────────────────────────────── */
  async function init() {
    await initPage(); // from main.js

    productsGrid = document.getElementById("products-grid");
    activeFiltersBar = document.getElementById("active-filters");
    countLabel = document.getElementById("catalog-count");
    sortSelect = document.getElementById("sort-select");
    priceSlider = document.getElementById("price-slider");
    priceLabelEl = document.getElementById("price-label");

    // Preenche filtros iniciais da URL
    if (state.occasion) {
      const btn = document.querySelector(`[data-category="${state.occasion}"]`);
      if (btn) toggleCategoryFilter(btn, state.occasion, false);
    }

    if (sortSelect) {
      sortSelect.addEventListener("change", () => {
        state.sortBy = sortSelect.value;
        renderProducts();
      });
    }

    if (priceSlider) {
      priceSlider.addEventListener("input", () => {
        state.maxPrice = parseInt(priceSlider.value, 10);
        const pct = ((state.maxPrice - 50) / (500 - 50)) * 100;
        priceSlider.style.setProperty("--progress", pct + "%");
        if (priceLabelEl) priceLabelEl.textContent = formatPrice(state.maxPrice);
        renderProducts();
      });
    }

    // Botões de filtro de tamanho
    document.querySelectorAll(".size-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const sz = btn.dataset.size;
        const idx = state.sizes.indexOf(sz);
        if (idx === -1) {
          state.sizes.push(sz);
          btn.classList.add("active");
        } else {
          state.sizes.splice(idx, 1);
          btn.classList.remove("active");
        }
        renderProducts();
        renderActiveFilters();
      });
    });

    // Botões de categoria
    document.querySelectorAll(".cat-filter-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const cat = btn.dataset.category;
        toggleCategoryFilter(btn, cat, true);
      });
    });

    // Filtro mobile
    const filterToggle = document.getElementById("filter-toggle");
    const sidebar = document.getElementById("sidebar-filters");
    if (filterToggle && sidebar) {
      filterToggle.addEventListener("click", () => {
        sidebar.classList.toggle("open");
      });
    }

    // Carrega dados do Supabase
    await loadProducts();
  }

  async function loadProducts() {
    if (productsGrid) {
      productsGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 1rem; color: var(--text-3);">
          <div class="spinner" style="margin: 0 auto 1rem; width: 32px; height: 32px; border: 3px solid var(--border); border-top-color: var(--orange); border-radius: 50%; animation: spin 0.8s linear infinite;"></div>
          <p>Carregando peças do acervo...</p>
        </div>
      `;
    }

    let items = [];
    if (window.AlugaeAPI) {
      const { data, error } = await window.AlugaeAPI.getProducts();
      if (!error && Array.isArray(data) && data.length > 0) {
        items = data.map((p) => ({
          id: p.id,
          name: p.titulo,
          category: p.categoria,
          categoryLabel: capitalize(p.categoria),
          occasions: [p.categoria],
          sizes: p.tamanhos || [],
          size: (p.tamanhos || []).join(", "),
          rentalPrice: Number(p.preco_diaria),
          rating: Number(p.rating) || 5.0,
          reviews: p.reviews || 0,
          description: p.descricao,
          colorScheme: p.categoria,
          artType: p.art_type || "dress-midi",
          artColor: p.art_color || "#888",
          imagePath: p.imagens && p.imagens.length > 0 ? p.imagens[0] : null,
          store: p.profiles
            ? {
                name: p.profiles.nome_loja || p.profiles.nome,
                location: p.profiles.cidade || "Brasil",
                description: p.profiles.descricao_loja || "Loja parceira ALUGAÊ",
              }
            : null,
        }));
      }
    }

    state.products = items;
    state.loading = false;
    renderProducts();
    renderActiveFilters();
  }

  function toggleCategoryFilter(btn, category, reRender = true) {
    const isSelected = btn.classList.contains("selected");
    document.querySelectorAll(".cat-filter-btn").forEach((b) => {
      b.classList.remove("selected");
      b.setAttribute("aria-pressed", "false");
    });

    if (isSelected) {
      state.occasion = "";
    } else {
      btn.classList.add("selected");
      btn.setAttribute("aria-pressed", "true");
      state.occasion = category;
    }

    if (reRender) {
      renderProducts();
      renderActiveFilters();
    }
  }

  function renderActiveFilters() {
    if (!activeFiltersBar) return;
    const tags = [];

    if (state.occasion) {
      tags.push({ label: capitalize(state.occasion), type: "occasion" });
    }
    state.sizes.forEach((s) => {
      tags.push({ label: `Tam ${s}`, type: "size", val: s });
    });
    if (state.maxPrice < 500) {
      tags.push({ label: `Até ${formatPrice(state.maxPrice)}`, type: "price" });
    }

    if (tags.length === 0) {
      activeFiltersBar.innerHTML = "";
      return;
    }

    activeFiltersBar.innerHTML = `
      <div style="display:flex;align-items:center;gap:0.5rem;flex-wrap:wrap;padding:0.75rem 0;">
        <span style="font-size:0.75rem;color:var(--text-3);text-transform:uppercase;font-weight:600;">Filtros:</span>
        ${tags
          .map(
            (t) => `
          <button class="active-filter-tag" data-type="${t.type}" data-val="${t.val || ""}" style="background:var(--surface-2);border:1px solid var(--border);color:var(--text);border-radius:var(--r-full);padding:0.25rem 0.65rem;font-size:0.75rem;display:inline-flex;align-items:center;gap:0.35rem;cursor:pointer;">
            <span>${escapeHTML(t.label)}</span>
            <span style="opacity:0.6;">&times;</span>
          </button>
        `
          )
          .join("")}
        <button id="clear-all-filters" style="background:none;border:none;color:var(--orange);font-size:0.75rem;cursor:pointer;text-decoration:underline;">Limpar tudo</button>
      </div>
    `;

    activeFiltersBar.querySelectorAll(".active-filter-tag").forEach((btn) => {
      btn.addEventListener("click", () => {
        const type = btn.dataset.type;
        const val = btn.dataset.val;
        if (type === "occasion") {
          state.occasion = "";
          document.querySelectorAll(".cat-filter-btn").forEach((b) => b.classList.remove("selected"));
        } else if (type === "size") {
          state.sizes = state.sizes.filter((s) => s !== val);
          const sBtn = document.querySelector(`.size-btn[data-size="${val}"]`);
          if (sBtn) sBtn.classList.remove("active");
        } else if (type === "price") {
          state.maxPrice = 500;
          if (priceSlider) priceSlider.value = 500;
          if (priceLabelEl) priceLabelEl.textContent = formatPrice(500);
        }
        renderProducts();
        renderActiveFilters();
      });
    });

    const clearAll = document.getElementById("clear-all-filters");
    if (clearAll) {
      clearAll.addEventListener("click", () => {
        state.occasion = "";
        state.sizes = [];
        state.maxPrice = 500;
        document.querySelectorAll(".cat-filter-btn").forEach((b) => b.classList.remove("selected"));
        document.querySelectorAll(".size-btn").forEach((b) => b.classList.remove("active"));
        if (priceSlider) priceSlider.value = 500;
        if (priceLabelEl) priceLabelEl.textContent = formatPrice(500);
        renderProducts();
        renderActiveFilters();
      });
    }
  }

  function renderProducts() {
    if (!productsGrid) return;

    let filtered = state.products.filter((p) => {
      if (state.occasion && p.category !== state.occasion && !p.occasions?.includes(state.occasion)) {
        return false;
      }
      if (state.sizes.length > 0 && !p.sizes.some((s) => state.sizes.includes(s))) {
        return false;
      }
      if (p.rentalPrice > state.maxPrice) {
        return false;
      }
      return true;
    });

    if (state.sortBy === "price-asc") {
      filtered.sort((a, b) => a.rentalPrice - b.rentalPrice);
    } else if (state.sortBy === "price-desc") {
      filtered.sort((a, b) => b.rentalPrice - a.rentalPrice);
    } else if (state.sortBy === "rating") {
      filtered.sort((a, b) => b.rating - a.rating);
    }

    if (countLabel) {
      countLabel.textContent = `${filtered.length} ${filtered.length === 1 ? "peça encontrada" : "peças encontradas"}`;
    }

    if (filtered.length === 0) {
      productsGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 1rem; color: var(--text-3);">
          <p style="font-size: 1.15rem; margin-bottom: 0.5rem; color: var(--text);">Nenhuma peça disponível no acervo.</p>
          <p style="font-size: 0.9rem;">Seja o primeiro anunciante a publicar uma peça.</p>
        </div>
      `;
      return;
    }

    productsGrid.innerHTML = filtered
      .map((p) => {
        const isFav = state.wishlist.includes(p.id);
        const imageHTML = p.imagePath
          ? `<img src="${encodeURI(p.imagePath)}" alt="${escapeHTML(p.name)}" class="product-card-img" style="width:100%;height:100%;object-fit:cover;" loading="lazy">`
          : `<div class="fashion-art ph-${sanitizeCategoryClass(p.colorScheme)}" style="width:100%;height:100%;padding:1.5rem;">${renderFashionArt(p)}</div>`;

        return `
        <article class="product-card" data-id="${p.id}">
          <div class="product-card-media" style="position:relative;height:280px;background:var(--surface-2);border-radius:var(--r-md);overflow:hidden;">
            <a href="produto.html?id=${p.id}" aria-label="Ver detalhes de ${escapeHTML(p.name)}" style="display:block;width:100%;height:100%;">
              ${imageHTML}
            </a>
            <button class="product-card-fav" data-id="${p.id}" aria-label="Favoritar" style="position:absolute;top:10px;right:10px;background:rgba(0,0,0,0.45);backdrop-filter:blur(4px);border:none;border-radius:50%;width:34px;height:34px;display:flex;align-items:center;justify-content:center;cursor:pointer;color:#fff;">
              ${isFav ? ICONS.heartFill : ICONS.heart}
            </button>
            <div style="position:absolute;bottom:10px;left:10px;">
              <span class="badge badge-orange" style="font-size:0.7rem;padding:0.2rem 0.55rem;border-radius:var(--r-full);background:rgba(232,104,50,0.9);color:#fff;">${escapeHTML(p.categoryLabel)}</span>
            </div>
          </div>

          <div class="product-card-content" style="padding:0.85rem 0.25rem;">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:0.25rem;">
              <h2 style="font-size:1rem;font-weight:600;margin:0;">
                <a href="produto.html?id=${p.id}" style="color:var(--text);text-decoration:none;">${escapeHTML(p.name)}</a>
              </h2>
              <div style="display:flex;align-items:center;gap:0.25rem;font-size:0.8rem;color:#E8A020;">
                ${ICONS.star}
                <span style="color:var(--text);font-weight:600;">${p.rating}</span>
              </div>
            </div>

            <p style="font-size:0.8rem;color:var(--text-3);margin:0 0 0.5rem;">Tam: ${escapeHTML(p.size)}</p>

            <div style="display:flex;justify-content:space-between;align-items:baseline;">
              <div>
                <span style="font-size:1.1rem;font-weight:700;color:var(--text);">${formatPrice(p.rentalPrice)}</span>
                <span style="font-size:0.75rem;color:var(--text-3);">/ dia</span>
              </div>
              <a href="produto.html?id=${p.id}" class="btn btn-ghost btn-sm" style="font-size:0.8rem;padding:0.35rem 0.75rem;">Reservar</a>
            </div>
          </div>
        </article>
      `;
      })
      .join("");

    // Eventos de Favoritos
    productsGrid.querySelectorAll(".product-card-fav").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        const id = parseInt(btn.dataset.id, 10);
        const idx = state.wishlist.indexOf(id);
        if (idx === -1) {
          state.wishlist.push(id);
          btn.innerHTML = ICONS.heartFill;
          btn.style.color = "var(--orange)";
          showToast("Adicionado aos favoritos!");
        } else {
          state.wishlist.splice(idx, 1);
          btn.innerHTML = ICONS.heart;
          btn.style.color = "#fff";
          showToast("Removido dos favoritos.");
        }
        localStorage.setItem("pret_wishlist", JSON.stringify(state.wishlist));
      });
    });
  }

  document.addEventListener("DOMContentLoaded", init);
})();
