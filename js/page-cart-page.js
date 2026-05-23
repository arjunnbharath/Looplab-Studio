/**
 * Cart UI: bag count, PLP / new page add-to-bag, cart.html list render + qty/remove.
 * Requires js/page-cart-store.js (window.LLCart).
 */
(function () {
  if (typeof window === "undefined" || !window.LLCart) return;

  var LLCart = window.LLCart;

  function syncBagBadge() {
    var n = LLCart.totalQty();
    document.querySelectorAll("[data-cart-count]").forEach(function (el) {
      el.textContent = String(n);
      el.hidden = n < 1;
    });
    document.querySelectorAll(".jc-bag-btn").forEach(function (btn) {
      var base = "Shopping bag";
      btn.setAttribute("aria-label", n ? base + ", " + n + " items" : base);
    });
  }

  function ensureAddButton(card) {
    if (!card || card.querySelector(".pd-card-add")) return;
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "pd-card-add";
    btn.setAttribute("data-add-to-bag", "");
    var titleEl = card.querySelector(".pd-card-title");
    var label = titleEl ? titleEl.textContent.trim() : "product";
    btn.setAttribute("aria-label", "Add " + label + " to bag");
    btn.textContent = "Add to bag";
    card.appendChild(btn);
  }

  function initProductGrids() {
    document.querySelectorAll(".pd-grid .pd-card").forEach(ensureAddButton);
  }

  function onAddClick(ev) {
    var btn = ev.target.closest("[data-add-to-bag]");
    if (!btn) return;
    var card = btn.closest(".pd-card");
    if (!card) return;
    ev.preventDefault();
    LLCart.addFromCard(card);
    syncBagBadge();
    var prev = btn.textContent;
    btn.textContent = "Added";
    btn.disabled = true;
    window.setTimeout(function () {
      btn.textContent = prev;
      btn.disabled = false;
    }, 1400);
  }

  function buildCartRow(item) {
    var li = document.createElement("li");
    li.className = "jc-cart-row";
    li.setAttribute("data-cart-line-id", item.id);

    var rm = document.createElement("button");
    rm.type = "button";
    rm.className = "jc-cart-row-remove";
    rm.setAttribute("aria-label", "Remove " + item.title);
    rm.appendChild(document.createTextNode("\u00d7"));

    var img = document.createElement("img");
    img.className = "jc-cart-row-img";
    img.src = item.image || "";
    img.alt = "";
    img.width = 88;
    img.height = 88;
    img.loading = "lazy";

    var body = document.createElement("div");
    body.className = "jc-cart-row-body";

    var h2 = document.createElement("h2");
    h2.className = "jc-cart-item-title";
    h2.textContent = item.title;

    var meta = document.createElement("p");
    meta.className = "jc-cart-item-meta";
    var mq = item.qty || 1;
    meta.appendChild(
      document.createTextNode(
        (item.meta ? item.meta + " · " : "") + "Qty "
      )
    );
    var mqSpan = document.createElement("span");
    mqSpan.setAttribute("data-qty-display", "1");
    mqSpan.textContent = String(mq);
    meta.appendChild(mqSpan);

    var qtyWrap = document.createElement("div");
    qtyWrap.className = "jc-cart-qty";
    qtyWrap.setAttribute("data-qty-wrap", "");
    qtyWrap.setAttribute("data-line-id", item.id);

    var down = document.createElement("button");
    down.type = "button";
    down.setAttribute("data-qty-down", "");
    down.setAttribute("aria-label", "Decrease quantity");
    down.appendChild(document.createTextNode("\u2212"));

    var val = document.createElement("span");
    val.setAttribute("data-qty-val", "");
    val.textContent = String(mq);

    var up = document.createElement("button");
    up.type = "button";
    up.setAttribute("data-qty-up", "");
    up.setAttribute("aria-label", "Increase quantity");
    up.appendChild(document.createTextNode("+"));

    qtyWrap.appendChild(down);
    qtyWrap.appendChild(val);
    qtyWrap.appendChild(up);

    body.appendChild(h2);
    body.appendChild(meta);
    body.appendChild(qtyWrap);

    var lineTotalCents = (item.priceCents || 0) * mq;
    var tot = document.createElement("div");
    tot.className = "jc-cart-row-total";
    var spanTot = document.createElement("span");
    spanTot.className = "jc-cart-line-total";
    spanTot.textContent = LLCart.fmt(lineTotalCents);
    var spanUnit = document.createElement("span");
    spanUnit.className = "jc-cart-line-unit";
    spanUnit.textContent = LLCart.fmt(item.priceCents || 0) + " each";
    tot.appendChild(spanTot);
    tot.appendChild(spanUnit);

    li.appendChild(rm);
    li.appendChild(img);
    li.appendChild(body);
    li.appendChild(tot);

    return li;
  }

  function renderCartPage() {
    var root = document.getElementById("jc-cart-list-root");
    if (!root) return;

    var empty = document.getElementById("jc-cart-empty");
    var items = LLCart.load();
    root.innerHTML = "";

    if (!items.length) {
      root.hidden = true;
      if (empty) empty.hidden = false;
    } else {
      root.hidden = false;
      if (empty) empty.hidden = true;
      items.forEach(function (item) {
        root.appendChild(buildCartRow(item));
      });
    }

    var sub = document.querySelector("[data-cart-subtotal]");
    var total = document.querySelector("[data-cart-total]");
    var cents = LLCart.totalCents();
    var label = LLCart.fmt(cents);
    if (sub) sub.textContent = label;
    if (total) total.textContent = label;
  }

  function readQtyVal(valEl) {
    var n = parseInt(valEl.textContent, 10);
    return isNaN(n) || n < 1 ? 1 : n;
  }

  function bindCartListDelegation() {
    var root = document.getElementById("jc-cart-list-root");
    if (!root || root.getAttribute("data-cart-bound") === "1") return;
    root.setAttribute("data-cart-bound", "1");

    root.addEventListener("click", function (ev) {
      var row = ev.target.closest(".jc-cart-row");
      if (!row) return;
      var id = row.getAttribute("data-cart-line-id");
      if (!id) return;

      if (ev.target.closest(".jc-cart-row-remove")) {
        LLCart.remove(id);
        renderCartPage();
        syncBagBadge();
        return;
      }

      var wrap = ev.target.closest("[data-qty-wrap]");
      if (!wrap || wrap.getAttribute("data-line-id") !== id) return;

      var valEl = wrap.querySelector("[data-qty-val]");
      var metaQty = row.querySelector("[data-qty-display]");
      var lineTotalEl = row.querySelector(".jc-cart-line-total");
      if (!valEl) return;

      if (ev.target.closest("[data-qty-down]")) {
        var n = readQtyVal(valEl);
        if (n > 1) {
          LLCart.setQty(id, n - 1);
          renderCartPage();
          syncBagBadge();
        }
        return;
      }

      if (ev.target.closest("[data-qty-up]")) {
        LLCart.setQty(id, readQtyVal(valEl) + 1);
        renderCartPage();
        syncBagBadge();
      }
    });
  }

  function wireUpdateCartButton() {
    var btn = document.querySelector(".jc-cart-update");
    if (!btn || btn.getAttribute("data-cart-update-bound") === "1") return;
    btn.setAttribute("data-cart-update-bound", "1");
    btn.addEventListener("click", function () {
      renderCartPage();
      syncBagBadge();
    });
  }

  function wireCouponApply() {
    var apply = document.querySelector(".jc-coupon-apply");
    if (!apply || apply.getAttribute("data-cart-coupon-bound") === "1") return;
    apply.setAttribute("data-cart-coupon-bound", "1");
    apply.addEventListener("click", function () {
      var input = document.querySelector(".jc-coupon-input");
      var code = input && input.value.trim();
      if (!code) return;
      /* Demo placeholder */
    });
  }

  function init() {
    syncBagBadge();
    initProductGrids();
    document.addEventListener("click", onAddClick);
    document.addEventListener("ll-cart-change", syncBagBadge);
    document.addEventListener("page-nav-loaded", function () {
      syncBagBadge();
      initProductGrids();
    });

    renderCartPage();
    bindCartListDelegation();
    wireUpdateCartButton();
    wireCouponApply();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
