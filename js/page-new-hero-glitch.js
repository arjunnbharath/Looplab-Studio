/**
 * New page hero — RGB split / clip glitch (from glitch-demo.html), cycles image/1–11.png.
 */
(function () {
  var root = document.querySelector(".nw-page [data-nw-hero-glitch]");
  var img = document.querySelector(".nw-page [data-nw-hero-glitch-img]");
  if (!root || !img) return;

  var total = 11;
  var intervalMs = 4200;
  var glitchClass = "is-glitching";
  var mq = window.matchMedia("(prefers-reduced-motion: reduce)");

  function setSrc(index) {
    var n = ((index - 1) % total + total) % total + 1;
    var path = "image/" + n + ".png";
    img.src = path;
    root.style.setProperty("--nw-hero-glitch-src", "url('" + path + "')");
  }

  var i = 1;
  var timer;

  function runGlitch() {
    if (mq.matches) {
      i = (i % total) + 1;
      setSrc(i);
      return;
    }
    root.classList.add(glitchClass);
    window.setTimeout(function () {
      i = (i % total) + 1;
      setSrc(i);
    }, 260);
    window.setTimeout(function () {
      root.classList.remove(glitchClass);
    }, 520);
  }

  function start() {
    if (timer) clearInterval(timer);
    timer = window.setInterval(runGlitch, intervalMs);
  }

  function onMotionChange() {
    start();
  }

  if (typeof mq.addEventListener === "function") {
    mq.addEventListener("change", onMotionChange);
  } else if (typeof mq.addListener === "function") {
    mq.addListener(onMotionChange);
  }

  start();
})();
