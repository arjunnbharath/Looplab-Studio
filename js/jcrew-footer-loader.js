/**
 * Loads partials/footer.html into #jc-site-footer-mount.
 * Requires HTTP (fetch blocked on file://). Example: npx --yes serve . -p 3000
 */
(function () {
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
        mount.outerHTML = html;
      })
      .catch(function (err) {
        console.error("[jcrew-footer-loader]", err);
        mount.outerHTML =
          '<footer class="jc-site-footer jc-site-footer--error" role="contentinfo" style="background:#1a1a1a;color:#f5d67a;padding:1rem 1.25rem;font:13px/1.5 system-ui,Segoe UI,sans-serif">' +
          "<strong>Footer did not load.</strong> Serve the site over HTTP (e.g. <code>npx serve</code> in the project folder) or paste <code>partials/footer.html</code> in place of <code>#jc-site-footer-mount</code>." +
          "</footer>";
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run);
  } else {
    run();
  }
})();
