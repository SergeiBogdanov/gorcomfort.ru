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

function initAnchorScroll() {
  const HEADER_GAP = 24;

  function getScrollTarget(element) {
    if (!(element instanceof HTMLElement)) return null;
    if (element.id === "top") return element;

    return element.closest("section[id]") || element;
  }

  function getHeaderOffset() {
    const header = document.querySelector(".site-header");
    if (!(header instanceof HTMLElement)) return HEADER_GAP;

    return Math.ceil(header.getBoundingClientRect().height) + HEADER_GAP;
  }

  function getElementTop(element) {
    return element.getBoundingClientRect().top + window.scrollY;
  }

  function scrollToHash(hash, behavior = "smooth") {
    if (!hash || hash === "#") return false;

    const id = decodeURIComponent(hash.slice(1));
    const element = document.getElementById(id);
    const target = getScrollTarget(element);

    if (!(target instanceof HTMLElement)) {
      return false;
    }

    const top = target.id === "top" ? 0 : Math.max(0, getElementTop(target) - getHeaderOffset());

    window.scrollTo({
      top,
      behavior,
    });

    return true;
  }

  document.addEventListener("click", (event) => {
    const link = event.target instanceof Element ? event.target.closest("a[href*='#']") : null;
    if (!(link instanceof HTMLAnchorElement)) return;

    const url = new URL(link.href, window.location.href);
    const isSamePage =
      url.origin === window.location.origin &&
      url.pathname === window.location.pathname &&
      url.search === window.location.search;

    if (!isSamePage || !url.hash) return;

    event.preventDefault();

    if (scrollToHash(url.hash)) {
      window.history.pushState(null, "", url.hash);
    }
  });

  if (window.location.hash) {
    const adjustInitialHash = () => scrollToHash(window.location.hash, "auto");

    requestAnimationFrame(adjustInitialHash);
    window.addEventListener("load", adjustInitialHash, { once: true });
    window.setTimeout(adjustInitialHash, 120);
  }

  window.addEventListener("hashchange", () => {
    scrollToHash(window.location.hash, "auto");
  });
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

function initShopCatalog() {
  const cards = Array.from(document.querySelectorAll("[data-product-card]"));
  const filterFields = Array.from(document.querySelectorAll("[data-shop-filter]"));
  const countElement = document.querySelector("[data-shop-count]");
  const emptyState = document.querySelector("[data-shop-empty]");
  const productModal = document.querySelector("[data-product-modal]");

  if (!cards.length || !filterFields.length || !(countElement instanceof HTMLElement) || !(emptyState instanceof HTMLElement)) {
    return;
  }

  const productModalImage = productModal?.querySelector("[data-product-modal-image]");
  const productModalTitle = productModal?.querySelector("[data-product-modal-title]");
  const productModalPrice = productModal?.querySelector("[data-product-modal-price]");
  const productModalDescription = productModal?.querySelector("[data-product-modal-description]");
  const productModalSpecs = productModal?.querySelector("[data-product-modal-specs]");
  const productModalRequestButton = productModal?.querySelector("[data-product-modal-request]");
  const productModalCloseButtons = productModal?.querySelectorAll("[data-product-modal-close]") || [];
  const requestModal = document.querySelector("[data-request-modal]");
  const requestModalTrigger = document.querySelector("[data-open-request-modal]");
  const requestNameInput = requestModal?.querySelector('input[name="name"]');
  const requestServiceSelect = requestModal?.querySelector('select[name="service"]');
  const requestMessageInput = requestModal?.querySelector('textarea[name="message"]');
  const requestCounter = requestModal?.querySelector("[data-message-counter]");

  let activeProduct = null;
  let lastFocusedElement = null;

  function getFieldValue(name) {
    const field = filterFields.find((item) => item instanceof HTMLSelectElement && item.name === name);
    return field instanceof HTMLSelectElement ? field.value : "all";
  }

  function updateCount(visibleCount) {
    const cardWord = visibleCount === 1 ? "карточка" : visibleCount >= 2 && visibleCount <= 4 ? "карточки" : "карточек";
    countElement.textContent = `Показано ${visibleCount} ${cardWord}`;
    emptyState.hidden = visibleCount !== 0;
  }

  function applyFilters() {
    const currentFilters = {
      power: getFieldValue("power"),
      size: getFieldValue("size"),
      compressor: getFieldValue("compressor"),
      brand: getFieldValue("brand"),
    };

    let visibleCount = 0;

    cards.forEach((card) => {
      const matches = Object.entries(currentFilters).every(([key, value]) => value === "all" || card.dataset[key] === value);
      card.hidden = !matches;

      if (matches) {
        visibleCount += 1;
      }
    });

    updateCount(visibleCount);
  }

  function updateRequestMessage(title) {
    if (!(requestMessageInput instanceof HTMLTextAreaElement)) return;

    const nextMessage = `Интересует кондиционер ${title}. Прошу уточнить наличие, стоимость и условия монтажа.`;
    requestMessageInput.value = nextMessage;

    if (requestCounter instanceof HTMLElement) {
      const maxLength = Number(requestMessageInput.getAttribute("maxlength")) || 500;
      requestCounter.textContent = `${nextMessage.length} из ${maxLength} символов`;
    }
  }

  function openRequestModalForProduct(title) {
    const shouldTriggerExistingModal =
      requestModalTrigger instanceof HTMLElement &&
      requestModal instanceof HTMLElement &&
      requestModal.hidden;

    if (shouldTriggerExistingModal) {
      requestModalTrigger.click();
    }

    if (requestServiceSelect instanceof HTMLSelectElement) {
      const matchingOption = Array.from(requestServiceSelect.options).find((option) => option.value === "Подбор, покупка и монтаж");
      if (matchingOption) {
        requestServiceSelect.value = matchingOption.value;
      }
    }

    updateRequestMessage(title);

    if (requestModal instanceof HTMLElement && !shouldTriggerExistingModal) {
      requestModal.hidden = false;
      requestModal.setAttribute("aria-hidden", "false");
      document.body.classList.add("is-modal-open");
      document.body.style.overflow = "hidden";

      requestAnimationFrame(() => {
        if (requestNameInput instanceof HTMLInputElement) {
          requestNameInput.focus();
        }
      });
    }
  }

  function fillProductModal(card) {
    if (!(productModal instanceof HTMLElement)) return;
    if (!(productModalImage instanceof HTMLImageElement)) return;
    if (!(productModalTitle instanceof HTMLElement)) return;
    if (!(productModalPrice instanceof HTMLElement)) return;
    if (!(productModalDescription instanceof HTMLElement)) return;
    if (!(productModalSpecs instanceof HTMLElement)) return;

    const title = card.dataset.title || "Карточка кондиционера";
    const price = card.dataset.price || "";
    const description = card.dataset.description || "";
    const image = card.dataset.image || "./assets/images/hero-conditioner.png";
    const specs = (card.dataset.specs || "").split("|").filter(Boolean);
    const imageElement = card.querySelector(".product-card__image");
    const imageAlt = imageElement instanceof HTMLImageElement ? imageElement.alt : title;

    productModalImage.src = image;
    productModalImage.alt = imageAlt;
    productModalTitle.textContent = title;
    productModalPrice.textContent = price;
    productModalDescription.textContent = description;
    productModalSpecs.innerHTML = "";

    specs.forEach((spec) => {
      const item = document.createElement("li");
      item.textContent = spec;
      productModalSpecs.appendChild(item);
    });
  }

  function openProductModal(card, trigger) {
    if (!(productModal instanceof HTMLElement)) return;

    activeProduct = card;
    lastFocusedElement = trigger instanceof HTMLElement ? trigger : card;
    fillProductModal(card);

    productModal.hidden = false;
    productModal.setAttribute("aria-hidden", "false");
    document.body.classList.add("is-modal-open");
    document.body.style.overflow = "hidden";

    requestAnimationFrame(() => {
      if (productModalRequestButton instanceof HTMLButtonElement) {
        productModalRequestButton.focus();
      }
    });
  }

  function closeProductModal() {
    if (!(productModal instanceof HTMLElement)) return;

    productModal.hidden = true;
    productModal.setAttribute("aria-hidden", "true");

    if (!(requestModal instanceof HTMLElement) || requestModal.hidden) {
      document.body.classList.remove("is-modal-open");
      document.body.style.overflow = "";
    }

    if (lastFocusedElement instanceof HTMLElement && lastFocusedElement.isConnected) {
      lastFocusedElement.focus();
    }
  }

  filterFields.forEach((field) => {
    field.addEventListener("change", applyFilters);
  });

  cards.forEach((card) => {
    const detailsButton = card.querySelector("[data-product-details]");
    const requestButton = card.querySelector("[data-add-to-request]");

    detailsButton?.addEventListener("click", () => {
      openProductModal(card, detailsButton);
    });

    requestButton?.addEventListener("click", () => {
      openRequestModalForProduct(card.dataset.title || "выбранная модель");
    });
  });

  productModalCloseButtons.forEach((button) => {
    button.addEventListener("click", closeProductModal);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && productModal instanceof HTMLElement && !productModal.hidden) {
      closeProductModal();
    }
  });

  if (productModalRequestButton instanceof HTMLButtonElement) {
    productModalRequestButton.addEventListener("click", () => {
      const title = activeProduct?.dataset.title || "выбранная модель";
      closeProductModal();
      openRequestModalForProduct(title);
    });
  }

  applyFilters();
}

