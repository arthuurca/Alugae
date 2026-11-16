/**
 * main.js — Shared utilities: navigation, SVG icons, fashion art renderer, URL params.
 * Atualizado com sessão de usuário Supabase, menu dinâmico e suporte a CDN.
 */

/* ── URL params ──────────────────────────────────────────── */
function getParam(key) {
  return new URLSearchParams(window.location.search).get(key) || "";
}

function setParams(obj) {
  const p = new URLSearchParams(window.location.search);
  Object.entries(obj).forEach(([k, v]) => {
    if (v === null || v === undefined || v === "") p.delete(k);
    else p.set(k, v);
  });
  return p.toString();
}

function navigateTo(path, params = {}) {
  const qs = new URLSearchParams(params).toString();
  window.location.href = qs ? `${path}?${qs}` : path;
}

function escapeHTML(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function capitalize(s) {
  if (!s) return "";
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function formatDateBR(dateStr) {
  if (!dateStr) return "";
  const parts = dateStr.split("-");
  if (parts.length < 3) return dateStr;
  const [y, m, d] = parts;
  return `${d}/${m}/${y}`;
}

function rentalDays(startStr, endStr) {
  if (!startStr || !endStr) return 0;
  const a = new Date(startStr + "T00:00:00");
  const b = new Date(endStr + "T00:00:00");
  return Math.max(0, Math.round((b - a) / 86400000) + 1);
}

/* ── SVG icons ───────────────────────────────────────────── */
const ICONS = {
  star: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>`,
  heart: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`,
  heartFill: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`,
  chevronLeft: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>`,
  chevronRight: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>`,
  x: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
  check: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
  calendar: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
  arrowRight: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>`,
  filter: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>`,
  grid: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>`,
  search: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`,
  tag: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>`,
  user: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
};

/* ── Fashion art SVGs (product illustrations) ──────────────── */
const FASHION_ART = {
  "dress-long": (color) => `
    <svg viewBox="0 0 120 200" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="60" cy="55" rx="18" ry="22" fill="${color}" opacity="0.9"/>
      <line x1="46" y1="40" x2="40" y2="30" stroke="${color}" stroke-width="4" stroke-linecap="round" opacity="0.8"/>
      <line x1="74" y1="40" x2="80" y2="30" stroke="${color}" stroke-width="4" stroke-linecap="round" opacity="0.8"/>
      <path d="M42 72 Q30 110 20 160 Q30 165 60 168 Q90 165 100 160 Q90 110 78 72 Z" fill="${color}" opacity="0.75"/>
      <path d="M55 72 Q50 110 48 160" stroke="rgba(255,255,255,0.15)" stroke-width="3" fill="none" stroke-linecap="round"/>
      <rect x="42" y="70" width="36" height="5" rx="2" fill="${color}" opacity="1" filter="brightness(1.2)"/>
    </svg>`,

  "dress-midi": (color) => `
    <svg viewBox="0 0 120 180" xmlns="http://www.w3.org/2000/svg">
      <path d="M36 45 Q30 38 28 32 Q38 28 52 30 Q60 28 68 30 Q82 28 92 32 Q90 38 84 45 Z" fill="${color}" opacity="0.85"/>
      <rect x="40" y="44" width="40" height="45" rx="4" fill="${color}" opacity="0.9"/>
      <line x1="40" y1="70" x2="80" y2="70" stroke="rgba(255,255,255,0.2)" stroke-width="1.5"/>
      <path d="M38 88 Q25 115 22 145 Q35 150 60 152 Q85 150 98 145 Q95 115 82 88 Z" fill="${color}" opacity="0.8"/>
    </svg>`,

  "suit": (color) => `
    <svg viewBox="0 0 140 200" xmlns="http://www.w3.org/2000/svg">
      <path d="M30 60 L30 130 Q30 135 35 135 L62 135 L62 60 Z" fill="${color}" opacity="0.9"/>
      <path d="M110 60 L110 130 Q110 135 105 135 L78 135 L78 60 Z" fill="${color}" opacity="0.9"/>
      <path d="M62 60 L50 55 L42 42 L55 55 L62 65 Z" fill="${color}" opacity="1"/>
      <path d="M78 60 L90 55 L98 42 L85 55 L78 65 Z" fill="${color}" opacity="1"/>
      <path d="M60 60 L65 42 L70 40 L75 42 L80 60 L70 65 Z" fill="rgba(255,255,255,0.85)"/>
      <path d="M68 44 L72 44 L74 65 L70 72 L66 65 Z" fill="rgba(180,140,100,0.8)"/>
      <path d="M30 60 L22 62 L18 100 L28 102 L30 65 Z" fill="${color}" opacity="0.85"/>
      <path d="M110 60 L118 62 L122 100 L112 102 L110 65 Z" fill="${color}" opacity="0.85"/>
      <circle cx="70" cy="100" r="3" fill="rgba(255,255,255,0.3)"/>
      <circle cx="70" cy="115" r="3" fill="rgba(255,255,255,0.3)"/>
    </svg>`,

  "casual-set": (color) => `
    <svg viewBox="0 0 120 190" xmlns="http://www.w3.org/2000/svg">
      <path d="M30 35 L90 35 L85 90 L35 90 Z" fill="${color}" opacity="0.9"/>
      <polygon points="45,35 60,50 75,35" fill="rgba(255,255,255,0.2)"/>
      <path d="M35 95 L58 95 L56 170 L32 170 Z" fill="${color}" opacity="0.75"/>
      <path d="M62 95 L85 95 L88 170 L64 170 Z" fill="${color}" opacity="0.75"/>
      <rect x="33" y="91" width="54" height="6" rx="2" fill="${color}" opacity="1"/>
    </svg>`,

  "costume": (color) => `
    <svg viewBox="0 0 120 180" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="60" cy="35" rx="30" ry="12" fill="${color}" opacity="0.9"/>
      <ellipse cx="48" cy="35" rx="7" ry="5" fill="#18181B"/>
      <ellipse cx="72" cy="35" rx="7" ry="5" fill="#18181B"/>
      <path d="M40 55 Q30 95 18 150 Q35 155 60 156 Q85 155 102 150 Q90 95 80 55 Z" fill="${color}" opacity="0.8"/>
    </svg>`,

  "accessories": (color) => `
    <svg viewBox="0 0 140 140" xmlns="http://www.w3.org/2000/svg">
      <path d="M30 45 Q70 70 110 45" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round"/>
      <ellipse cx="70" cy="74" rx="8" ry="10" fill="${color}" opacity="0.8"/>
      <rect x="28" y="92" width="52" height="34" rx="6" fill="${color}" opacity="0.8"/>
    </svg>`,

  "blazer": (color) => `
    <svg viewBox="0 0 130 170" xmlns="http://www.w3.org/2000/svg">
      <path d="M28 55 L28 130 Q28 135 33 135 L60 135 L60 55 Z" fill="${color}" opacity="0.9"/>
      <path d="M102 55 L102 130 Q102 135 97 135 L70 135 L70 55 Z" fill="${color}" opacity="0.9"/>
      <path d="M60 55 L44 50 L36 34 L52 50 L60 62 Z" fill="${color}" opacity="1"/>
      <path d="M70 55 L86 50 L94 34 L78 50 L70 62 Z" fill="${color}" opacity="1"/>
    </svg>`,
};

function renderFashionArt(product, size = "100%") {
  const artType = product.art_type || product.artType;
  const artFn = Object.prototype.hasOwnProperty.call(FASHION_ART, artType)
    ? FASHION_ART[artType]
    : FASHION_ART["dress-midi"];
  return artFn(sanitizeArtColor(product.art_color || product.artColor));
}

function sanitizeArtColor(value) {
  const color = String(value || "").trim();
  return /^#[0-9a-f]{3,8}$/i.test(color) ? color : "#888";
}

function sanitizeCategoryClass(value) {
  const category = String(value || "").toLowerCase();
  return /^[a-z0-9-]+$/.test(category) ? category : "casual";
}

function renderStars(rating, size = 12) {
  const num = Number(rating) || 5;
  const full = Math.floor(num);
  const half = num % 1 >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;

  const star = (opacity) =>
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor" style="color:#E8A020;opacity:${opacity}"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>`;

  return `
    <span class="rating-stars">
      ${"".padStart(full).split("").map(() => star(1)).join("")}
      ${half ? star(0.5) : ""}
      ${"".padStart(empty).split("").map(() => star(0.15)).join("")}
    </span>`;
}

let toastContainer;
function showToast(message, type = "info", duration = 3500) {
  if (!toastContainer) {
    toastContainer = document.createElement("div");
    toastContainer.className = "toast-container";
    document.body.appendChild(toastContainer);
  }

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span style="color:var(--${type === "success" ? "success" : type === "error" ? "error" : "orange"})">${ICONS.check}</span>
    <span>${escapeHTML(message)}</span>
  `;

  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = "toast-in 0.25s var(--ease) reverse forwards";
    setTimeout(() => toast.remove(), 250);
  }, duration);
}

function formatPrice(value) {
  const num = Number(value) || 0;
  return `R$\u00A0${num.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

/* ── Nav builder com Autenticação Real ─────────────────────── */
function buildNav(user = null) {
  const current = window.location.pathname.split("/").pop() || "index.html";

  const links = [
    { href: "index.html", label: "Início" },
    { href: "catalogo.html", label: "Catálogo" },
  ];

  const linksHTML = links
    .map(
      (l) => `
    <a href="${l.href}" class="nav-link${current === l.href ? " active" : ""}" id="nav-${l.href.replace(".html", "")}">${l.label}</a>
  `
    )
    .join("");

  // Bloco de Autenticação / Menu do Usuário
  let authMenuHTML = "";
  if (user) {
    const nomeExibicao = escapeHTML(user.profile?.nome || user.email.split("@")[0]);
    const isAnunciante = user.profile?.tipo === "anunciante";

    authMenuHTML = `
      <div class="nav-user-dropdown" style="position:relative;">
        <button class="nav-user-btn" id="nav-user-toggle" aria-expanded="false" style="display:flex;align-items:center;gap:0.5rem;background:transparent;border:1px solid var(--border);color:var(--text);padding:0.4rem 0.85rem;border-radius:var(--r-full);font-size:0.875rem;cursor:pointer;">
          <span style="width:20px;height:20px;display:inline-flex;align-items:center;justify-content:center;color:var(--orange);">${ICONS.user}</span>
          <span>${nomeExibicao}</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
        </button>

        <div class="nav-user-menu" id="nav-user-menu" style="display:none;position:absolute;right:0;top:calc(100% + 8px);background:var(--surface-2);border:1px solid var(--border);border-radius:var(--r-md);min-width:210px;box-shadow:var(--shadow-lg);z-index:100;overflow:hidden;padding:0.5rem 0;">
          <div style="padding:0.5rem 1rem;font-size:0.75rem;color:var(--text-3);border-bottom:1px solid var(--border);">
            Conectado como <strong>${isAnunciante ? "Anunciante" : "Locatário"}</strong>
          </div>
          <a href="minha-conta.html" style="display:block;padding:0.6rem 1rem;font-size:0.875rem;color:var(--text);text-decoration:none;">Minha conta</a>
          <a href="minha-conta.html#reservas" style="display:block;padding:0.6rem 1rem;font-size:0.875rem;color:var(--text);text-decoration:none;">Minhas reservas</a>
          ${
            isAnunciante
              ? `<a href="minha-conta.html#anuncios" style="display:block;padding:0.6rem 1rem;font-size:0.875rem;color:var(--text);text-decoration:none;">Meus anúncios</a>
                 <a href="novo-anuncio.html" style="display:block;padding:0.6rem 1rem;font-size:0.875rem;color:var(--orange);font-weight:600;text-decoration:none;">+ Criar anúncio</a>`
              : `<a href="novo-anuncio.html" style="display:block;padding:0.6rem 1rem;font-size:0.875rem;color:var(--text-2);text-decoration:none;">Quero anunciar</a>`
          }
          <div style="border-top:1px solid var(--border);margin:0.25rem 0;"></div>
          <button id="nav-logout-btn" style="width:100%;text-align:left;background:transparent;border:none;padding:0.6rem 1rem;font-size:0.875rem;color:var(--error);cursor:pointer;">Sair da conta</button>
        </div>
      </div>
    `;
  } else {
    authMenuHTML = `
      <div style="display:flex;align-items:center;gap:0.75rem;">
        <a href="login.html" class="nav-link" id="nav-login">Entrar</a>
        <a href="cadastro.html" class="nav-cta" id="nav-register" style="padding:0.45rem 1rem;font-size:0.85rem;">Criar conta</a>
      </div>
    `;
  }

  return `
    <nav class="nav" role="navigation" aria-label="Navegação principal">
      <div class="nav-inner">
        <a href="index.html" class="nav-logo" aria-label="ALUGAÊ — Página inicial">
          <svg class="nav-logo-mark" viewBox="0 0 100 100" aria-hidden="true" style="width: 36px; height: 36px; background: transparent; border-radius: 0;">
            <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" stroke-width="3"/>
            <path d="M50 20 L25 80 M50 20 L75 80 M35 60 L65 60" fill="none" stroke="currentColor" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/>
          </svg>
          <span class="nav-logo-name">ALUGAÊ</span>
        </a>
        <div class="nav-links" role="list">
          ${linksHTML}
        </div>
        <div class="nav-auth-area">
          ${authMenuHTML}
        </div>
      </div>
    </nav>`;
}

async function initPage() {
  let currentUser = null;
  if (window.AlugaeAPI) {
    try {
      currentUser = await window.AlugaeAPI.getCurrentUser();
    } catch (e) {
      console.warn("Sessão não verificada:", e);
    }
  }

  // Insere a barra de navegação
  const oldNav = document.querySelector(".nav");
  if (oldNav) oldNav.remove();

  const navEl = document.createElement("div");
  navEl.innerHTML = buildNav(currentUser);
  document.body.insertBefore(navEl.firstElementChild, document.body.firstChild);

  // Insere rodapé caso não exista
  if (!document.querySelector(".footer")) {
    document.body.insertAdjacentHTML("beforeend", buildFooter());
  }

  // Eventos do menu dropdown
  const userBtn = document.getElementById("nav-user-toggle");
  const userMenu = document.getElementById("nav-user-menu");
  const logoutBtn = document.getElementById("nav-logout-btn");

  if (userBtn && userMenu) {
    userBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const open = userMenu.style.display === "block";
      userMenu.style.display = open ? "none" : "block";
      userBtn.setAttribute("aria-expanded", !open);
    });

    document.addEventListener("click", () => {
      userMenu.style.display = "none";
      userBtn.setAttribute("aria-expanded", "false");
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      await window.AlugaeAPI.signOut();
      window.location.href = "index.html";
    });
  }
}

function buildFooter() {
  return `
    <footer class="footer" role="contentinfo">
      <div class="footer-inner">
        <div class="footer-brand">
          <a href="index.html" class="nav-logo" aria-label="ALUGAÊ">
            <svg class="nav-logo-mark" viewBox="0 0 100 100" aria-hidden="true" style="width: 36px; height: 36px; background: transparent; border-radius: 0;">
              <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" stroke-width="3"/>
              <path d="M50 20 L25 80 M50 20 L75 80 M35 60 L65 60" fill="none" stroke="currentColor" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/>
            </svg>
            <span class="nav-logo-name">ALUGAÊ</span>
          </a>
          <p>USE. DEVOLVA. REPITA.</p>
        </div>
        <div>
          <p class="footer-col-title">Navegação</p>
          <ul class="footer-col-links">
            <li><a href="index.html">Início</a></li>
            <li><a href="catalogo.html">Catálogo</a></li>
            <li><a href="novo-anuncio.html">Criar anúncio</a></li>
          </ul>
        </div>
        <div>
          <p class="footer-col-title">Categorias</p>
          <ul class="footer-col-links">
            <li><a href="catalogo.html?ocasiao=casamento">Casamento</a></li>
            <li><a href="catalogo.html?ocasiao=formatura">Formatura</a></li>
            <li><a href="catalogo.html?ocasiao=festa">Festas</a></li>
            <li><a href="catalogo.html?ocasiao=casual">Casual</a></li>
          </ul>
        </div>
        <div>
          <p class="footer-col-title">Informações</p>
          <ul class="footer-col-links">
            <li><a href="index.html#how-heading">Como funciona</a></li>
            <li><a href="catalogo.html">Políticas de aluguel</a></li>
            <li><a href="login.html">Área do cliente</a></li>
          </ul>
        </div>
      </div>
      <div class="footer-bottom">
        <span>© 2026 ALUGAÊ. Todos os direitos reservados.</span>
        <span>Plataforma Oficial de Moda Circular</span>
      </div>
    </footer>`;
}
