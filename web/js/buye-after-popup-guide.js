/*
=========================================================
BUYE IELTS - AFTER POPUP SCROLL GUIDE
=========================================================
*/

(function () {

  "use strict";


  let guide = null;
  let popupWasVisible = false;


  /* =====================================================
     FIND EXISTING PRICING SECTION
     ===================================================== */

  function findPricingSection() {

    /*
     * First use common IDs if the existing homepage has one.
     */

    const knownIds = [
      "pricing",
      "plans",
      "pricing-section",
      "choose-your-plan"
    ];


    for (const id of knownIds) {

      const element =
        document.getElementById(id);

      if (element) {
        return element;
      }

    }


    /*
     * Otherwise locate the existing
     * "Choose Your IELTS Plan" heading.
     */

    const headings =
      document.querySelectorAll(
        "h1,h2,h3,h4"
      );


    for (const heading of headings) {

      const text =
        (heading.textContent || "")
          .trim()
          .toLowerCase();


      if (
        text.includes(
          "choose your ielts plan"
        )
      ) {

        return heading;

      }

    }


    return null;

  }


  /* =====================================================
     CREATE GUIDE
     ===================================================== */

  function createGuide() {

    if (
      document.getElementById(
        "buyeAfterPopupGuide"
      )
    ) {

      guide =
        document.getElementById(
          "buyeAfterPopupGuide"
        );

      return;

    }


    guide =
      document.createElement("button");


    guide.type = "button";

    guide.id =
      "buyeAfterPopupGuide";


    guide.setAttribute(
      "aria-label",
      "Scroll up to explore more BUYE IELTS features"
    );


    guide.innerHTML =

      '<span class="buye-guide-arrow">↑</span>' +

      '<span class="buye-guide-text">' +

        '<strong>Scroll Up</strong>' +

        '<span>Explore More Features</span>' +

      '</span>';


    document.body.appendChild(
      guide
    );


    guide.addEventListener(
      "click",
      function () {

        /*
         * Return visitor toward the main
         * exploration area of the homepage.
         */

        const topTarget =
          document.querySelector(
            "header"
          );


        if (topTarget) {

          topTarget.scrollIntoView({
            behavior: "smooth",
            block: "start"
          });

        } else {

          window.scrollTo({
            top: 0,
            behavior: "smooth"
          });

        }


        /*
         * Hide guide after visitor
         * chooses to explore.
         */

        setTimeout(
          function () {

            hideGuide();

          },
          900
        );

      }
    );

  }


  /* =====================================================
     SHOW GUIDE
     ===================================================== */

  function showGuide() {

    if (!guide) {
      createGuide();
    }


    if (!guide) return;


    guide.classList.add(
      "buye-guide-visible"
    );

  }


  /* =====================================================
     HIDE GUIDE
     ===================================================== */

  function hideGuide() {

    if (!guide) return;


    guide.classList.remove(
      "buye-guide-visible"
    );

  }


  /* =====================================================
     MOVE TO PRICING
     ===================================================== */

  function moveToPricing() {

    const pricing =
      findPricingSection();


    if (!pricing) {

      /*
       * Fallback:
       * use the lower portion of the page.
       */

      window.scrollTo({
        top: Math.max(
          0,
          document.documentElement.scrollHeight -
          window.innerHeight
        ),
        behavior: "smooth"
      });

      return;

    }


    /*
     * Give the close animation a moment
     * to complete before moving.
     */

    setTimeout(
      function () {

        pricing.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });


        /*
         * Show the directional guide
         * after the pricing section is visible.
         */

        setTimeout(
          function () {

            showGuide();

          },
          700
        );

      },
      250
    );

  }


  /* =====================================================
     WATCH POPUP STATE
     ===================================================== */

  function watchPopup() {

    const popup =
      document.getElementById(
        "buyeSlidingOffer"
      );


    if (!popup) {

      console.warn(
        "BUYE IELTS: Sliding popup not found."
      );

      return;

    }


    popupWasVisible =
      popup.classList.contains(
        "buye-popup-visible"
      );


    const observer =
      new MutationObserver(
        function () {

          const visible =
            popup.classList.contains(
              "buye-popup-visible"
            );


          /*
           * Detect the exact moment the
           * visitor closes the popup.
           */

          if (
            popupWasVisible &&
            !visible
          ) {

            moveToPricing();

          }


          popupWasVisible =
            visible;

        }
      );


    observer.observe(
      popup,
      {
        attributes: true,
        attributeFilter: [
          "class"
        ]
      }
    );

  }


  /* =====================================================
     OPTIONAL USER SCROLL BEHAVIOUR
     ===================================================== */

  function watchScrolling() {

    let lastY =
      window.scrollY;


    window.addEventListener(
      "scroll",
      function () {

        const currentY =
          window.scrollY;


        /*
         * If visitor starts scrolling upward,
         * the guide has served its purpose.
         */

        if (
          currentY < lastY - 30
        ) {

          hideGuide();

        }


        lastY =
          currentY;

      },
      {
        passive: true
      }
    );

  }


  /* =====================================================
     INITIALISE
     ===================================================== */

  function init() {

    createGuide();

    watchPopup();

    watchScrolling();

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
