/*
 BUYE IELTS LEAD + PAYMENT MODULE
 Does not replace existing application JavaScript.
*/

(function () {

  const PAYMENT_LINKS = {
    "7-Day Trial Pass": "https://www.buye.online/wlp/course-phpat-1789315783266",
    "30-Day Complete Pass": "https://www.buye.online/wlp/course-phpat-1789315928117",
    "90-Day Complete Pass": "https://www.buye.online/wlp/course-phpat-1789316119407",
    "180-Day Complete Pass": "https://www.buye.online/wlp/course-phpat-1789316299967",
    "365-Day Complete Pass": "https://www.buye.online/wlp/course-phpat-1789316439989"
  };

  function initBuyeLeadAd() {

    const form = document.getElementById("buyeLeadPaymentForm");

    if (!form) return;

    const planSelect = document.getElementById("buyeLeadPlan");
    const message = document.getElementById("buyeLeadMessage");
    const submitButton = document.getElementById("buyeLeadSubmit");

    document.querySelectorAll(".buye-plan-button[data-plan]").forEach(function (button) {

      button.addEventListener("click", function () {

        planSelect.value = button.dataset.plan;

        const formCard = document.querySelector(".buye-lead-form-card");

        if (formCard) {
          formCard.scrollIntoView({
            behavior: "smooth",
            block: "center"
          });
        }

        document.getElementById("buyeLeadName").focus();
      });

    });


    form.addEventListener("submit", async function (event) {

      event.preventDefault();

      const name = document.getElementById("buyeLeadName").value.trim();
      const email = document.getElementById("buyeLeadEmail").value.trim();
      const phone = document.getElementById("buyeLeadPhone").value.trim();
      const plan = planSelect.value;

      const paymentUrl = PAYMENT_LINKS[plan];

      if (!name || !email || !phone || !plan) {
        message.textContent = "Please complete all required fields.";
        return;
      }

      if (!paymentUrl) {
        message.textContent = "Please select a valid plan.";
        return;
      }

      submitButton.disabled = true;
      submitButton.textContent = "Saving Details...";
      message.textContent = "";

      try {

        if (typeof api !== "function") {
          throw new Error("BUYE API is not available.");
        }

        const result = await api("saveLead", {
          name: name,
          email: email,
          phone: phone,
          plan: plan,
          source: "Home Page IELTS Advertisement",
          payment_url: paymentUrl,
          created_from: window.location.href
        });

        if (result && result.ok === false) {
          throw new Error(result.message || "Lead could not be saved.");
        }

        message.textContent =
          "Details saved successfully. Opening payment...";

        submitButton.textContent = "Opening Payment...";

        setTimeout(function () {
          window.location.href = paymentUrl;
        }, 500);

      } catch (error) {

        console.error("BUYE Lead Error:", error);

        message.textContent =
          "Unable to save your details. Please try again.";

        submitButton.disabled = false;
        submitButton.textContent = "Continue to Payment →";
      }

    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initBuyeLeadAd);
  } else {
    initBuyeLeadAd();
  }

})();
