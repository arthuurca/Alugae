/**
 * payment.js — Gerencia a chamada segura de checkout para a Edge Function
 */

(function () {
  "use strict";

  window.AlugaePayment = {
    /**
     * Inicia o fluxo de checkout redirecionando para o Mercado Pago Checkout Pro
     */
    async iniciarCheckout({ productId, dataInicio, dataFim, tamanho, notes, btnElement }) {
      if (btnElement) {
        btnElement.disabled = true;
        btnElement.textContent = "Gerando pagamento seguro...";
      }

      try {
        const resultado = await window.AlugaeAPI.createReservationAndCheckout({
          product_id: productId,
          data_inicio: dataInicio,
          data_fim: dataFim,
          tamanho,
          notes,
        });

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
          btnElement.textContent = "Ir para o pagamento";
        }
        throw err;
      }
    },
  };
})();
