/**
 * Hamburger menu + slide-out drawer (≤1100px). Mega panels become accordions.
 * Runs when `.jc-site-header` is present, or after `page-nav-loaded` (nav loader).
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

  document.addEventListener("page-nav-loaded", tryBind);

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", tryBind);
  } else {
    tryBind();
  }

  /**
   * Collapsible header search: icon toggles expanded field (all breakpoints).
   */
  function bindSearchExpand() {
    var wrap = document.getElementById("jc-search-expand");
    var toggle = document.getElementById("jc-search-toggle");
    var input = document.getElementById("jc-site-search");
    if (!wrap || !toggle || !input) return;
    if (wrap.getAttribute("data-jc-search-bound") === "1") return;
    wrap.setAttribute("data-jc-search-bound", "1");

    function closeSearch() {
      wrap.classList.remove("jc-search-expand--open");
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "Open search");
    }

    function openSearch() {
      var backdrop = document.getElementById("jc-nav-backdrop");
      if (backdrop && document.body.classList.contains("jc-nav-is-open")) {
        backdrop.click();
      }
      wrap.classList.add("jc-search-expand--open");
      toggle.setAttribute("aria-expanded", "true");
      toggle.setAttribute("aria-label", "Close search");
      window.requestAnimationFrame(function () {
        input.focus();
      });
    }

    toggle.addEventListener("click", function (ev) {
      ev.stopPropagation();
      if (wrap.classList.contains("jc-search-expand--open")) closeSearch();
      else openSearch();
    });

    document.addEventListener(
      "click",
      function (ev) {
        if (!wrap.classList.contains("jc-search-expand--open")) return;
        if (!wrap.contains(ev.target)) closeSearch();
      },
      true
    );

    document.addEventListener(
      "keydown",
      function (ev) {
        if (ev.key !== "Escape") return;
        if (!wrap.classList.contains("jc-search-expand--open")) return;
        ev.stopPropagation();
        closeSearch();
        toggle.focus();
      },
      true
    );
  }

  document.addEventListener("page-nav-loaded", bindSearchExpand);
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bindSearchExpand);
  } else {
    bindSearchExpand();
  }

  /**
   * Mega menu: disable only placeholder # links. Real .html links (catalog, journal, etc.) work.
   */
  function disableMegaSubNavLinks() {
    document.querySelectorAll(".jc-site-header .jc-mega a[href]").forEach(function (a) {
      var h = (a.getAttribute("href") || "").trim();
      if (h === "#" || h === "") {
        a.setAttribute("tabindex", "-1");
      } else {
        a.removeAttribute("tabindex");
      }
    });
  }

  document.addEventListener("click", function (e) {
    var a = e.target.closest("a");
    if (!a || !a.closest(".jc-mega")) return;
    var h = (a.getAttribute("href") || "").trim();
    if (h === "#" || h === "") {
      e.preventDefault();
    }
  });

  document.addEventListener("page-nav-loaded", disableMegaSubNavLinks);
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", disableMegaSubNavLinks);
  } else {
    disableMegaSubNavLinks();
  }

  /**
   * Loyalty chip: `?emailid=…` (any non-empty value) → show 500 pts; otherwise default 2,400 pts demo.
   */
  function formatLoyaltyPoints(n) {
    try {
      return Number(n).toLocaleString("en-US");
    } catch (e) {
      return String(n);
    }
  }

  function syncLoyaltyPointsFromUrl() {
    var el = document.querySelector("[data-loyalty-points]");
    if (!el) return;
    var q = new URLSearchParams(window.location.search || "");
    var emailId = q.get("emailid");
    if (emailId != null && String(emailId).trim() !== "") {
      el.textContent = formatLoyaltyPoints(500);
    } else {
      el.textContent = formatLoyaltyPoints(2400);
    }
  }

  document.addEventListener("page-nav-loaded", syncLoyaltyPointsFromUrl);
  document.addEventListener("DOMContentLoaded", syncLoyaltyPointsFromUrl);
  window.addEventListener("popstate", syncLoyaltyPointsFromUrl);
})();
