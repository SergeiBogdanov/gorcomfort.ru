document.addEventListener("DOMContentLoaded", () => {
  initMenu();
  initWorksSlider();
  initFaq();
  initRequestModalV2();
  initCouponModal();
  initQuoteCartBar();
  initAcCalculator();
  initUsefulArticles();
  initShopCatalog();
  initAnchorScroll();
});

function initQuoteCartBar() {
  const storageKey = "gorcomfortQuoteCart";
  const duplicateKey = "gorcomfortQuoteCartLastLead";
  const limitFlagKey = "gorcomfortQuoteCartLimitHit";
  const maxItems = 10;
  const duplicateCooldownMs = 5 * 60 * 1000;
  const body = document.body;

  if (!(body instanceof HTMLBodyElement)) {
    return;
  }

  let cartModal = null;
  let cartBar = null;
  let successToastTimeout = 0;
  let lastFocusedTrigger = null;
  let isCartModalOpen = false;

  function safeParseCart(value) {
    if (!value) return [];

    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function formatPrice(price, currency = "RUB") {
    return new Intl.NumberFormat("ru-RU", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(Number(price) || 0);
  }

  function normalizeCartItem(item) {
    return {
      id: item?.id || "",
      title: item?.title || "Товар",
      price: Number(item?.price) || 0,
      currency: item?.currency || "RUB",
      image:
        typeof item?.image === "string" && item.image.trim()
          ? item.image
          : "./assets/images/products/_defaults/conditioner-placeholder.svg",
      imageAlt:
        typeof item?.imageAlt === "string" && item.imageAlt.trim()
          ? item.imageAlt
          : item?.title || "Фотография товара",
      description:
        typeof item?.description === "string" && item.description.trim() ? item.description : "",
      quantity: Math.max(1, Number(item?.quantity) || 1),
    };
  }

  function readCart() {
    return safeParseCart(window.localStorage.getItem(storageKey))
      .map(normalizeCartItem)
      .filter((item) => item.id);
  }

  function writeCart(cart) {
    window.localStorage.setItem(
      storageKey,
      JSON.stringify((Array.isArray(cart) ? cart : []).map(normalizeCartItem))
    );
  }

  function getItemsCount(cart) {
    return cart.reduce((sum, item) => sum + Math.max(1, Number(item.quantity) || 1), 0);
  }

  function getItemsSum(cart) {
    return cart.reduce(
      (sum, item) => sum + (Number(item.price) || 0) * Math.max(1, Number(item.quantity) || 1),
      0
    );
  }

  function setLimitWarningState(isVisible) {
    if (isVisible) {
      window.sessionStorage.setItem(limitFlagKey, "true");
    } else {
      window.sessionStorage.removeItem(limitFlagKey);
    }
  }

  function isLimitWarningVisible() {
    return window.sessionStorage.getItem(limitFlagKey) === "true";
  }

  function canAddUnits(cart, delta) {
    return getItemsCount(cart) + delta <= maxItems;
  }

  function dispatchCartUpdated() {
    document.dispatchEvent(new CustomEvent("quote-cart-updated"));
  }

  function isMobileMenuOpen() {
    const mobileMenu = document.getElementById("mobileMenu");
    return Boolean(mobileMenu && mobileMenu.classList.contains("is-open"));
  }

  function isRequestModalOpen() {
    const requestModal = document.querySelector("[data-request-modal]");
    return requestModal instanceof HTMLElement && !requestModal.hidden;
  }

  function isCouponModalOpen() {
    const couponModal = document.querySelector("[data-coupon-modal]");
    return couponModal instanceof HTMLElement && !couponModal.hidden;
  }

  function isProductModalOpen() {
    const productModal = document.querySelector("[data-product-modal]");
    return productModal instanceof HTMLElement && !productModal.hidden;
  }

  function syncCartBodyScrollLock() {
    syncBodyScrollLock("quote-cart-modal", isCartModalOpen);
  }

  function getSuccessToast() {
    let toast = document.querySelector("[data-quote-cart-toast]");

    if (toast instanceof HTMLElement) {
      return toast;
    }

    toast = document.createElement("div");
    toast.className = "quote-cart-toast";
    toast.hidden = true;
    toast.setAttribute("data-quote-cart-toast", "");
    toast.setAttribute("role", "status");
    toast.setAttribute("aria-live", "polite");
    toast.innerHTML = `
      <div class="quote-cart-toast__inner">
        <div class="quote-cart-toast__icon" aria-hidden="true">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M20 6L9 17L4 12" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"></path>
          </svg>
        </div>
        <div class="quote-cart-toast__copy">
          <p class="quote-cart-toast__title">Заявка отправлена</p>
          <p class="quote-cart-toast__text">Мы получили ваш список товаров и скоро свяжемся с вами.</p>
        </div>
      </div>
    `;

    body.appendChild(toast);
    return toast;
  }

  function showSuccessToast() {
    const toast = getSuccessToast();
    toast.hidden = false;
    toast.classList.add("is-visible");

    window.clearTimeout(successToastTimeout);
    successToastTimeout = window.setTimeout(() => {
      toast.classList.remove("is-visible");
      window.setTimeout(() => {
        toast.hidden = true;
      }, 220);
    }, 4200);
  }

  function ensureCartBar() {
    let bar = document.querySelector("[data-quote-cart-bar]");

    if (bar instanceof HTMLElement) {
      return bar;
    }

    bar = document.createElement("aside");
    bar.className = "quote-cart-bar";
    bar.hidden = true;
    bar.setAttribute("data-quote-cart-bar", "");
    bar.innerHTML = `
      <div class="quote-cart-bar__inner">
        <button class="quote-cart-bar__close" type="button" aria-label="Очистить список товаров" data-quote-cart-clear>
          <span aria-hidden="true">×</span>
        </button>
        <div class="quote-cart-bar__summary">
          <span class="quote-cart-bar__label">Товаров добавлено:</span>
          <strong class="quote-cart-bar__count" data-quote-cart-count>0</strong>
          <span class="quote-cart-bar__warning" data-quote-cart-warning hidden>У вас максимальное количество товаров</span>
        </div>
        <div class="quote-cart-bar__actions">
          <button class="button button--white quote-cart-bar__button" type="button" data-quote-cart-open>
            Посмотреть товары
          </button>
        </div>
      </div>
    `;

    body.appendChild(bar);

    const clearButton = bar.querySelector("[data-quote-cart-clear]");
    clearButton?.addEventListener("click", () => {
      setLimitWarningState(false);
      writeCart([]);
      renderAllCartUi();
      dispatchCartUpdated();
    });

    bar.addEventListener("click", (event) => {
      const target = event.target instanceof Element ? event.target : null;

      if (target?.closest("[data-quote-cart-clear]")) {
        setLimitWarningState(false);
        writeCart([]);
        renderAllCartUi();
        dispatchCartUpdated();
      }
    });

    const openButton = bar.querySelector("[data-quote-cart-open]");
    openButton?.addEventListener("click", () => {
      lastFocusedTrigger = openButton;
      openCartModal(false);
    });


    return bar;
  }

  function ensureCartModal() {
    if (cartModal instanceof HTMLElement) {
      return cartModal;
    }

    const modal = document.createElement("section");
    modal.className = "modal modal--cart quote-cart-modal";
    modal.hidden = true;
    modal.setAttribute("data-quote-cart-modal", "");
    modal.setAttribute("aria-hidden", "true");
    modal.innerHTML = `
      <div class="modal__overlay quote-cart-modal__overlay" data-quote-cart-modal-close></div>
      <div class="modal__dialog quote-cart-modal__dialog" role="dialog" aria-modal="true" aria-labelledby="quote-cart-title">
        <button class="modal__close quote-cart-modal__close" type="button" aria-label="Закрыть корзину" data-quote-cart-modal-close>
          <span aria-hidden="true">×</span>
        </button>
        <div class="modal__content quote-cart-modal__content">
          <div class="quote-cart-modal__header">
            <div class="quote-cart-modal__header-main">
              <div class="quote-cart-modal__heading">
                <h2 class="quote-cart-modal__title" id="quote-cart-title">Корзина</h2>
                <p class="quote-cart-modal__summary" data-quote-cart-total-count>Всего товаров: <span class="quote-cart-modal__summary-count">0</span></p>
              </div>
            </div>
            <p class="quote-cart-modal__warning" data-quote-cart-limit-warning hidden>
              Вы выбрали максимальное количество товаров для заявки
            </p>
          </div>
          <div class="quote-cart-modal__body">
            <div class="quote-cart-modal__items" data-quote-cart-items></div>
            <div class="quote-cart-modal__footer">
              <div class="quote-cart-modal__total-row">
                <span class="quote-cart-modal__total-label">Всего товаров на сумму:</span>
                <strong class="quote-cart-modal__total-value" data-quote-cart-total-sum>0 ₽</strong>
              </div>
              <form class="request-form quote-cart-form" data-quote-cart-form novalidate>
                <div class="grid grid--form grid--gap-md request-form__grid">
                  <label class="form-field request-form__field">
                    <span class="form-label request-form__label">Имя</span>
                    <input class="form-input request-form__input" type="text" name="cartName" autocomplete="name" placeholder="Как к вам обращаться" required />
                  </label>
                  <label class="form-field request-form__field">
                    <span class="form-label request-form__label">Телефон</span>
                    <input class="form-input request-form__input" type="tel" name="cartPhone" autocomplete="tel" inputmode="tel" placeholder="+7 (___) ___-__-__" required />
                  </label>
                </div>
                <div class="request-form__bottom quote-cart-form__bottom">
                  <label class="request-form__agree">
                    <input class="request-form__checkbox" type="checkbox" name="cartAgree" required />
                    <span class="request-form__agree-text">Согласие на обработку персональных данных</span>
                  </label>
                  <div class="request-form__actions quote-cart-form__actions">
                    <button class="button button--orange button--full request-form__submit quote-cart-form__submit" type="submit" data-quote-cart-submit>
                      Отправить заявку
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    `;

    body.appendChild(modal);
    cartModal = modal;

    const closeButtons = modal.querySelectorAll("[data-quote-cart-modal-close]");
    closeButtons.forEach((button) => {
      button.addEventListener("click", closeCartModal);
    });

    modal.addEventListener("click", (event) => {
      const target = event.target instanceof Element ? event.target : null;

      if (target?.closest("[data-quote-cart-modal-close]")) {
        closeCartModal();
      }
    });

    const dialog = modal.querySelector(".quote-cart-modal__dialog");
    dialog?.addEventListener("click", (event) => {
      event.stopPropagation();
    });

    const itemsContainer = modal.querySelector("[data-quote-cart-items]");
    itemsContainer?.addEventListener("click", (event) => {
      const target = event.target instanceof Element ? event.target : null;
      if (!target) return;

      const itemElement = target.closest("[data-quote-cart-item]");
      if (!(itemElement instanceof HTMLElement)) return;

      const itemId = itemElement.dataset.quoteCartItem || "";
      if (!itemId) return;

      if (target.closest("[data-quote-cart-remove]")) {
        removeItem(itemId);
        return;
      }

      if (target.closest("[data-quote-cart-decrement]")) {
        changeItemQuantity(itemId, -1);
        return;
      }

      if (target.closest("[data-quote-cart-increment]")) {
        changeItemQuantity(itemId, 1);
      }
    });

    const form = modal.querySelector("[data-quote-cart-form]");
    const nameInput = modal.querySelector('input[name="cartName"]');
    const phoneInput = modal.querySelector('input[name="cartPhone"]');
    const agreeInput = modal.querySelector('input[name="cartAgree"]');

    if (nameInput instanceof HTMLInputElement) {
      nameInput.addEventListener("input", () => {
        nameInput.value = sanitizePersonName(nameInput.value);
        updateCartSubmitState();
      });
    }

    if (phoneInput instanceof HTMLInputElement) {
      phoneInput.addEventListener("input", () => {
        phoneInput.value = formatRussianPhone(phoneInput.value);
        updateCartSubmitState();
      });
    }

    if (agreeInput instanceof HTMLInputElement) {
      agreeInput.addEventListener("change", () => {
        agreeInput.setCustomValidity("");
        updateCartSubmitState();
      });
    }

    form?.addEventListener("submit", handleCartSubmit);
    return modal;
  }

  function getCartModalElements() {
    const modal = ensureCartModal();
    return {
      modal,
      totalCount: modal.querySelector("[data-quote-cart-total-count]"),
      totalSum: modal.querySelector("[data-quote-cart-total-sum]"),
      warning: modal.querySelector("[data-quote-cart-limit-warning]"),
      items: modal.querySelector("[data-quote-cart-items]"),
      form: modal.querySelector("[data-quote-cart-form]"),
      submitButton: modal.querySelector("[data-quote-cart-submit]"),
      nameInput: modal.querySelector('input[name="cartName"]'),
      phoneInput: modal.querySelector('input[name="cartPhone"]'),
      agreeInput: modal.querySelector('input[name="cartAgree"]'),
    };
  }

  function buildCartItemMarkup(item) {
    const lineTotal = formatPrice((Number(item.price) || 0) * Math.max(1, Number(item.quantity) || 1), item.currency);

    return `
      <article class="quote-cart-item" data-quote-cart-item="${escapeHtml(item.id)}">
        <div class="quote-cart-item__media">
          <img class="quote-cart-item__image" src="${escapeHtml(item.image)}" alt="${escapeHtml(item.imageAlt)}" />
        </div>
        <div class="quote-cart-item__content">
          <button class="quote-cart-item__remove" type="button" aria-label="Удалить товар" data-quote-cart-remove>
            <span aria-hidden="true">×</span>
          </button>
          <h3 class="quote-cart-item__title">${escapeHtml(item.title)}</h3>
          <p class="quote-cart-item__price">${escapeHtml(formatPrice(item.price, item.currency))}</p>
          ${item.description ? `<p class="quote-cart-item__text">${escapeHtml(item.description)}</p>` : ""}
          <div class="quote-cart-item__bottom">
            <div class="quote-cart-item__counter" aria-label="Количество товара">
              <button class="quote-cart-item__counter-button" type="button" data-quote-cart-decrement aria-label="Уменьшить количество">−</button>
              <span class="quote-cart-item__counter-value">${escapeHtml(item.quantity)}</span>
              <button class="quote-cart-item__counter-button" type="button" data-quote-cart-increment aria-label="Увеличить количество">+</button>
            </div>
            <strong class="quote-cart-item__sum"><span class="quote-cart-item__sum-label">Сумма:</span> <span class="quote-cart-item__sum-value">${escapeHtml(lineTotal)}</span></strong>
          </div>
        </div>
      </article>
    `;
  }

  function updateCartSubmitState() {
    const { form, submitButton, nameInput, phoneInput, agreeInput } = getCartModalElements();

    if (!(form instanceof HTMLFormElement) || !(submitButton instanceof HTMLButtonElement)) {
      return;
    }

    const cart = readCart();
    const isSubmitting = submitButton.dataset.loading === "true";

    submitButton.disabled = cart.length === 0 || isSubmitting;
  }

  function renderCartModal() {
    const { modal, totalCount, totalSum, warning, items, form } = getCartModalElements();
    const cart = readCart();
    const count = getItemsCount(cart);
    const sum = getItemsSum(cart);

    if (totalCount instanceof HTMLElement) {
      totalCount.innerHTML = `Всего товаров: <span class="quote-cart-modal__summary-count">${escapeHtml(count)}</span>`;
    }

    if (totalSum instanceof HTMLElement) {
      totalSum.textContent = formatPrice(sum);
    }

    if (warning instanceof HTMLElement) {
      warning.hidden = !isLimitWarningVisible();
    }

    if (items instanceof HTMLElement) {
      items.innerHTML = cart.map(buildCartItemMarkup).join("");
    }

    if (form instanceof HTMLFormElement) {
      form.hidden = cart.length === 0;
    }

    updateCartSubmitState();

    if (isCartModalOpen && count === 0) {
      closeCartModal(false);
    }

    if (modal instanceof HTMLElement) {
      modal.classList.toggle("is-empty", cart.length === 0);
    }
  }

  function renderCartBar() {
    const bar = ensureCartBar();
    const countElement = bar.querySelector("[data-quote-cart-count]");
    const warningElement = bar.querySelector("[data-quote-cart-warning]");
    const cart = readCart();
    const itemsCount = getItemsCount(cart);

    bar.hidden = itemsCount === 0 || isCartModalOpen;
    body.classList.toggle("has-quote-cart-bar", itemsCount > 0 && !isCartModalOpen);

    if (countElement instanceof HTMLElement) {
      countElement.textContent = String(itemsCount);
    }

    if (warningElement instanceof HTMLElement) {
      warningElement.hidden = itemsCount < maxItems;
    }
  }

  function renderAllCartUi() {
    renderCartBar();
    renderCartModal();
  }

  function removeItem(id) {
    const nextCart = readCart().filter((item) => item.id !== id);
    if (nextCart.length < maxItems) {
      setLimitWarningState(false);
    }
    writeCart(nextCart);
    renderAllCartUi();
    dispatchCartUpdated();
  }

  function changeItemQuantity(id, delta) {
    const cart = readCart();
    const item = cart.find((entry) => entry.id === id);

    if (!item) {
      return false;
    }

    if (delta > 0 && !canAddUnits(cart, delta)) {
      setLimitWarningState(true);
      renderAllCartUi();
      dispatchCartUpdated();
      return false;
    }

    item.quantity = Math.max(1, (Number(item.quantity) || 1) + delta);
    setLimitWarningState(false);
    writeCart(cart);
    renderAllCartUi();
    dispatchCartUpdated();
    return true;
  }

  function canRestoreFocus(element) {
    return (
      element instanceof HTMLElement &&
      element.isConnected &&
      !element.hasAttribute("disabled") &&
      element.offsetParent !== null
    );
  }

  function openCartModal(shouldFocusSubmit) {
    const modal = ensureCartModal();
    const { nameInput, submitButton } = getCartModalElements();

    if (getItemsCount(readCart()) === 0) {
      return;
    }

    isCartModalOpen = true;
    modal.hidden = false;
    modal.setAttribute("aria-hidden", "false");
    renderAllCartUi();
    syncCartBodyScrollLock();

    requestAnimationFrame(() => {
      if (shouldFocusSubmit && submitButton instanceof HTMLButtonElement) {
        submitButton.focus();
      } else if (nameInput instanceof HTMLInputElement && !nameInput.value.trim()) {
        nameInput.focus();
      } else {
        const firstInteractive = modal.querySelector("button, input");
        firstInteractive?.focus();
      }
    });
  }

  function closeCartModal(restoreFocus = true) {
    const modal = ensureCartModal();
    const activeElement = document.activeElement;

    if (activeElement instanceof HTMLElement && modal.contains(activeElement)) {
      activeElement.blur();
    }

    isCartModalOpen = false;
    modal.hidden = true;
    modal.setAttribute("aria-hidden", "true");
    renderCartBar();
    syncCartBodyScrollLock();

    if (restoreFocus && canRestoreFocus(lastFocusedTrigger)) {
      lastFocusedTrigger.focus();
    }
  }

  function getCartLeadSignature(payload) {
    return JSON.stringify({
      name: payload.name,
      phone: payload.phone,
      items: payload.items.map((item) => ({
        id: item.id,
        quantity: item.quantity,
        price: item.price,
      })),
      totalQuantity: payload.totalQuantity,
      totalSum: payload.totalSum,
    });
  }

  function isDuplicateLead(signature) {
    const value = window.sessionStorage.getItem(duplicateKey);
    if (!value) return false;

    try {
      const lastLead = JSON.parse(value);
      return (
        lastLead &&
        lastLead.signature === signature &&
        Date.now() - Number(lastLead.timestamp) < duplicateCooldownMs
      );
    } catch {
      return false;
    }
  }

  function rememberSuccessfulLead(signature) {
    window.sessionStorage.setItem(
      duplicateKey,
      JSON.stringify({
        signature,
        timestamp: Date.now(),
      })
    );
  }

  async function handleCartSubmit(event) {
    event.preventDefault();

    const { form, submitButton, nameInput, phoneInput, agreeInput } = getCartModalElements();

    if (
      !(form instanceof HTMLFormElement) ||
      !(submitButton instanceof HTMLButtonElement) ||
      !(nameInput instanceof HTMLInputElement) ||
      !(phoneInput instanceof HTMLInputElement) ||
      !(agreeInput instanceof HTMLInputElement)
    ) {
      return;
    }

    const feedback = ensureFormFeedback(form, false, ".quote-cart-form__bottom");
    const cart = readCart();
    const nameValue = nameInput.value.trim();
    const phoneValue = phoneInput.value;
    const phoneDigits = phoneValue.replace(/\D/g, "");

    nameInput.setCustomValidity("");
    phoneInput.setCustomValidity("");
    agreeInput.setCustomValidity("");
    setFormFeedback(feedback, "", "");

    if (submitButton.dataset.loading === "true") {
      return;
    }

    if (!cart.length) {
      setFormFeedback(feedback, "В корзине нет товаров для заявки.", "error");
      updateCartSubmitState();
      return;
    }

    if (!isValidPersonName(nameValue)) {
      nameInput.setCustomValidity("Введите имя только буквами, без цифр.");
      nameInput.reportValidity();
      nameInput.focus();
      updateCartSubmitState();
      return;
    }

    if (phoneDigits.length !== 11) {
      phoneInput.setCustomValidity("Введите корректный номер телефона.");
      phoneInput.reportValidity();
      phoneInput.focus();
      updateCartSubmitState();
      return;
    }

    if (!agreeInput.checked) {
      agreeInput.setCustomValidity("Нужно дать согласие на обработку данных.");
      agreeInput.reportValidity();
      agreeInput.focus();
      updateCartSubmitState();
      return;
    }

    const totalQuantity = getItemsCount(cart);
    const totalSum = getItemsSum(cart);
    const items = cart.map((item) => ({
      id: item.id,
      title: item.title,
      quantity: item.quantity,
      price: item.price,
      currency: item.currency,
    }));

    const payload = {
      type: "cart",
      name: nameValue,
      phone: phoneValue,
      service: "Покупка из магазина",
      message: items
        .map(
          (item, index) =>
            `${index + 1}. ${item.title} — ${item.quantity} шт. × ${formatPrice(item.price, item.currency)}`
        )
        .join("\n"),
      page: window.location.pathname,
      source: "quote-cart-modal",
      totalQuantity,
      totalSum,
      items,
    };

    const signature = getCartLeadSignature(payload);

    if (isDuplicateLead(signature)) {
      setFormFeedback(
        feedback,
        "Такая заявка уже была только что отправлена. Если нужно, немного измените состав товаров или подождите пару минут.",
        "error"
      );
      updateCartSubmitState();
      return;
    }

    submitButton.dataset.loading = "true";
    setButtonLoadingState(submitButton, true, "Отправить заявку", "Отправляем...");
    setFormFeedback(feedback, "Отправляем заявку...", "pending");
    updateCartSubmitState();

    try {
      await submitLead(payload);

      rememberSuccessfulLead(signature);
      form.reset();
      setLimitWarningState(false);
      writeCart([]);
      setFormFeedback(feedback, "", "");
      submitButton.dataset.loading = "false";
      setButtonLoadingState(submitButton, false, "Отправить заявку", "Отправляем...");
      closeCartModal(false);
      renderAllCartUi();
      dispatchCartUpdated();
      showSuccessToast();
    } catch (error) {
      submitButton.dataset.loading = "false";
      setButtonLoadingState(submitButton, false, "Отправить заявку", "Отправляем...");
      setFormFeedback(
        feedback,
        error instanceof Error
          ? error.message
          : "Не удалось отправить заявку. Попробуйте еще раз.",
        "error"
      );
      updateCartSubmitState();
    }
  }

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && isCartModalOpen) {
      closeCartModal();
    }
  });

  window.quoteCartApi = {
    addProduct(product) {
      if (!product || typeof product !== "object" || !product.id) {
        return false;
      }

      const cart = readCart();
      if (!canAddUnits(cart, 1)) {
        setLimitWarningState(true);
        renderAllCartUi();
        dispatchCartUpdated();
        return false;
      }

      const existingItem = cart.find((item) => item.id === product.id);

      if (existingItem) {
        existingItem.quantity = (Number(existingItem.quantity) || 1) + 1;
      } else {
        cart.push({
          id: product.id,
          title: product.title || "Товар",
          price: Number(product.price) || 0,
          currency: product.currency || "RUB",
          image:
            typeof product.image === "string" && product.image.trim()
              ? product.image
              : "./assets/images/products/_defaults/conditioner-placeholder.svg",
          imageAlt: product.imageAlt || product.title || "Фотография товара",
          description: product.description || "",
          quantity: 1,
        });
      }

      setLimitWarningState(false);
      writeCart(cart);
      renderAllCartUi();
      dispatchCartUpdated();
      return true;
    },
    clear() {
      setLimitWarningState(false);
      writeCart([]);
      renderAllCartUi();
      dispatchCartUpdated();
    },
    getCount() {
      return getItemsCount(readCart());
    },
    open() {
      openCartModal(false);
    },
    getItems() {
      return readCart();
    },
  };

  window.addEventListener("storage", (event) => {
    if (event.key === storageKey) {
      renderAllCartUi();
    }
  });

  ensureCartBar();
  ensureCartModal();
  renderAllCartUi();
}
