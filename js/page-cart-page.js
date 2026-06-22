/**
 * Cart UI: bag count, PLP / new page add-to-bag, cart.html list render + qty/remove.
 * Requires js/page-cart-store.js (window.LLCart).
 */
(function () {
  if (typeof window === "undefined" || !window.LLCart) return;

  var LLCart = window.LLCart;
  var GIFT_LINE_ID = LLCart.FREE_GIFT_LINE_ID || "ll-motherday-gift";
  /** Put your photo at image/gift/gift.jpg or change this path. */
  var GIFT_IMAGE_URL = "image/gift/gift.jpg";
  var FREEGIFT_DECLINED_KEY = "ll_freegift_declined_v1";
  var PROMOS_STORAGE_KEY = "looplab_cart_promos_v1";
  /** Legacy single-code key — migrated once into PROMOS_STORAGE_KEY */
  var LEGACY_PROMO_STORAGE_KEY = "looplab_cart_promo_v1";
  /** 50% off entire cart subtotal */
  var PROMO_50 = "50LESS";
  /** 25% off selected Bags lines (see data/motherday-selected-products.txt + isSunnyEligibleBag) */
  var PROMO_SUNNY = "SUNNY";
  /**
   * Mirror non-# lines in data/motherday-selected-products.txt — used if fetch fails (e.g. file://) or the txt has no product ids.
   */
  var MOTHERDAY_SUNNY_IDS_FALLBACK =
    "bags-03403961772aa7ea137f6bb51709d42f\n" +
    "bags-3902c592edce1989014fb27cab73c716\n" +
    "bags-396ce01cb633625a3fa9487949f323d6\n" +
    "bags-5c30d1c3078e8b58e06832ea7c4e175d\n" +
    "bags-6020e4ef3dcea315d97f12a49473604f\n" +
    "bags-b0496609759bbf5678b718366c92d99e\n" +
    "bags-b37dd35fe525ebc8734f586f3afef775\n" +
    "bags-f2384df6a796b23c739f4886ef29e5b5\n";
  /** null until first list load attempt finishes; then object map base id (lowercase) -> true */
  var sunnyMotherdayIdMap = null;
  /** true when the active id map has at least one Mother's Day pick (from network txt or in-script fallback) */
  var sunnyMotherdayFetchOk = false;
  /** Auto-applied with Mother's Day pick bags — blocks other promo codes while active */
  var PROMO_FREEGIFT = "FREEGIFT";
  var COUPON_APPLY_LABEL_DEFAULT = "Apply";
  var COUPON_HINT_DEFAULT =
    "Have a coupon? Enter it below and we will apply it to this bag.";
  var LOYALTY_REDEEM_KEY = "looplab_cart_loyalty_redeem_pts_v1";
  var LOYALTY_CODE = "LOYALTY";
  var LOYALTY_PTS_PER_BLOCK = 100;
  /** USD discount per 100 loyalty points ($10.00). */
  var LOYALTY_USD_CENTS_PER_BLOCK = 1000;

  /** Serialized cart bill for checkout.html (sessionStorage). */
  var CHECKOUT_SNAPSHOT_KEY = "looplab_checkout_snapshot_v1";

  function isValidPromo(norm) {
    return (
      norm === PROMO_50 ||
      norm === PROMO_SUNNY ||
      norm === PROMO_FREEGIFT
    );
  }

  function baseCartLineId(id) {
    var s = String(id || "");
    var i = s.indexOf("::");
    if (i !== -1) return s.slice(0, i);
    return s;
  }

  function parseMotherdayIdList(text) {
    var map = {};
    var body = String(text || "").replace(/^\uFEFF/, "");
    body.split(/\r?\n/).forEach(function (line) {
      var t = line.trim();
      if (!t || t.charAt(0) === "#") return;
      map[t.toLowerCase()] = true;
    });
    return map;
  }

  function motherdayListUrl() {
    try {
      return new URL(
        "data/motherday-selected-products.txt",
        window.location.href
      ).href;
    } catch (e) {
      return "data/motherday-selected-products.txt";
    }
  }

  function applyMotherdayMapFromText(txt) {
    sunnyMotherdayIdMap = parseMotherdayIdList(txt);
    sunnyMotherdayFetchOk = Object.keys(sunnyMotherdayIdMap).length > 0;
  }

  function loadMotherdaySunnyList() {
    return fetch(motherdayListUrl(), { credentials: "same-origin" })
      .then(function (res) {
        if (!res.ok) throw new Error(String(res.status));
        return res.text();
      })
      .then(function (txt) {
        applyMotherdayMapFromText(txt);
        if (!sunnyMotherdayFetchOk) {
          applyMotherdayMapFromText(MOTHERDAY_SUNNY_IDS_FALLBACK);
        }
      })
      .catch(function () {
        applyMotherdayMapFromText(MOTHERDAY_SUNNY_IDS_FALLBACK);
      });
  }

  function sunnyPromoLabel() {
    if (sunnyMotherdayIdMap === null) return "SUNNY — 25% off Mother's Day picks";
    if (!sunnyMotherdayFetchOk) return "SUNNY — Mother's Day list unavailable";
    return "SUNNY — 25% off Mother's Day picks";
  }

  /**
   * SUNNY (25%) applies only to product base ids in data/motherday-selected-products.txt
   * (or the mirrored MOTHERDAY_SUNNY_IDS_FALLBACK if the file cannot be loaded).
   */
  function isSunnyEligibleBag(item) {
    if (!item) return false;
    if (sunnyMotherdayIdMap === null || !sunnyMotherdayFetchOk) return false;
    return !!sunnyMotherdayIdMap[baseCartLineId(item.id).toLowerCase()];
  }

  function sunnyEligibleSubtotalCents(items) {
    return items.reduce(function (acc, x) {
      if (!isSunnyEligibleBag(x)) return acc;
      return acc + (x.priceCents || 0) * (x.qty || 1);
    }, 0);
  }

  function isFreeGiftDeclined() {
    try {
      return sessionStorage.getItem(FREEGIFT_DECLINED_KEY) === "1";
    } catch (e) {
      return false;
    }
  }

  function setFreeGiftDeclined(on) {
    try {
      if (on) sessionStorage.setItem(FREEGIFT_DECLINED_KEY, "1");
      else sessionStorage.removeItem(FREEGIFT_DECLINED_KEY);
    } catch (e2) {
      /* ignore */
    }
  }

  function cartWithoutGift(items) {
    return (items || []).filter(function (x) {
      return String(x.id) !== GIFT_LINE_ID && !x.freeGift;
    });
  }

  function hasEligibleMotherdayPick(items) {
    return cartWithoutGift(items).some(isSunnyEligibleBag);
  }

  function sunnyEligibilityListReady() {
    return sunnyMotherdayIdMap !== null && sunnyMotherdayFetchOk;
  }

  /**
   * Mother's Day id list is loaded, the bag has paid lines, but nothing qualifies for SUNNY.
   */
  function sunnyPromoInvalidForCart(items) {
    if (!items || !items.length) return false;
    if (!sunnyEligibilityListReady()) return false;
    if (!cartWithoutGift(items).length) return false;
    return sunnyEligibleSubtotalCents(items) === 0;
  }

  function motherDayGiftLineItem() {
    return {
      id: GIFT_LINE_ID,
      title: "Complimentary gift",
      meta: "Mother's Day · With eligible bag",
      image: GIFT_IMAGE_URL,
      priceCents: 0,
      qty: 1,
      freeGift: true,
    };
  }

  var _giftReconcileBusy = false;
  function reconcileMotherdayGiftAndFreeGift() {
    if (_giftReconcileBusy) return;
    _giftReconcileBusy = true;
    try {
      var items = LLCart.load();
      var rest = cartWithoutGift(items);
      var hasGift = items.some(function (x) {
        return String(x.id) === GIFT_LINE_ID;
      });
      var eligible = hasEligibleMotherdayPick(items);
      var promos = getAppliedPromos();

      if (eligible) {
        if (isFreeGiftDeclined()) {
          if (hasGift) {
            LLCart.save(rest);
          }
          if (promos.indexOf(PROMO_FREEGIFT) !== -1) {
            setAppliedPromos(
              promos.filter(function (c) {
                return c !== PROMO_FREEGIFT;
              })
            );
          }
          return;
        }
        var onlyFree =
          promos.length === 1 && promos[0] === PROMO_FREEGIFT;
        if (!onlyFree) {
          setAppliedPromos([PROMO_FREEGIFT]);
        }
        if (!hasGift) {
          LLCart.save(rest.concat([motherDayGiftLineItem()]));
        }
        return;
      }

      setFreeGiftDeclined(false);

      if (hasGift) {
        LLCart.save(rest);
      }
      if (promos.indexOf(PROMO_FREEGIFT) !== -1) {
        setAppliedPromos(
          promos.filter(function (c) {
            return c !== PROMO_FREEGIFT;
          })
        );
      }
    } finally {
      _giftReconcileBusy = false;
    }
  }

  function migrateLegacyPromoIfNeeded() {
    try {
      var legacy = sessionStorage.getItem(LEGACY_PROMO_STORAGE_KEY);
      if (!legacy) return;
      var n = normalizePromoCode(legacy);
      sessionStorage.removeItem(LEGACY_PROMO_STORAGE_KEY);
      if (n === PROMO_50 || n === PROMO_SUNNY) setAppliedPromos([n]);
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
    var bagSub = sunnyEligibleSubtotalCents(items);
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
        label: sunnyPromoLabel(),
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
      text.textContent =
        code === PROMO_FREEGIFT
          ? "FREEGIFT promocode applied"
          : code + " promo code applied";
      li.appendChild(text);
      var rm = document.createElement("button");
      rm.type = "button";
      rm.className = "jc-coupon-remove-promo";
      rm.setAttribute("data-remove-promo", code);
      rm.setAttribute(
        "aria-label",
        code === PROMO_FREEGIFT
          ? "Remove FREEGIFT and complimentary gift"
          : "Remove " + code + " promo code"
      );
      rm.textContent = "Remove";
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
      var mod =
        L.code === LOYALTY_CODE
          ? "jc-cart-discount-row--loyalty"
          : "jc-cart-discount-row--promo";
      row.className =
        "jc-cart-summary-row jc-cart-discount-row " + mod;
      row.setAttribute("data-cart-discount-line", L.code);
      var lab = document.createElement("span");
      lab.textContent =
        L.code === LOYALTY_CODE ? L.label : "Promo (" + L.label + ")";
      var amt = document.createElement("span");
      amt.textContent = "\u2212" + LLCart.fmt(L.cents);
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

  function loyaltyUsdCentsPerBlock() {
    return LOYALTY_USD_CENTS_PER_BLOCK;
  }

  function snapLoyaltyPointsDown(pts) {
    pts = Math.max(0, Math.floor(Number(pts) || 0));
    return Math.floor(pts / LOYALTY_PTS_PER_BLOCK) * LOYALTY_PTS_PER_BLOCK;
  }

  function getLoyaltyRedeemPointsRaw() {
    try {
      var raw = sessionStorage.getItem(LOYALTY_REDEEM_KEY);
      var n = parseInt(raw, 10);
      if (isNaN(n) || n < 0) return 0;
      return n;
    } catch (e) {
      return 0;
    }
  }

  function setLoyaltyRedeemPoints(n) {
    try {
      n = snapLoyaltyPointsDown(Math.max(0, n));
      if (n > 0) sessionStorage.setItem(LOYALTY_REDEEM_KEY, String(n));
      else sessionStorage.removeItem(LOYALTY_REDEEM_KEY);
    } catch (e2) {
      /* ignore */
    }
  }

  function isCartCustomerSignedIn() {
    var ses = typeof window !== "undefined" && window.LoopLabCustomerSession;
    return !!(ses && ses.isSignedIn && ses.isSignedIn());
  }

  function getCartLoyaltyBalance() {
    var ses = typeof window !== "undefined" && window.LoopLabCustomerSession;
    if (!ses || !ses.getLoyaltyPoints) return 0;
    var n = Number(ses.getLoyaltyPoints());
    return Math.max(0, Math.floor(isNaN(n) ? 0 : n));
  }

  function clampLoyaltyRedeemForCart(balance, maxPtsAllowed) {
    maxPtsAllowed = snapLoyaltyPointsDown(Math.max(0, maxPtsAllowed));
    var raw = snapLoyaltyPointsDown(getLoyaltyRedeemPointsRaw());
    var upper = snapLoyaltyPointsDown(Math.min(balance, maxPtsAllowed));
    var v = Math.min(raw, upper);
    v = snapLoyaltyPointsDown(v);
    if (v !== raw) setLoyaltyRedeemPoints(v);
    return v;
  }

  function buildLoyaltyDiscountLine(subtotalCents, promoDiscountCents, pts) {
    pts = snapLoyaltyPointsDown(pts);
    if (pts < LOYALTY_PTS_PER_BLOCK) return null;
    var blocks = pts / LOYALTY_PTS_PER_BLOCK;
    var usdCents = Math.round(blocks * LOYALTY_USD_CENTS_PER_BLOCK);
    var cap = Math.max(0, (subtotalCents || 0) - (promoDiscountCents || 0));
    if (usdCents > cap) usdCents = cap;
    if (usdCents < 1) return null;
    var dollarsOffStr = LLCart.fmt(usdCents);
    return {
      code: LOYALTY_CODE,
      label:
        "LoopLab Rewards \u2014 " +
        pts.toLocaleString("en-US") +
        " pts (" +
        dollarsOffStr +
        " off)",
      cents: usdCents
    };
  }

  function syncLoyaltyMetaDisplay(pts) {
    pts = snapLoyaltyPointsDown(pts);
    var blocks = pts / LOYALTY_PTS_PER_BLOCK;
    var usdCents = Math.round(blocks * LOYALTY_USD_CENTS_PER_BLOCK);
    var elP = document.getElementById("jc-loyalty-pts-val");
    var elU = document.getElementById("jc-loyalty-usd-val");
    if (elP) elP.textContent = String(pts);
    if (elU) elU.textContent = LLCart.fmt(usdCents);
  }

  function renderLoyaltyPanel(items, subtotalCents, promoDiscountCents, effectiveRedeemPts) {
    var guestEl = document.getElementById("jc-loyalty-guest");
    var userEl = document.getElementById("jc-loyalty-user");
    var balanceEl = document.getElementById("jc-loyalty-balance-line");
    var range = document.getElementById("jc-loyalty-range");
    if (!guestEl || !userEl) return;

    if (!isCartCustomerSignedIn()) {
      setLoyaltyRedeemPoints(0);
      guestEl.hidden = false;
      userEl.hidden = true;
      return;
    }

    guestEl.hidden = true;
    userEl.hidden = false;

    var balance = getCartLoyaltyBalance();
    var hint =
      balance.toLocaleString("en-US") +
      " pts in your account. Use the slider or enter points in steps of " +
      LOYALTY_PTS_PER_BLOCK +
      " (each block = " +
      LLCart.fmt(LOYALTY_USD_CENTS_PER_BLOCK) +
      " off).";
    if (balanceEl) balanceEl.textContent = hint;

    var cap = Math.max(0, subtotalCents - promoDiscountCents);
    var per = loyaltyUsdCentsPerBlock();
    var maxBlocks = Math.floor(cap / per);
    var maxPts = snapLoyaltyPointsDown(
      Math.min(balance, maxBlocks * LOYALTY_PTS_PER_BLOCK)
    );
    var usePts = snapLoyaltyPointsDown(effectiveRedeemPts);
    if (usePts > maxPts) usePts = maxPts;

    var disabled =
      !items.length ||
      balance < LOYALTY_PTS_PER_BLOCK ||
      maxPts < LOYALTY_PTS_PER_BLOCK;

    if (range) {
      range.min = 0;
      range.max = maxPts;
      range.step = LOYALTY_PTS_PER_BLOCK;
      range.disabled = !!disabled;
      range.value = String(usePts);
      range.setAttribute("aria-valuemax", String(maxPts));
      range.setAttribute("aria-valuenow", String(usePts));
      range.setAttribute("aria-valuemin", "0");
    }

    var ptsInput = document.getElementById("jc-loyalty-points-input");
    var ptsApply = document.getElementById("jc-loyalty-points-apply");
    if (ptsInput) {
      ptsInput.min = "0";
      ptsInput.max = String(maxPts);
      ptsInput.step = String(LOYALTY_PTS_PER_BLOCK);
      ptsInput.value = String(usePts);
      ptsInput.setAttribute("data-max-pts", String(maxPts));
      ptsInput.disabled = !!disabled;
    }
    if (ptsApply) {
      ptsApply.disabled = !!disabled;
    }

    syncLoyaltyMetaDisplay(usePts);
  }

  function wireLoyaltyRedeem() {
    var user = document.getElementById("jc-loyalty-user");
    if (!user || user.getAttribute("data-loyalty-wired") === "1") return;
    user.setAttribute("data-loyalty-wired", "1");

    var range = document.getElementById("jc-loyalty-range");
    var ptsInput = document.getElementById("jc-loyalty-points-input");
    var ptsApply = document.getElementById("jc-loyalty-points-apply");

    function onRangeMove() {
      if (!range || range.disabled) return;
      var v = parseInt(range.value, 10) || 0;
      setLoyaltyRedeemPoints(v);
      syncLoyaltyMetaDisplay(v);
      if (document.getElementById("jc-cart-list-root")) renderCartPage();
    }

    if (range) {
      range.addEventListener("input", onRangeMove);
      range.addEventListener("change", onRangeMove);
    }

    function applyLoyaltyPointsFromInput() {
      if (!ptsInput || ptsInput.disabled) return;
      var raw = parseInt(String(ptsInput.value).trim(), 10);
      if (isNaN(raw) || raw < 0) raw = 0;
      raw = snapLoyaltyPointsDown(raw);
      var maxV = parseInt(ptsInput.getAttribute("data-max-pts") || "0", 10);
      if (!isNaN(maxV) && raw > maxV) raw = maxV;
      raw = snapLoyaltyPointsDown(raw);
      setLoyaltyRedeemPoints(raw);
      if (document.getElementById("jc-cart-list-root")) renderCartPage();
    }

    if (ptsInput) {
      ptsInput.addEventListener("change", function () {
        applyLoyaltyPointsFromInput();
      });
      ptsInput.addEventListener("keydown", function (ev) {
        if (ev.key === "Enter") {
          ev.preventDefault();
          applyLoyaltyPointsFromInput();
        }
      });
    }
    if (ptsApply) {
      ptsApply.addEventListener("click", function () {
        applyLoyaltyPointsFromInput();
      });
    }

    var clr = document.getElementById("jc-loyalty-clear");
    if (clr && clr.getAttribute("data-loyalty-clear-bound") !== "1") {
      clr.setAttribute("data-loyalty-clear-bound", "1");
      clr.addEventListener("click", function () {
        setLoyaltyRedeemPoints(0);
        if (document.getElementById("jc-cart-list-root")) renderCartPage();
      });
    }

    function onSession() {
      if (document.getElementById("jc-cart-list-root")) renderCartPage();
    }
    document.addEventListener("looplab-signin-changed", onSession);
    document.addEventListener("looplab-customers-ready", onSession);
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
    var isGift =
      LLCart.isFreeGiftLine && LLCart.isFreeGiftLine(item)
        ? true
        : String(item.id) === GIFT_LINE_ID || item.freeGift === true;

    var li = document.createElement("li");
    li.className = "jc-cart-row" + (isGift ? " jc-cart-row--free-gift" : "");
    li.setAttribute("data-cart-line-id", item.id);

    var rm = null;
    var leadSlot = null;
    if (!isGift) {
      rm = document.createElement("button");
      rm.type = "button";
      rm.className = "jc-cart-row-remove";
      rm.setAttribute("aria-label", "Remove " + item.title);
      rm.appendChild(document.createTextNode("\u00d7"));
      leadSlot = rm;
    } else {
      leadSlot = document.createElement("span");
      leadSlot.className = "jc-cart-row-remove-placeholder";
      leadSlot.setAttribute("aria-hidden", "true");
    }

    var img = document.createElement("img");
    img.className = "jc-cart-row-img";
    img.src = item.image || "";
    img.alt = isGift ? "Complimentary gift" : "";
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
    if (isGift) {
      meta.textContent = item.meta || "Qty 1 · Included with qualifying bag";
    } else {
      meta.appendChild(
        document.createTextNode(
          (item.meta ? item.meta + " · " : "") + "Qty "
        )
      );
      var mqSpan = document.createElement("span");
      mqSpan.setAttribute("data-qty-display", "1");
      mqSpan.textContent = String(mq);
      meta.appendChild(mqSpan);
    }

    var qtyWrap = null;
    if (!isGift) {
      qtyWrap = document.createElement("div");
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
    }

    body.appendChild(h2);
    body.appendChild(meta);
    if (qtyWrap) body.appendChild(qtyWrap);

    var lineTotalCents = (item.priceCents || 0) * mq;
    var tot = document.createElement("div");
    tot.className = "jc-cart-row-total";
    var spanTot = document.createElement("span");
    spanTot.className = "jc-cart-line-total";
    spanTot.textContent = isGift ? "$0.00" : LLCart.fmt(lineTotalCents);
    var spanUnit = document.createElement("span");
    spanUnit.className = "jc-cart-line-unit";
    spanUnit.textContent = isGift
      ? "Included"
      : LLCart.fmt(item.priceCents || 0) + " each";
    tot.appendChild(spanTot);
    tot.appendChild(spanUnit);

    if (leadSlot) li.appendChild(leadSlot);
    li.appendChild(img);
    li.appendChild(body);
    li.appendChild(tot);

    return li;
  }

  /**
   * Single source of truth for subtotal, promos, discounts, loyalty, and total.
   * Mutates applied promos / loyalty clamp the same way as the cart UI.
   */
  function getCartBillBreakdown() {
    reconcileMotherdayGiftAndFreeGift();
    var items = LLCart.load();
    if (!items.length) return null;

    var subtotalCents = LLCart.totalCents();
    var promos = getAppliedPromos();
    var cleaned = promos.filter(isValidPromo);
    if (cleaned.length !== promos.length) setAppliedPromos(cleaned);
    promos = getAppliedPromos();

    if (sunnyPromoInvalidForCart(items) && promos.indexOf(PROMO_SUNNY) !== -1) {
      removePromo(PROMO_SUNNY);
      promos = getAppliedPromos();
      var hintSunnyStrip = document.getElementById("jc-coupon-hint");
      if (hintSunnyStrip) {
        hintSunnyStrip.textContent =
          "SUNNY was removed — none of the items in your bag are eligible for this offer. Add a Mother's Day Sale pick from the Bags page to use SUNNY.";
      }
      setCouponErrorState(true);
    }

    var discountLines = computeDiscountLines(subtotalCents, items, promos);
    var promoDiscountCents = discountLines.reduce(function (a, L) {
      return a + L.cents;
    }, 0);

    var balancePts = isCartCustomerSignedIn() ? getCartLoyaltyBalance() : 0;
    var capAfterPromo = Math.max(0, subtotalCents - promoDiscountCents);
    var perBlockUsd = loyaltyUsdCentsPerBlock();
    var maxBlocksFromCart = Math.floor(capAfterPromo / perBlockUsd);
    var maxPtsForCart = snapLoyaltyPointsDown(
      Math.min(balancePts, maxBlocksFromCart * LOYALTY_PTS_PER_BLOCK)
    );
    var effectiveLoyaltyPts = clampLoyaltyRedeemForCart(balancePts, maxPtsForCart);
    var loyaltyLine = buildLoyaltyDiscountLine(
      subtotalCents,
      promoDiscountCents,
      effectiveLoyaltyPts
    );
    var allDiscountLines = discountLines.slice();
    if (loyaltyLine) allDiscountLines.push(loyaltyLine);

    var discountCents = allDiscountLines.reduce(function (a, L) {
      return a + L.cents;
    }, 0);
    var finalCents = Math.max(0, subtotalCents - discountCents);

    var lines = items.map(function (item) {
      var qty = item.qty || 1;
      var isGift =
        (LLCart.isFreeGiftLine && LLCart.isFreeGiftLine(item)) ||
        String(item.id) === GIFT_LINE_ID ||
        item.freeGift === true;
      return {
        id: item.id,
        title: item.title || "Item",
        meta: item.meta || "",
        image: item.image || "",
        qty: qty,
        priceCentsEach: item.priceCents || 0,
        lineTotalCents: isGift ? 0 : (item.priceCents || 0) * qty,
        freeGift: !!isGift
      };
    });

    return {
      version: 1,
      createdAt: Date.now(),
      orderRef: "LL-" + Date.now().toString(36).toUpperCase(),
      lines: lines,
      subtotalCents: subtotalCents,
      promos: promos.slice(),
      discountLines: allDiscountLines.map(function (L) {
        return { code: L.code, label: L.label, cents: L.cents };
      }),
      promoDiscountCents: promoDiscountCents,
      effectiveLoyaltyPts: effectiveLoyaltyPts,
      discountCents: discountCents,
      shippingCents: 0,
      taxCents: 0,
      finalCents: finalCents
    };
  }

  function persistCheckoutSnapshot() {
    var bill = getCartBillBreakdown();
    if (!bill) return false;
    try {
      sessionStorage.setItem(CHECKOUT_SNAPSHOT_KEY, JSON.stringify(bill));
      return true;
    } catch (e) {
      return false;
    }
  }

  function wireCheckoutLink() {
    var a = document.querySelector(".jc-cart-checkout");
    if (!a || a.getAttribute("data-checkout-bound") === "1") return;
    a.setAttribute("data-checkout-bound", "1");
    a.setAttribute("href", "checkout.html");
    a.addEventListener("click", function (ev) {
      reconcileMotherdayGiftAndFreeGift();
      if (!LLCart.load().length) {
        ev.preventDefault();
        var h = document.getElementById("jc-coupon-hint");
        if (h) {
          h.textContent =
            "Your bag is empty — add items before checkout.";
        }
        setCouponErrorState(true);
        return;
      }
      if (!persistCheckoutSnapshot()) {
        ev.preventDefault();
      }
    });
  }

  function renderCartPage() {
    reconcileMotherdayGiftAndFreeGift();
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

    var subtotalCents = 0;
    var promos = [];
    var discountLines = [];
    var promoDiscountCents = 0;
    var effectiveLoyaltyPts = 0;
    var discountCents = 0;
    var finalCents = 0;

    if (!items.length) {
      setAppliedPromos([]);
      setFreeGiftDeclined(false);
      setLoyaltyRedeemPoints(0);
      promos = [];
      var hintEmpty = document.getElementById("jc-coupon-hint");
      if (hintEmpty) hintEmpty.textContent = COUPON_HINT_DEFAULT;
      setCouponErrorState(false);
    } else {
      var bill = getCartBillBreakdown();
      if (bill) {
        subtotalCents = bill.subtotalCents;
        promos = bill.promos;
        discountLines = bill.discountLines;
        promoDiscountCents = bill.promoDiscountCents;
        effectiveLoyaltyPts = bill.effectiveLoyaltyPts;
        discountCents = bill.discountCents;
        finalCents = bill.finalCents;
      } else {
        subtotalCents = LLCart.totalCents();
        promos = getAppliedPromos();
        finalCents = subtotalCents;
      }
    }

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
        anyDiscount
      );
    }

    syncCouponFieldUi(hasPromos, items.length);
    renderLoyaltyPanel(
      items,
      subtotalCents,
      promoDiscountCents,
      effectiveLoyaltyPts
    );
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
      if (String(id) === GIFT_LINE_ID) return;

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
      var normRm = normalizePromoCode(code);
      if (normRm === PROMO_FREEGIFT) {
        setFreeGiftDeclined(true);
      }
      removePromo(code);
      var hint = document.getElementById("jc-coupon-hint");
      var remaining = getAppliedPromos();
      if (hint) {
        if (normRm === PROMO_FREEGIFT) {
          hint.textContent =
            "FREEGIFT removed — the complimentary gift was removed from your bag. You can use other promo codes. Add a Mother's Day pick again later to get the gift offer back.";
        } else if (remaining.length) {
          hint.textContent =
            "Removed " +
            normRm +
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

      reconcileMotherdayGiftAndFreeGift();
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
            "Invalid code — try " +
            PROMO_50 +
            " (order), " +
            PROMO_SUNNY +
            " (Mother's Day picks), or note that FREEGIFT applies automatically with a qualifying Mother's Day bag.";
        return;
      }

      var promos = getAppliedPromos();
      if (promos.indexOf(norm) !== -1) {
        setCouponErrorState(false);
        if (hint)
          hint.textContent =
            norm +
            " is already applied. Enter the other code if you have not added it yet.";
        if (input) input.value = "";
        return;
      }

      if (norm === PROMO_FREEGIFT) {
        setCouponErrorState(false);
        if (hint) {
          if (isFreeGiftDeclined() && hasEligibleMotherdayPick(items)) {
            hint.textContent =
              "You removed FREEGIFT for this order while a Mother's Day pick is still in your bag. Remove those picks and add one again to get the complimentary gift and FREEGIFT back.";
          } else if (hasEligibleMotherdayPick(items)) {
            hint.textContent =
              "FREEGIFT is already applied with your Mother's Day pick.";
          } else {
            hint.textContent =
              "FREEGIFT is added automatically when you add a Mother's Day Sale bag from the Bags page.";
          }
        }
        if (input) input.value = "";
        return;
      }

      if (promos.indexOf(PROMO_FREEGIFT) !== -1) {
        setCouponErrorState(true);
        if (hint)
          hint.textContent =
            "A promo is already applied.";
        if (input) input.value = "";
        return;
      }

      if (norm === PROMO_SUNNY && sunnyPromoInvalidForCart(items)) {
        setCouponErrorState(true);
        if (hint) {
          hint.textContent =
            "SUNNY can't be applied — none of the items in your bag are eligible for this offer. Add a Mother's Day Sale pick from the Bags page, or try another code.";
        }
        if (input) input.value = "";
        return;
      }

      promos.push(norm);
      setAppliedPromos(promos);
      if (input) input.value = "";
      setCouponErrorState(false);
      if (hint) {
        if (norm === PROMO_50) {
          hint.textContent =
            PROMO_50 +
            " added — 50% off your order subtotal. See Cart totals for each promo line.";
        } else if (norm === PROMO_SUNNY) {
          var sunnySub = sunnyEligibleSubtotalCents(items);
          var sunnyHintTail =
            sunnySub > 0
              ? " added — 25% off Mother's Day pick lines in your order. See Cart totals."
              : sunnyMotherdayIdMap === null
                ? " added — loading the Mother's Day list; totals update in a moment. See Cart totals."
                : !sunnyMotherdayFetchOk
                  ? " added — we could not load data/motherday-selected-products.txt; refresh the page. SUNNY applies only to ids in that list."
                  : " added — add a bag with the Mother's Day Sale tag on the Bags page for 25% off that line. See Cart totals.";
          hint.textContent = PROMO_SUNNY + sunnyHintTail;
        }
      }
      renderCartPage();
    });
  }

  function init() {
    syncBagBadge();
    initProductGrids();
    document.addEventListener("click", onAddClick);
    document.addEventListener("ll-cart-change", function () {
      reconcileMotherdayGiftAndFreeGift();
      syncBagBadge();
      if (document.getElementById("jc-cart-list-root")) renderCartPage();
    });
    document.addEventListener("page-nav-loaded", function () {
      syncBagBadge();
      initProductGrids();
    });

    bindCartListDelegation();
    wireUpdateCartButton();
    wireCouponApply();
    wireAppliedPromoRemove();
    wireLoyaltyRedeem();
    wireCheckoutLink();

    renderCartPage();
    loadMotherdaySunnyList().finally(function () {
      renderCartPage();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
