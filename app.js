document.addEventListener("DOMContentLoaded", () => {
  const burger = document.querySelector(".burger");
  const mobileMenu = document.getElementById("mobileMenu");
  const mobileLinks = document.querySelectorAll(".mobile-menu__link, .mobile-menu__phone, .mobile-menu__cta");

  function isMenuOpen() {
    return Boolean(mobileMenu && mobileMenu.classList.contains("is-open"));
  }

  function isHeaderInteractiveElement(target) {
    return Boolean(
      target instanceof Element &&
      target.closest(".burger, .site-header__phone, .site-header__cta, .site-logo, a, button")
    );
  }

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

      document.addEventListener("click", (event) => {
      const target = event.target;

      if (!isMenuOpen() || !(target instanceof Element)) {
        return;
      }

      const clickedBurger = target.closest(".burger");
      const clickedInsideMenu = target.closest("#mobileMenu");
      const clickedHeader = target.closest(".site-header");

      if (clickedBurger || clickedInsideMenu) {
        return;
      }

      if (clickedHeader) {
        if (!isHeaderInteractiveElement(target)) {
          closeMenu();
        }
        return;
      }

      closeMenu();
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
  initRequestModalV2();
  initCouponModal();
  initAcCalculator();
  initBackToTop();
});

function sanitizePersonName(value) {
  return value.replace(/[^\p{Script=Latin}\p{Script=Cyrillic}\s-]/gu, "");
}

function formatRussianPhone(value) {
  let digits = value.replace(/\D/g, "");

  if (!digits) {
    return "";
  }

  if (digits.startsWith("8")) {
    digits = "7" + digits.slice(1);
  }

  if (!digits.startsWith("7")) {
    digits = "7" + digits;
  }

  digits = digits.slice(0, 11);

  let result = "+7";

  if (digits.length > 1) {
    result += " (" + digits.slice(1, 4);
  }

  if (digits.length >= 5) {
    result += ") " + digits.slice(4, 7);
  }

  if (digits.length >= 8) {
    result += "-" + digits.slice(7, 9);
  }

  if (digits.length >= 10) {
    result += "-" + digits.slice(9, 11);
  }

  return result;
}

function isValidPersonName(value) {
  return (
    /^[\p{Script=Latin}\p{Script=Cyrillic}\s-]+$/u.test(value) &&
    /[\p{Script=Latin}\p{Script=Cyrillic}]/u.test(value)
  );
}

async function submitLead(payload) {
  let response;

  try {
    response = await fetch("/api/leads", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    throw new Error(
      "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u043E\u0442\u043F\u0440\u0430\u0432\u0438\u0442\u044C \u0437\u0430\u044F\u0432\u043A\u0443 \u0438\u0437-\u0437\u0430 \u043E\u0448\u0438\u0431\u043A\u0438 \u0441\u043E\u0435\u0434\u0438\u043D\u0435\u043D\u0438\u044F. \u041F\u043E\u043F\u0440\u043E\u0431\u0443\u0439\u0442\u0435 \u0435\u0449\u0435 \u0440\u0430\u0437."
    );
  }

  let result = null;

  try {
    result = await response.json();
  } catch (error) {
    result = null;
  }

  if (!response.ok || !result?.ok) {
    throw new Error(
      result?.error || "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u043E\u0442\u043F\u0440\u0430\u0432\u0438\u0442\u044C \u0437\u0430\u044F\u0432\u043A\u0443. \u041F\u043E\u043F\u0440\u043E\u0431\u0443\u0439\u0442\u0435 \u0435\u0449\u0435 \u0440\u0430\u0437."
    );
  }

  return result;
}

function ensureFormFeedback(form, centered) {
  if (!(form instanceof HTMLFormElement)) {
    return null;
  }

  let feedback = form.querySelector(".form-feedback");

  if (!(feedback instanceof HTMLElement)) {
    feedback = document.createElement("p");
    feedback.className = centered ? "form-feedback form-feedback--center" : "form-feedback";
    feedback.hidden = true;
    feedback.setAttribute("aria-live", "polite");
    form.appendChild(feedback);
  }

  return feedback;
}

function setFormFeedback(element, message, state) {
  if (!(element instanceof HTMLElement)) {
    return;
  }

  element.textContent = message || "";
  element.hidden = !message;

  if (message && state) {
    element.dataset.state = state;
  } else {
    delete element.dataset.state;
  }
}

function setButtonLoadingState(button, isLoading, idleLabel, loadingLabel) {
  if (!(button instanceof HTMLButtonElement)) {
    return;
  }

  button.disabled = isLoading;
  button.textContent = isLoading ? loadingLabel : idleLabel;
}

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

function initRequestModalV2() {
  const modal = document.querySelector("[data-request-modal]");
  if (!(modal instanceof HTMLElement)) return;

  const dialog = modal.querySelector(".request-modal__dialog");
  const openButtons = document.querySelectorAll("[data-open-request-modal]");
  const closeButtons = modal.querySelectorAll("[data-request-close]");
  const form = modal.querySelector(".request-form");
  const successBlock = modal.querySelector("[data-request-success]");
  const successCloseButton = modal.querySelector("[data-request-success-close]");
  const submitButton = form?.querySelector(".request-form__submit");
  const feedback = ensureFormFeedback(form, false);
  const nameInput = modal.querySelector('input[name="name"]');
  const phoneInput = modal.querySelector('input[name="phone"]');
  const agreeInput = modal.querySelector('input[name="agree"]');
  const messageInput = modal.querySelector('textarea[name="message"]');
  const messageCounter = modal.querySelector("[data-message-counter]");

  let lastFocusedTrigger = null;

  if (!(dialog instanceof HTMLElement) || !(form instanceof HTMLFormElement) || !openButtons.length) {
    return;
  }

  if (nameInput instanceof HTMLInputElement) {
    nameInput.addEventListener("input", () => {
      nameInput.value = sanitizePersonName(nameInput.value);
    });
  }

  if (messageInput instanceof HTMLTextAreaElement && messageCounter instanceof HTMLElement) {
    const maxLength = Number(messageInput.getAttribute("maxlength")) || 500;

    function updateMessageCounter() {
      messageCounter.textContent = `${messageInput.value.length} \u0438\u0437 ${maxLength} \u0441\u0438\u043C\u0432\u043E\u043B\u043E\u0432`;
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

  function setSuccessState(isSuccess) {
    modal.classList.toggle("is-success", isSuccess);

    if (successBlock instanceof HTMLElement) {
      successBlock.hidden = !isSuccess;
    }
  }

  function isSuccessState() {
    return modal.classList.contains("is-success");
  }

  function resetUiState() {
    setFormFeedback(feedback, "", "");
    setButtonLoadingState(
      submitButton,
      false,
      "\u041E\u0442\u043F\u0440\u0430\u0432\u0438\u0442\u044C \u0437\u0430\u044F\u0432\u043A\u0443",
      "\u041E\u0442\u043F\u0440\u0430\u0432\u043B\u044F\u0435\u043C..."
    );
  }

  function canRestoreFocus(element) {
    return (
      element instanceof HTMLElement &&
      element.isConnected &&
      !element.hasAttribute("disabled") &&
      element.offsetParent !== null
    );
  }

  function openModal() {
    setSuccessState(false);
    resetUiState();
    modal.hidden = false;
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("is-modal-open");
    syncBodyScrollLock();

    requestAnimationFrame(() => {
      const targetField = nameInput || phoneInput || modal.querySelector("button");
      targetField?.focus();
    });
  }

  function closeModal() {
    const activeElement = document.activeElement;

    if (activeElement instanceof HTMLElement && modal.contains(activeElement)) {
      activeElement.blur();
    }

    setSuccessState(false);
    resetUiState();
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
    button.addEventListener("click", closeModal);
  });

  if (successCloseButton instanceof HTMLButtonElement) {
    successCloseButton.addEventListener("click", closeModal);
  }

  modal.addEventListener("click", (event) => {
    if (event.target === modal && !isSuccessState()) {
      closeModal();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !modal.hidden && !isSuccessState()) {
      closeModal();
    }
  });

  dialog.addEventListener("click", (event) => {
    event.stopPropagation();
  });

  if (phoneInput instanceof HTMLInputElement) {
    phoneInput.addEventListener("input", () => {
      phoneInput.value = formatRussianPhone(phoneInput.value);
    });
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const serviceInput = form.elements.namedItem("service");
    const nameValue = nameInput instanceof HTMLInputElement ? nameInput.value.trim() : "";
    const phoneDigits = phoneInput instanceof HTMLInputElement ? phoneInput.value.replace(/\D/g, "") : "";
    const serviceValue = serviceInput instanceof HTMLSelectElement ? serviceInput.value.trim() : "";
    const messageValue = messageInput instanceof HTMLTextAreaElement ? messageInput.value.trim() : "";

    if (nameInput instanceof HTMLInputElement) {
      nameInput.setCustomValidity("");
    }

    if (phoneInput instanceof HTMLInputElement) {
      phoneInput.setCustomValidity("");
    }

    if (agreeInput instanceof HTMLInputElement) {
      agreeInput.setCustomValidity("");
    }

    setFormFeedback(feedback, "", "");

    if (!isValidPersonName(nameValue)) {
      if (nameInput instanceof HTMLInputElement) {
        nameInput.setCustomValidity(
          "\u0412\u0432\u0435\u0434\u0438\u0442\u0435 \u0438\u043C\u044F \u0442\u043E\u043B\u044C\u043A\u043E \u0431\u0443\u043A\u0432\u0430\u043C\u0438, \u0431\u0435\u0437 \u0446\u0438\u0444\u0440."
        );
        nameInput.focus();
        nameInput.reportValidity();
      }
      return;
    }

    if (phoneDigits.length !== 11) {
      if (phoneInput instanceof HTMLInputElement) {
        phoneInput.setCustomValidity(
          "\u0412\u0432\u0435\u0434\u0438\u0442\u0435 \u043A\u043E\u0440\u0440\u0435\u043A\u0442\u043D\u044B\u0439 \u043D\u043E\u043C\u0435\u0440 \u0442\u0435\u043B\u0435\u0444\u043E\u043D\u0430."
        );
        phoneInput.focus();
        phoneInput.reportValidity();
      }
      return;
    }

    if (!(agreeInput instanceof HTMLInputElement) || !agreeInput.checked) {
      if (agreeInput instanceof HTMLInputElement) {
        agreeInput.setCustomValidity(
          "\u041D\u0443\u0436\u043D\u043E \u0434\u0430\u0442\u044C \u0441\u043E\u0433\u043B\u0430\u0441\u0438\u0435 \u043D\u0430 \u043E\u0431\u0440\u0430\u0431\u043E\u0442\u043A\u0443 \u0434\u0430\u043D\u043D\u044B\u0445."
        );
        agreeInput.focus();
        agreeInput.reportValidity();
      }
      return;
    }

    try {
      setButtonLoadingState(
        submitButton,
        true,
        "\u041E\u0442\u043F\u0440\u0430\u0432\u0438\u0442\u044C \u0437\u0430\u044F\u0432\u043A\u0443",
        "\u041E\u0442\u043F\u0440\u0430\u0432\u043B\u044F\u0435\u043C..."
      );
      setFormFeedback(
        feedback,
        "\u041E\u0442\u043F\u0440\u0430\u0432\u043B\u044F\u0435\u043C \u0437\u0430\u044F\u0432\u043A\u0443...",
        "pending"
      );

      await submitLead({
        type: "request",
        name: nameValue,
        phone: phoneInput instanceof HTMLInputElement ? phoneInput.value : "",
        service: serviceValue,
        message: messageValue,
        page: window.location.pathname,
        source: "request-modal",
      });

      form.reset();

      if (messageInput instanceof HTMLTextAreaElement && messageCounter instanceof HTMLElement) {
        const maxLength = Number(messageInput.getAttribute("maxlength")) || 500;
        messageCounter.textContent = `0 \u0438\u0437 ${maxLength} \u0441\u0438\u043C\u0432\u043E\u043B\u043E\u0432`;
      }

      resetUiState();
      setSuccessState(true);
      successCloseButton?.focus();
    } catch (error) {
      setButtonLoadingState(
        submitButton,
        false,
        "\u041E\u0442\u043F\u0440\u0430\u0432\u0438\u0442\u044C \u0437\u0430\u044F\u0432\u043A\u0443",
        "\u041E\u0442\u043F\u0440\u0430\u0432\u043B\u044F\u0435\u043C..."
      );
      setFormFeedback(
        feedback,
        error instanceof Error
          ? error.message
          : "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u043E\u0442\u043F\u0440\u0430\u0432\u0438\u0442\u044C \u0437\u0430\u044F\u0432\u043A\u0443. \u041F\u043E\u043F\u0440\u043E\u0431\u0443\u0439\u0442\u0435 \u0435\u0449\u0435 \u0440\u0430\u0437.",
        "error"
      );
    }
  });
}

function initCouponModal() {
  const modal = document.querySelector("[data-coupon-modal]");
  if (!(modal instanceof HTMLElement)) return;

  const dialog = modal.querySelector(".coupon-modal__dialog");
  const closeButtons = modal.querySelectorAll("[data-coupon-close]");
  const form = modal.querySelector(".coupon-form");
  const successBlock = modal.querySelector("[data-coupon-success]");
  const successCloseButton = modal.querySelector("[data-coupon-success-close]");
  const nameInput = modal.querySelector('input[name="couponName"]');
  const phoneInput = modal.querySelector('input[name="couponPhone"]');
  const submitButton = form?.querySelector(".coupon-form__submit");
  const feedback = ensureFormFeedback(form, true);

  if (
    !(dialog instanceof HTMLElement) ||
    !(form instanceof HTMLFormElement) ||
    !(nameInput instanceof HTMLInputElement) ||
    !(phoneInput instanceof HTMLInputElement)
  ) {
    return;
  }

  const SESSION_START_KEY = "gorcomfortCouponSessionStart";
  const SESSION_SHOWN_KEY = "gorcomfortCouponShown";
  const SHOW_DELAY_MS = 60000;

  function isMobileMenuOpen() {
    const mobileMenu = document.getElementById("mobileMenu");
    return Boolean(mobileMenu && mobileMenu.classList.contains("is-open"));
  }

  function isRequestModalOpen() {
    const requestModal = document.querySelector("[data-request-modal]");
    return Boolean(requestModal && !requestModal.hidden);
  }

  function syncBodyScrollLock() {
    if (isMobileMenuOpen() || isRequestModalOpen() || !modal.hidden) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
  }

  function setSuccessState(isSuccess) {
    modal.classList.toggle("is-success", isSuccess);

    if (successBlock instanceof HTMLElement) {
      successBlock.hidden = !isSuccess;
    }

    form.hidden = isSuccess;
  }

  function isSuccessState() {
    return modal.classList.contains("is-success");
  }

  function resetUiState() {
    nameInput.setCustomValidity("");
    phoneInput.setCustomValidity("");
    setFormFeedback(feedback, "", "");
    setButtonLoadingState(
      submitButton,
      false,
      "\u041F\u043E\u043B\u0443\u0447\u0438\u0442\u044C \u043A\u0443\u043F\u043E\u043D",
      "\u0411\u0440\u043E\u043D\u0438\u0440\u0443\u0435\u043C..."
    );
  }

  function openModal() {
    setSuccessState(false);
    resetUiState();
    modal.hidden = false;
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("is-modal-open");
    sessionStorage.setItem(SESSION_SHOWN_KEY, "true");
    syncBodyScrollLock();

    requestAnimationFrame(() => {
      nameInput.focus();
    });
  }

  function closeModal() {
    const activeElement = document.activeElement;

    if (activeElement instanceof HTMLElement && modal.contains(activeElement)) {
      activeElement.blur();
    }

    setSuccessState(false);
    resetUiState();
    modal.hidden = true;
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("is-modal-open");
    syncBodyScrollLock();
  }

  function scheduleModal() {
    if (sessionStorage.getItem(SESSION_SHOWN_KEY) === "true") {
      return;
    }

    const now = Date.now();
    const startedAt = Number(sessionStorage.getItem(SESSION_START_KEY)) || now;

    if (!sessionStorage.getItem(SESSION_START_KEY)) {
      sessionStorage.setItem(SESSION_START_KEY, String(now));
    }

    const remaining = Math.max(0, SHOW_DELAY_MS - (now - startedAt));

    window.setTimeout(() => {
      if (sessionStorage.getItem(SESSION_SHOWN_KEY) === "true") {
        return;
      }

      if (document.hidden || isRequestModalOpen()) {
        window.setTimeout(scheduleModal, 5000);
        return;
      }

      openModal();
    }, remaining);
  }

  nameInput.addEventListener("input", () => {
    nameInput.value = sanitizePersonName(nameInput.value);
  });

  phoneInput.addEventListener("input", () => {
    phoneInput.value = formatRussianPhone(phoneInput.value);
  });

  closeButtons.forEach((button) => {
    button.addEventListener("click", closeModal);
  });

  if (successCloseButton instanceof HTMLButtonElement) {
    successCloseButton.addEventListener("click", closeModal);
  }

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !modal.hidden && !isSuccessState()) {
      closeModal();
    }
  });

  dialog.addEventListener("click", (event) => {
    event.stopPropagation();
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const nameValue = nameInput.value.trim();
    const phoneDigits = phoneInput.value.replace(/\D/g, "");

    resetUiState();

    if (!isValidPersonName(nameValue)) {
      nameInput.setCustomValidity(
        "\u0412\u0432\u0435\u0434\u0438\u0442\u0435 \u0438\u043C\u044F \u0442\u043E\u043B\u044C\u043A\u043E \u0431\u0443\u043A\u0432\u0430\u043C\u0438, \u0431\u0435\u0437 \u0446\u0438\u0444\u0440."
      );
      nameInput.reportValidity();
      nameInput.focus();
      return;
    }

    if (phoneDigits.length !== 11) {
      phoneInput.setCustomValidity(
        "\u0412\u0432\u0435\u0434\u0438\u0442\u0435 \u043A\u043E\u0440\u0440\u0435\u043A\u0442\u043D\u044B\u0439 \u043D\u043E\u043C\u0435\u0440 \u0442\u0435\u043B\u0435\u0444\u043E\u043D\u0430."
      );
      phoneInput.reportValidity();
      phoneInput.focus();
      return;
    }

    try {
      setButtonLoadingState(
        submitButton,
        true,
        "\u041F\u043E\u043B\u0443\u0447\u0438\u0442\u044C \u043A\u0443\u043F\u043E\u043D",
        "\u0411\u0440\u043E\u043D\u0438\u0440\u0443\u0435\u043C..."
      );
      setFormFeedback(
        feedback,
        "\u0411\u0440\u043E\u043D\u0438\u0440\u0443\u0435\u043C \u0441\u043A\u0438\u0434\u043A\u0443...",
        "pending"
      );

      await submitLead({
        type: "coupon",
        name: nameValue,
        phone: phoneInput.value,
        service: "\u0421\u043A\u0438\u0434\u043A\u0430 1000 \u0440\u0443\u0431\u043B\u0435\u0439 \u043D\u0430 \u043C\u043E\u043D\u0442\u0430\u0436",
        message: "",
        page: window.location.pathname,
        source: "coupon-modal",
      });

      form.reset();
      resetUiState();
      setSuccessState(true);
      successCloseButton?.focus();
    } catch (error) {
      setButtonLoadingState(
        submitButton,
        false,
        "\u041F\u043E\u043B\u0443\u0447\u0438\u0442\u044C \u043A\u0443\u043F\u043E\u043D",
        "\u0411\u0440\u043E\u043D\u0438\u0440\u0443\u0435\u043C..."
      );
      setFormFeedback(
        feedback,
        error instanceof Error
          ? error.message
          : "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0437\u0430\u0431\u0440\u043E\u043D\u0438\u0440\u043E\u0432\u0430\u0442\u044C \u0441\u043A\u0438\u0434\u043A\u0443. \u041F\u043E\u043F\u0440\u043E\u0431\u0443\u0439\u0442\u0435 \u0435\u0449\u0435 \u0440\u0430\u0437.",
        "error"
      );
    }
  });

  scheduleModal();
}

