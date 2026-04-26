document.addEventListener("DOMContentLoaded", () => {
  initMenu();
  initWorksSlider();
  initFaq();
  initRequestModalV2();
  initCouponModal();
  initQuoteCartBar();
  initAcCalculator();
  initShopCatalog();
  initBackToTop();
  initAnchorScroll();
});

function initQuoteCartBar() {
  const storageKey = "gorcomfortQuoteCart";
  const body = document.body;

  if (!(body instanceof HTMLBodyElement)) {
    return;
  }

  function safeParseCart(value) {
    if (!value) return [];

    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function readCart() {
    return safeParseCart(window.localStorage.getItem(storageKey));
  }

  function writeCart(cart) {
    window.localStorage.setItem(storageKey, JSON.stringify(cart));
  }

  function getItemsCount(cart) {
    return cart.reduce((sum, item) => sum + Math.max(1, Number(item.quantity) || 1), 0);
  }

  function dispatchCartUpdated() {
    document.dispatchEvent(new CustomEvent("quote-cart-updated"));
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
        </div>
        <div class="quote-cart-bar__actions">
          <button class="quote-cart-bar__button quote-cart-bar__button--secondary" type="button">
            Посмотреть товары
          </button>
          <button class="quote-cart-bar__button quote-cart-bar__button--primary" type="button">
            Отправить заявку
          </button>
        </div>
      </div>
    `;

    body.appendChild(bar);

    const clearButton = bar.querySelector("[data-quote-cart-clear]");
    clearButton?.addEventListener("click", () => {
      writeCart([]);
      renderCartBar();
      dispatchCartUpdated();
    });

    return bar;
  }

  function renderCartBar() {
    const bar = ensureCartBar();
    const countElement = bar.querySelector("[data-quote-cart-count]");
    const cart = readCart();
    const itemsCount = getItemsCount(cart);

    bar.hidden = itemsCount === 0;
    body.classList.toggle("has-quote-cart-bar", itemsCount > 0);

    if (countElement instanceof HTMLElement) {
      countElement.textContent = String(itemsCount);
    }
  }

  window.quoteCartApi = {
    addProduct(product) {
      if (!product || typeof product !== "object" || !product.id) {
        return;
      }

      const cart = readCart();
      const existingItem = cart.find((item) => item.id === product.id);

      if (existingItem) {
        existingItem.quantity = (Number(existingItem.quantity) || 1) + 1;
      } else {
        cart.push({
          id: product.id,
          title: product.title || "Товар",
          quantity: 1,
        });
      }

      writeCart(cart);
      renderCartBar();
      dispatchCartUpdated();
    },
    clear() {
      writeCart([]);
      renderCartBar();
      dispatchCartUpdated();
    },
    getCount() {
      return getItemsCount(readCart());
    },
  };

  window.addEventListener("storage", (event) => {
    if (event.key === storageKey) {
      renderCartBar();
    }
  });

  renderCartBar();
}
