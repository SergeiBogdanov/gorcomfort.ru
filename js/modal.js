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
    const target = event.target instanceof Element ? event.target : null;

    if (!target || isSuccessState()) {
      return;
    }

    if (target.closest("[data-request-close]")) {
      closeModal();
      return;
    }

    if (target === modal) {
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
  const feedback = ensureFormFeedback(form, true, ".coupon-form__policy");

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


