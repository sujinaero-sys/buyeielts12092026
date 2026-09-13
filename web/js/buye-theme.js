
(function () {
  "use strict";

  var KEY = "buye_theme";

  function getTheme() {
    var saved = localStorage.getItem(KEY);

    if (saved === "dark" || saved === "light") {
      return saved;
    }

    return window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);

    var buttons = document.querySelectorAll(".buye-theme-toggle");

    buttons.forEach(function (button) {
      button.textContent =
        theme === "dark"
          ? "☀️ Light mode"
          : "🌙 Dark mode";

      button.setAttribute(
        "aria-label",
        theme === "dark"
          ? "Switch to light mode"
          : "Switch to dark mode"
      );
    });
  }

  function createControls() {
    if (!document.querySelector(".buye-theme-toggle")) {
      var button = document.createElement("button");

      button.className = "buye-theme-toggle";
      button.type = "button";

      button.addEventListener("click", function () {
        var current =
          document.documentElement.getAttribute("data-theme") || "light";

        var next = current === "dark" ? "light" : "dark";

        localStorage.setItem(KEY, next);
        applyTheme(next);
      });

      document.body.appendChild(button);
    }

    applyTheme(getTheme());
  }

  applyTheme(getTheme());

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", createControls);
  } else {
    createControls();
  }
})();
