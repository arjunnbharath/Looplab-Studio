/**
 * Hero cutout (index / men): cycles sec1–sec4 with RGB-shift + clip burst (glitch-demo.html).
 * Exposes LLInitHeroCutout / LLDestroyHeroCutout for manual re-init if the hero is injected later.
 */
(function () {
  var sources = [
    "image/home/sec1pic.png",
    "image/home/sec2pic.png",
    "image/home/sec3pic.png",
    "image/home/sec4pic.png",
  ];

  var glitchClass = "rx-hero-cutout--glitch";
  var intervalMs = 2100;
  var swapDelayMs = 260;
  var glitchDurationMs = 520;

  var timer;
  var root;
  var img;
  var i;
  var busy;
  var mq;
  var mqHandler;

  function destroy() {
    if (timer) window.clearInterval(timer);
    timer = null;
    if (mq && mqHandler) {
      if (typeof mq.removeEventListener === "function") mq.removeEventListener("change", mqHandler);
      else if (typeof mq.removeListener === "function") mq.removeListener(mqHandler);
    }
    mqHandler = null;
    mq = null;
    root = null;
    img = null;
  }

  function finishGlitch() {
    if (!root) return;
    root.classList.remove(glitchClass);
    busy = false;
  }

  function advance() {
    if (!root || !img || busy) return;
    busy = true;
    var next = (i + 1) % sources.length;

    if (mq.matches) {
      i = next;
      root.setAttribute("data-cutout-index", String(i));
      setSrc(i);
      busy = false;
      return;
    }

    root.classList.add(glitchClass);
    window.setTimeout(function () {
      if (!root || !img) return;
      i = next;
      root.setAttribute("data-cutout-index", String(i));
      setSrc(i);
    }, swapDelayMs);
    window.setTimeout(finishGlitch, glitchDurationMs);
  }

  function setSrc(index) {
    if (!img || !root) return;
    var path = sources[index];
    img.src = path;
    root.style.setProperty("--rx-hero-cutout-glitch-src", "url('" + path + "')");
  }

  function start() {
    if (timer) window.clearInterval(timer);
    timer = window.setInterval(advance, intervalMs);
  }

  function onMotionChange() {
    if (!root) return;
    root.classList.remove(glitchClass);
    busy = false;
    start();
  }

  function initHero() {
    destroy();
    root = document.querySelector("[data-hero-cutout]");
    img = document.querySelector("[data-hero-cutout-img]");
    if (!root || !img) return false;

    i = 0;
    busy = false;
    mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    mqHandler = onMotionChange;

    sources.forEach(function (src) {
      var pre = new Image();
      pre.src = src;
    });

    if (typeof mq.addEventListener === "function") mq.addEventListener("change", mqHandler);
    else if (typeof mq.addListener === "function") mq.addListener(mqHandler);

    start();
    return true;
  }

  window.LLDestroyHeroCutout = destroy;
  window.LLInitHeroCutout = initHero;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initHero);
  } else {
    initHero();
  }
})();
