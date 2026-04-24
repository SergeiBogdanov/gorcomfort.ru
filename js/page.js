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

