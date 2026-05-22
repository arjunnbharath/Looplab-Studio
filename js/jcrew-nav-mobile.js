/**
 * Hamburger menu + slide-out drawer (≤1100px). Mega panels become accordions.
 * Runs when `.jc-site-header` is present, or after `jcrew-nav-loaded` (nav loader).
 */
(function () {
  var mq = window.matchMedia("(max-width: 1100px)");
  var bound = false;

  function isMobileNav() {
    return mq.matches;
  }

  function tryBind() {
    if (bound) return;
    var header = document.querySelector(".jc-site-header");
    if (!header) return;
    var btn = document.getElementById("jc-menu-btn");
    var backdrop = document.getElementById("jc-nav-backdrop");
    var nav = document.getElementById("jc-primary-nav");
    if (!btn || !nav) return;
    bound = true;

    function setHeaderHeightVar() {
      var h = header.getBoundingClientRect().height;
      document.documentElement.style.setProperty("--jc-header-h", Math.ceil(h) + "px");
    }

    function syncBackdropA11y(open) {
      if (!backdrop) return;
      backdrop.setAttribute("aria-hidden", open ? "false" : "true");
    }

    function closeNav() {
      header.classList.remove("jc-nav-is-open");
      btn.setAttribute("aria-expanded", "false");
      btn.setAttribute("aria-label", "Open navigation menu");
      document.body.classList.remove("jc-nav-is-open");
      syncBackdropA11y(false);
      header.querySelectorAll(".jc-nav-item--open").forEach(function (el) {
        el.classList.remove("jc-nav-item--open");
      });
    }

    function openNav() {
      setHeaderHeightVar();
      header.classList.add("jc-nav-is-open");
      btn.setAttribute("aria-expanded", "true");
      btn.setAttribute("aria-label", "Close navigation menu");
      document.body.classList.add("jc-nav-is-open");
      syncBackdropA11y(true);
    }

    function toggleNav() {
      if (header.classList.contains("jc-nav-is-open")) {
        closeNav();
      } else {
        openNav();
      }
    }

    btn.addEventListener("click", function () {
      if (!isMobileNav()) return;
      toggleNav();
    });

    if (backdrop) {
      backdrop.addEventListener("click", closeNav);
    }

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeNav();
    });

    window.addEventListener(
      "resize",
      function () {
        setHeaderHeightVar();
        if (!isMobileNav()) closeNav();
      },
      { passive: true }
    );

    if (typeof mq.addEventListener === "function") {
      mq.addEventListener("change", function () {
        if (!isMobileNav()) closeNav();
      });
    } else if (typeof mq.addListener === "function") {
      mq.addListener(function () {
        if (!isMobileNav()) closeNav();
      });
    }

    header.querySelectorAll(".jc-nav-item > .jc-nav-trigger").forEach(function (trigger) {
      trigger.addEventListener("click", function (e) {
        if (!isMobileNav()) return;
        var item = trigger.closest(".jc-nav-item");
        if (!item) return;
        var mega = item.querySelector(".jc-mega");
        if (!mega) return;
        e.preventDefault();
        var wasOpen = item.classList.contains("jc-nav-item--open");
        header.querySelectorAll(".jc-nav-item--open").forEach(function (other) {
          other.classList.remove("jc-nav-item--open");
        });
        if (!wasOpen) {
          item.classList.add("jc-nav-item--open");
        }
      });
    });

    setHeaderHeightVar();
  }

  document.addEventListener("jcrew-nav-loaded", tryBind);

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", tryBind);
  } else {
    tryBind();
  }
})();
