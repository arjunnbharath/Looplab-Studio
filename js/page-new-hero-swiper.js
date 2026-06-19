/**
 * New page hero — Swiper coverflow + reflected slides (no glitch).
 * Requires Swiper bundle (CDN on new.html).
 * Exposes LLInitNewHeroSwiper for manual re-init if the hero is injected later.
 */
(function () {
  var inst = null;

  function destroy() {
    if (inst) {
      try {
        inst.destroy(true, true);
      } catch (e) {
        /* ignore */
      }
      inst = null;
    }
  }

  function init() {
    if (typeof Swiper === "undefined") return;
    destroy();
    var el = document.querySelector(".nw-page .nw-hero-swiper-el");
    if (!el) return;

    var mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    var cfg = {
      effect: "coverflow",
      grabCursor: true,
      centeredSlides: true,
      slidesPerView: "auto",
      loop: true,
      speed: 420,
      coverflowEffect: {
        rotate: 26,
        stretch: 0,
        depth: 110,
        modifier: 1,
        slideShadows: false,
      },
      breakpoints: {
        0: { spaceBetween: 12 },
        640: { spaceBetween: 20 },
      },
    };

    if (!mq.matches) {
      cfg.autoplay = {
        delay: 2000,
        disableOnInteraction: false,
        pauseOnMouseEnter: true,
      };
    }

    inst = new Swiper(el, cfg);
  }

  window.LLInitNewHeroSwiper = init;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
