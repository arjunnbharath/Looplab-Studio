/**
 * Loads partials/jcrew-nav.html into #jc-site-nav-mount.
 * After a successful load, dispatches document "jcrew-nav-loaded" (for jcrew-nav-mobile.js).
 * Requires HTTP (fetch blocked on file://). Example: npx --yes serve . -p 3000
 */
(function () {
  function run() {
    var mount = document.getElementById("jc-site-nav-mount");
    if (!mount) return;

    var path = mount.getAttribute("data-nav-partial") || "partials/jcrew-nav.html";

    fetch(path, { credentials: "same-origin" })
      .then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.text();
      })
      .then(function (html) {
        mount.innerHTML = html;
        document.dispatchEvent(new CustomEvent("jcrew-nav-loaded"));
      })
      .catch(function (err) {
        console.error("[jcrew-nav-loader]", err);
        mount.innerHTML =
          '<div role="alert" style="padding:1rem 1.25rem;font:14px/1.5 system-ui,Segoe UI,sans-serif;background:#fff3cd;border-bottom:1px solid #e6d89c;color:#664d03">' +
          "<strong>Navigation did not load.</strong> Open this site over HTTP (for example run <code>npx serve</code> in the project folder) so <code>" +
          path +
          "</code> can be fetched. Or copy the contents of <code>partials/jcrew-nav.html</code> into the <code>#jc-site-nav-mount</code> element in your HTML." +
          "</div>";
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run);
  } else {
    run();
  }
})();
