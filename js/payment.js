/**
 * payment.js — Gerencia a chamada segura de checkout para a Edge Function
 */

(function () {
  "use strict";

  window.AlugaePayment = {
    /**
     * Inicia o fluxo de checkout (Pix Direto sem taxa ou Mercado Pago Checkout Pro)
     */
    async iniciarCheckout({ productId, dataInicio, dataFim, tamanho, notes, paymentMethod, btnElement }) {
      const isPixDireto = paymentMethod === "pix_direto";
      if (btnElement) {
        btnElement.disabled = true;
        btnElement.textContent = isPixDireto
          ? "Gerando QR Code Pix..."
          : "Gerando pagamento seguro...";
      }

      try {
        const resultado = await window.AlugaeAPI.createReservationAndCheckout({
          product_id: productId,
          data_inicio: dataInicio,
          data_fim: dataFim,
          tamanho,
          notes,
          payment_method: paymentMethod || "mercadopago",
        });

        if (isPixDireto) {
          if (resultado.payment_method === "pix_direto" && resultado.pix_payload) {
            localStorage.setItem("alugae_last_code", resultado.codigo);
            sessionStorage.setItem(`alugae_pix_${resultado.codigo}`, resultado.pix_payload);
            window.location.href = resultado.redirect_url || `confirmacao.html?ref=${encodeURIComponent(resultado.codigo)}&method=pix`;
            return;
          }
          throw new Error("O servidor ainda não foi atualizado para Pix Direto. Faça o deploy da função criar-reserva.");
        }

        if (resultado.checkout_url) {
          // Salva referência rápida local para caso o usuário retorne manualmente
          localStorage.setItem("alugae_last_code", resultado.codigo);

          // Redirecionamento oficial para o Mercado Pago
          window.location.href = resultado.checkout_url;
        } else {
          throw new Error("Não foi possível gerar a página de pagamento.");
        }
      } catch (err) {
        console.error("Erro no checkout:", err);
        if (btnElement) {
          btnElement.disabled = false;
          btnElement.textContent = isPixDireto
            ? "Gerar QR Code Pix"
            : "Ir para o pagamento seguro";
        }
        throw err;
      }
    },
  };
})();
