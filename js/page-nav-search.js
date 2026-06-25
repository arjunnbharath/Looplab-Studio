/**
 * Site search — loads data/products.json (or __PRODUCTS_CATALOG__), shows matches in nav dropdown.
 */
(function () {
  var CATALOG_URL = "data/products.json";
  var MAX_RESULTS = 8;
  var DEBOUNCE_MS = 180;
  var MIN_QUERY_LEN = 2;

  var DEPT_ALIASES = {
    men: ["men", "mens", "men's", "man"],
    women: ["women", "womens", "women's", "woman"],
    bags: ["bags", "bag", "handbag", "handbags", "tote", "totes"],
    kids: ["kids", "kid", "children", "child"],
    linen: ["linen"],
    cashmere: ["cashmere"],
    petites: ["petites", "petite"],
    sale: ["sale"],
    swim: ["swim", "swimsuit", "swimwear", "bikini"],
    new: ["new", "arrivals"]
  };

  var catalog = null;
  var catalogPromise = null;
  var debounceTimer = null;

  function loadCatalog() {
    if (catalog) return Promise.resolve(catalog);
    if (catalogPromise) return catalogPromise;

    var bundled =
      typeof window !== "undefined" &&
      window.__PRODUCTS_CATALOG__ &&
      Array.isArray(window.__PRODUCTS_CATALOG__.products);

    if (bundled && window.__PRODUCTS_CATALOG__.products.length) {
      catalog = window.__PRODUCTS_CATALOG__.products;
      return Promise.resolve(catalog);
    }

    catalogPromise = fetch(CATALOG_URL, { cache: "no-store" })
      .then(function (res) {
        return res.ok ? res.json() : { products: [] };
      })
      .catch(function () {
        return { products: [] };
      })
      .then(function (data) {
        catalog = Array.isArray(data.products) ? data.products : [];
        return catalog;
      });

    return catalogPromise;
  }

  function norm(s) {
    return String(s || "")
      .toLowerCase()
      .replace(/['’]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function singularToken(t) {
    if (t.length > 3 && t.slice(-1) === "s" && !t.endsWith("ss")) {
      return t.slice(0, -1);
    }
    return t;
  }

  function buildQueryTokens(query) {
    var base = norm(query);
    var tokens = [];
    var seen = {};

    function add(t) {
      if (!t || t.length < MIN_QUERY_LEN || seen[t]) return;
      seen[t] = true;
      tokens.push(t);
    }

    add(base);
    add(singularToken(base));

    var deptKeys = Object.keys(DEPT_ALIASES);
    for (var d = 0; d < deptKeys.length; d++) {
      var dept = deptKeys[d];
      var aliases = DEPT_ALIASES[dept];
      var hit = false;
      for (var i = 0; i < aliases.length; i++) {
        var alias = norm(aliases[i]);
        if (
          base === alias ||
          singularToken(base) === alias ||
          singularToken(alias) === base ||
          base.indexOf(alias) !== -1 ||
          alias.indexOf(base) !== -1
        ) {
          hit = true;
          break;
        }
      }
      if (hit || base === dept || singularToken(base) === dept) {
        add(dept);
        for (var j = 0; j < aliases.length; j++) {
          add(norm(aliases[j]));
        }
      }
    }

    return tokens;
  }

  function deptMatchesToken(dept, token) {
    if (!dept || !token) return false;
    var d = norm(dept);
    var t = norm(token);
    var ds = singularToken(d);
    var ts = singularToken(t);
    if (d === t || ds === t || d === ts || ds === ts) return true;
    if (d.indexOf(t) === 0 || t.indexOf(d) === 0) return true;
    if (ds.indexOf(ts) === 0 || ts.indexOf(ds) === 0) return true;
    return false;
  }

  function productHaystack(p) {
    return norm(
      [
        p.title,
        p.meta,
        p.department,
        p.brand,
        p.description,
        p.sku,
        Array.isArray(p.breadcrumb) ? p.breadcrumb.join(" ") : ""
      ].join(" ")
    );
  }

  function scoreProduct(p, query) {
    var tokens = buildQueryTokens(query);
    if (!tokens.length) return 0;

    var title = norm(p.title);
    var meta = norm(p.meta);
    var dept = norm(p.department);
    var hay = productHaystack(p);
    var best = 0;

    for (var i = 0; i < tokens.length; i++) {
      var t = tokens[i];
      if (deptMatchesToken(dept, t)) {
        best = Math.max(best, 90);
        continue;
      }
      if (title === t) best = Math.max(best, 100);
      else if (title.indexOf(t) === 0) best = Math.max(best, 80);
      else if (title.indexOf(t) !== -1) best = Math.max(best, 60);
      else if (meta.indexOf(t) !== -1) best = Math.max(best, 50);
      else if (hay.indexOf(t) !== -1) best = Math.max(best, 30);
    }

    return best;
  }

  function searchProducts(list, query) {
    var q = norm(query);
    if (!q || q.length < MIN_QUERY_LEN) return [];
    var out = [];
    for (var i = 0; i < list.length; i++) {
      var s = scoreProduct(list[i], query);
      if (s > 0) out.push({ product: list[i], score: s });
    }
    out.sort(function (a, b) {
      return b.score - a.score;
    });
    return out.slice(0, MAX_RESULTS);
  }

  function cardDepartment(card) {
    var id = card.getAttribute("data-product-id") || "";
    var dash = id.indexOf("-");
    if (dash > 0) return id.slice(0, dash);
    return "";
  }

  function cardMatchesQuery(card, query) {
    var tokens = buildQueryTokens(query);
    if (!tokens.length) return false;

    var dept = cardDepartment(card);
    var titleEl = card.querySelector(".pd-card-title");
    var metaEl = card.querySelector(".pd-card-meta");
    var title = norm(titleEl ? titleEl.textContent : "");
    var meta = norm(metaEl ? metaEl.textContent : "");
    var hay = norm(title + " " + meta + " " + dept);

    for (var i = 0; i < tokens.length; i++) {
      var t = tokens[i];
      if (dept && deptMatchesToken(dept, t)) return true;
      if (title.indexOf(t) !== -1 || meta.indexOf(t) !== -1 || hay.indexOf(t) !== -1) {
        return true;
      }
    }
    return false;
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function productUrl(id) {
    return "product.html?id=" + encodeURIComponent(id);
  }

  function productsPageUrl(query) {
    return "products.html?q=" + encodeURIComponent(query);
  }

  function pageFileName() {
    var p = String(window.location.pathname || "").replace(/\\/g, "/");
    var i = p.lastIndexOf("/");
    return (i === -1 ? p : p.slice(i + 1)).toLowerCase();
  }

  function isProductsPage() {
    return pageFileName() === "products.html";
  }

  function bindSiteSearch() {
    var wrap = document.getElementById("jc-search-expand");
    var input = document.getElementById("jc-site-search");
    var panel = document.getElementById("jc-search-results");
    if (!wrap || !input || !panel) return;
    if (wrap.getAttribute("data-jc-site-search-bound") === "1") return;
    wrap.setAttribute("data-jc-site-search-bound", "1");

    function setPanelOpen(open) {
      panel.hidden = !open;
      input.setAttribute("aria-expanded", open ? "true" : "false");
    }

    function clearResults() {
      panel.innerHTML = "";
      setPanelOpen(false);
    }

    function renderResults(matches, query) {
      panel.innerHTML = "";
      if (!query || query.length < MIN_QUERY_LEN) {
        clearResults();
        return;
      }

      if (!matches.length) {
        panel.innerHTML =
          '<p class="jc-search-results-empty">No products for “' +
          escapeHtml(query) +
          "”.</p>";
        setPanelOpen(true);
        return;
      }

      var frag = document.createDocumentFragment();
      matches.forEach(function (row) {
        var p = row.product;
        var a = document.createElement("a");
        a.className = "jc-search-result";
        a.href = productUrl(p.id);
        a.setAttribute("role", "option");
        a.innerHTML =
          '<span class="jc-search-result-thumb">' +
          (p.image
            ? '<img src="' +
              escapeHtml(p.image) +
              '" alt="" width="40" height="52" loading="lazy" />'
            : "") +
          "</span>" +
          '<span class="jc-search-result-text">' +
          '<span class="jc-search-result-title">' +
          escapeHtml(p.title || "Product") +
          "</span>" +
          '<span class="jc-search-result-meta">' +
          escapeHtml(p.meta || p.department || "") +
          "</span>" +
          "</span>" +
          '<span class="jc-search-result-price">' +
          escapeHtml(p.priceDisplay || "") +
          "</span>";
        frag.appendChild(a);
      });

      var all = document.createElement("a");
      all.className = "jc-search-results-all";
      all.href = productsPageUrl(query);
      all.textContent = "View all results";
      frag.appendChild(all);

      panel.appendChild(frag);
      setPanelOpen(true);
    }

    function runSearch() {
      var query = input.value.trim();
      if (query.length < MIN_QUERY_LEN) {
        clearResults();
        return;
      }
      loadCatalog().then(function (list) {
        renderResults(searchProducts(list, query), query);
      });
    }

    input.addEventListener("input", function () {
      window.clearTimeout(debounceTimer);
      debounceTimer = window.setTimeout(runSearch, DEBOUNCE_MS);
    });

    input.addEventListener("keydown", function (ev) {
      if (ev.key === "Enter") {
        ev.preventDefault();
        var q = input.value.trim();
        if (!q) return;
        window.location.href = productsPageUrl(q);
      }
      if (ev.key === "Escape") {
        clearResults();
      }
    });

    document.addEventListener(
      "click",
      function (ev) {
        if (wrap.contains(ev.target)) return;
        clearResults();
      },
      true
    );

    document.addEventListener("page-nav-loaded", function () {
      if (isProductsPage()) {
        var params = new URLSearchParams(window.location.search);
        var q = params.get("q");
        if (q) input.value = q;
      }
    });
  }

  function applyProductsPageQuery() {
    if (!isProductsPage()) return;
    var params = new URLSearchParams(window.location.search);
    var rawQ = params.get("q") || "";
    var q = norm(rawQ);
    var grid = document.querySelector(".pd-grid");
    if (!grid) return;

    var cards = grid.querySelectorAll(".pd-card");
    if (!q) return;

    var visible = 0;
    cards.forEach(function (card) {
      var show = cardMatchesQuery(card, rawQ);
      card.hidden = !show;
      if (show) visible++;
    });

    var heroTitle = document.getElementById("pd-title");
    if (heroTitle) {
      heroTitle.textContent = visible
        ? "Results for “" + rawQ + "”"
        : "No results";
    }

    var empty = document.getElementById("pd-search-empty");
    if (!empty) {
      empty = document.createElement("p");
      empty.id = "pd-search-empty";
      empty.className = "pd-search-empty";
      grid.parentNode.insertBefore(empty, grid.nextSibling);
    }
    empty.hidden = visible > 0;
    empty.textContent =
      visible > 0
        ? ""
        : "No products matched your search. Try another term or browse the full catalog.";
  }

  document.addEventListener("page-nav-loaded", bindSiteSearch);
  document.addEventListener("DOMContentLoaded", bindSiteSearch);
  document.addEventListener("DOMContentLoaded", applyProductsPageQuery);

  if (document.getElementById("jc-site-search")) {
    bindSiteSearch();
  }
  applyProductsPageQuery();
})();
