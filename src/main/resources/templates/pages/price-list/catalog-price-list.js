(function () {
  /**
   * ГІБРИДНИЙ ПІДХІД: Карточки рендеряться на сервері через Thymeleaf,
   * JavaScript тільки фільтрує/сортує існуючі DOM елементи
   */

  const section = document.getElementById("priceListContent");
  if (!section) {
    return;
  }

  const hasSession = section.dataset.hasSession !== "false";
  const loadingEl = document.getElementById("priceLoading");
  const errorEl = document.getElementById("priceError");
  const tableContainer = document.getElementById(
    "priceTableContainer",
  );
  const cardsGrid = tableContainer?.querySelector(".cards-grid");
  const controls = document.getElementById("price-list-controls");
  const searchInput = document.getElementById("search-input");
  const brandFilterSelect = document.getElementById("brand-filter");
  const sortSelect = document.getElementById("sort-select");
  const resultsSummary = document.getElementById(
    "search-results-summary",
  );
  const resultsSummaryText = document.getElementById(
    "search-results-summary-text",
  );
  const activeFiltersContainer = document.getElementById(
    "search-active-filters",
  );
  const tg = window.Telegram?.WebApp;

  // Додаємо відступ тільки в Telegram версії
  if (
    tg &&
    tg.initDataUnsafe &&
    Object.keys(tg.initDataUnsafe).length > 0 &&
    section
  ) {
    section.style.marginTop = "80px";
  }

  if (!hasSession) {
    hide(loadingEl);
    return;
  }

  // Зчитуємо всі карточки, які вже є в DOM (створені Thymeleaf)
  /** @type {HTMLElement[]} */
  let allCards = [];

  function show(el) {
    if (el) {
      el.classList.remove("is-hidden");
    }
  }

  function hide(el) {
    if (el) {
      el.classList.add("is-hidden");
    }
  }

  function setText(el, text) {
    if (!el) return;
    el.textContent = text;
  }

  function updateResultsSummary(visibleCount, filters = {}) {
    if (!resultsSummary) {
      return;
    }

    if (!allCards.length) {
      hide(resultsSummary);
      if (activeFiltersContainer) {
        activeFiltersContainer.classList.add("is-hidden");
        activeFiltersContainer.innerHTML = "";
      }
      return;
    }

    const totalCount = allCards.length;
    const label =
      totalCount === visibleCount
        ? `Показано ${visibleCount} позицій`
        : `Показано ${visibleCount} з ${totalCount} позицій`;

    if (resultsSummaryText) {
      setText(resultsSummaryText, label);
    } else {
      resultsSummary.textContent = label;
    }

    updateActiveFilters(filters);
    show(resultsSummary);
  }

  /**
   * Extracts unique brands from card DOM elements and populates the brand filter dropdown
   */
  function populateBrandFilterOptions() {
    if (!brandFilterSelect) {
      return;
    }

    const previousValue = brandFilterSelect.value;
    const brandMap = new Map();

    // Збираємо унікальні бренди з data-brand атрибутів карточок
    allCards.forEach(card => {
      const brand = card.dataset.brand?.trim();
      if (!brand) {
        return;
      }
      const key = brand.toLocaleLowerCase("uk");
      if (!brandMap.has(key)) {
        brandMap.set(key, brand);
      }
    });

    const brands = Array.from(brandMap.values());
    brands.sort((a, b) =>
      a.localeCompare(b, "uk", { sensitivity: "base" }),
    );

    brandFilterSelect.innerHTML = "";

    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = "Усі бренди";
    brandFilterSelect.appendChild(defaultOption);

    brands.forEach(brand => {
      const option = document.createElement("option");
      option.value = brand;
      option.textContent = brand;
      brandFilterSelect.appendChild(option);
    });

    if (
      previousValue &&
      brands.some(
        brand =>
          brand.toLocaleLowerCase("uk") ===
          previousValue.toLocaleLowerCase("uk"),
      )
    ) {
      const matchedBrand = brands.find(
        brand =>
          brand.toLocaleLowerCase("uk") ===
          previousValue.toLocaleLowerCase("uk"),
      );
      brandFilterSelect.value = matchedBrand || "";
    } else {
      brandFilterSelect.value = "";
    }

    brandFilterSelect.disabled = brands.length === 0;
  }

  /**
   * @param {Object} filters - current filter values
  * @param {string} [filters.name] - search uery for product name
  * @param {string} [filters.brandLabel] - display label of selected brand
  
  
  
  
  */
  function updateActiveFilters(filters) {
    if (!activeFiltersContainer) {
      return;
    }

    activeFiltersContainer.innerHTML = "";

    /** @type {ActiveFilter[]} */
    const active = [];
    const nameValue =
      typeof filters?.name === "string" ? filters.name.trim() : "";
    const brandLabel =
      typeof filters?.brandLabel === "string"
        ? filters.brandLabel.trim()
        : "";

    if (nameValue) {
      active.push({ label: "Назва", value: nameValue });
    }

    if (brandLabel) {
      active.push({ label: "Бренд", value: brandLabel });
    }

    if (!active.length) {
      activeFiltersContainer.classList.add("is-hidden");
      return;
    }

    active.forEach(filter => {
      const pill = document.createElement("span");
      pill.className = "pill";
      pill.textContent = `${filter.label}: ${filter.value}`;
      activeFiltersContainer.appendChild(pill);
    });

    activeFiltersContainer.classList.remove("is-hidden");
  }

  /**
   * Фільтрує та показує/ховає карточки на основі критеріїв
   * @param {Function} filterFn - функція фільтрації (card) => boolean
   * @param {Object} filters - об'єкт з інформацією про активні фільтри
   */
  function filterAndDisplayCards(filterFn, filters = {}) {
    let visibleCount = 0;

    allCards.forEach(card => {
      if (filterFn(card)) {
        card.style.display = "";
        visibleCount++;
      } else {
        card.style.display = "none";
      }
    });

    updateResultsSummary(visibleCount, filters);

    // Показуємо/ховаємо контроли
    if (controls) {
      if (allCards.length) {
        show(controls);
      } else {
        hide(controls);
      }
    }
  }

  /**
   * Сортує карточки в DOM за певним data-атрибутом
   * @param {string} dataKey - назва data-атрибуту (name, brand, price)
   */
  function sortCardsByAttribute(dataKey) {
    if (!cardsGrid) return;

    const sortedCards = [...allCards].sort((a, b) => {
      const aValue = a.dataset[dataKey] || "";
      const bValue = b.dataset[dataKey] || "";
      return aValue.localeCompare(bValue, "uk", {
        sensitivity: "base",
      });
    });

    // Перевставляємо карточки у відсортованому порядку
    sortedCards.forEach(card => cardsGrid.appendChild(card));
  }

  /**
   * Сортує карточки за ціною
   * @param {("lowest-first"|"highest-first")} order
   */
  function sortCardsByPrice(order) {
    if (!cardsGrid) return;

    const sortedCards = [...allCards].sort((a, b) => {
      const aPrice = parseFloat(a.dataset.price) || 0;
      const bPrice = parseFloat(b.dataset.price) || 0;

      return order === "highest-first"
        ? bPrice - aPrice
        : aPrice - bPrice;
    });

    // Перевставляємо карточки у відсортованому порядку
    sortedCards.forEach(card => cardsGrid.appendChild(card));
  }

  /**
   * Застосовує всі активні фільтри (пошук, бренд, сортування)
   */
  function applyFilters() {
    const nameQuery = searchInput?.value?.trim().toLowerCase() || "";
    const brandValue =
      brandFilterSelect?.value?.trim().toLowerCase() || "";
    /** @type {('none'|'name'|'brand'|'price-lowest-first'|'price-highest-first')} */
    const sortValue = sortSelect?.value || "none";

    const brandLabel = brandValue
      ? brandFilterSelect?.options[brandFilterSelect.selectedIndex]
          ?.textContent || brandValue
      : "";

    // Функція фільтрації для карточок
    const filterFn = card => {
      // Фільтр за назвою/артикулом
      if (nameQuery) {
        const cardName = card.dataset.name || "";
        const cardArticle = card.dataset.article || "";
        const matchesName = cardName.includes(nameQuery);
        const matchesArticle = cardArticle.includes(nameQuery);

        if (!matchesName && !matchesArticle) {
          return false;
        }
      }

      // Фільтр за брендом
      if (brandValue) {
        const cardBrand = card.dataset.brand || "";
        if (cardBrand !== brandValue) {
          return false;
        }
      }

      return true;
    };

    // Застосовуємо фільтрацію
    filterAndDisplayCards(filterFn, { name: nameQuery, brandLabel });

    // Застосовуємо сортування
    if (sortValue === "name") {
      sortCardsByAttribute("name");
    } else if (sortValue === "brand") {
      sortCardsByAttribute("brand");
    } else if (sortValue === "price-lowest-first") {
      sortCardsByPrice("lowest-first");
    } else if (sortValue === "price-highest-first") {
      sortCardsByPrice("highest-first");
    }
  }

  /**
   * Ініціалізує карточки з DOM (карточки вже створені Thymeleaf на сервері)
   */
  function initializeCards() {
    // Зчитуємо всі карточки з DOM
    if (cardsGrid) {
      allCards = Array.from(
        cardsGrid.querySelectorAll('[data-price-card]'),
      );
    }

    if (!allCards.length) {
      // Немає карточок - показуємо повідомлення
      if (controls) {
        hide(controls);
      }
      hide(resultsSummary);
      return;
    }

    // Заповнюємо фільтр брендів
    populateBrandFilterOptions();

    // Показуємо контроли
    if (controls) {
      show(controls);
    }

    // Застосовуємо початкові фільтри
    applyFilters();
  }

  searchInput?.addEventListener("input", () => {
    applyFilters();
  });

  brandFilterSelect?.addEventListener("change", event => {
    applyFilters();
  });

  sortSelect?.addEventListener("change", () => {
    applyFilters();
  });

  // Ініціалізуємо карточки з DOM (замість AJAX запиту)
  initializeCards();
})();
