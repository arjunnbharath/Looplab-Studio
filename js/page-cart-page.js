/**
 * Cart UI: bag count, PLP / new page add-to-bag, cart.html list render + qty/remove.
 * Requires js/page-cart-store.js (window.LLCart).
 */
(function () {
  if (typeof window === "undefined" || !window.LLCart) return;

  var LLCart = window.LLCart;
  var PROMO_STORAGE_KEY = "looplab_cart_promo_v1";
  var PROMO_INVALID_FLAG_KEY = "looplab_cart_promo_invalid_v1";
  var PROMO_CODE = "50LESS";
  var COUPON_APPLY_LABEL_DEFAULT = "Apply";
  var COUPON_HINT_DEFAULT =
    "Have a coupon? Enter it below and we will apply it to this bag.";

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

  function getAppliedPromo() {
    try {
      return sessionStorage.getItem(PROMO_STORAGE_KEY) || "";
    } catch (e) {
      return "";
    }
  }

  function setAppliedPromo(code) {
    try {
      if (code) sessionStorage.setItem(PROMO_STORAGE_KEY, code);
      else sessionStorage.removeItem(PROMO_STORAGE_KEY);
    } catch (e) {
      /* ignore */
    }
  }

  function getInvalidPromoReapplyFlag() {
    try {
      return sessionStorage.getItem(PROMO_INVALID_FLAG_KEY) === "1";
    } catch (e) {
      return false;
    }
  }

  function setInvalidPromoReapplyFlag(on) {
    try {
      if (on) sessionStorage.setItem(PROMO_INVALID_FLAG_KEY, "1");
      else sessionStorage.removeItem(PROMO_INVALID_FLAG_KEY);
    } catch (e) {
      /* ignore */
    }
  }

  function syncCouponFieldUi(promoUiActive, itemsLength) {
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

    if (input) {
      if (promoUiActive) {
        input.value = PROMO_CODE;
      } else if (!itemsLength) {
        input.value = "";
      }
    }
    if (applyBtn) {
      applyBtn.textContent = promoUiActive ? "Applied" : defaultLabel;
      applyBtn.setAttribute(
        "aria-label",
        promoUiActive ? "Promo code applied" : "Apply coupon code"
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
    var discountRow = document.querySelector("[data-cart-discount-row]");
    var discountEl = document.querySelector("[data-cart-discount]");
    var discountLabel = document.querySelector("[data-cart-discount-label]");

    var subtotalCents = LLCart.totalCents();
    var applied = normalizePromoCode(getAppliedPromo());

    if (!items.length) {
      setAppliedPromo("");
      setInvalidPromoReapplyFlag(false);
      applied = "";
      var hintEmpty = document.getElementById("jc-coupon-hint");
      if (hintEmpty) hintEmpty.textContent = COUPON_HINT_DEFAULT;
      setCouponErrorState(false);
    }

    var discountCents = 0;
    var finalCents = subtotalCents;
    if (items.length && applied === PROMO_CODE) {
      finalCents = Math.round(subtotalCents * 0.5);
      discountCents = subtotalCents - finalCents;
    } else if (applied && applied !== PROMO_CODE) {
      setAppliedPromo("");
    }

    if (applied === PROMO_CODE) {
      setInvalidPromoReapplyFlag(false);
    }

    if (sub) sub.textContent = LLCart.fmt(subtotalCents);
    if (total) total.textContent = LLCart.fmt(finalCents);

    var showInvalidZero =
      items.length > 0 &&
      applied !== PROMO_CODE &&
      getInvalidPromoReapplyFlag();

    if (discountRow && discountEl) {
      var showDiscount = items.length && discountCents > 0;
      if (showDiscount) {
        discountRow.hidden = false;
        discountEl.textContent = "−" + LLCart.fmt(discountCents);
        if (discountLabel)
          discountLabel.textContent = "Promo (50% off — " + PROMO_CODE + ")";
      } else if (showInvalidZero) {
        discountRow.hidden = false;
        discountEl.textContent = "−" + LLCart.fmt(0);
        if (discountLabel)
          discountLabel.textContent =
            "Promo discount (invalid code — no savings)";
      } else {
        discountRow.hidden = true;
      }
    }

    var promoUiActive =
      items.length > 0 && applied === PROMO_CODE;
    if (promoUiActive) {
      setCouponErrorState(false);
    } else if (showInvalidZero) {
      setCouponErrorState(true);
    }

    var couponField = document.querySelector(".jc-coupon-field");
    var summaryTotalEl = document.querySelector(".jc-cart-summary-total");
    if (couponField) {
      couponField.classList.toggle("jc-coupon-field--applied", promoUiActive);
    }
    if (discountRow) {
      discountRow.classList.toggle(
        "jc-cart-discount-row--promo",
        promoUiActive && !showInvalidZero
      );
    }
    if (summaryTotalEl) {
      summaryTotalEl.classList.toggle(
        "jc-cart-summary-total--promo",
        promoUiActive
      );
    }

    syncCouponFieldUi(promoUiActive, items.length);
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
      if (norm === PROMO_CODE) {
        setInvalidPromoReapplyFlag(false);
        setAppliedPromo(PROMO_CODE);
        setCouponErrorState(false);
        if (hint)
          hint.textContent =
            "Promo " +
            PROMO_CODE +
            " applied — 50% off your bag subtotal.";
        renderCartPage();
      } else {
        var hadValidPromo = normalizePromoCode(getAppliedPromo()) === PROMO_CODE;
        setAppliedPromo("");
        if (hadValidPromo) setInvalidPromoReapplyFlag(true);
        else setInvalidPromoReapplyFlag(false);
        setCouponErrorState(true);
        if (hint)
          hint.textContent = hadValidPromo
            ? "Invalid code — that code is not valid. Your promo discount is now $0.00. Re-apply " +
              PROMO_CODE +
              " for 50% off."
            : "Invalid code — not recognized. Try " +
              PROMO_CODE +
              " for 50% off.";
        renderCartPage();
      }
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
