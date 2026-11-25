/**
 * admin.js — Painel administrativo (login, análise de vendas/lucro e confirmação de pagamentos)
 */
(function () {
  "use strict";

  const TOKEN_KEY = "alugae_admin_token";
  let allReservations = [];

  async function callAdminPanel(body, token) {
    const client = window.alugaeSupabase;
    if (!client) {
      throw new Error("Cliente Supabase não inicializado.");
    }

    const headers = token ? { "x-admin-token": token } : {};
    const { data, error } = await client.functions.invoke("admin-panel", {
      headers,
      body,
    });

    if (error) {
      let msg = error.message;
      let status = error.context?.status || 500;
      try {
        if (error.context && typeof error.context.json === "function") {
          const bodyErr = await error.context.json();
          if (bodyErr?.error) msg = bodyErr.error;
        }
      } catch (_) {}
      const err = new Error(msg || "Erro ao acessar painel administrativo.");
      err.status = status;
      throw err;
    }

    return data;
  }

  function showLogin() {
    document.getElementById("admin-login-section").style.display = "block";
    document.getElementById("admin-dashboard-section").style.display = "none";
  }

  function showDashboard() {
    document.getElementById("admin-login-section").style.display = "none";
    document.getElementById("admin-dashboard-section").style.display = "block";
  }

  function renderMetrics(m) {
    document.getElementById("kpi-vendas").textContent = String(m.total_vendas || 0);
    document.getElementById("kpi-gmv").textContent = formatPrice(m.gmv || 0);
    document.getElementById("kpi-lucro").textContent = formatPrice(m.lucro_alugae || 0);
    document.getElementById("kpi-repasse").textContent = formatPrice(m.total_repasse || 0);
    document.getElementById("kpi-ticket").textContent = formatPrice(m.ticket_medio || 0);
    document.getElementById("kpi-pendentes").textContent = String(m.reservas_pendentes || 0);

    const pix = m.por_metodo?.pix_direto || { quantidade: 0, total: 0, lucro: 0 };
    const mp = m.por_metodo?.mercadopago || { quantidade: 0, total: 0, lucro: 0 };

    document.getElementById("kpi-pix-qtd").textContent = `${pix.quantidade} ${pix.quantidade === 1 ? "venda" : "vendas"}`;
    document.getElementById("kpi-pix-valores").textContent = `Bruto: ${formatPrice(pix.total)} • Lucro: ${formatPrice(pix.lucro)}`;

    document.getElementById("kpi-mp-qtd").textContent = `${mp.quantidade} ${mp.quantidade === 1 ? "venda" : "vendas"}`;
    document.getElementById("kpi-mp-valores").textContent = `Bruto: ${formatPrice(mp.total)} • Lucro: ${formatPrice(mp.lucro)}`;

    document.getElementById("kpi-base").textContent = `${m.produtos_ativos || 0} peças ativas`;
    document.getElementById("kpi-usuarios").textContent = `${m.total_usuarios || 0} usuários • Taxas MP: ${formatPrice(m.total_taxas_mp || 0)}`;
  }

  function renderReservations() {
    const tbody = document.getElementById("admin-reservations-body");
    const filter = document.getElementById("admin-status-filter")?.value || "todas";

    const filtered = allReservations.filter((r) => {
      if (filter === "todas") return true;
      if (filter === "cancelada") return r.status === "cancelada" || r.status === "expirada";
      return r.status === filter;
    });

    if (filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" style="color:var(--text-3);">Nenhuma reserva encontrada para este filtro.</td></tr>`;
      return;
    }

    tbody.innerHTML = filtered.map((r) => {
      const storeName = r.product?.owner?.nome_loja || r.product?.owner?.nome || "Loja";
      const methodLabel = r.metodo_pagamento === "pix_direto" ? "Pix Direto" : (r.metodo_pagamento || "Mercado Pago");
      const canAct = r.status === "aguardando_pagamento";

      return `
        <tr>
          <td><strong>${escapeHTML(r.codigo)}</strong></td>
          <td>
            <div>${escapeHTML(r.product?.titulo || "Peça")}</div>
            <div style="font-size:0.78rem;color:var(--text-3);">${escapeHTML(storeName)}</div>
          </td>
          <td>${escapeHTML(r.renter?.nome || "Cliente")}</td>
          <td>${escapeHTML(methodLabel)}</td>
          <td>${formatPrice(r.valor_total || 0)}</td>
          <td style="color:var(--orange);font-weight:700;">${formatPrice(r.taxa_plataforma || 0)}</td>
          <td><span class="status-badge status-${r.status}">${r.status.replace("_", " ")}</span></td>
          <td>
            ${canAct
              ? `<div style="display:flex;gap:0.4rem;">
                   <button type="button" class="btn btn-primary btn-sm btn-admin-confirm" data-id="${r.id}">Confirmar</button>
                   <button type="button" class="btn btn-ghost btn-sm btn-admin-cancel" data-id="${r.id}">Cancelar</button>
                 </div>`
              : `<span style="color:var(--text-3);font-size:0.8rem;">—</span>`}
          </td>
        </tr>
      `;
    }).join("");

    tbody.querySelectorAll(".btn-admin-confirm").forEach((btn) => {
      btn.addEventListener("click", async () => {
        await handleReservationAction("confirm_payment", btn.dataset.id, btn);
      });
    });

    tbody.querySelectorAll(".btn-admin-cancel").forEach((btn) => {
      btn.addEventListener("click", async () => {
        await handleReservationAction("cancel_reservation", btn.dataset.id, btn);
      });
    });
  }

  async function handleReservationAction(action, reservationId, btn) {
    const token = sessionStorage.getItem(TOKEN_KEY);
    if (!token) {
      showLogin();
      return;
    }

    btn.disabled = true;
    try {
      await callAdminPanel({ action, reservation_id: reservationId }, token);
      showToast(action === "confirm_payment" ? "Pagamento confirmado!" : "Reserva cancelada.", "success");
      await loadDashboard();
    } catch (err) {
      showToast(err.message || "Erro ao atualizar reserva.", "error");
      btn.disabled = false;
    }
  }

  async function loadDashboard() {
    const token = sessionStorage.getItem(TOKEN_KEY);
    if (!token) {
      showLogin();
      return;
    }

    try {
      const data = await callAdminPanel({ action: "dashboard" }, token);
      showDashboard();
      renderMetrics(data.metrics || {});
      allReservations = data.reservations || [];
      renderReservations();
    } catch (err) {
      if (err.status === 401) {
        sessionStorage.removeItem(TOKEN_KEY);
        showLogin();
      } else {
        showToast(err.message || "Erro ao carregar painel.", "error");
      }
    }
  }

  document.addEventListener("DOMContentLoaded", async () => {
    await initPage();

    const loginForm = document.getElementById("admin-login-form");
    loginForm?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const username = document.getElementById("admin-username").value.trim();
      const password = document.getElementById("admin-password").value;
      const btn = document.getElementById("admin-login-btn");

      btn.disabled = true;
      btn.textContent = "Entrando...";
      try {
        const res = await callAdminPanel({ action: "login", username, password });
        sessionStorage.setItem(TOKEN_KEY, res.token);
        await loadDashboard();
      } catch (err) {
        showToast(err.message || "Falha no login administrativo.", "error");
      } finally {
        btn.disabled = false;
        btn.textContent = "Entrar no painel";
      }
    });

    document.getElementById("admin-status-filter")?.addEventListener("change", renderReservations);
    document.getElementById("admin-refresh-btn")?.addEventListener("click", loadDashboard);
    document.getElementById("admin-logout-btn")?.addEventListener("click", () => {
      sessionStorage.removeItem(TOKEN_KEY);
      showLogin();
    });

    if (sessionStorage.getItem(TOKEN_KEY)) {
      await loadDashboard();
    } else {
      showLogin();
    }
  });
})();
