/**
 * Product detail page — resolves product by ?id= using catalog:
 *   1) window.__PRODUCTS_CATALOG__ from js/products-catalog-bundled.js (no fetch)
 *   2) else fetch data/products.json
 */
(function () {
  var CATALOG_URL = "data/products.json";
  var STORAGE_ID = "ll_pdp_nav_id";

  function loadCatalog() {
    var c = typeof window !== "undefined" && window.__PRODUCTS_CATALOG__;
    if (c && Array.isArray(c.products) && c.products.length) {
      return Promise.resolve(c);
    }
    return fetch(CATALOG_URL, { credentials: "same-origin" }).then(function (res) {
      if (!res.ok) throw new Error("HTTP " + res.status);
      return res.json();
    });
  }

  function qs(name) {
    var p = new URLSearchParams(window.location.search);
    var v = p.get(name);
    return v == null ? "" : String(v);
  }

  /** Decode hash segment safely */
  function dec(s) {
    try {
      return decodeURIComponent(String(s || "").replace(/\+/g, " ")).trim();
    } catch (e) {
      return String(s || "").trim();
    }
  }

  /**
   * Resolve PDP id from: ?id=, then #p= (survives some hosts/preview quirks), then sessionStorage.
   */
  function resolveProductId() {
    var urlId = qs("id").trim();

    var hashId = "";
    var h = location.hash || "";
    var m = /^#p=(.+)$/.exec(h);
    if (m) hashId = dec(m[1]);
    if (!hashId) {
      var m2 = /^#id=(.+)$/.exec(h);
      if (m2) hashId = dec(m2[1]);
    }

    var id = urlId || hashId;
    if (id) {
      try {
        sessionStorage.removeItem(STORAGE_ID);
      } catch (e) {}
      if (!urlId && hashId) {
        try {
          history.replaceState(
            null,
            "",
            "product.html?id=" + encodeURIComponent(id)
          );
        } catch (e2) {}
      }
      return id;
    }

    try {
      var fromStore = (sessionStorage.getItem(STORAGE_ID) || "").trim();
      if (fromStore) {
        sessionStorage.removeItem(STORAGE_ID);
        try {
          history.replaceState(
            null,
            "",
            "product.html?id=" + encodeURIComponent(fromStore)
          );
        } catch (e3) {}
        return fromStore;
      }
    } catch (e4) {}
    return "";
  }

  function esc(s) {
    var d = document.createElement("div");
    d.textContent = s == null ? "" : String(s);
    return d.innerHTML;
  }

  function syncBag() {
    if (!window.LLCart) return;
    var n = window.LLCart.totalQty();
    document.querySelectorAll("[data-cart-count]").forEach(function (el) {
      el.textContent = String(n);
      el.hidden = n < 1;
    });
  }

  function renderBreadcrumb(bcEl, parts) {
    if (!bcEl || !parts || !parts.length) return;
    bcEl.innerHTML = "";
    for (var i = 0; i < parts.length; i++) {
      var label = parts[i];
      if (i > 0) {
        var sep = document.createElement("span");
        sep.className = "pdp-bc-sep";
        sep.setAttribute("aria-hidden", "true");
        sep.textContent = " / ";
        bcEl.appendChild(sep);
      }
      if (i === 0) {
        var a = document.createElement("a");
        a.href = "index.html";
        a.textContent = label;
        bcEl.appendChild(a);
      } else if (i === parts.length - 1) {
        var cur = document.createElement("span");
        cur.className = "pdp-bc-current";
        cur.textContent = label;
        bcEl.appendChild(cur);
      } else {
        var a2 = document.createElement("a");
        a2.href = "products.html";
        a2.textContent = label;
        bcEl.appendChild(a2);
      }
    }
  }

  function run() {
    var id = resolveProductId();
    var loading = document.getElementById("pdp-loading");
    var miss = document.getElementById("pdp-state");
    var root = document.getElementById("pdp-root");

    if (!id) {
      if (loading) loading.hidden = true;
      if (miss) {
        miss.hidden = false;
        var msg0 = miss.querySelector(".pdp-miss-msg");
        if (msg0) {
          msg0.textContent =
            "Open a product from the catalog (e.g. products.html) and click a card, or open product.html?id=women-… or product.html#p=women-…";
        }
      }
      if (root) root.hidden = true;
      return;
    }

    loadCatalog()
      .then(function (data) {
        var list = (data && data.products) || [];
        var product = null;
        for (var i = 0; i < list.length; i++) {
          if (list[i].id === id) {
            product = list[i];
            break;
          }
        }
        if (loading) loading.hidden = true;
        if (!product) {
          if (miss) {
            miss.hidden = false;
            var msg1 = miss.querySelector(".pdp-miss-msg");
            if (msg1) msg1.textContent = "That product is not in the catalog.";
          }
          if (root) root.hidden = true;
          return;
        }
        if (miss) miss.hidden = true;
        if (root) root.hidden = false;

        document.title = (product.title || "Product") + " — LoopLab Studio";

        renderBreadcrumb(
          document.getElementById("pdp-bc"),
          product.breadcrumb || ["Home", product.title]
        );

        var img = document.getElementById("pdp-img");
        if (img) {
          img.src = product.image || "";
          img.alt = product.title || "";
        }

        var brand = document.getElementById("pdp-brand");
        if (brand) brand.textContent = product.brand || "LoopLab Studio";

        var title = document.getElementById("pdp-title");
        if (title) title.textContent = product.title || "";

        var price = document.getElementById("pdp-price");
        if (price) price.textContent = product.priceDisplay || "";

        var sizesEl = document.getElementById("pdp-sizes");
        var sizes = product.sizes || ["XS", "S", "M", "L"];
        var selectedSize = sizes[0] || "XS";
        if (sizesEl) {
          sizesEl.innerHTML = "";
          sizes.forEach(function (sz, idx) {
            var b = document.createElement("button");
            b.type = "button";
            b.className = "pdp-size-btn";
            b.textContent = sz;
            b.setAttribute("aria-pressed", idx === 0 ? "true" : "false");
            b.addEventListener("click", function () {
              selectedSize = sz;
              sizesEl.querySelectorAll(".pdp-size-btn").forEach(function (btn) {
                btn.setAttribute("aria-pressed", btn === b ? "true" : "false");
              });
            });
            sizesEl.appendChild(b);
          });
        }

        var det = document.getElementById("pdp-panel-details");
        var ship = document.getElementById("pdp-panel-shipping");
        var des = document.getElementById("pdp-panel-designer");
        if (det)
          det.innerHTML =
            "<p>" +
            esc(product.description || "") +
            '</p><p class="pdp-code">Product code: ' +
            esc(product.sku || product.id) +
            "</p>";
        if (ship) {
          ship.innerHTML =
            "<p>" +
            esc(product.shipping || "") +
            "</p><p>" +
            esc(product.returns || "") +
            "</p>";
        }
        if (des)
          des.innerHTML = "<p>" + esc(product.designer || "") + "</p>";

        var tabs = document.querySelectorAll(".pdp-tab");
        var panels = document.querySelectorAll(".pdp-panel");
        function activateTab(which) {
          tabs.forEach(function (t) {
            t.setAttribute("aria-selected", t.getAttribute("data-tab") === which ? "true" : "false");
          });
          panels.forEach(function (p) {
            p.hidden = p.getAttribute("data-tabpanel") !== which;
          });
        }
        tabs.forEach(function (tab) {
          tab.addEventListener("click", function () {
            activateTab(tab.getAttribute("data-tab") || "details");
          });
        });
        activateTab("details");

        var addBtn = document.getElementById("pdp-add");
        if (addBtn && window.LLCart) {
          addBtn.addEventListener("click", function () {
            window.LLCart.addFromPdp({
              id: product.id,
              title: product.title,
              meta: product.meta || "",
              image: product.image || "",
              priceCents: product.priceCents || 0,
              size: selectedSize,
            });
            syncBag();
            var addLabel = document.getElementById("pdp-add-label");
            var prev = addLabel ? addLabel.textContent : "ADD TO BAG";
            if (addLabel) addLabel.textContent = "Added";
            addBtn.disabled = true;
            window.setTimeout(function () {
              if (addLabel) addLabel.textContent = prev;
              addBtn.disabled = false;
            }, 1400);
          });
        }

        var wish = document.getElementById("pdp-wish");
        var sg = document.querySelector(".pdp-size-guide");
        if (sg) {
          sg.addEventListener("click", function (e) {
            e.preventDefault();
          });
        }
        if (wish) {
          wish.addEventListener("click", function () {
            wish.setAttribute("aria-pressed", wish.getAttribute("aria-pressed") === "true" ? "false" : "true");
          });
        }
      })
      .catch(function () {
        if (loading) loading.hidden = true;
        if (miss) {
          miss.hidden = false;
          var msg2 = miss.querySelector(".pdp-miss-msg");
          if (msg2) {
            msg2.textContent =
              "Could not load the product catalog. Run: node scripts/build-products-catalog.cjs (and ensure js/products-catalog-bundled.js is loaded on product.html).";
          }
        }
        if (root) root.hidden = true;
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run);
  } else {
    run();
  }
})();
