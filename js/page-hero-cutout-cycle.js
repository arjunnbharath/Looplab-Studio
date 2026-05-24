/**
 * Hero cutout (index / men): cycles sec1–sec4 with RGB-shift + clip burst (glitch-demo.html).
 */
(function () {
  var root = document.querySelector("[data-hero-cutout]");
  var img = document.querySelector("[data-hero-cutout-img]");
  if (!root || !img) return;

  var sources = [
    "image/home/sec1pic.png",
    "image/home/sec2pic.png",
    "image/home/sec3pic.png",
    "image/home/sec4pic.png",
  ];

  var glitchClass = "rx-hero-cutout--glitch";
  var intervalMs = 5200;
  var swapDelayMs = 260;
  var glitchDurationMs = 520;
  var mq = window.matchMedia("(prefers-reduced-motion: reduce)");

  sources.forEach(function (src) {
    var pre = new Image();
    pre.src = src;
  });

  function setSrc(index) {
    var path = sources[index];
    img.src = path;
    root.style.setProperty("--rx-hero-cutout-glitch-src", "url('" + path + "')");
  }

  var i = 0;
  var busy = false;

  function finishGlitch() {
    root.classList.remove(glitchClass);
    busy = false;
  }

  function advance() {
    if (busy) return;
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
      i = next;
      root.setAttribute("data-cutout-index", String(i));
      setSrc(i);
    }, swapDelayMs);
    window.setTimeout(function () {
      finishGlitch();
    }, glitchDurationMs);
  }

  function start() {
    if (timer) window.clearInterval(timer);
    timer = window.setInterval(advance, intervalMs);
  }

  var timer;

  function onMotionChange() {
    root.classList.remove(glitchClass);
    busy = false;
    start();
  }

  if (typeof mq.addEventListener === "function") {
    mq.addEventListener("change", onMotionChange);
  } else if (typeof mq.addListener === "function") {
    mq.addListener(onMotionChange);
  }

  start();
})();
