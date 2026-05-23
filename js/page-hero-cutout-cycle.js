(function () {
  var root = document.querySelector("[data-hero-cutout]");
  var img = document.querySelector("[data-hero-cutout-img]");
  if (!root || !img) return;

  var sources = [
    "image/sec1pic.png",
    "image/sec2pic.png",
    "image/sec3pic.png",
    "image/sec4pic.png",
  ];

  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return;
  }

  var i = 0;
  var busy = false;
  var intervalMs = 5200;
  var swapDelayMs = 360;
  var glitchMinMs = 520;

  sources.forEach(function (src) {
    var pre = new Image();
    pre.src = src;
  });

  function finishCycle(next) {
    i = next;
    root.setAttribute("data-cutout-index", String(i));
    root.classList.remove("rx-hero-cutout--glitch");
    busy = false;
  }

  function advance() {
    if (busy) return;
    busy = true;
    var next = (i + 1) % sources.length;
    var glitchStart = Date.now();
    root.classList.add("rx-hero-cutout--glitch");

    window.setTimeout(function () {
      img.src = sources[next];

      function whenReady() {
        var elapsed = Date.now() - glitchStart;
        var wait = Math.max(80, glitchMinMs - elapsed);
        window.setTimeout(function () {
          finishCycle(next);
        }, wait);
      }

      if (img.decode) {
        img.decode().then(whenReady).catch(whenReady);
      } else if (img.complete) {
        whenReady();
      } else {
        img.onload = function () {
          img.onload = null;
          whenReady();
        };
      }
    }, swapDelayMs);
  }

  window.setInterval(advance, intervalMs);
})();
