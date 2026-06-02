/**
 * Cart UI: bag count, PLP / new page add-to-bag, cart.html list render + qty/remove.
 * Requires js/page-cart-store.js (window.LLCart).
 */
(function () {
  if (typeof window === "undefined" || !window.LLCart) return;

  var LLCart = window.LLCart;
  var PROMOS_STORAGE_KEY = "looplab_cart_promos_v1";
  /** Legacy single-code key — migrated once into PROMOS_STORAGE_KEY */
  var LEGACY_PROMO_STORAGE_KEY = "looplab_cart_promo_v1";
  /** 50% off entire cart subtotal */
  var PROMO_50 = "50LESS";
  /** 25% off bag items only (see isBagLineItem) */
  var PROMO_SUNNY = "SUNNY";
  var COUPON_APPLY_LABEL_DEFAULT = "Apply";
  var COUPON_HINT_DEFAULT =
    "Have a coupon? Enter it below and we will apply it to this bag.";

  function isValidPromo(norm) {
    return norm === PROMO_50 || norm === PROMO_SUNNY;
  }

  /** Line counts toward SUNNY bag discount */
  function isBagLineItem(item) {
    if (!item) return false;
    var id = String(item.id || "");
    if (id.lastIndexOf("bags-", 0) === 0) return true;
    if (id.lastIndexOf("bags-men-", 0) === 0) return true;
    var img = String(item.image || "").toLowerCase();
    if (img.indexOf("/bags/") !== -1 || img.indexOf("\\bags\\") !== -1)
      return true;
    if (img.indexOf("/bags_men/") !== -1 || img.indexOf("\\bags_men\\") !== -1)
      return true;
    if (img.indexOf("/bages-men/") !== -1 || img.indexOf("\\bages-men\\") !== -1)
      return true;
    var meta = String(item.meta || "");
    return /\bBags\b/i.test(meta);
  }

  function bagsSubtotalCents(items) {
    return items.reduce(function (acc, x) {
      if (!isBagLineItem(x)) return acc;
      return acc + (x.priceCents || 0) * (x.qty || 1);
    }, 0);
  }

  function migrateLegacyPromoIfNeeded() {
    try {
      var legacy = sessionStorage.getItem(LEGACY_PROMO_STORAGE_KEY);
      if (!legacy) return;
      var n = normalizePromoCode(legacy);
      sessionStorage.removeItem(LEGACY_PROMO_STORAGE_KEY);
      if (isValidPromo(n)) setAppliedPromos([n]);
    } catch (e) {
      /* ignore */
    }
  }

  function getAppliedPromos() {
    migrateLegacyPromoIfNeeded();
    try {
      var raw = sessionStorage.getItem(PROMOS_STORAGE_KEY);
      if (!raw) return [];
      var p = JSON.parse(raw);
      if (!Array.isArray(p)) return [];
      var out = [];
      var seen = {};
      for (var i = 0; i < p.length; i++) {
        var n = normalizePromoCode(p[i]);
        if (!isValidPromo(n) || seen[n]) continue;
        seen[n] = true;
        out.push(n);
      }
      return out;
    } catch (e2) {
      return [];
    }
  }

  function setAppliedPromos(codes) {
    try {
      var clean = [];
      var seen = {};
      for (var i = 0; i < (codes || []).length; i++) {
        var n = normalizePromoCode(codes[i]);
        if (!isValidPromo(n) || seen[n]) continue;
        seen[n] = true;
        clean.push(n);
      }
      if (clean.length) sessionStorage.setItem(PROMOS_STORAGE_KEY, JSON.stringify(clean));
      else sessionStorage.removeItem(PROMOS_STORAGE_KEY);
    } catch (e) {
      /* ignore */
    }
  }

  function removePromo(code) {
    var n = normalizePromoCode(code);
    var cur = getAppliedPromos();
    setAppliedPromos(cur.filter(function (c) {
      return c !== n;
    }));
  }

  function computeDiscountLines(subtotalCents, items, promos) {
    var lines = [];
    if (!items.length || !promos.length) return lines;
    var bagSub = bagsSubtotalCents(items);
    if (promos.indexOf(PROMO_50) !== -1) {
      lines.push({
        code: PROMO_50,
        label: "50LESS — 50% off order",
        cents: Math.round(subtotalCents * 0.5),
      });
    }
    if (promos.indexOf(PROMO_SUNNY) !== -1) {
      lines.push({
        code: PROMO_SUNNY,
        label: "SUNNY — 25% off bag items",
        cents: Math.round(bagSub * 0.25),
      });
    }
    var raw = 0;
    for (var j = 0; j < lines.length; j++) raw += lines[j].cents;
    if (raw > subtotalCents && raw > 0) {
      var scale = subtotalCents / raw;
      for (var k = 0; k < lines.length; k++) {
        lines[k].cents = Math.round(lines[k].cents * scale);
      }
      var drift = subtotalCents - lines.reduce(function (a, L) {
        return a + L.cents;
      }, 0);
      if (drift !== 0 && lines.length) lines[lines.length - 1].cents += drift;
    }
    return lines;
  }

  function renderAppliedPromoList(promos) {
    var ul = document.getElementById("jc-coupon-applied-list");
    if (!ul) return;
    ul.innerHTML = "";
    if (!promos.length) {
      ul.hidden = true;
      return;
    }
    ul.hidden = false;
    promos.forEach(function (code) {
      var li = document.createElement("li");
      li.className = "jc-coupon-applied-item";
      var text = document.createElement("span");
      text.className = "jc-coupon-applied-text";
      text.textContent = code + " promo code applied";
      var rm = document.createElement("button");
      rm.type = "button";
      rm.className = "jc-coupon-remove-promo";
      rm.setAttribute("data-remove-promo", code);
      rm.setAttribute("aria-label", "Remove " + code + " promo code");
      rm.textContent = "Remove";
      li.appendChild(text);
      li.appendChild(rm);
      ul.appendChild(li);
    });
  }

  function renderDiscountRows(discountLines) {
    var wrap = document.getElementById("jc-cart-discount-rows");
    if (!wrap) return;
    wrap.innerHTML = "";
    discountLines.forEach(function (L) {
      var row = document.createElement("div");
      row.className =
        "jc-cart-summary-row jc-cart-discount-row jc-cart-discount-row--promo";
      row.setAttribute("data-cart-discount-line", L.code);
      var lab = document.createElement("span");
      lab.textContent = "Promo (" + L.label + ")";
      var amt = document.createElement("span");
      amt.textContent = "−" + LLCart.fmt(L.cents);
      row.appendChild(lab);
      row.appendChild(amt);
      wrap.appendChild(row);
    });
    wrap.style.display = discountLines.length ? "" : "none";
  }

  function setCouponErrorState(isError) {
    var hint = document.getElementById("jc-coupon-hint");
    var field = document.querySelector(".jc-coupon-field");
    var input = document.querySelector(".jc-coupon-input");
    if (hint) {
      hint.classList.toggle("jc-coupon-hint--error", !!isError);
      if (isError) hint.setAttribute("role", "alert");
      else hint.removeAttribute("role");
    }
    if (field) {
      field.classList.toggle("jc-coupon-field--error", !!isError);
      if (isError) field.classList.remove("jc-coupon-field--applied");
    }
    if (input) {
      if (isError) input.setAttribute("aria-invalid", "true");
      else input.removeAttribute("aria-invalid");
    }
  }

  function normalizePromoCode(raw) {
    return String(raw || "")
      .trim()
      .toUpperCase();
  }

  function syncCouponFieldUi(hasPromos, itemsLength) {
    var input = document.querySelector(".jc-coupon-input");
    var applyBtn = document.querySelector(".jc-coupon-apply");
    if (applyBtn && !applyBtn.getAttribute("data-cart-apply-default")) {
      applyBtn.setAttribute(
        "data-cart-apply-default",
        (applyBtn.textContent || "").trim() || COUPON_APPLY_LABEL_DEFAULT
      );
    }
    var defaultLabel =
      (applyBtn && applyBtn.getAttribute("data-cart-apply-default")) ||
      COUPON_APPLY_LABEL_DEFAULT;

    if (input && !itemsLength) {
      input.value = "";
    }
    if (applyBtn) {
      applyBtn.textContent = defaultLabel;
      applyBtn.setAttribute(
        "aria-label",
        hasPromos ? "Apply another promo code" : "Apply coupon code"
      );
    }
  }

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

  function wirePdpLinks() {
    document.querySelectorAll(".pd-card[data-product-id] a.pd-card-link").forEach(function (a) {
      var card = a.closest(".pd-card");
      var id = card && card.getAttribute("data-product-id");
      if (!id) return;
      var raw = (a.getAttribute("href") || "").trim();
      if (raw === "#" || raw === "" || raw === "javascript:void(0)") {
        a.href =
          "product.html?id=" +
          encodeURIComponent(id) +
          "#p=" +
          encodeURIComponent(id);
      }
    });
  }

  function initProductGrids() {
    document.querySelectorAll(".pd-grid .pd-card").forEach(ensureAddButton);
    wirePdpLinks();
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

    var subtotalCents = LLCart.totalCents();
    var promos = getAppliedPromos();

    if (!items.length) {
      setAppliedPromos([]);
      promos = [];
      var hintEmpty = document.getElementById("jc-coupon-hint");
      if (hintEmpty) hintEmpty.textContent = COUPON_HINT_DEFAULT;
      setCouponErrorState(false);
    }

    var cleaned = promos.filter(isValidPromo);
    if (cleaned.length !== promos.length) setAppliedPromos(cleaned);
    promos = getAppliedPromos();

    var discountLines = computeDiscountLines(subtotalCents, items, promos);
    var discountCents = discountLines.reduce(function (a, L) {
      return a + L.cents;
    }, 0);
    var finalCents = Math.max(0, subtotalCents - discountCents);

    if (sub) sub.textContent = LLCart.fmt(subtotalCents);
    if (total) total.textContent = LLCart.fmt(finalCents);

    renderDiscountRows(discountLines);
    renderAppliedPromoList(promos);

    var hasPromos = items.length > 0 && promos.length > 0;
    var anyDiscount = discountCents > 0;

    if (hasPromos) {
      setCouponErrorState(false);
    }

    var couponField = document.querySelector(".jc-coupon-field");
    var summaryTotalEl = document.querySelector(".jc-cart-summary-total");
    if (couponField) {
      couponField.classList.toggle("jc-coupon-field--applied", hasPromos);
    }
    if (summaryTotalEl) {
      summaryTotalEl.classList.toggle(
        "jc-cart-summary-total--promo",
        hasPromos && anyDiscount
      );
    }

    syncCouponFieldUi(hasPromos, items.length);
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

  function wireAppliedPromoRemove() {
    var ul = document.getElementById("jc-coupon-applied-list");
    if (!ul || ul.getAttribute("data-promo-remove-bound") === "1") return;
    ul.setAttribute("data-promo-remove-bound", "1");
    ul.addEventListener("click", function (ev) {
      var btn = ev.target.closest("[data-remove-promo]");
      if (!btn) return;
      var code = btn.getAttribute("data-remove-promo");
      if (!code) return;
      removePromo(code);
      var hint = document.getElementById("jc-coupon-hint");
      var remaining = getAppliedPromos();
      if (hint) {
        if (remaining.length) {
          hint.textContent =
            "Removed " +
            normalizePromoCode(code) +
            ". Other promos stay on your order.";
        } else {
          hint.textContent = COUPON_HINT_DEFAULT;
        }
      }
      setCouponErrorState(false);
      renderCartPage();
    });
  }

  function wireCouponApply() {
    var apply = document.querySelector(".jc-coupon-apply");
    if (!apply || apply.getAttribute("data-cart-coupon-bound") === "1") return;
    apply.setAttribute("data-cart-coupon-bound", "1");
    apply.addEventListener("click", function () {
      var input = document.querySelector(".jc-coupon-input");
      var hint = document.getElementById("jc-coupon-hint");
      var code = input && input.value.trim();
      if (!code) return;

      var items = LLCart.load();
      if (!items.length) {
        setCouponErrorState(false);
        if (hint)
          hint.textContent =
            "Your bag is empty — add items before applying a promo code.";
        return;
      }

      var norm = normalizePromoCode(code);
      if (!isValidPromo(norm)) {
        setCouponErrorState(true);
        if (hint)
          hint.textContent =
            "Invalid code — not recognized. Try " +
            PROMO_50 +
            " or " +
            PROMO_SUNNY +
            ".";
        return;
      }

      var promos = getAppliedPromos();
      if (promos.indexOf(norm) !== -1) {
        setCouponErrorState(false);
        if (hint)
          hint.textContent =
            norm +
            " is already applied. Enter the other code if you have not added it yet.";
        return;
      }

      promos.push(norm);
      setAppliedPromos(promos);
      if (input) input.value = "";
      setCouponErrorState(false);
      if (hint) {
        var bagC = bagsSubtotalCents(items);
        if (norm === PROMO_50) {
          hint.textContent =
            PROMO_50 +
            " added — 50% off your order subtotal. See Cart totals for each promo line.";
        } else {
          hint.textContent =
            PROMO_SUNNY +
            (bagC > 0
              ? " added — 25% off bag items. See Cart totals for each promo line."
              : " added — 25% off bag-tagged lines when you add them. See Cart totals.");
        }
      }
      renderCartPage();
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
    wireAppliedPromoRemove();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