function initRequestModal() {
  const modal = document.querySelector("[data-request-modal]");
  if (!modal) return;

  const dialog = modal.querySelector(".request-modal__dialog");
  const openButtons = document.querySelectorAll("[data-open-request-modal]");
  const closeButtons = modal.querySelectorAll("[data-request-close]");
  const form = modal.querySelector(".request-form");
  const successBlock = modal.querySelector("[data-request-success]");
  const successCloseButton = modal.querySelector("[data-request-success-close]");

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

  function setSuccessState(isSuccess) {
    modal.classList.toggle("is-success", isSuccess);

    if (successBlock) {
      successBlock.hidden = !isSuccess;
    }
  }

  function isSuccessState() {
    return modal.classList.contains("is-success");
  }

  function openModal() {
    setSuccessState(false);
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

    setSuccessState(false);
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

  if (successCloseButton) {
    successCloseButton.addEventListener("click", () => {
      closeModal();
    });
  }

  modal.addEventListener("click", (event) => {
    if (event.target === modal && !isSuccessState()) {
      closeModal();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !modal.hidden && !isSuccessState()) {
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

  setSuccessState(true);
  successCloseButton?.focus();
  return;
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

function initAcCalculator() {
  const form = document.querySelector("[data-ac-calculator]");
  const result = document.querySelector("[data-ac-result]");
  const resultContent = document.querySelector("[data-ac-result-content]");

  if (
    !(form instanceof HTMLFormElement) ||
    !(result instanceof HTMLElement) ||
    !(resultContent instanceof HTMLElement)
  ) {
    return;
  }

  const modelOutput = result.querySelector("[data-ac-result-model]");
  const summaryOutput = result.querySelector("[data-ac-result-summary]");
  const coolingOutput = result.querySelector("[data-ac-result-cooling]");
  const heatOutput = result.querySelector("[data-ac-result-heat]");
  const listOutput = result.querySelector("[data-ac-result-list]");

  if (
    !(modelOutput instanceof HTMLElement) ||
    !(summaryOutput instanceof HTMLElement) ||
    !(coolingOutput instanceof HTMLElement) ||
    !(heatOutput instanceof HTMLElement) ||
    !(listOutput instanceof HTMLElement)
  ) {
    return;
  }

  const modelScale = [
    { code: "07", coolingKw: 2.1, btu: 7000 },
    { code: "09", coolingKw: 2.6, btu: 9000 },
    { code: "12", coolingKw: 3.5, btu: 12000 },
    { code: "18", coolingKw: 5.3, btu: 18000 },
    { code: "24", coolingKw: 7.0, btu: 24000 },
    { code: "28", coolingKw: 8.0, btu: 28000 },
    { code: "36", coolingKw: 10.6, btu: 36000 },
  ];

  const sunlightFactors = {
    shade: 0.95,
    normal: 1,
    sunny: 1.15,
  };

  const roomFactors = {
    bedroom: 0.95,
    living: 1,
    kids: 1,
    office: 1.1,
    kitchen: 1.18,
    shop: 1.2,
    server: 1.55,
    other: 1,
  };

  const windowFactors = {
    small: 0.98,
    medium: 1.04,
    large: 1.12,
  };

  const insulationFactors = {
    good: 0.95,
    normal: 1,
    weak: 1.12,
  };

  const equipmentHeat = {
    low: 0.15,
    medium: 0.35,
    high: 0.7,
    extreme: 1.4,
  };

  const roomLabels = {
    bedroom: "спальни",
    living: "гостиной",
    kids: "детской",
    office: "офиса",
    kitchen: "кухни",
    shop: "магазина или салона",
    server: "серверной",
    other: "помещения",
  };

  function formatKw(value) {
    return new Intl.NumberFormat("ru-RU", {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(value);
  }

  function resetValidity(elements) {
    elements.forEach((element) => {
      if (element instanceof HTMLInputElement || element instanceof HTMLSelectElement) {
        element.setCustomValidity("");
      }
    });
  }

  function getNumericValue(name) {
    const field = form.elements.namedItem(name);
    if (!(field instanceof HTMLInputElement)) return 0;
    return Number(field.value);
  }

  function getSelectValue(name) {
    const field = form.elements.namedItem(name);
    if (!(field instanceof HTMLSelectElement)) return "";
    return field.value;
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const areaField = form.elements.namedItem("area");
    const heightField = form.elements.namedItem("height");
    const sunlightField = form.elements.namedItem("sunlight");
    const roomTypeField = form.elements.namedItem("roomType");
    const peopleField = form.elements.namedItem("people");
    const windowsField = form.elements.namedItem("windows");
    const insulationField = form.elements.namedItem("insulation");
    const equipmentField = form.elements.namedItem("equipment");

    const requiredFields = [
      areaField,
      heightField,
      sunlightField,
      roomTypeField,
      peopleField,
      windowsField,
      insulationField,
      equipmentField,
    ];

    resetValidity(requiredFields);

    const area = getNumericValue("area");
    const height = getNumericValue("height");
    const people = getNumericValue("people");
    const sunlight = getSelectValue("sunlight");
    const roomType = getSelectValue("roomType");
    const windows = getSelectValue("windows");
    const insulation = getSelectValue("insulation");
    const equipment = getSelectValue("equipment");

    if (area <= 0 && areaField instanceof HTMLInputElement) {
      areaField.setCustomValidity("Укажите площадь помещения.");
      areaField.reportValidity();
      areaField.focus();
      return;
    }

    if (height <= 0 && heightField instanceof HTMLInputElement) {
      heightField.setCustomValidity("Укажите высоту потолка.");
      heightField.reportValidity();
      heightField.focus();
      return;
    }

    if (!sunlight && sunlightField instanceof HTMLSelectElement) {
      sunlightField.setCustomValidity("Выберите солнечную сторону.");
      sunlightField.reportValidity();
      sunlightField.focus();
      return;
    }

    if (!roomType && roomTypeField instanceof HTMLSelectElement) {
      roomTypeField.setCustomValidity("Выберите тип помещения.");
      roomTypeField.reportValidity();
      roomTypeField.focus();
      return;
    }

    if (people <= 0 && peopleField instanceof HTMLInputElement) {
      peopleField.setCustomValidity("Укажите количество людей.");
      peopleField.reportValidity();
      peopleField.focus();
      return;
    }

    if (!windows && windowsField instanceof HTMLSelectElement) {
      windowsField.setCustomValidity("Выберите вариант остекления.");
      windowsField.reportValidity();
      windowsField.focus();
      return;
    }

    if (!insulation && insulationField instanceof HTMLSelectElement) {
      insulationField.setCustomValidity("Выберите теплоизоляцию помещения.");
      insulationField.reportValidity();
      insulationField.focus();
      return;
    }

    if (!equipment && equipmentField instanceof HTMLSelectElement) {
      equipmentField.setCustomValidity("Выберите уровень тепловыделений.");
      equipmentField.reportValidity();
      equipmentField.focus();
      return;
    }

    const baseHeatKw = area * height * 0.035;
    const adjustedEnvelopeHeatKw =
      baseHeatKw *
      sunlightFactors[sunlight] *
      roomFactors[roomType] *
      windowFactors[windows] *
      insulationFactors[insulation];
    const peopleHeatKw = people * 0.13;
    const equipmentLoadKw = equipmentHeat[equipment];
    const totalHeatKw = adjustedEnvelopeHeatKw + peopleHeatKw + equipmentLoadKw;
    const recommendedCoolingKw = totalHeatKw * 1.12;

    const selectedModel =
      modelScale.find((model) => model.coolingKw >= recommendedCoolingKw) ||
      modelScale[modelScale.length - 1];

    const needsExtendedSelection =
      recommendedCoolingKw > modelScale[modelScale.length - 1].coolingKw;

    modelOutput.textContent = needsExtendedSelection
      ? "Нужен индивидуальный подбор полупромышленной системы"
      : `Подойдет кондиционер класса ${selectedModel.code}`;

    summaryOutput.textContent = needsExtendedSelection
      ? `Расчет показывает высокую нагрузку для ${roomLabels[roomType]}. Лучше ориентироваться на индивидуальный подбор мульти-сплит или полупромышленного решения.`
      : `Для ${roomLabels[roomType]} площадью ${formatKw(area)} м² рекомендуем ориентироваться на систему с запасом по холоду не ниже ${formatKw(selectedModel.coolingKw)} кВт.`;

    coolingOutput.textContent = needsExtendedSelection
      ? `от ${selectedModel.btu.toLocaleString("ru-RU")} BTU / ${formatKw(recommendedCoolingKw)} кВт`
      : `${selectedModel.btu.toLocaleString("ru-RU")} BTU / ${formatKw(selectedModel.coolingKw)} кВт`;

    heatOutput.textContent = `${formatKw(totalHeatKw)} кВт`;

    listOutput.innerHTML = "";

    [
      `Базовая нагрузка по объему помещения: ${formatKw(baseHeatKw)} кВт.`,
      `С учетом солнца, типа помещения, окон и теплоизоляции: ${formatKw(adjustedEnvelopeHeatKw)} кВт.`,
      `Тепло от людей и техники: ${formatKw(peopleHeatKw + equipmentLoadKw)} кВт.`,
      `Рекомендуемый запас по холоду: ${formatKw(recommendedCoolingKw)} кВт.`,
    ].forEach((text) => {
      const item = document.createElement("li");
      item.textContent = text;
      listOutput.appendChild(item);
    });

    result.hidden = false;
    resultContent.hidden = false;
  });
}
