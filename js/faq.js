function initFaq() {
  const faq = document.querySelector("[data-faq]");
  if (!faq) return;

  const items = Array.from(faq.querySelectorAll(".faq-item"));
  if (!items.length) return;

  function closeItem(item) {
    const button = item.querySelector(".faq-item__question");
    const answer = item.querySelector(".faq-item__answer");

    if (!button || !answer) return;

    item.classList.remove("is-open");
    button.setAttribute("aria-expanded", "false");
    answer.hidden = true;
  }

  function openItem(item) {
    const button = item.querySelector(".faq-item__question");
    const answer = item.querySelector(".faq-item__answer");

    if (!button || !answer) return;

    item.classList.add("is-open");
    button.setAttribute("aria-expanded", "true");
    answer.hidden = false;
  }

  items.forEach((item) => {
    const button = item.querySelector(".faq-item__question");
    if (!button) return;

    button.addEventListener("click", () => {
      const isOpen = item.classList.contains("is-open");

      items.forEach((currentItem) => {
        if (currentItem !== item) {
          closeItem(currentItem);
        }
      });

      if (isOpen) {
        closeItem(item);
      } else {
        openItem(item);
      }
    });
  });
}


