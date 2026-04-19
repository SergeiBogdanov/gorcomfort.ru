function initWorksSlider() {
  const slider = document.querySelector("[data-works-slider]");
  if (!slider) return;

  const items = Array.from(slider.querySelectorAll(".works-slider__item"));
  if (items.length < 2) return;

  const prevButton = slider.querySelector("[data-works-prev]");
  const nextButton = slider.querySelector("[data-works-next]");

  const prevSlide = slider.querySelector(".works-slide--prev");
  const mainSlide = slider.querySelector(".works-slide--main");
  const nextSlide = slider.querySelector(".works-slide--next");

  const prevImage = prevSlide?.querySelector(".works-slide__image");
  const mainImage = mainSlide?.querySelector(".works-slide__image");
  const nextImage = nextSlide?.querySelector(".works-slide__image");

  const caption = slider.querySelector(".works-slider__caption-text");
  const nav = slider.querySelector(".works-slider__nav");

  if (
    !prevButton ||
    !nextButton ||
    !prevSlide ||
    !mainSlide ||
    !nextSlide ||
    !prevImage ||
    !mainImage ||
    !nextImage ||
    !caption ||
    !nav
  ) {
    return;
  }

  let currentIndex = 0;
  let isAnimating = false;
  let navButtons = [];

  const MAIN_ANIMATION_DURATION = 320;
  const SIDE_ANIMATION_DURATION = 220;
  const EASING = "cubic-bezier(0.22, 1, 0.36, 1)";

  function getSafeIndex(index) {
    const total = items.length;
    return (index + total) % total;
  }

  function getItem(index) {
    return items[getSafeIndex(index)];
  }

  function fillImage(imageElement, item, fallbackAlt) {
    imageElement.src = item.dataset.image || "";
    imageElement.alt = item.dataset.alt || item.dataset.title || fallbackAlt;
  }

  function buildDots() {
    nav.innerHTML = "";
    navButtons = [];

    items.forEach((item, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "works-slider__nav-dot works-slider__nav-dot--bullet";
      button.setAttribute("aria-label", `Перейти к фото ${index + 1}`);
      button.dataset.index = String(index);

      button.addEventListener("click", () => {
        goToIndex(index);
      });

      nav.appendChild(button);
      navButtons.push(button);
    });
  }

  function updateDots() {
    navButtons.forEach((button, index) => {
      button.classList.toggle("is-active", index === currentIndex);

      if (index === currentIndex) {
        button.setAttribute("aria-current", "true");
      } else {
        button.removeAttribute("aria-current");
      }
    });
  }

  function renderStatic() {
    const prevItem = getItem(currentIndex - 1);
    const currentItem = getItem(currentIndex);
    const nextItem = getItem(currentIndex + 1);

    fillImage(prevImage, prevItem, "Предыдущая работа");
    fillImage(mainImage, currentItem, "Текущая работа");
    fillImage(nextImage, nextItem, "Следующая работа");

    caption.textContent = currentItem.dataset.title || "";
    updateDots();
  }

  function setDisabled(disabled) {
    prevButton.disabled = disabled;
    nextButton.disabled = disabled;

    navButtons.forEach((button) => {
      button.disabled = disabled;
    });
  }

  function animateMainOut(direction) {
    const offset = direction === "next" ? -36 : 36;

    return mainSlide.animate(
      [
        { opacity: 1, transform: "translateX(0) scale(1)" },
        { opacity: 0, transform: `translateX(${offset}px) scale(0.985)` },
      ],
      {
        duration: MAIN_ANIMATION_DURATION,
        easing: EASING,
        fill: "forwards",
      }
    ).finished;
  }

  function animateMainIn(direction) {
    const offset = direction === "next" ? 36 : -36;

    return mainSlide.animate(
      [
        { opacity: 0, transform: `translateX(${offset}px) scale(0.985)` },
        { opacity: 1, transform: "translateX(0) scale(1)" },
      ],
      {
        duration: MAIN_ANIMATION_DURATION,
        easing: EASING,
        fill: "forwards",
      }
    ).finished;
  }

  function animateSidePreview(slide, direction) {
    const offset = direction === "next" ? 18 : -18;

    return slide.animate(
      [
        { opacity: 0.65, transform: `translateX(${offset}px) scale(0.98)` },
        { opacity: 0.92, transform: "translateX(0) scale(1)" },
      ],
      {
        duration: SIDE_ANIMATION_DURATION,
        easing: EASING,
        fill: "forwards",
      }
    ).finished;
  }

  function getDirectionToTarget(targetIndex) {
    if (targetIndex === currentIndex) return null;

    const total = items.length;
    const forwardDistance = (targetIndex - currentIndex + total) % total;
    const backwardDistance = (currentIndex - targetIndex + total) % total;

    return forwardDistance <= backwardDistance ? "next" : "prev";
  }

  async function animateToNewState(direction, targetIndex) {
    await animateMainOut(direction);

    currentIndex = getSafeIndex(targetIndex);
    renderStatic();

    const sideDirection = direction === "next" ? "next" : "prev";

    await Promise.all([
      animateMainIn(direction),
      animateSidePreview(prevSlide, sideDirection),
      animateSidePreview(nextSlide, sideDirection),
    ]);
  }

  async function goTo(direction) {
    if (isAnimating) return;

    const targetIndex =
      direction === "next"
        ? getSafeIndex(currentIndex + 1)
        : getSafeIndex(currentIndex - 1);

    isAnimating = true;
    setDisabled(true);

    try {
      await animateToNewState(direction, targetIndex);
    } catch (error) {
      renderStatic();
    } finally {
      mainSlide.style.opacity = "";
      mainSlide.style.transform = "";
      prevSlide.style.opacity = "";
      prevSlide.style.transform = "";
      nextSlide.style.opacity = "";
      nextSlide.style.transform = "";

      setDisabled(false);
      isAnimating = false;
    }
  }

  async function goToIndex(targetIndex) {
    if (isAnimating) return;
    if (targetIndex === currentIndex) return;

    const direction = getDirectionToTarget(targetIndex);
    if (!direction) return;

    isAnimating = true;
    setDisabled(true);

    try {
      await animateToNewState(direction, targetIndex);
    } catch (error) {
      renderStatic();
    } finally {
      mainSlide.style.opacity = "";
      mainSlide.style.transform = "";
      prevSlide.style.opacity = "";
      prevSlide.style.transform = "";
      nextSlide.style.opacity = "";
      nextSlide.style.transform = "";

      setDisabled(false);
      isAnimating = false;
    }
  }

  prevButton.addEventListener("click", () => {
    goTo("prev");
  });

  nextButton.addEventListener("click", () => {
    goTo("next");
  });

  document.addEventListener("keydown", (event) => {
    const worksSection = document.getElementById("works");
    if (!worksSection || isAnimating) return;

    const rect = worksSection.getBoundingClientRect();
    const isWorksVisible = rect.top < window.innerHeight && rect.bottom > 0;

    if (!isWorksVisible) return;

    if (event.key === "ArrowLeft") {
      goTo("prev");
    }

    if (event.key === "ArrowRight") {
      goTo("next");
    }
  });

  buildDots();
  renderStatic();
}


