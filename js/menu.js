function initMenu() {
  const burger = document.querySelector(".burger");
  const mobileMenu = document.getElementById("mobileMenu");
  const mobileLinks = document.querySelectorAll(".mobile-menu__link, .mobile-menu__sublink, .mobile-menu__phone, .mobile-menu__cta");
  const dropdowns = Array.from(document.querySelectorAll("[data-nav-dropdown]"));

  function closeDropdown(dropdown) {
    if (!(dropdown instanceof HTMLElement)) return;

    const trigger = dropdown.querySelector("[data-nav-trigger]");
    const panel = dropdown.querySelector(".site-nav__dropdown");

    dropdown.classList.remove("is-open");
    if (trigger instanceof HTMLButtonElement) {
      trigger.setAttribute("aria-expanded", "false");
    }

    if (panel instanceof HTMLElement) {
      panel.hidden = true;
    }
  }

  function closeAllDropdowns() {
    dropdowns.forEach(closeDropdown);
  }

  function openDropdown(dropdown) {
    if (!(dropdown instanceof HTMLElement)) return;

    const trigger = dropdown.querySelector("[data-nav-trigger]");
    const panel = dropdown.querySelector(".site-nav__dropdown");

    closeAllDropdowns();
    dropdown.classList.add("is-open");

    if (trigger instanceof HTMLButtonElement) {
      trigger.setAttribute("aria-expanded", "true");
    }

    if (panel instanceof HTMLElement) {
      panel.hidden = false;
    }
  }

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

    closeAllDropdowns();
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

    if (mobileMenu.classList.contains("is-open")) {
      closeMenu();
    } else {
      openMenu();
    }
  }

  if (!burger || !mobileMenu) {
    return;
  }

  burger.addEventListener("click", toggleMenu);

  dropdowns.forEach((dropdown) => {
    const trigger = dropdown.querySelector("[data-nav-trigger]");
    const panelLinks = dropdown.querySelectorAll(".site-nav__dropdown-link");

    closeDropdown(dropdown);

    if (trigger instanceof HTMLButtonElement) {
      trigger.addEventListener("click", () => {
        if (dropdown.classList.contains("is-open")) {
          closeDropdown(dropdown);
        } else {
          openDropdown(dropdown);
        }
      });
    }

    panelLinks.forEach((link) => {
      link.addEventListener("click", () => {
        closeDropdown(dropdown);
      });
    });
  });

  mobileLinks.forEach((link) => {
    link.addEventListener("click", closeMenu);
  });

  document.addEventListener("click", (event) => {
    const target = event.target;

      if (!isMenuOpen() || !(target instanceof Element)) {
        if (!target.closest("[data-nav-dropdown]")) {
          closeAllDropdowns();
        }
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
    if (event.key === "Escape") {
      closeAllDropdowns();
    }

    if (event.key === "Escape" && mobileMenu.classList.contains("is-open")) {
      closeMenu();
    }
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth <= 1060) {
      closeAllDropdowns();
    }

    if (window.innerWidth > 1060 && mobileMenu.classList.contains("is-open")) {
      closeMenu();
    }
  });
}
