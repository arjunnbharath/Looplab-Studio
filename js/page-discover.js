document.addEventListener("DOMContentLoaded", () => {
  const track = document.getElementById("rx-discover-track");
  const dots = document.querySelectorAll("#rx-discover-dots .rx-dot");
  const slides = document.querySelectorAll(".rx-discover-slide");

  if (!track || !dots.length || !slides.length) return;

  const updateClasses = (activeIndex) => {
    slides.forEach((slide, index) => {
      slide.className = "rx-discover-slide"; // reset
      if (index === activeIndex) {
        slide.classList.add("rx-active");
      } else if (index === activeIndex - 1 || index === activeIndex + 1) {
        slide.classList.add("rx-faded", "rx-faded-near");
      } else {
        slide.classList.add("rx-faded");
      }
    });

    dots.forEach((dot, index) => {
      dot.classList.toggle("rx-dot-active", index === activeIndex);
    });
  };

  // Scroll event to determine active slide
  track.addEventListener("scroll", () => {
    let minDistance = Infinity;
    let activeIndex = 0;
    const trackCenter = track.scrollLeft + track.clientWidth / 2;

    slides.forEach((slide, index) => {
      const slideCenter = slide.offsetLeft + slide.clientWidth / 2;
      const distance = Math.abs(trackCenter - slideCenter);
      if (distance < minDistance) {
        minDistance = distance;
        activeIndex = index;
      }
    });

    updateClasses(activeIndex);
  });

  // Click on dots
  dots.forEach((dot, index) => {
    dot.addEventListener("click", () => {
      const slide = slides[index];
      track.scrollTo({
        left: slide.offsetLeft - track.clientWidth / 2 + slide.clientWidth / 2,
        behavior: "smooth"
      });
    });
  });

  // Click on slide to bring it to center
  slides.forEach((slide, index) => {
    slide.addEventListener("click", () => {
      track.scrollTo({
        left: slide.offsetLeft - track.clientWidth / 2 + slide.clientWidth / 2,
        behavior: "smooth"
      });
    });
  });

  // Initial scroll to middle element (index 4)
  setTimeout(() => {
    const startSlide = slides[4];
    track.scrollTo({
      left: startSlide.offsetLeft - track.clientWidth / 2 + startSlide.clientWidth / 2,
      behavior: "auto"
    });
    updateClasses(4);
  }, 100);
});
