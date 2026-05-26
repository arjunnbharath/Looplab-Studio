/**
 * PLP → PDP: runs synchronously from <head> (no defer).
 * - Clicks anywhere on a product card (badge, image, title…) except Add to cart.
 * - Navigates with BOTH ?id= and #p= so the id survives odd servers / preview tools.
 * - pointerdown stores sessionStorage early (before default # link behavior).
 */
(function () {
  var STORAGE = "ll_pdp_nav_id";

  function goPdp(id) {
    try {
      sessionStorage.setItem(STORAGE, id);
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
        var raw = (link.getAttribute("href") || "").trim();
        var pid = "";
        try {
          pid = (new URL(raw, window.location.href).searchParams.get("id") || "").trim();
        } catch (e) {}
        if (pid === id) return;
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
