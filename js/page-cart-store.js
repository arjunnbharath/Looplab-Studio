/**
 * LoopLab Studio — cart persistence (localStorage).
 * Used by page-cart-page.js for bag badge, PLP add-to-bag, and cart.html rendering.
 */
(function (global) {
  var STORAGE_KEY = "looplab_cart_v1";

  function load() {
    try {
      var raw = global.localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      var arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr : [];
    } catch (e) {
      return [];
    }
  }

  function save(items) {
    try {
      global.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      /* ignore quota / private mode */
    }
    if (typeof document !== "undefined") {
      document.dispatchEvent(
        new CustomEvent("ll-cart-change", { detail: { items: items } })
      );
    }
  }

  function stableId(title, imgSrc) {
    var s = String(title || "") + "|" + String(imgSrc || "");
    var h = 0;
    for (var i = 0; i < s.length; i++) {
      h = ((h << 5) - h + s.charCodeAt(i)) | 0;
    }
    return "ll-" + Math.abs(h).toString(36);
  }

  function parseCents(text) {
    if (!text) return 0;
    var matches = String(text).match(/\$[\d,]+\.\d{2}/g);
    if (!matches || !matches.length) return 0;
    var last = matches[matches.length - 1].replace(/[$,]/g, "");
    var parts = last.split(".");
    var dollars = parseInt(parts[0], 10);
    var cents = parseInt(parts[1], 10);
    if (isNaN(dollars)) dollars = 0;
    if (isNaN(cents)) cents = 0;
    return dollars * 100 + cents;
  }

  function fmt(cents) {
    var n = Math.round(Number(cents) || 0);
    return "$" + (n / 100).toFixed(2);
  }

  function addFromCard(card) {
    if (!card) return load();
    var titleEl = card.querySelector(".pd-card-title");
    var metaEl = card.querySelector(".pd-card-meta");
    var priceEl = card.querySelector(".pd-card-price");
    var imgEl = card.querySelector(".pd-card-media img");
    var title = titleEl ? titleEl.textContent.trim() : "Item";
    var meta = metaEl ? metaEl.textContent.trim() : "";
    var img = imgEl ? imgEl.getAttribute("src") || "" : "";
    var priceCents = parseCents(priceEl ? priceEl.textContent : "");
    var id = card.getAttribute("data-product-id") || stableId(title, img);
    var items = load();
    var found = null;
    for (var i = 0; i < items.length; i++) {
      if (items[i].id === id) {
        found = items[i];
        break;
      }
    }
    if (found) {
      found.qty = (found.qty || 1) + 1;
    } else {
      items.push({
        id: id,
        title: title,
        meta: meta,
        image: img,
        priceCents: priceCents,
        qty: 1,
      });
    }
    save(items);
    return items;
  }

  function remove(id) {
    var items = load().filter(function (x) {
      return x.id !== id;
    });
    save(items);
    return items;
  }

  function setQty(id, qty) {
    qty = parseInt(qty, 10);
    if (isNaN(qty) || qty < 1) qty = 1;
    if (qty > 99) qty = 99;
    var items = load().map(function (x) {
      if (x.id === id) {
        var copy = {};
        for (var k in x) {
          if (Object.prototype.hasOwnProperty.call(x, k)) copy[k] = x[k];
        }
        copy.qty = qty;
        return copy;
      }
      return x;
    });
    save(items);
    return items;
  }

  function totalQty() {
    return load().reduce(function (acc, x) {
      return acc + (x.qty || 1);
    }, 0);
  }

  function totalCents() {
    return load().reduce(function (acc, x) {
      return acc + (x.priceCents || 0) * (x.qty || 1);
    }, 0);
  }

  global.LLCart = {
    STORAGE_KEY: STORAGE_KEY,
    load: load,
    save: save,
    addFromCard: addFromCard,
    remove: remove,
    setQty: setQty,
    totalQty: totalQty,
    totalCents: totalCents,
    fmt: fmt,
    parseCents: parseCents,
  };
})(typeof window !== "undefined" ? window : this);
