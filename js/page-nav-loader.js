/**
 * Loads partials/page-nav.html into #jc-site-nav-mount.
 * After a successful load, dispatches document "page-nav-loaded" (for page-nav-mobile.js).
 * Over HTTP, fetches the partial so edits stay in one file.
 * On file://, fetch usually fails; include js/page-nav-html-bundled.js before this script
 * to set window.__PAGE_NAV_FALLBACK__ from the same partial at build time.
 */
(function () {
  function applyNavHtml(mount, html) {
    mount.innerHTML = html;
    document.dispatchEvent(new CustomEvent("page-nav-loaded"));
  }

  function tryFallback(mount, path) {
    var fb = typeof window !== "undefined" && window.__PAGE_NAV_FALLBACK__;
    if (typeof fb === "string" && fb.length) {
      applyNavHtml(mount, fb);
      return true;
    }
    var tmpl = document.getElementById("jc-nav-inline");
    if (tmpl && tmpl.innerHTML && tmpl.innerHTML.trim()) {
      applyNavHtml(mount, tmpl.innerHTML);
      return true;
    }
    mount.innerHTML =
      '<div role="alert" style="padding:1rem 1.25rem;font:14px/1.5 system-ui,Segoe UI,sans-serif;background:#fff3cd;border-bottom:1px solid #e6d89c;color:#664d03">' +
      "<strong>Navigation did not load.</strong> Use <code>npx serve</code> in this folder (HTTP), or load <code>js/page-nav-html-bundled.js</code> before this script for <code>file://</code>. Regenerate the bundle after editing <code>partials/page-nav.html</code> (see <code>NAV.md</code>). Requested path: <code>" +
      path +
      "</code>." +
      "</div>";
    return false;
  }

  function run() {
    var mount = document.getElementById("jc-site-nav-mount");
    if (!mount) return;

    var path = mount.getAttribute("data-nav-partial") || "partials/page-nav.html";

    fetch(path, { credentials: "same-origin" })
      .then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.text();
      })
      .then(function (html) {
        applyNavHtml(mount, html);
      })
      .catch(function (err) {
        console.error("[page-nav-loader]", err);
        tryFallback(mount, path);
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run);
  } else {
    run();
  }
})();
