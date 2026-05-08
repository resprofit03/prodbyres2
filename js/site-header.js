(function () {
  var chrome = document.querySelector(".app-chrome");
  if (!chrome) return;
  var toTopBtn = document.createElement("button");
  toTopBtn.type = "button";
  toTopBtn.className = "to-top-btn";
  toTopBtn.setAttribute("aria-label", "Наверх");
  toTopBtn.textContent = "↑";
  document.body.appendChild(toTopBtn);

  var SCROLL_TOP_SHOWN = 48;
  var SCROLL_HIDE_START = 96;
  var SCROLL_TOP_BTN_SHOW = 260;
  var DELTA_THRESHOLD = 8;
  var lastY = window.scrollY || 0;
  var ticking = false;

  function setChromeHeight() {
    var h = chrome.offsetHeight;
    document.documentElement.style.setProperty("--app-chrome-h", h + "px");
  }

  function update() {
    var y = window.scrollY || 0;
    var delta = y - lastY;

    if (y <= SCROLL_TOP_SHOWN) {
      chrome.classList.remove("app-chrome--hidden");
      document.body.classList.remove("is-header-hidden");
    } else if (Math.abs(delta) < DELTA_THRESHOLD) {
      // Ignore tiny wheel/touch jitter to avoid header flicker.
    } else if (delta > 0 && y > SCROLL_HIDE_START) {
      chrome.classList.add("app-chrome--hidden");
      document.body.classList.add("is-header-hidden");
    } else if (delta < 0) {
      chrome.classList.remove("app-chrome--hidden");
      document.body.classList.remove("is-header-hidden");
    }

    if (y > SCROLL_TOP_BTN_SHOW) {
      toTopBtn.classList.add("to-top-btn--visible");
    } else {
      toTopBtn.classList.remove("to-top-btn--visible");
    }
    lastY = y;
    ticking = false;
  }

  function onScroll() {
    if (!ticking) {
      requestAnimationFrame(update);
      ticking = true;
    }
  }

  setChromeHeight();

  if (typeof ResizeObserver !== "undefined") {
    new ResizeObserver(setChromeHeight).observe(chrome);
  }
  window.addEventListener("resize", setChromeHeight, { passive: true });
  window.addEventListener("load", setChromeHeight);
  window.addEventListener("scroll", onScroll, { passive: true });
  toTopBtn.addEventListener("click", function () {
    var prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: prefersReduced ? "auto" : "smooth" });
  });
  update();
})();
