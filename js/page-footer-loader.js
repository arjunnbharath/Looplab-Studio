/**
 * Loads partials/footer.html into #jc-site-footer-mount.
 * Over HTTP, fetches the partial. If fetch fails (e.g. file://), uses
 * window.__PAGE_FOOTER_FALLBACK__ from js/page-footer-html-bundled.js when present.
 */
(function () {
  function applyFooterHtml(mount, html) {
    mount.outerHTML = html;
  }

  function tryFallback(mount, path) {
    var fb = typeof window !== "undefined" && window.__PAGE_FOOTER_FALLBACK__;
    if (typeof fb === "string" && fb.length) {
      applyFooterHtml(mount, fb);
      return true;
    }
    mount.outerHTML =
      '<footer class="jc-site-footer jc-site-footer--error" role="contentinfo" style="background:#1a1a1a;color:#f5d67a;padding:1rem 1.25rem;font:13px/1.5 system-ui,Segoe UI,sans-serif">' +
      "<strong>Footer did not load.</strong> Use <code>npx serve</code> in this folder (HTTP), or load <code>js/page-footer-html-bundled.js</code> before this script for <code>file://</code>. Regenerate the bundle after editing <code>partials/footer.html</code>. Requested path: <code>" +
      path +
      "</code>." +
      "</footer>";
    return false;
  }

  function run() {
    var mount = document.getElementById("jc-site-footer-mount");
    if (!mount) return;

    var path = mount.getAttribute("data-footer-partial") || "partials/footer.html";

    fetch(path, { credentials: "same-origin" })
      .then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.text();
      })
      .then(function (html) {
        applyFooterHtml(mount, html);
      })
      .catch(function (err) {
        console.error("[page-footer-loader]", err);
        tryFallback(mount, path);
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run);
  } else {
    run();
  }
})();
