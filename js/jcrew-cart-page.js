/**
 * Cart page: quantity +/- (demo only; line totals stay static).
 */
(function () {
  document.querySelectorAll("[data-qty-wrap]").forEach(function (wrap) {
    var valEl = wrap.querySelector("[data-qty-val]");
    var down = wrap.querySelector("[data-qty-down]");
    var up = wrap.querySelector("[data-qty-up]");
    if (!valEl || !down || !up) return;

    var row = wrap.closest(".jc-cart-row");
    var metaQty = row ? row.querySelector("[data-qty-display]") : null;

    function readVal() {
      var n = parseInt(valEl.textContent, 10);
      return isNaN(n) || n < 1 ? 1 : n;
    }

    function writeVal(n) {
      valEl.textContent = String(n);
      if (metaQty) metaQty.textContent = String(n);
    }

    down.addEventListener("click", function () {
      var n = readVal();
      if (n > 1) writeVal(n - 1);
    });

    up.addEventListener("click", function () {
      writeVal(readVal() + 1);
    });
  });

  var apply = document.querySelector(".jc-coupon-apply");
  if (apply) {
    apply.addEventListener("click", function () {
      var input = document.querySelector(".jc-coupon-input");
      var code = input && input.value.trim();
      if (!code) return;
      /* Demo placeholder — connect to your promo endpoint */
    });
  }
})();
