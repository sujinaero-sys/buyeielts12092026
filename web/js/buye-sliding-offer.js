/*
=========================================================
BUYE IELTS - SLIDING ADVERTISEMENT CAROUSEL
=========================================================
*/

(function () {

  "use strict";

  const AD_FOLDER = "assets/advertisements/";

  const AD_IMAGES = [
    "IELTS-AD-1.png",
    "IELTS-AD-2.png",
    "IELTS-AD-3.png",
    "IELTS-AD-S-0001.png"
  ];

  const PAYMENT_LINKS = {

    "7-Day Trial Pass":
      "https://www.buye.online/wlp/course-phpat-1789315783266",

    "30-Day Complete Pass":
      "https://www.buye.online/wlp/course-phpat-1789315928117",

    "90-Day Complete Pass":
      "https://www.buye.online/wlp/course-phpat-1789316119407",

    "180-Day Complete Pass":
      "https://www.buye.online/wlp/course-phpat-1789316299967",

    "365-Day Complete Pass":
      "https://www.buye.online/wlp/course-phpat-1789316439989"

  };

  let currentSlide = 0;
  let slideTimer = null;


  function $(id) {
    return document.getElementById(id);
  }


  /* =====================================================
     BUILD IMAGE CAROUSEL
     ===================================================== */

  function buildCarousel() {

    const container =
      document.querySelector(".buye-popup-promo");

    if (!container) return;


    container.innerHTML = "";


    const carousel =
      document.createElement("div");

    carousel.className =
      "buye-ad-carousel";


    AD_IMAGES.forEach(function (file, index) {

      const slide =
        document.createElement("div");

      slide.className =
        "buye-ad-slide" +
        (index === 0 ? " active" : "");

      const image =
        document.createElement("img");

      image.src =
        AD_FOLDER + file;

      image.alt =
        "BUYE IELTS advertisement " +
        (index + 1);

      image.addEventListener(
        "error",
        function () {

          console.error(
            "BUYE IELTS advertisement not found:",
            image.src
          );

          slide.remove();

          updateDots();

          showSlide(currentSlide);

        }
      );


      slide.appendChild(image);

      carousel.appendChild(slide);

    });


    /* PREVIOUS */

    const prev =
      document.createElement("button");

    prev.type = "button";

    prev.className =
      "buye-ad-prev";

    prev.innerHTML = "‹";

    prev.setAttribute(
      "aria-label",
      "Previous advertisement"
    );

    prev.addEventListener(
      "click",
      function () {

        showSlide(currentSlide - 1);

        restartAutoSlide();

      }
    );


    /* NEXT */

    const next =
      document.createElement("button");

    next.type = "button";

    next.className =
      "buye-ad-next";

    next.innerHTML = "›";

    next.setAttribute(
      "aria-label",
      "Next advertisement"
    );

    next.addEventListener(
      "click",
      function () {

        showSlide(currentSlide + 1);

        restartAutoSlide();

      }
    );


    /* DOTS */

    const dots =
      document.createElement("div");

    dots.className =
      "buye-ad-dots";


    AD_IMAGES.forEach(function (_, index) {

      const dot =
        document.createElement("button");

      dot.type = "button";

      dot.className =
        "buye-ad-dot" +
        (index === 0 ? " active" : "");

      dot.setAttribute(
        "aria-label",
        "Advertisement " + (index + 1)
      );

      dot.addEventListener(
        "click",
        function () {

          showSlide(index);

          restartAutoSlide();

        }
      );

      dots.appendChild(dot);

    });


    carousel.appendChild(prev);
    carousel.appendChild(next);
    carousel.appendChild(dots);

    container.appendChild(carousel);


    updateDots();

    startAutoSlide();

  }


  /* =====================================================
     UPDATE DOTS
     ===================================================== */

  function updateDots() {

    const slides =
      document.querySelectorAll(
        ".buye-ad-slide"
      );

    const dots =
      document.querySelectorAll(
        ".buye-ad-dot"
      );


    dots.forEach(function (dot, index) {

      dot.style.display =
        index < slides.length
          ? ""
          : "none";

    });

  }


  /* =====================================================
     SHOW SLIDE
     ===================================================== */

  function showSlide(index) {

    const slides =
      document.querySelectorAll(
        ".buye-ad-slide"
      );

    if (!slides.length) return;


    if (index < 0) {
      index = slides.length - 1;
    }

    if (index >= slides.length) {
      index = 0;
    }


    currentSlide = index;


    slides.forEach(
      function (slide, i) {

        slide.classList.toggle(
          "active",
          i === currentSlide
        );

      }
    );


    document
      .querySelectorAll(".buye-ad-dot")
      .forEach(
        function (dot, i) {

          dot.classList.toggle(
            "active",
            i === currentSlide
          );

        }
      );

  }


  /* =====================================================
     AUTOMATIC SLIDE
     ===================================================== */

  function startAutoSlide() {

    clearInterval(slideTimer);

    slideTimer =
      setInterval(
        function () {

          showSlide(
            currentSlide + 1
          );

        },
        5000
      );

  }


  function restartAutoSlide() {

    startAutoSlide();

  }


  /* =====================================================
     PLAN SELECTION
     ===================================================== */

  function selectPlan(plan) {

    const select =
      $("buyePopupPlan");

    if (!select) return;


    if (!PAYMENT_LINKS[plan]) {

      console.error(
        "Unknown payment plan:",
        plan
      );

      return;

    }


    select.value = plan;


    const form =
      $("buyePopupLeadForm");

    if (form) {

      form.scrollIntoView({
        behavior: "smooth",
        block: "center"
      });

    }

  }


  function bindPriceButtons() {

    document
      .querySelectorAll(
        "[data-popup-plan]"
      )
      .forEach(
        function (button) {

          button.addEventListener(
            "click",
            function () {

              selectPlan(
                button.getAttribute(
                  "data-popup-plan"
                )
              );

            }
          );

        }
      );

  }


  /* =====================================================
     LEAD + PAYMENT
     ===================================================== */

  function bindLeadForm() {

    const form =
      $("buyePopupLeadForm");

    if (!form) return;


    form.addEventListener(
      "submit",
      async function (event) {

        event.preventDefault();


        const name =
          $("buyePopupName")
            .value.trim();

        const email =
          $("buyePopupEmail")
            .value.trim();

        const phone =
          $("buyePopupPhone")
            .value.trim();

        const plan =
          $("buyePopupPlan")
            .value;


        const paymentUrl =
          PAYMENT_LINKS[plan];


        if (
          !name ||
          !email ||
          !phone ||
          !plan
        ) {

          $("buyePopupMessage")
            .textContent =
              "Please complete all required fields.";

          return;

        }


        if (!paymentUrl) {

          $("buyePopupMessage")
            .textContent =
              "Please select a valid plan.";

          return;

        }


        const submit =
          $("buyePopupSubmit");


        submit.disabled = true;

        submit.textContent =
          "Saving Your Details...";


        try {

          if (
            typeof api !== "function"
          ) {

            throw new Error(
              "BUYE backend API is not connected."
            );

          }


          const result =
            await api(
              "saveLead",
              {

                name: name,

                email: email,

                phone: phone,

                plan: plan,

                source:
                  "Home Page Sliding Advertisement",

                payment_url:
                  paymentUrl,

                created_from:
                  window.location.href

              }
            );


          if (
            result &&
            result.ok === false
          ) {

            throw new Error(
              result.message ||
              "Lead could not be saved."
            );

          }


          $("buyePopupMessage")
            .textContent =
              "Details saved. Opening payment...";


          submit.textContent =
            "Opening Payment...";


          setTimeout(
            function () {

              window.location.href =
                paymentUrl;

            },
            600
          );


        } catch (error) {

          console.error(
            "BUYE popup lead error:",
            error
          );


          $("buyePopupMessage")
            .textContent =
              "Unable to save your details. Please try again.";


          submit.disabled = false;

          submit.textContent =
            "Continue to Payment →";

        }

      }
    );

  }


  /* =====================================================
     POPUP
     ===================================================== */

  function bindPopup() {

    const popup =
      $("buyeSlidingOffer");

    if (!popup) return;


    const close =
      $("buyePopupClose");


    if (close) {

      close.addEventListener(
        "click",
        function () {

          popup.classList.remove(
            "buye-popup-visible"
          );

          popup.setAttribute(
            "aria-hidden",
            "true"
          );

          clearInterval(slideTimer);

        }
      );

    }


    popup.addEventListener(
      "click",
      function (event) {

        if (
          event.target === popup &&
          close
        ) {

          close.click();

        }

      }
    );


    document.addEventListener(
      "keydown",
      function (event) {

        if (
          event.key === "Escape" &&
          popup.classList.contains(
            "buye-popup-visible"
          ) &&
          close
        ) {

          close.click();

        }

      }
    );


    setTimeout(
      function () {

        popup.classList.add(
          "buye-popup-visible"
        );

        popup.setAttribute(
          "aria-hidden",
          "false"
        );

      },
      900
    );

  }


  /* =====================================================
     START
     ===================================================== */

  function init() {

    buildCarousel();

    bindPriceButtons();

    bindLeadForm();

    bindPopup();

  }


  if (
    document.readyState === "loading"
  ) {

    document.addEventListener(
      "DOMContentLoaded",
      init
    );

  } else {

    init();

  }

})();
