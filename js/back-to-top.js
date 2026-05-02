document.addEventListener("DOMContentLoaded", () => {
  const backToTopButton = document.querySelector("[data-back-to-top]");
  if (!(backToTopButton instanceof HTMLElement)) return;
  if (backToTopButton.dataset.backToTopReady === "true") return;

  backToTopButton.dataset.backToTopReady = "true";

  const showOffset = 400;

  function toggleBackToTopButton() {
    backToTopButton.classList.toggle("is-visible", window.scrollY > showOffset);
  }

  backToTopButton.addEventListener("click", () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });

    backToTopButton.blur();
  });

  window.addEventListener("scroll", toggleBackToTopButton, { passive: true });
  window.addEventListener("resize", toggleBackToTopButton, { passive: true });
  toggleBackToTopButton();
});
