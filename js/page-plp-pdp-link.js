/**
 * PLP → PDP: runs synchronously from <head> (no defer).
 * - Clicks anywhere on a product card (badge, image, title…) except Add to cart.
 * - Navigates with BOTH ?id= and #p= using the card's data-product-id (not native <a href>) so the PDP always matches the card.
 * - Ctrl/Cmd+click on a wired product link still uses the browser default (e.g. new tab).
 * - Before leaving a listing page, stores ll_pdp_return so PDP Back can return to bags/women/etc. when Referer is empty.
 */
(function () {
  var STORAGE = "ll_pdp_nav_id";
  var RETURN_URL = "ll_pdp_return";

  function goPdp(id) {
    try {
      sessionStorage.setItem(STORAGE, id);
      var path = (window.location.pathname || "").toLowerCase();
      if (path.indexOf("product.html") === -1) {
        sessionStorage.setItem(RETURN_URL, window.location.href);
      }
    } catch (e) {}
    var q = "product.html?id=" + encodeURIComponent(id);
    var frag = "#p=" + encodeURIComponent(id);
    window.location.assign(q + frag);
  }

  function armStorage(ev) {
    var card = ev.target.closest(".pd-card[data-product-id]");
    if (!card) return;
    if (ev.target.closest(".pd-card-add")) return;
    if (ev.target.closest("[data-add-to-bag]")) return;
    var id = card.getAttribute("data-product-id");
    if (!id) return;
    try {
      sessionStorage.setItem(STORAGE, id);
    } catch (e) {}
  }

  document.addEventListener("pointerdown", armStorage, true);

  document.addEventListener(
    "click",
    function (ev) {
      var card = ev.target.closest(".pd-card[data-product-id]");
      if (!card) return;
      if (ev.target.closest(".pd-card-add")) return;
      if (ev.target.closest("[data-add-to-bag]")) return;

      var id = card.getAttribute("data-product-id");
      if (!id) return;

      var link = ev.target.closest("a.pd-card-link");
      if (link && card.contains(link)) {
        /* Always open PDP from data-product-id so navigation matches the card (href can be # or stale). */
        var raw = (link.getAttribute("href") || "").trim();
        var hrefLooksWired =
          raw !== "#" &&
          raw !== "" &&
          raw !== "javascript:void(0)" &&
          raw.indexOf("product.html") !== -1;
        if (hrefLooksWired && (ev.ctrlKey || ev.metaKey)) {
          return;
        }
        ev.preventDefault();
        ev.stopPropagation();
        goPdp(id);
        return;
      }

      ev.preventDefault();
      ev.stopPropagation();
      goPdp(id);
    },
    true
  );
})();
