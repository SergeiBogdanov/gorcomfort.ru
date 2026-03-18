document.addEventListener("DOMContentLoaded", () => {
  const burger = document.querySelector(".burger");
  const mobileMenu = document.getElementById("mobileMenu");
  const mobileLinks = document.querySelectorAll(".mobile-menu__link, .mobile-menu__phone, .mobile-menu__cta");

  function openMenu() {
    if (!mobileMenu || !burger) return;

    mobileMenu.hidden = false;
    mobileMenu.classList.add("is-open");
    burger.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden";
  }

  function closeMenu() {
    if (!mobileMenu || !burger) return;

    mobileMenu.classList.remove("is-open");
    mobileMenu.hidden = true;
    burger.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
  }

  function toggleMenu() {
    if (!mobileMenu) return;

    const isOpen = mobileMenu.classList.contains("is-open");
    if (isOpen) {
      closeMenu();
    } else {
      openMenu();
    }
  }

  if (burger && mobileMenu) {
    burger.addEventListener("click", toggleMenu);

    mobileLinks.forEach((link) => {
      link.addEventListener("click", closeMenu);
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && mobileMenu.classList.contains("is-open")) {
        closeMenu();
      }
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth > 1060 && mobileMenu.classList.contains("is-open")) {
        closeMenu();
      }
    });
  }

  initWorksSlider();
  initFaq();
  initRequestModal();
  initBackToTop();
});

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

function initRequestModal() {
  const modal = document.querySelector("[data-request-modal]");
  if (!modal) return;

  const dialog = modal.querySelector(".request-modal__dialog");
  const openButtons = document.querySelectorAll("[data-open-request-modal]");
  const closeButtons = modal.querySelectorAll("[data-request-close]");
  const form = modal.querySelector(".request-form");

  const nameInput = modal.querySelector('input[name="name"]');
  const phoneInput = modal.querySelector('input[name="phone"]');
  const agreeInput = modal.querySelector('input[name="agree"]');
  const messageInput = modal.querySelector('textarea[name="message"]');
  const messageCounter = modal.querySelector("[data-message-counter]");

  let lastFocusedTrigger = null;

  if (!dialog || !openButtons.length) return;

  if (nameInput) {
    nameInput.addEventListener("input", () => {
      nameInput.value = nameInput.value.replace(/[^A-Za-zА-Яа-яЁё\s-]/g, "");
    });
  }

  if (messageInput && messageCounter) {
    const maxLength = Number(messageInput.getAttribute("maxlength")) || 500;

    function updateMessageCounter() {
      const currentLength = messageInput.value.length;
      messageCounter.textContent = `${currentLength} из ${maxLength} символов`;
    }

    messageInput.addEventListener("input", updateMessageCounter);
    updateMessageCounter();
  }

  function isMobileMenuOpen() {
    const mobileMenu = document.getElementById("mobileMenu");
    return Boolean(mobileMenu && mobileMenu.classList.contains("is-open"));
  }

  function syncBodyScrollLock() {
    if (isMobileMenuOpen() || !modal.hidden) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
  }

  function openModal() {
    modal.hidden = false;
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("is-modal-open");
    syncBodyScrollLock();

    requestAnimationFrame(() => {
      const targetField =
        nameInput ||
        phoneInput ||
        modal.querySelector("button");

      targetField?.focus();
    });
  }

    function canRestoreFocus(element) {
    return (
      element instanceof HTMLElement &&
      element.isConnected &&
      !element.hasAttribute("disabled") &&
      element.offsetParent !== null
    );
  }

  function closeModal() {
    const activeElement = document.activeElement;

    if (activeElement instanceof HTMLElement && modal.contains(activeElement)) {
      activeElement.blur();
    }

    modal.hidden = true;
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("is-modal-open");
    syncBodyScrollLock();

    if (canRestoreFocus(lastFocusedTrigger)) {
      lastFocusedTrigger.focus();
    }
  }

  openButtons.forEach((button) => {
    button.addEventListener("click", () => {
      lastFocusedTrigger = button;
      openModal();
    });
  });

  closeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      closeModal();
    });
  });

  modal.addEventListener("click", (event) => {
    if (event.target === modal) {
      closeModal();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !modal.hidden) {
      closeModal();
    }
  });

  dialog.addEventListener("click", (event) => {
    event.stopPropagation();
  });

  if (phoneInput) {
    phoneInput.addEventListener("input", () => {
      let value = phoneInput.value.replace(/\D/g, "");

      if (!value) {
        phoneInput.value = "";
        return;
      }

      if (value.startsWith("8")) {
        value = "7" + value.slice(1);
      }

      if (!value.startsWith("7")) {
        value = "7" + value;
      }

      value = value.slice(0, 11);

      let result = "+7";

      if (value.length > 1) {
        result += " (" + value.slice(1, 4);
      }

      if (value.length >= 5) {
        result += ") " + value.slice(4, 7);
      }

      if (value.length >= 8) {
        result += "-" + value.slice(7, 9);
      }

      if (value.length >= 10) {
        result += "-" + value.slice(9, 11);
      }

      phoneInput.value = result;
    });
  }

  if (form) {
    form.addEventListener("submit", (event) => {
  event.preventDefault();

  const name = nameInput;
  const phone = phoneInput;
  const agree = agreeInput;

  const nameValue = name ? name.value.trim() : "";
  const phoneDigits = phone ? phone.value.replace(/\D/g, "") : "";

  const isNameValid =
    /^[A-Za-zА-Яа-яЁё\s-]+$/.test(nameValue) &&
    /[A-Za-zА-Яа-яЁё]/.test(nameValue);

  const isPhoneValid = phoneDigits.length === 11;
  const isAgreeValid = Boolean(agree?.checked);

  if (name) {
    name.setCustomValidity("");
  }

  if (phone) {
    phone.setCustomValidity("");
  }

  if (agree) {
    agree.setCustomValidity("");
  }

  if (!isNameValid) {
    if (name) {
      name.setCustomValidity("Введите имя только буквами, без цифр.");
      name.focus();
      name.reportValidity();
    }
    return;
  }

  if (!isPhoneValid) {
    if (phone) {
      phone.setCustomValidity("Введите корректный номер телефона.");
      phone.focus();
      phone.reportValidity();
    }
    return;
  }

  if (!isAgreeValid) {
    if (agree) {
      agree.setCustomValidity("Нужно дать согласие на обработку данных.");
      agree.focus();
      agree.reportValidity();
    }
    return;
  }

  form.reset();

  if (name) {
    name.setCustomValidity("");
  }

  if (phone) {
    phone.setCustomValidity("");
  }

  if (agree) {
    agree.setCustomValidity("");
  }

  if (messageInput && messageCounter) {
    const maxLength = Number(messageInput.getAttribute("maxlength")) || 500;
    messageCounter.textContent = `0 из ${maxLength} символов`;
  }

  closeModal();
  alert("Спасибо! Ваша заявка отправлена.");
});
  }
}

function initBackToTop() {
  const backToTopButton = document.querySelector("[data-back-to-top]");
  if (!backToTopButton) return;

  const SHOW_OFFSET = 400;

  function toggleBackToTopButton() {
    const shouldShow = window.scrollY > SHOW_OFFSET;
    backToTopButton.classList.toggle("is-visible", shouldShow);
  }

  backToTopButton.addEventListener("click", () => {
  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });

  backToTopButton.blur();
});

  window.addEventListener("scroll", toggleBackToTopButton, { passive: true });
  toggleBackToTopButton();
}