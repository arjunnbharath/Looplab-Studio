/**
 * Checkout page: reads cart bill snapshot from sessionStorage (set on cart
 * "Proceed to checkout"). Requires js/page-cart-store.js (window.LLCart).
 */
(function () {
  if (typeof window === "undefined" || !window.LLCart) return;

  var LLCart = window.LLCart;
  var SNAPSHOT_KEY = "looplab_checkout_snapshot_v1";
  var LOYALTY_CODE = "LOYALTY";

  function escapeHtml(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function prefillDeliveryFromSession() {
    var nameEl = document.getElementById("co-full-name");
    var emailEl = document.getElementById("co-email");
    var ses = typeof window !== "undefined" && window.LoopLabCustomerSession;
    if ((!nameEl && !emailEl) || !ses || !ses.getSessionProfile) return;
    var p = ses.getSessionProfile();
    if (!p) return;
    if (nameEl && !String(nameEl.value || "").trim()) {
      if (p.name) {
        nameEl.value = p.name;
      } else if (p.email) {
        var at = p.email.indexOf("@");
        if (at > 0) nameEl.value = p.email.slice(0, at);
      }
    }
    if (emailEl && !String(emailEl.value || "").trim() && p.email) {
      emailEl.value = p.email;
    }
  }

  function readSnapshot() {
    try {
      var raw = sessionStorage.getItem(SNAPSHOT_KEY);
      if (!raw) return null;
      var o = JSON.parse(raw);
      if (!o || o.version !== 1 || !Array.isArray(o.lines) || !o.lines.length) {
        return null;
      }
      return o;
    } catch (e) {
      return null;
    }
  }

  function renderBill(container, data) {
    var when = new Date(data.createdAt || Date.now());
    var dateStr = when.toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short"
    });

    var promos = Array.isArray(data.promos) ? data.promos : [];
    var promosHtml =
      promos.length > 0
        ? "<p class=\"jc-bill-promos\">Promos: " +
          escapeHtml(promos.join(", ")) +
          "</p>"
        : "";

    var loyaltyNote =
      data.effectiveLoyaltyPts > 0
        ? "<p class=\"jc-bill-meta\">Loyalty points applied: " +
          Number(data.effectiveLoyaltyPts).toLocaleString("en-US") +
          " pts</p>"
        : "";

    var linesHtml = "";
    data.lines.forEach(function (line) {
      var gift = !!line.freeGift;
      var title = escapeHtml(line.title);
      var meta = escapeHtml(line.meta || "");
      var qty = line.qty || 1;
      var img = escapeHtml(line.image || "");
      var price = LLCart.fmt(line.lineTotalCents || 0);
      linesHtml +=
        '<li class="jc-bill-line' +
        (gift ? " jc-bill-line--gift" : "") +
        '">' +
        (img
          ? '<img class="jc-bill-line-img" src="' +
            img +
            '" alt="" width="52" height="52" loading="lazy" />'
          : '<span class="jc-bill-line-img" aria-hidden="true"></span>') +
        '<div class="jc-bill-line-body">' +
        "<p class=\"jc-bill-line-title\">" +
        title +
        "</p>" +
        '<p class="jc-bill-line-meta">' +
        (gift ? "Included · " : "") +
        "Qty " +
        escapeHtml(String(qty)) +
        (meta && !gift ? " · " + meta : "") +
        "</p>" +
        "</div>" +
        '<p class="jc-bill-line-price">' +
        (gift ? "$0.00" : escapeHtml(price)) +
        "</p>" +
        "</li>";
    });

    var discountRows = "";
    (data.discountLines || []).forEach(function (L) {
      var isLoyalty = L.code === LOYALTY_CODE;
      var lab = isLoyalty
        ? escapeHtml(L.label || "Loyalty")
        : "Promo (" + escapeHtml(L.label || L.code) + ")";
      discountRows +=
        '<div class="jc-bill-row jc-bill-row--discount">' +
        "<span>" +
        lab +
        "</span>" +
        "<span>\u2212" +
        escapeHtml(LLCart.fmt(L.cents || 0)) +
        "</span>" +
        "</div>";
    });

    container.innerHTML =
      '<div class="jc-bill-header">' +
      '<p class="jc-bill-brand">LoopLab Studio</p>' +
      '<p class="jc-bill-meta">' +
      escapeHtml(dateStr) +
      "</p>" +
      '<p class="jc-bill-meta">Order ref: <strong>' +
      escapeHtml(data.orderRef || "—") +
      "</strong></p>" +
      loyaltyNote +
      promosHtml +
      "</div>" +
      '<ul class="jc-bill-lines">' +
      linesHtml +
      "</ul>" +
      '<div class="jc-bill-rows">' +
      '<div class="jc-bill-row">' +
      "<span>Subtotal</span>" +
      "<span>" +
      escapeHtml(LLCart.fmt(data.subtotalCents || 0)) +
      "</span>" +
      "</div>" +
      discountRows +
      '<div class="jc-bill-row">' +
      "<span>Shipping (3–5 business days)</span>" +
      "<span>" +
      (data.shippingCents ? escapeHtml(LLCart.fmt(data.shippingCents)) : "Free") +
      "</span>" +
      "</div>" +
      '<div class="jc-bill-row">' +
      "<span>Tax (estimated)</span>" +
      "<span>" +
      escapeHtml(LLCart.fmt(data.taxCents || 0)) +
      "</span>" +
      "</div>" +
      '<div class="jc-bill-row jc-bill-row--total">' +
      "<span>Total due</span>" +
      "<span>" +
      escapeHtml(LLCart.fmt(data.finalCents || 0)) +
      "</span>" +
      "</div>" +
      "</div>";
  }

  function init() {
    var emptyEl = document.getElementById("jc-checkout-empty");
    var mainEl = document.getElementById("jc-checkout-main");
    var billEl = document.getElementById("jc-checkout-bill");
    var thanksEl = document.getElementById("jc-checkout-thanks");
    var placeBtn = document.getElementById("jc-checkout-place-demo");

    var snap = readSnapshot();

    if (!snap || !billEl) {
      if (emptyEl) emptyEl.hidden = false;
      if (mainEl) mainEl.hidden = true;
      return;
    }

    if (emptyEl) emptyEl.hidden = true;
    if (mainEl) mainEl.hidden = false;

    renderBill(billEl, snap);
    prefillDeliveryFromSession();

    if (placeBtn) {
      placeBtn.addEventListener("click", function () {
        if (thanksEl) {
          thanksEl.textContent =
            "Thanks — this is a demo checkout. No payment was taken and your bag is unchanged.";
          thanksEl.classList.add("jc-checkout-thanks--show");
        }
        placeBtn.disabled = true;
      });
    }
  }

  function bindCheckoutSessionSync() {
    document.addEventListener("looplab-signin-changed", function () {
      if (document.getElementById("jc-checkout-main") && !document.getElementById("jc-checkout-main").hidden) {
        prefillDeliveryFromSession();
      }
    });
    document.addEventListener("page-nav-loaded", function () {
      if (document.getElementById("jc-checkout-main") && !document.getElementById("jc-checkout-main").hidden) {
        prefillDeliveryFromSession();
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      bindCheckoutSessionSync();
      init();
    });
  } else {
    bindCheckoutSessionSync();
    init();
  }
})();
