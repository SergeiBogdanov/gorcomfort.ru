function initBackToTop() {
  const backToTopButton = document.querySelector("[data-back-to-top]");
  if (!backToTopButton) return;
  if (backToTopButton.dataset.backToTopReady === "true") return;

  backToTopButton.dataset.backToTopReady = "true";

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

    requestAnimationFrame(() => {
      result.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
}

async function initUsefulArticles() {
  const grid = document.querySelector("[data-useful-articles-grid]");
  const statusElement = document.querySelector("[data-useful-articles-status]");
  const modal = document.querySelector("[data-useful-article-modal]");

  if (!(grid instanceof HTMLElement) || !(statusElement instanceof HTMLElement) || !(modal instanceof HTMLElement)) {
    return;
  }

  const modalImage = modal.querySelector("[data-useful-article-image]");
  const modalTitle = modal.querySelector("[data-useful-article-title]");
  const modalLead = modal.querySelector("[data-useful-article-lead]");
  const modalContent = modal.querySelector("[data-useful-article-content]");
  const closeButtons = modal.querySelectorAll("[data-useful-article-close]");

  const articlePlaceholderImage = "./assets/images/useful/article-coming-soon.svg";
  let articles = [];
  let activeArticle = null;
  let lastFocusedElement = null;

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function setStatus(message, isVisible = true) {
    statusElement.textContent = message;
    statusElement.hidden = !isVisible;
  }

  function normalizeArticle(article) {
    return {
      ...article,
      image:
        typeof article.image === "string" && article.image.trim()
          ? article.image
          : articlePlaceholderImage,
      title:
        typeof article.title === "string" && article.title.trim()
          ? article.title
          : "Полезный материал",
      description:
        typeof article.description === "string" && article.description.trim()
          ? article.description
          : "Описание статьи скоро появится.",
      content:
        typeof article.content === "string" && article.content.trim()
          ? article.content
          : "Материал скоро будет опубликован.",
      contentImage:
        typeof article.contentImage === "string" && article.contentImage.trim()
          ? article.contentImage
          : articlePlaceholderImage,
      contentFormat:
        typeof article.contentFormat === "string" && article.contentFormat.trim()
          ? article.contentFormat
          : "text",
      slug:
        typeof article.slug === "string" && article.slug.trim()
          ? article.slug
          : `article-${Math.random().toString(36).slice(2, 8)}`,
      isPlaceholder: article.isPlaceholder === true,
    };
  }

  function createArticleMarkup(article) {
    const badge = article.isPlaceholder
      ? '<span class="useful-article-card__placeholder">Скоро появится</span>'
      : "";

    return `
      <article class="useful-article-card" data-useful-article-card data-article-slug="${escapeHtml(article.slug)}">
        <button class="useful-article-card__button" type="button" data-useful-article-open aria-label="${escapeHtml(article.title)}">
          <div class="useful-article-card__media">
            <img class="useful-article-card__image" src="${escapeHtml(article.image)}" alt="${escapeHtml(article.title)}" />
            ${badge}
          </div>
          <div class="useful-article-card__content">
            <h3 class="useful-article-card__title">${escapeHtml(article.title)}</h3>
            <p class="useful-article-card__description">${escapeHtml(article.description)}</p>
          </div>
        </button>
      </article>
    `;
  }

  function renderArticles(items) {
    grid.innerHTML = items.map(createArticleMarkup).join("");
  }

  function findArticleBySlug(slug) {
    return articles.find((article) => article.slug === slug) || null;
  }

  function renderInlineMarkdown(value) {
    return escapeHtml(value)
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
  }

  function appendArticleFigure(markdownImageMatch, article) {
    const figure = document.createElement("figure");
    figure.className = "useful-article-modal__figure";

    const image = document.createElement("img");
    image.src = markdownImageMatch[2] || article.contentImage;
    image.alt = markdownImageMatch[1] || article.title;

    if (image.src === window.location.href) {
      image.src = article.contentImage;
    }

    const caption = document.createElement("figcaption");
    caption.textContent = markdownImageMatch[1] || article.title;

    figure.append(image, caption);
    modalContent.appendChild(figure);
  }

  function renderPlainArticleContent(article) {
    article.content
      .split(/\n{2,}/)
      .map((paragraph) => paragraph.trim())
      .filter(Boolean)
      .forEach((paragraph) => {
        const imageMatch = paragraph.match(/^\[Изображение:\s*(.+)\]$/i);

        if (imageMatch) {
          appendArticleFigure([paragraph, imageMatch[1], article.contentImage], article);
          return;
        }

        const element = document.createElement("p");
        element.textContent = paragraph;
        modalContent.appendChild(element);
      });
  }

  function renderMarkdownArticleContent(article) {
    article.content
      .split(/\n{2,}/)
      .map((block) => block.trim())
      .filter(Boolean)
      .forEach((block) => {
        const imageMatch = block.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);

        if (imageMatch) {
          appendArticleFigure(imageMatch, article);
          return;
        }

        const headingMatch = block.match(/^(#{2,4})\s+(.+)$/);

        if (headingMatch) {
          const element = document.createElement(headingMatch[1].length === 2 ? "h3" : "h4");
          element.innerHTML = renderInlineMarkdown(headingMatch[2]);
          modalContent.appendChild(element);
          return;
        }

        const listItems = block
          .split(/\n/)
          .map((line) => line.trim().match(/^[-*]\s+(.+)$/))
          .filter(Boolean);

        if (listItems.length && listItems.length === block.split(/\n/).filter(Boolean).length) {
          const list = document.createElement("ul");
          listItems.forEach((item) => {
            const element = document.createElement("li");
            element.innerHTML = renderInlineMarkdown(item[1]);
            list.appendChild(element);
          });
          modalContent.appendChild(list);
          return;
        }

        const element = document.createElement("p");
        element.innerHTML = renderInlineMarkdown(block.replace(/\n/g, " "));
        modalContent.appendChild(element);
      });
  }

  function fillArticleModal(article) {
    if (
      !(modalImage instanceof HTMLImageElement) ||
      !(modalTitle instanceof HTMLElement) ||
      !(modalContent instanceof HTMLElement)
    ) {
      return;
    }

    modalImage.src = article.image;
    modalImage.alt = article.title;
    modalTitle.textContent = article.title;
    if (modalLead instanceof HTMLElement) {
      modalLead.textContent = "";
      modalLead.hidden = true;
    }
    modalContent.innerHTML = "";

    if (article.contentFormat === "markdown") {
      renderMarkdownArticleContent(article);
      return;
    }

    renderPlainArticleContent(article);
  }

  function openModal(article, trigger) {
    activeArticle = article;
    lastFocusedElement = trigger instanceof HTMLElement ? trigger : null;
    fillArticleModal(article);
    modal.hidden = false;
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("is-modal-open");
    document.body.style.overflow = "hidden";

    requestAnimationFrame(() => {
      const closeButton = modal.querySelector(".useful-article-modal__close");
      closeButton?.focus();
    });
  }

  function closeModal() {
    if (modal.hidden) {
      return;
    }

    const activeElement = document.activeElement;
    if (activeElement instanceof HTMLElement && modal.contains(activeElement)) {
      activeElement.blur();
    }

    activeArticle = null;
    modal.hidden = true;
    modal.setAttribute("aria-hidden", "true");

    const requestModal = document.querySelector("[data-request-modal]");
    const productModal = document.querySelector("[data-product-modal]");
    const quoteCartModal = document.querySelector("[data-quote-cart-modal]");

    if (
      (!(requestModal instanceof HTMLElement) || requestModal.hidden) &&
      (!(productModal instanceof HTMLElement) || productModal.hidden) &&
      (!(quoteCartModal instanceof HTMLElement) || quoteCartModal.hidden)
    ) {
      document.body.classList.remove("is-modal-open");
      document.body.style.overflow = "";
    }

    if (lastFocusedElement instanceof HTMLElement && lastFocusedElement.isConnected) {
      lastFocusedElement.focus();
    }
  }

  grid.addEventListener("click", (event) => {
    const target = event.target instanceof Element ? event.target.closest("[data-useful-article-open]") : null;
    if (!(target instanceof HTMLElement)) {
      return;
    }

    const card = target.closest("[data-article-slug]");
    if (!(card instanceof HTMLElement)) {
      return;
    }

    const article = findArticleBySlug(card.dataset.articleSlug || "");
    if (!article) {
      return;
    }

    openModal(article, target);
  });

  closeButtons.forEach((button) => {
    button.addEventListener("click", closeModal);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !modal.hidden) {
      closeModal();
    }
  });

  try {
    setStatus("Загружаем полезные материалы...", true);

    const articlesResponse = await fetch("/api/articles", {
      headers: {
        Accept: "application/json",
      },
    });

    if (!articlesResponse.ok) {
      throw new Error("Не удалось загрузить статьи.");
    }

    const payload = await articlesResponse.json();

    if (!payload || !Array.isArray(payload.articles) || !payload.articles.length) {
      throw new Error("Список статей пуст или поврежден.");
    }

    articles = payload.articles
      .map(normalizeArticle)
      .sort((left, right) => {
        if (left.isPlaceholder !== right.isPlaceholder) {
          return Number(left.isPlaceholder) - Number(right.isPlaceholder);
        }
        return left.title.localeCompare(right.title, "ru");
      });
    renderArticles(articles);
    setStatus("", false);
  } catch (error) {
    grid.innerHTML = "";
    setStatus(
      "Не удалось загрузить полезные материалы. Проверьте JSON-файлы статей и обновите страницу.",
      true
    );
  }
}

async function initShopCatalog() {
  const filterFields = Array.from(document.querySelectorAll("[data-shop-filter]"));
  const searchInput = document.querySelector("[data-shop-search-input]");
  const searchSubmitButton = document.querySelector("[data-shop-search-submit]");
  const searchClearButton = document.querySelector("[data-shop-search-clear]");
  const sortField = document.querySelector("[data-shop-sort]");
  const countElement = document.querySelector("[data-shop-count]");
  const emptyState = document.querySelector("[data-shop-empty]");
  const statusElement = document.querySelector("[data-shop-status]");
  const grid = document.querySelector("[data-shop-grid]");
  const moreWrap = document.querySelector("[data-shop-more-wrap]");
  const moreButton = document.querySelector("[data-shop-more]");
  const productModal = document.querySelector("[data-product-modal]");

  if (
    !filterFields.length ||
    !(searchInput instanceof HTMLInputElement) ||
    !(searchSubmitButton instanceof HTMLButtonElement) ||
    !(searchClearButton instanceof HTMLButtonElement) ||
    !(sortField instanceof HTMLSelectElement) ||
    !(countElement instanceof HTMLElement) ||
    !(emptyState instanceof HTMLElement) ||
    !(statusElement instanceof HTMLElement) ||
    !(grid instanceof HTMLElement) ||
    !(moreWrap instanceof HTMLElement) ||
    !(moreButton instanceof HTMLButtonElement)
  ) {
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

  const compressorLabels = {
    inverter: "Инверторный",
    onoff: "Неинверторный",
    on_off: "Неинверторный",
  };
  const PRODUCTS_PER_PAGE = 9;
  const productPlaceholderImage = "./assets/images/conditioners/conditioner-placeholder.svg";
  const powerFilters = [
    {
      value: "power-up-to-2-2",
      label: "До 2.2 кВт",
      roomLabel: "площадь до 20 м²",
      min: 0,
      max: 2.2,
    },
    {
      value: "power-2-3-2-7",
      label: "2.3 - 2.7 кВт",
      roomLabel: "площадь до 25 м²",
      min: 2.3,
      max: 2.7,
    },
    {
      value: "power-2-8-3-6",
      label: "2.8 - 3.6 кВт",
      roomLabel: "площадь до 35 м²",
      min: 2.8,
      max: 3.6,
    },
    {
      value: "power-3-7-5-5",
      label: "3.7 - 5.5 кВт",
      roomLabel: "площадь до 50 м²",
      min: 3.7,
      max: 5.5,
    },
    {
      value: "power-5-6-7-5",
      label: "5.6 - 7.5 кВт",
      roomLabel: "площадь до 70 м²",
      min: 5.6,
      max: 7.5,
    },
    {
      value: "power-7-6-10-5",
      label: "7.6 - 10.5 кВт",
      roomLabel: "площадь до 100 м²",
      min: 7.6,
      max: 10.5,
    },
    {
      value: "power-from-10-6",
      label: "От 10.6 кВт",
      roomLabel: "площадь от 100 м²",
      min: 10.6,
      max: null,
    },
  ];

  function findPowerFilterByValue(value) {
    return powerFilters.find((item) => item.value === value) || null;
  }

  function findPowerFilterByPower(powerKw) {
    const numericPower = Number(powerKw);
    return (
      powerFilters.find((item) => {
        if (numericPower < item.min) {
          return false;
        }

        if (item.max === null) {
          return true;
        }

        return numericPower <= item.max;
      }) || null
    );
  }

  const filterConfig = {
    power: {
      label: (value) => {
        const powerFilter = findPowerFilterByValue(value);
        return powerFilter ? `${powerFilter.label} (${powerFilter.roomLabel})` : value;
      },
      sort: (a, b) => {
        const left = findPowerFilterByValue(a);
        const right = findPowerFilterByValue(b);
        return (left?.min ?? 0) - (right?.min ?? 0);
      },
    },
    size: {
      label: (value) => value,
      sort: (a, b) => Number(a) - Number(b),
    },
    compressor: {
      label: (value) => compressorLabels[value] || value,
      sort: (a, b) => (compressorLabels[a] || a).localeCompare(compressorLabels[b] || b, "ru"),
    },
    brand: {
      label: (value) => value,
      sort: (a, b) => a.localeCompare(b, "ru"),
    },
  };

  let products = [];
  let currentCatalogItems = [];
  let visibleCount = PRODUCTS_PER_PAGE;
  let activeProduct = null;
  let lastFocusedElement = null;
  let appliedSearchQuery = "";

  function formatPrice(price, currency = "RUB") {
    return new Intl.NumberFormat("ru-RU", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(price);
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function getFieldValue(name) {
    const field = filterFields.find((item) => item instanceof HTMLSelectElement && item.name === name);
    return field instanceof HTMLSelectElement ? field.value : "all";
  }

  function getSortValue() {
    return sortField.value || "default";
  }

  function normalizeSearchQuery(value) {
    return String(value || "")
      .trim()
      .replace(/\s+/g, " ")
      .toLocaleLowerCase("ru-RU");
  }

  function updateSearchClearVisibility() {
    const hasValue = searchInput.value.trim().length > 0;
    searchClearButton.hidden = !hasValue;
    searchClearButton.setAttribute("aria-hidden", hasValue ? "false" : "true");
  }

  function setStatus(message, isVisible = true) {
    statusElement.textContent = message;
    statusElement.hidden = !isVisible;
  }

  function getCardWord(count) {
    return count === 1 ? "карточка" : count >= 2 && count <= 4 ? "карточки" : "карточек";
  }

  function updateCount(shownCount, totalCount = shownCount) {
    const cardWord = getCardWord(totalCount);
    countElement.textContent =
      shownCount === totalCount
        ? `Показано ${shownCount} ${cardWord}`
        : `Показано ${shownCount} из ${totalCount} ${cardWord}`;
    emptyState.hidden = totalCount !== 0;
  }

  function updateMoreButton(totalCount) {
    moreWrap.hidden = totalCount === 0 || visibleCount >= totalCount;
  }

  function normalizeProduct(product) {
    return {
      ...product,
      image: typeof product.image === "string" && product.image.trim() ? product.image : productPlaceholderImage,
      imageAlt:
        typeof product.imageAlt === "string" && product.imageAlt.trim()
          ? product.imageAlt
          : product.title || "Фотография товара скоро появится",
      isAvailable: product.isAvailable !== false,
      specs: Array.isArray(product.specs) ? product.specs : [],
    };
  }

  function populateFilters(items) {
    filterFields.forEach((field) => {
      if (!(field instanceof HTMLSelectElement)) return;

      const defaultLabels = {
        power: "Любая мощность",
        size: "Любой типоразмер",
        compressor: "Любой",
        brand: "Любой производитель",
      };

      const values =
        field.name === "power"
          ? powerFilters.map((item) => item.value)
          : Array.from(
              new Set(
                items
                  .map((item) => {
                    if (field.name === "size") return item.size;
                    if (field.name === "compressor") return item.compressor;
                    if (field.name === "brand") return item.brand;
                    return "";
                  })
                  .filter(Boolean)
              )
            ).sort(filterConfig[field.name]?.sort);

      field.innerHTML = "";

      const allOption = document.createElement("option");
      allOption.value = "all";
      allOption.textContent = defaultLabels[field.name] || "Все варианты";
      field.appendChild(allOption);

      values.forEach((value) => {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = filterConfig[field.name]?.label(value) || value;
        field.appendChild(option);
      });

      field.value = "all";
    });
  }

  function createCardMarkup(product) {
    const availabilityBadge = product.isAvailable
      ? ""
      : '<span class="product-card__badge" aria-label="Нет в наличии">Нет в наличии</span>';

    return `
      <article
        class="product-card"
        data-product-id="${escapeHtml(product.id)}"
        data-product-card
      >
        <div class="product-card__media">
          <img
            class="product-card__image"
            src="${escapeHtml(product.image)}"
            alt="${escapeHtml(product.imageAlt || product.title)}"
            loading="lazy"
            decoding="async"
          />
          ${availabilityBadge}
        </div>
        <div class="product-card__body">
          <div class="product-card__header">
            <div>
              <h3 class="product-card__title">${escapeHtml(product.title)}</h3>
              <p class="product-card__meta">${escapeHtml(
                `${Number(product.powerKw).toFixed(1)} кВт • ${product.size} • ${compressorLabels[product.compressor] || product.compressor} • ${product.brand}`
              )}</p>
            </div>
            <p class="product-card__price">${escapeHtml(formatPrice(product.price, product.currency || "RUB"))}</p>
          </div>
          <div class="product-card__actions">
            <button class="product-card__button product-card__button--secondary" type="button" data-product-details>
              Подробнее
            </button>
            <button class="product-card__button product-card__button--primary" type="button" data-add-to-request>
              Добавить в заявку
            </button>
          </div>
        </div>
      </article>
    `;
  }

  function renderCards(items) {
    grid.innerHTML = items.map(createCardMarkup).join("");
  }

  function renderVisibleCatalog() {
    const visibleItems = currentCatalogItems.slice(0, visibleCount);
    renderCards(visibleItems);
    updateCount(visibleItems.length, currentCatalogItems.length);
    updateMoreButton(currentCatalogItems.length);
  }

  function findProductById(id) {
    return products.find((product) => product.id === id) || null;
  }

  function applyFilters() {
    const currentFilters = {
      power: getFieldValue("power"),
      size: getFieldValue("size"),
      compressor: getFieldValue("compressor"),
      brand: getFieldValue("brand"),
    };
    const filteredProducts = products
      .filter((product) => {
        if (!appliedSearchQuery) return true;
        return normalizeSearchQuery(product.title).includes(appliedSearchQuery);
      })
      .filter((product) =>
        Object.entries(currentFilters).every(([key, value]) => {
          if (!value || value === "all") return true;
          if (key === "power") {
            const powerFilter = findPowerFilterByValue(value);
            if (!powerFilter) return true;
            if (Number(product.powerKw) < powerFilter.min) return false;
            if (powerFilter.max === null) return true;
            return Number(product.powerKw) <= powerFilter.max;
          }
          if (key === "size") return product.size === value;
          if (key === "compressor") return product.compressor === value;
          if (key === "brand") return product.brand === value;
          return true;
        })
      );

    const sortValue = getSortValue();
    const sortedProducts = [...filteredProducts];

    if (sortValue === "price-asc") {
      sortedProducts.sort((a, b) => a.price - b.price);
    } else if (sortValue === "price-desc") {
      sortedProducts.sort((a, b) => b.price - a.price);
    } else if (sortValue === "default" || sortValue === "power-asc") {
      sortedProducts.sort((a, b) => a.powerKw - b.powerKw);
    } else if (sortValue === "power-desc") {
      sortedProducts.sort((a, b) => b.powerKw - a.powerKw);
    }

    currentCatalogItems = sortedProducts;
    renderVisibleCatalog();
    setStatus("", false);
  }

  function resetCatalogLimit() {
    visibleCount = PRODUCTS_PER_PAGE;
    applyFilters();
  }

  function applySearch() {
    appliedSearchQuery = normalizeSearchQuery(searchInput.value);
    visibleCount = PRODUCTS_PER_PAGE;
    applyFilters();
  }

  function clearSearch() {
    searchInput.value = "";
    appliedSearchQuery = "";
    updateSearchClearVisibility();
    visibleCount = PRODUCTS_PER_PAGE;
    applyFilters();
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

  function fillProductModal(product) {
    if (!(productModal instanceof HTMLElement)) return;
    if (!(productModalImage instanceof HTMLImageElement)) return;
    if (!(productModalTitle instanceof HTMLElement)) return;
    if (!(productModalPrice instanceof HTMLElement)) return;
    if (!(productModalDescription instanceof HTMLElement)) return;
    if (!(productModalSpecs instanceof HTMLElement)) return;

    productModalImage.src = product.image || productPlaceholderImage;
    productModalImage.alt = product.imageAlt || product.title || "Кондиционер";
    productModalTitle.textContent = product.title || "Карточка кондиционера";
    productModalPrice.textContent = formatPrice(product.price, product.currency || "RUB");
    productModalDescription.textContent = product.description || "";
    productModalSpecs.innerHTML = "";

    (Array.isArray(product.specs) ? product.specs : []).forEach((spec) => {
      const item = document.createElement("li");
      item.textContent = spec;
      productModalSpecs.appendChild(item);
    });
  }

  function openProductModal(product, trigger) {
    if (!(productModal instanceof HTMLElement)) return;

    activeProduct = product;
    lastFocusedElement = trigger instanceof HTMLElement ? trigger : null;
    fillProductModal(product);

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
    field.addEventListener("change", resetCatalogLimit);
  });

  searchInput.addEventListener("input", updateSearchClearVisibility);

  searchInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      applySearch();
    }
  });

  searchSubmitButton.addEventListener("click", applySearch);
  searchClearButton.addEventListener("click", clearSearch);

  sortField.addEventListener("change", resetCatalogLimit);

  moreButton.addEventListener("click", () => {
    visibleCount += PRODUCTS_PER_PAGE;
    renderVisibleCatalog();
  });

  grid.addEventListener("click", (event) => {
    const target = event.target instanceof Element ? event.target : null;
    const card = target?.closest("[data-product-id]");
    if (!(card instanceof HTMLElement)) return;

    const product = findProductById(card.dataset.productId || "");
    if (!product) return;

    const detailsButton = target?.closest("[data-product-details]");
    const requestButton = target?.closest("[data-add-to-request]");

    if (detailsButton instanceof HTMLElement) {
      openProductModal(product, detailsButton);
    }

    if (requestButton instanceof HTMLElement) {
      window.quoteCartApi?.addProduct(product);
    }
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
      if (activeProduct) {
        window.quoteCartApi?.addProduct(activeProduct);
      }
      closeProductModal();
    });
  }

  try {
    setStatus("Загружаем товары...", true);

    const indexResponse = await fetch("./assets/data/products/index.json", {
      headers: {
        Accept: "application/json",
      },
    });

    if (!indexResponse.ok) {
      throw new Error("Не удалось загрузить каталог товаров.");
    }

    const indexPayload = await indexResponse.json();

    if (!Array.isArray(indexPayload) || !indexPayload.length) {
      throw new Error("Список товаров пуст или поврежден.");
    }

    const productResponses = await Promise.all(
      indexPayload.map(async (productUrl) => {
        const response = await fetch(productUrl, {
          headers: {
            Accept: "application/json",
          },
        });

        if (!response.ok) {
          throw new Error("Не удалось загрузить один из товаров каталога.");
        }

        return response.json();
      })
    );

    products = productResponses.map(normalizeProduct);
    populateFilters(products);
    searchInput.value = "";
    appliedSearchQuery = "";
    updateSearchClearVisibility();
    sortField.value = "default";
    visibleCount = PRODUCTS_PER_PAGE;
    applyFilters();
    setStatus("", false);
  } catch (error) {
    currentCatalogItems = [];
    visibleCount = PRODUCTS_PER_PAGE;
    updateMoreButton(0);
    grid.innerHTML = "";
    updateCount(0);
    emptyState.hidden = true;
    setStatus(
      "Не удалось загрузить каталог товаров. Проверьте интернет-соединение и обновите страницу.",
      true
    );
  }
}

