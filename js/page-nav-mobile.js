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
      var stack = document.getElementById("jc-site-top");
      var inner = header.querySelector(".jc-header-inner");
      var barH;
      if (stack) {
        barH = stack.getBoundingClientRect().height;
      } else {
        var bar = inner || header;
        barH = bar.getBoundingClientRect().height;
        var headerStyle = window.getComputedStyle(header);
        var borderBottom = parseFloat(headerStyle.borderBottomWidth) || 0;
        barH += borderBottom;
      }
      document.documentElement.style.setProperty(
        "--jc-header-h",
        Math.ceil(barH) + "px"
      );
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
        var t = el.querySelector(".jc-nav-submenu-toggle");
        if (t) t.setAttribute("aria-expanded", "false");
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

    enhanceMobileNavItems(header);
    bindMobileDrawerAccount(header);
    syncMobileDrawerAccount();

    setHeaderHeightVar();
  }

  document.addEventListener("page-nav-loaded", tryBind);

  function syncHeaderHeightVar() {
    var stack = document.getElementById("jc-site-top");
    var header = document.querySelector(".jc-site-header");
    if (!header && !stack) return;
    var barH;
    if (stack) {
      barH = stack.getBoundingClientRect().height;
    } else {
      var inner = header.querySelector(".jc-header-inner");
      var bar = inner || header;
      barH = bar.getBoundingClientRect().height;
      var headerStyle = window.getComputedStyle(header);
      var borderBottom = parseFloat(headerStyle.borderBottomWidth) || 0;
      barH += borderBottom;
    }
    document.documentElement.style.setProperty(
      "--jc-header-h",
      Math.ceil(barH) + "px"
    );
  }

  document.addEventListener("page-nav-loaded", syncHeaderHeightVar);
  document.addEventListener("looplab-signin-changed", syncHeaderHeightVar);
  window.addEventListener("resize", syncHeaderHeightVar, { passive: true });
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", syncHeaderHeightVar);
  } else {
    syncHeaderHeightVar();
  }

  var SUBMENU_CHEVRON =
    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">' +
    '<path d="M9 6l6 6-6 6" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>' +
    "</svg>";

  function enhanceMobileNavItems(header) {
    if (!header || header.getAttribute("data-jc-nav-enhanced") === "1") return;
    header.setAttribute("data-jc-nav-enhanced", "1");

    header.querySelectorAll(".jc-nav-item").forEach(function (item) {
      var trigger = item.querySelector(":scope > .jc-nav-trigger");
      var mega = item.querySelector(":scope > .jc-mega");
      if (!trigger) return;

      if (!mega) {
        item.classList.add("jc-nav-item--solo");
        return;
      }

      if (item.querySelector(".jc-nav-row")) return;

      var href = trigger.getAttribute("href") || "#";
      var label = (trigger.textContent || "").trim();

      var row = document.createElement("div");
      row.className = "jc-nav-row";

      var link = document.createElement("a");
      link.className = "jc-nav-trigger jc-nav-link";
      link.href = href;
      link.textContent = label;

      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "jc-nav-submenu-toggle";
      btn.setAttribute("aria-expanded", "false");
      btn.setAttribute("aria-label", "Open " + label + " submenu");
      btn.innerHTML = SUBMENU_CHEVRON;

      btn.addEventListener("click", function (ev) {
        if (!isMobileNav()) return;
        ev.preventDefault();
        ev.stopPropagation();
        var wasOpen = item.classList.contains("jc-nav-item--open");
        header.querySelectorAll(".jc-nav-item--open").forEach(function (other) {
          if (other === item) return;
          other.classList.remove("jc-nav-item--open");
          var t = other.querySelector(".jc-nav-submenu-toggle");
          if (t) t.setAttribute("aria-expanded", "false");
        });
        if (wasOpen) {
          item.classList.remove("jc-nav-item--open");
          btn.setAttribute("aria-expanded", "false");
        } else {
          item.classList.add("jc-nav-item--open");
          btn.setAttribute("aria-expanded", "true");
        }
      });

      row.appendChild(link);
      row.appendChild(btn);
      trigger.replaceWith(row);
    });
  }

  var drawerMountSaved = false;
  var drawerMounts = {
    greetParent: null,
    greetNext: null,
    signInParent: null,
    signInNext: null
  };

  function syncDrawerAccountEmail(show) {
    var el = document.getElementById("jc-drawer-email");
    if (!el) return;
    if (!show) {
      el.hidden = true;
      el.textContent = "";
      return;
    }
    try {
      var raw = sessionStorage.getItem("looplab-studio-signin");
      if (!raw) {
        el.hidden = true;
        el.textContent = "";
        return;
      }
      var o = JSON.parse(raw);
      if (!o || !o.email) {
        el.hidden = true;
        el.textContent = "";
        return;
      }
      el.textContent = String(o.email).trim();
      el.hidden = false;
    } catch (e) {
      el.hidden = true;
      el.textContent = "";
    }
  }

  function isSessionSignedIn() {
    try {
      var raw = sessionStorage.getItem("looplab-studio-signin");
      if (!raw) return false;
      var o = JSON.parse(raw);
      return !!(o && o.email);
    } catch (e) {
      return false;
    }
  }

  function saveDrawerMountPoints() {
    if (drawerMountSaved) return;
    var greet = document.getElementById("jc-header-greet");
    var signIn = document.querySelector(".jc-header-right .jc-sign-in");
    if (greet && greet.parentNode) {
      drawerMounts.greetParent = greet.parentNode;
      drawerMounts.greetNext = greet.nextSibling;
    }
    if (signIn && signIn.parentNode) {
      drawerMounts.signInParent = signIn.parentNode;
      drawerMounts.signInNext = signIn.nextSibling;
    }
    drawerMountSaved = true;
  }

  function restoreToHeader(el, parent, next) {
    if (!el || !parent) return;
    if (next && next.parentNode === parent) {
      parent.insertBefore(el, next);
    } else {
      parent.appendChild(el);
    }
  }

  function syncMobileDrawerAccount() {
    var header = document.querySelector(".jc-site-header");
    var drawerAccount = document.getElementById("jc-drawer-account");
    var greetMount = document.getElementById("jc-drawer-greet-mount");
    var signInMount = document.getElementById("jc-drawer-signin-mount");
    var search = document.getElementById("jc-search-expand");
    var greet = document.getElementById("jc-header-greet");
    var signIn = document.querySelector(".jc-header-right .jc-sign-in");
    if (!header) return;

    saveDrawerMountPoints();

    var useDrawer = isMobileNav() && isSessionSignedIn();

    header.classList.toggle("jc-signed-in-mobile", useDrawer);

    if (search) {
      search.classList.remove("jc-search-expand--drawer", "jc-search-expand--open");
    }

    if (!drawerAccount || !greetMount || !signInMount) return;

    if (useDrawer) {
      drawerAccount.hidden = false;
      if (greet && greet.parentNode !== greetMount) greetMount.appendChild(greet);
      if (signIn && signIn.parentNode !== signInMount) signInMount.appendChild(signIn);
      syncDrawerAccountEmail(true);
    } else {
      drawerAccount.hidden = true;
      restoreToHeader(greet, drawerMounts.greetParent, drawerMounts.greetNext);
      restoreToHeader(signIn, drawerMounts.signInParent, drawerMounts.signInNext);
      syncDrawerAccountEmail(false);
    }
  }

  function bindMobileDrawerAccount(header) {
    if (!header || header.getAttribute("data-jc-drawer-account-bound") === "1") return;
    header.setAttribute("data-jc-drawer-account-bound", "1");

    window.addEventListener(
      "resize",
      function () {
        syncMobileDrawerAccount();
      },
      { passive: true }
    );

    if (typeof mq.addEventListener === "function") {
      mq.addEventListener("change", syncMobileDrawerAccount);
    } else if (typeof mq.addListener === "function") {
      mq.addListener(syncMobileDrawerAccount);
    }

    document.addEventListener("looplab-signin-changed", syncMobileDrawerAccount);
    document.addEventListener("page-nav-loaded", syncMobileDrawerAccount);
  }

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
      var header = document.querySelector(".jc-site-header");
      if (header) header.classList.remove("jc-header-search-open");
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "Open search");
      var panel = document.getElementById("jc-search-results");
      var input = document.getElementById("jc-site-search");
      if (panel) {
        panel.hidden = true;
        panel.innerHTML = "";
      }
      if (input) input.setAttribute("aria-expanded", "false");
    }

    function openSearch() {
      var backdrop = document.getElementById("jc-nav-backdrop");
      if (backdrop && document.body.classList.contains("jc-nav-is-open")) {
        backdrop.click();
      }
      wrap.classList.add("jc-search-expand--open");
      if (isMobileNav()) {
        var header = document.querySelector(".jc-site-header");
        if (header) header.classList.add("jc-header-search-open");
      }
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

    function clearMobileSearchBarClass() {
      if (!isMobileNav()) {
        var header = document.querySelector(".jc-site-header");
        if (header) header.classList.remove("jc-header-search-open");
      }
    }

    window.addEventListener("resize", clearMobileSearchBarClass, { passive: true });
    if (typeof mq.addEventListener === "function") {
      mq.addEventListener("change", clearMobileSearchBarClass);
    } else if (typeof mq.addListener === "function") {
      mq.addListener(clearMobileSearchBarClass);
    }
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

  var SIGNIN_STORAGE_KEY = "looplab-studio-signin";
  var CUSTOMERS_URL = "data/customer.txt";
  var LOCAL_CUSTOMERS_KEY = "looplab-studio-customers-local";

  /**
   * Seed customers if customer.txt is missing or empty (e.g. file:// without fetch).
   * Same defaults as data/customer.txt — edit that file to change seed accounts.
   */
  var DEFAULT_SEED_CUSTOMERS = [
    { email: "arjun@gmail.com", password: "123", name: "Arjun", mobile: "919876543210", loyaltyPoints: 1200 },
    { email: "elrin@gmail.com", password: "123", name: "Elrin", mobile: "919876543211", loyaltyPoints: 2000 },
    { email: "mike@gmail.com", password: "123", name: "Mike", mobile: "919876543212", loyaltyPoints: 400 }
  ];

  var looplabFileCustomers = [];
  var looplabCustomersCache = null;
  var looplabCustomersReady = false;
  var looplabCustomersLoadPromise = null;

  function normalizeDemoEmail(email) {
    return (email || "").trim().toLowerCase();
  }

  function normalizeCustomer(o) {
    var lp = Number(o.loyaltyPoints);
    return {
      email: normalizeDemoEmail(o.email),
      password: String(o.password != null ? o.password : ""),
      name: String(o.name != null ? o.name : ""),
      mobile: String(o.mobile != null ? o.mobile : ""),
      loyaltyPoints: !isNaN(lp) ? lp : 0
    };
  }

  function parseCustomerText(text) {
    var out = [];
    var lines = (text || "").split(/\r?\n/);
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i].trim();
      if (!line || line.charAt(0) === "#") continue;
      try {
        var obj = JSON.parse(line);
        if (obj && obj.email) out.push(normalizeCustomer(obj));
      } catch (ignore) {
        /* skip bad line */
      }
    }
    return out;
  }

  function readLocalRegistered() {
    try {
      var raw = localStorage.getItem(LOCAL_CUSTOMERS_KEY);
      if (!raw) return [];
      var arr = JSON.parse(raw);
      if (!Array.isArray(arr)) return [];
      var out = [];
      for (var i = 0; i < arr.length; i++) {
        if (arr[i] && arr[i].email) out.push(normalizeCustomer(arr[i]));
      }
      return out;
    } catch (e) {
      return [];
    }
  }

  function writeLocalRegistered(arr) {
    try {
      localStorage.setItem(LOCAL_CUSTOMERS_KEY, JSON.stringify(arr));
    } catch (e) {
      /* ignore quota */
    }
  }

  function mergeCustomerLists(fileRows, localRows) {
    var map = {};
    var i;
    for (i = 0; i < fileRows.length; i++) {
      map[fileRows[i].email] = fileRows[i];
    }
    for (i = 0; i < localRows.length; i++) {
      map[localRows[i].email] = localRows[i];
    }
    var merged = [];
    for (var k in map) {
      if (Object.prototype.hasOwnProperty.call(map, k)) merged.push(map[k]);
    }
    return merged;
  }

  function rebuildCustomerCache() {
    var base = looplabFileCustomers.length ? looplabFileCustomers : DEFAULT_SEED_CUSTOMERS.map(normalizeCustomer);
    looplabCustomersCache = mergeCustomerLists(base, readLocalRegistered());
  }

  function loadCustomersIntoCache(cb) {
    if (looplabCustomersReady) {
      if (cb) cb();
      return;
    }
    if (looplabCustomersLoadPromise) {
      looplabCustomersLoadPromise.then(function () {
        if (cb) cb();
      });
      return;
    }
    looplabCustomersLoadPromise = fetch(CUSTOMERS_URL, { cache: "no-store" })
      .then(function (r) {
        return r.ok ? r.text() : "";
      })
      .catch(function () {
        return "";
      })
      .then(function (text) {
        var rows = parseCustomerText(text);
        looplabFileCustomers = rows.length ? rows : [];
        if (!looplabFileCustomers.length) {
          looplabFileCustomers = DEFAULT_SEED_CUSTOMERS.map(normalizeCustomer);
        }
        rebuildCustomerCache();
        looplabCustomersReady = true;
        try {
          document.dispatchEvent(new CustomEvent("looplab-customers-ready"));
        } catch (e0) {
          /* ignore */
        }
        if (cb) cb();
      });
  }

  function withCustomersReady(fn) {
    loadCustomersIntoCache(fn);
  }

  function getCustomerByEmail(email) {
    if (!looplabCustomersCache) return null;
    var key = normalizeDemoEmail(email);
    for (var i = 0; i < looplabCustomersCache.length; i++) {
      if (looplabCustomersCache[i].email === key) return looplabCustomersCache[i];
    }
    return null;
  }

  function appendRegisteredCustomer(row) {
    var list = readLocalRegistered();
    list.push(normalizeCustomer(row));
    writeLocalRegistered(list);
    rebuildCustomerCache();
  }

  function getSessionLoyaltyPoints() {
    try {
      var raw = sessionStorage.getItem(SIGNIN_STORAGE_KEY);
      if (!raw) return 0;
      var o = JSON.parse(raw);
      if (!o || !o.email) return 0;
      if (typeof o.loyaltyPoints === "number" && !isNaN(o.loyaltyPoints)) {
        return o.loyaltyPoints;
      }
      var c = getCustomerByEmail(o.email);
      return c ? c.loyaltyPoints : 0;
    } catch (e) {
      return 0;
    }
  }

  /**
   * Loyalty chip: hidden for guests. Signed-in shows `loyaltyPoints` from session or customer list.
   */
  function formatLoyaltyPoints(n) {
    try {
      return Number(n).toLocaleString("en-US");
    } catch (e) {
      return String(n);
    }
  }

  function isLoyaltySignedIn() {
    try {
      var raw = sessionStorage.getItem(SIGNIN_STORAGE_KEY);
      if (!raw) return false;
      var o = JSON.parse(raw);
      return !!(o && o.email);
    } catch (e) {
      return false;
    }
  }

  function getSessionProfile() {
    try {
      var raw = sessionStorage.getItem(SIGNIN_STORAGE_KEY);
      if (!raw) return null;
      var o = JSON.parse(raw);
      if (!o || !o.email) return null;
      return {
        email: String(o.email || "").trim(),
        name: String(o.name != null ? o.name : "").trim()
      };
    } catch (e2) {
      return null;
    }
  }

  function syncLoyaltyPointsFromUrl() {
    var header = document.querySelector(".jc-site-header");
    var chip = document.querySelector(".jc-loyalty-chip");
    var el = document.querySelector("[data-loyalty-points]");
    if (!header && !chip && !el) return;

    var signed = isLoyaltySignedIn();
    if (header) {
      header.classList.toggle("jc-loyalty-signed-in", signed);
    }
    if (!signed) {
      if (chip) {
        chip.hidden = true;
        chip.setAttribute("aria-hidden", "true");
      }
      if (el) el.textContent = formatLoyaltyPoints(0);
      return;
    }
    if (chip) {
      chip.hidden = false;
      chip.removeAttribute("aria-hidden");
    }
    if (el) el.textContent = formatLoyaltyPoints(getSessionLoyaltyPoints());
  }

  document.addEventListener("page-nav-loaded", syncLoyaltyPointsFromUrl);
  document.addEventListener("DOMContentLoaded", syncLoyaltyPointsFromUrl);
  window.addEventListener("popstate", syncLoyaltyPointsFromUrl);
  document.addEventListener("looplab-signin-changed", syncLoyaltyPointsFromUrl);
  document.addEventListener("looplab-customers-ready", syncLoyaltyPointsFromUrl);
  syncLoyaltyPointsFromUrl();

  document.addEventListener("DOMContentLoaded", function () {
    loadCustomersIntoCache(null);
  });
  document.addEventListener("page-nav-loaded", function () {
    loadCustomersIntoCache(null);
  });

  function syncSignInNavLink() {
    var a = document.querySelector(".jc-sign-in");
    if (!a) return;
    var signed = false;
    try {
      var raw = sessionStorage.getItem(SIGNIN_STORAGE_KEY);
      if (raw) {
        var o = JSON.parse(raw);
        signed = !!(o && o.email);
      }
    } catch (e) {
      signed = false;
    }
    if (signed) {
      a.removeAttribute("data-jc-sign-in-modal");
      a.setAttribute("data-jc-sign-out", "");
      a.setAttribute("href", "#");
      a.textContent = "Sign out";
      a.setAttribute("aria-label", "Sign out");
    } else {
      a.removeAttribute("data-jc-sign-out");
      a.setAttribute("href", "#");
      a.setAttribute("data-jc-sign-in-modal", "");
      a.textContent = "Sign In";
      a.setAttribute("aria-label", "Sign in");
    }
  }

  /** Signed-in greeting in the header (next to Sign In / Sign out). */
  function syncSignedInHeaderGreet() {
    var wrap = document.getElementById("jc-header-greet");
    var greet = document.querySelector("[data-jc-user-greet]");
    if (!wrap || !greet) return;
    try {
      var raw = sessionStorage.getItem(SIGNIN_STORAGE_KEY);
      if (!raw) {
        wrap.hidden = true;
        greet.textContent = "";
        return;
      }
      var o = JSON.parse(raw);
      if (!o || !o.email) {
        wrap.hidden = true;
        greet.textContent = "";
        return;
      }
      var namePart = o.name && String(o.name).trim() ? String(o.name).trim() : "";
      var display = namePart || normalizeDemoEmail(o.email).split("@")[0] || "there";
      greet.textContent = "Hi, " + display;
      wrap.hidden = false;
    } catch (e) {
      wrap.hidden = true;
      greet.textContent = "";
    }
  }

  document.addEventListener("page-nav-loaded", syncSignInNavLink);
  document.addEventListener("DOMContentLoaded", syncSignInNavLink);
  document.addEventListener("page-nav-loaded", syncSignedInHeaderGreet);
  document.addEventListener("DOMContentLoaded", syncSignedInHeaderGreet);
  document.addEventListener("looplab-signin-changed", syncSignedInHeaderGreet);

  document.addEventListener(
    "click",
    function (e) {
      var out = e.target && e.target.closest && e.target.closest("a.jc-sign-in[data-jc-sign-out]");
      if (!out) return;
      e.preventDefault();
      try {
        sessionStorage.removeItem(SIGNIN_STORAGE_KEY);
      } catch (err) {
        /* ignore */
      }
      syncSignInNavLink();
      try {
        document.dispatchEvent(new CustomEvent("looplab-signin-changed"));
      } catch (e2) {
        /* ignore */
      }
    },
    false
  );

  /**
   * Header sign-in: modal backed by data/customer.txt + localStorage (see NAV.md).
   */
  function bindSignInModal() {
    var modal = document.getElementById("jc-sign-in-modal");
    if (!modal || modal.getAttribute("data-jc-sign-in-modal-bound") === "1") return;
    modal.setAttribute("data-jc-sign-in-modal-bound", "1");

    var viewLogin = document.getElementById("jc-sign-in-modal-view-login");
    var viewRegister = document.getElementById("jc-sign-in-modal-view-register");
    var form = document.getElementById("jc-sign-in-modal-form");
    var emailEl = document.getElementById("jc-sign-in-modal-email");
    var pwdEl = document.getElementById("jc-sign-in-modal-password");
    var errEl = document.getElementById("jc-sign-in-modal-error");
    var submitBtn = document.getElementById("jc-sign-in-modal-submit");
    var labelBusy = submitBtn && submitBtn.querySelector(".jc-sign-in-modal__submit-label");
    var labelWorking = submitBtn && submitBtn.querySelector(".jc-sign-in-modal__submit-busy");
    var pwdToggle = document.getElementById("jc-sign-in-modal-pwd-toggle");
    var forgot = document.getElementById("jc-sign-in-modal-forgot");

    var regForm = document.getElementById("jc-sign-in-modal-reg-form");
    var regErrEl = document.getElementById("jc-sign-in-modal-reg-error");
    var regName = document.getElementById("jc-sign-in-modal-reg-name");
    var regEmail = document.getElementById("jc-sign-in-modal-reg-email");
    var regMobile = document.getElementById("jc-sign-in-modal-reg-mobile");
    var regPwd = document.getElementById("jc-sign-in-modal-reg-password");
    var regSubmit = document.getElementById("jc-sign-in-modal-reg-submit");
    var regLabelBusy = regSubmit && regSubmit.querySelector(".jc-sign-in-modal__reg-submit-label");
    var regLabelWorking = regSubmit && regSubmit.querySelector(".jc-sign-in-modal__reg-submit-busy");
    var regPwdToggle = document.getElementById("jc-sign-in-modal-reg-pwd-toggle");

    var lastFocus = null;

    function showErr(msg) {
      if (!errEl) return;
      errEl.textContent = msg || "";
      errEl.toggleAttribute("hidden", !msg);
    }

    function showRegErr(msg) {
      if (!regErrEl) return;
      regErrEl.textContent = msg || "";
      regErrEl.toggleAttribute("hidden", !msg);
    }

    function setBusy(busy) {
      if (!submitBtn) return;
      submitBtn.disabled = !!busy;
      if (labelBusy) labelBusy.toggleAttribute("hidden", !!busy);
      if (labelWorking) labelWorking.toggleAttribute("hidden", !busy);
    }

    function setRegBusy(busy) {
      if (!regSubmit) return;
      regSubmit.disabled = !!busy;
      if (regLabelBusy) regLabelBusy.toggleAttribute("hidden", !!busy);
      if (regLabelWorking) regLabelWorking.toggleAttribute("hidden", !busy);
    }

    function setModalView(which) {
      var isReg = which === "register";
      if (viewLogin) viewLogin.hidden = isReg;
      if (viewRegister) viewRegister.hidden = !isReg;
      modal.setAttribute("aria-labelledby", isReg ? "jc-sign-in-modal-title-register" : "jc-sign-in-modal-title-login");
      showErr("");
      showRegErr("");
    }

    function closeSignInModal() {
      if (modal.hidden) return;
      modal.hidden = true;
      modal.setAttribute("aria-hidden", "true");
      document.body.classList.remove("jc-sign-in-modal-open");
      showErr("");
      showRegErr("");
      setBusy(false);
      setRegBusy(false);
      setModalView("login");
      var header = document.querySelector(".jc-site-header");
      if (header && header.classList.contains("jc-nav-is-open")) {
        var bd = document.getElementById("jc-nav-backdrop");
        if (bd) bd.click();
      }
      if (lastFocus && typeof lastFocus.focus === "function") {
        try {
          lastFocus.focus();
        } catch (e) {
          /* ignore */
        }
      }
      lastFocus = null;
    }

    function openSignInModal(initialView) {
      var header = document.querySelector(".jc-site-header");
      if (header && header.classList.contains("jc-nav-is-open")) {
        var bd = document.getElementById("jc-nav-backdrop");
        if (bd) bd.click();
      }
      lastFocus = document.activeElement;
      modal.hidden = false;
      modal.setAttribute("aria-hidden", "false");
      document.body.classList.add("jc-sign-in-modal-open");
      showErr("");
      showRegErr("");
      setModalView(initialView === "register" ? "register" : "login");
      window.requestAnimationFrame(function () {
        if (initialView === "register" && regName) {
          regName.focus();
        } else if (emailEl) {
          emailEl.focus();
        }
      });
    }

    document.addEventListener(
      "click",
      function (e) {
        var trigger = e.target && e.target.closest && e.target.closest("a.jc-sign-in[data-jc-sign-in-modal]");
        if (!trigger) return;
        e.preventDefault();
        openSignInModal("login");
      },
      false
    );

    modal.addEventListener("click", function (e) {
      if (e.target.closest && e.target.closest("[data-jc-sign-in-close]")) {
        closeSignInModal();
        return;
      }
      if (e.target.closest && e.target.closest("[data-jc-sign-in-show-register]")) {
        e.preventDefault();
        setModalView("register");
        window.requestAnimationFrame(function () {
          if (regName) regName.focus();
        });
        return;
      }
      if (e.target.closest && e.target.closest("[data-jc-sign-in-show-login]")) {
        e.preventDefault();
        setModalView("login");
        window.requestAnimationFrame(function () {
          if (emailEl) emailEl.focus();
        });
        return;
      }
      if (e.target.closest && e.target.closest(".jc-sign-in-modal__legal a[href='#']")) {
        e.preventDefault();
      }
    });

    if (forgot) {
      forgot.addEventListener("click", function (e) {
        e.preventDefault();
        showErr("Password reset is not available on this demo site.");
      });
    }

    document.addEventListener(
      "keydown",
      function (e) {
        if (e.key !== "Escape") return;
        if (modal.hidden) return;
        closeSignInModal();
        e.stopPropagation();
      },
      true
    );

    function bindPwdToggle(toggle, input) {
      if (!toggle || !input) return;
      toggle.addEventListener("click", function () {
        var show = input.getAttribute("type") === "password";
        input.setAttribute("type", show ? "text" : "password");
        toggle.setAttribute("aria-pressed", show ? "true" : "false");
        toggle.setAttribute("aria-label", show ? "Hide password" : "Show password");
        toggle.textContent = show ? "Hide" : "Show";
      });
    }

    bindPwdToggle(pwdToggle, pwdEl);
    bindPwdToggle(regPwdToggle, regPwd);

    if (!form || !emailEl) return;

    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      showErr("");
      var email = (emailEl.value || "").trim();

      if (!email) {
        showErr("Enter your email address.");
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showErr("Enter a valid email address.");
        return;
      }

      var pwd = pwdEl ? pwdEl.value || "" : "";
      if (!pwd) {
        showErr("Enter your password.");
        return;
      }

      withCustomersReady(function () {
        var acct = getCustomerByEmail(email);
        if (!acct) {
          showErr("No account for that email. Register first, or add the row to data/customer.txt (needs HTTP).");
          return;
        }
        if (acct.password !== pwd) {
          showErr("Wrong password.");
          return;
        }

        setBusy(true);
        window.setTimeout(function () {
          try {
            var norm = normalizeDemoEmail(email);
            sessionStorage.setItem(
              SIGNIN_STORAGE_KEY,
              JSON.stringify({
                email: norm,
                name: acct.name || "",
                signedInAt: Date.now(),
                loyaltyPoints: acct.loyaltyPoints
              })
            );
          } catch (e) {
            setBusy(false);
            showErr("Could not save your session. Check that cookies/storage are enabled.");
            return;
          }

          setBusy(false);
          closeSignInModal();
          syncSignInNavLink();
          try {
            document.dispatchEvent(new CustomEvent("looplab-signin-changed"));
          } catch (e3) {
            /* ignore */
          }
        }, 380);
      });
    });

    if (regForm && regEmail && regPwd) {
      regForm.addEventListener("submit", function (ev) {
        ev.preventDefault();
        showRegErr("");
        var name = regName ? (regName.value || "").trim() : "";
        var remail = (regEmail.value || "").trim();
        var mobile = regMobile ? (regMobile.value || "").replace(/\D/g, "") : "";
        var pwd = regPwd.value || "";

        if (!name) {
          showRegErr("Enter your full name.");
          return;
        }
        if (!remail) {
          showRegErr("Enter your email address.");
          return;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(remail)) {
          showRegErr("Enter a valid email address.");
          return;
        }
        if (!mobile || mobile.length < 8) {
          showRegErr("Enter a valid mobile number.");
          return;
        }
        if (!pwd) {
          showRegErr("Enter your password.");
          return;
        }
        if (pwd.length < 4) {
          showRegErr("Use at least 4 characters for your password.");
          return;
        }

        withCustomersReady(function () {
          if (getCustomerByEmail(remail)) {
            showRegErr("An account with this email already exists. Use Log In.");
            return;
          }

          appendRegisteredCustomer({
            email: remail,
            password: pwd,
            name: name,
            mobile: mobile,
            loyaltyPoints: 0
          });

          setRegBusy(true);
          window.setTimeout(function () {
            try {
              sessionStorage.setItem(
                SIGNIN_STORAGE_KEY,
                JSON.stringify({
                  email: normalizeDemoEmail(remail),
                  name: name,
                  signedInAt: Date.now(),
                  registered: true,
                  loyaltyPoints: 0
                })
              );
            } catch (e) {
              setRegBusy(false);
              showRegErr("Could not save your session. Check that cookies/storage are enabled.");
              return;
            }

            setRegBusy(false);
            closeSignInModal();
            syncSignInNavLink();
            try {
              document.dispatchEvent(new CustomEvent("looplab-signin-changed"));
            } catch (e4) {
              /* ignore */
            }
          }, 380);
        });
      });
    }
  }

  document.addEventListener("page-nav-loaded", bindSignInModal);
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bindSignInModal);
  } else {
    bindSignInModal();
  }

  try {
    window.LoopLabCustomerSession = {
      getLoyaltyPoints: getSessionLoyaltyPoints,
      isSignedIn: isLoyaltySignedIn,
      getSessionProfile: getSessionProfile
    };
  } catch (eWin) {
    /* ignore */
  }
})();
