(function () {
  /**
   * @typedef {Object} PriceListItem
   * @property {string} article - article/SKU code
   * @property {string} name - product name
   * @property {string} storageUnit - unit of measurement (e.g., "шт", "кг")
   * @property {string} brand - brand name
   * @property {number} price - numeric price value
   * @property {string} [priceText] - formatted price text (optional)
   */

  /**
   * @typedef {Object} PriceListResponse
   * @property {PriceListItem[]} items - array of price list items
   */

  const section = document.getElementById("priceListContent");
  if (!section) {
    return;
  }

  const dataEndpoint = section.dataset.dataEndpoint;
  const hasSession = section.dataset.hasSession !== "false";
  const loadingEl = document.getElementById("priceLoading");
  const errorEl = document.getElementById("priceError");
  const tableContainer = document.getElementById(
    "priceTableContainer",
  );
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
  const zoomBar = document.getElementById("priceZoomBar");
  const zoomLabel = document.getElementById("priceZoomLabel");
  const zoomInBtn = document.getElementById("priceZoomIn");
  const zoomOutBtn = document.getElementById("priceZoomOut");
  const zoomResetBtn = document.getElementById("priceZoomReset");
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

  if (!dataEndpoint) {
    return;
  }

  /** @type {PriceListItem[]} */
  let allItems = [];

  // let selectedBrands = new Set();

  let zoom = 1;

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

  function showLoading() {
    show(loadingEl);
    hide(errorEl);
    hide(zoomBar);
    hide(controls);
    hide(resultsSummary);
    if (tableContainer) {
      tableContainer.innerHTML = "";
      hide(tableContainer);
    }
  }

  function showError(message) {
    hide(loadingEl);
    if (errorEl) {
      setText(errorEl, message || "Сталася помилка");
      show(errorEl);
    } else if (tg && typeof tg.showAlert === "function") {
      tg.showAlert(message || "Сталася помилка");
    } else {
      alert(message || "Сталася помилка");
    }
    hide(controls);
    hide(resultsSummary);
  }

  function normalisePrice(value) {
    if (value == null || value === "") {
      return "—";
    }

    try {
      const number =
        typeof value === "number" ? value : Number(value);
      if (Number.isNaN(number)) {
        return value;
      }
      const formatter = new Intl.NumberFormat("uk-UA", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
      return formatter.format(number);
    } catch (err) {
      return value;
    }
  }

  function applyZoom() {
    const zoomTarget = tableContainer
      ? tableContainer.querySelector("#priceTableZoomTarget")
      : null;
    if (!zoomTarget) {
      return;
    }
    zoomTarget.style.transform = `scale(${zoom})`;
    if (zoomLabel) {
      zoomLabel.textContent = `${Math.round(zoom * 100)}%`;
    }
  }

  zoomInBtn?.addEventListener("click", () => {
    zoom = Math.min(2, zoom + 0.1);
    applyZoom();
  });

  zoomOutBtn?.addEventListener("click", () => {
    zoom = Math.max(0.5, zoom - 0.1);
    applyZoom();
  });

  zoomResetBtn?.addEventListener("click", () => {
    zoom = 1;
    applyZoom();
  });

  function updateResultsSummary(visibleCount, filters = {}) {
    if (!resultsSummary) {
      return;
    }

    if (!allItems.length) {
      hide(resultsSummary);
      if (activeFiltersContainer) {
        activeFiltersContainer.classList.add("is-hidden");
        activeFiltersContainer.innerHTML = "";
      }
      return;
    }

    const totalCount = allItems.length;
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

  function createMetaRow(label, value) {
    if (value == null || value === "") {
      return null;
    }

    const row = document.createElement("div");
    row.className = "price-card__meta-item";

    const labelEl = document.createElement("span");
    labelEl.className = "price-card__meta-label";
    labelEl.textContent = label;

    const valueEl = document.createElement("span");
    valueEl.className = "price-card__meta-value";
    valueEl.textContent = value;

    row.appendChild(labelEl);
    row.appendChild(valueEl);
    return row;
  }

  /**
   * Extracts unique brands from items and populates the brand fillter dropdown.
   * Preserves the previously selected brand if it still exists after repopulation
   *
   * @param {PriceListItem[]} items - array of price list items to extract brands from
   */
  function populateBrandFilterOptions(items) {
    if (!brandFilterSelect) {
      return;
    }

    const previousValue = brandFilterSelect.value;
    const brandMap = new Map();

    if (Array.isArray(items)) {
      items.forEach(item => {
        const rawBrand = item?.brand;
        if (rawBrand == null) {
          return;
        }
        const brand = rawBrand.toString().trim();
        if (!brand) {
          return;
        }
        const key = brand.toLocaleLowerCase("uk");
        if (!brandMap.has(key)) {
          brandMap.set(key, brand);
        }
      });
    }

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

  function renderItems(items, filters = {}) {
    if (!tableContainer) {
      return;
    }

    tableContainer.innerHTML = "";
    const hasItems = Array.isArray(items) && items.length > 0;
    const visibleCount = Array.isArray(items) ? items.length : 0;

    if (!hasItems) {
      const message = document.createElement("div");
      message.className = "price-list-empty";
      message.textContent = allItems.length
        ? "Немає результатів за вказаними критеріями."
        : "Немає даних для відображення.";
      tableContainer.appendChild(message);
    } else {
      const list = document.createElement("div");
      list.className = "cards-grid two-columns price-list";

      items.forEach(item => {
        const card = document.createElement("article");
        card.className = "card tight price-card";

        const header = document.createElement("div");
        header.className = "price-card__header";

        const title = document.createElement("h3");
        title.className = "price-card__title";
        title.textContent = item?.name || item?.article || "—";
        header.appendChild(title);

        const priceValue = normalisePrice(
          item?.price ?? item?.priceText,
        );
        if (priceValue) {
          const priceEl = document.createElement("div");
          priceEl.className = "price-card__price";
          priceEl.textContent = priceValue;
          header.appendChild(priceEl);
        }

        card.appendChild(header);

        const metaRows = [
          createMetaRow("Артикул", item?.article),
          createMetaRow("Марка", item?.brand),
          createMetaRow("Одиниця", item?.storageUnit),
          createMetaRow(
            "ID",
            item?.id != null && item.id !== ""
              ? String(item.id)
              : null,
          ),
        ].filter(Boolean);

        if (metaRows.length) {
          const meta = document.createElement("div");
          meta.className = "price-card__meta";
          metaRows.forEach(row => meta.appendChild(row));
          card.appendChild(meta);
        }

        list.appendChild(card);
      });

      tableContainer.appendChild(list);
    }

    if (controls) {
      if (allItems.length) {
        show(controls);
      } else {
        hide(controls);
      }
    }

    hide(loadingEl);
    hide(errorEl);
    hide(zoomBar);
    show(tableContainer);
    updateResultsSummary(visibleCount, filters);
    zoom = 1;
  }

  function createSorter(key) {
    return (a, b) => {
      const aValue = a?.[key];
      const bValue = b?.[key];
      if (!aValue && !bValue) {
        return 0;
      }
      if (!aValue) {
        return 1;
      }
      if (!bValue) {
        return -1;
      }
      return aValue
        .toString()
        .localeCompare(bValue.toString(), "uk", {
          sensitivity: "base",
        });
    };
  }

  /**
   * Meant to be used on PriceListItem.sort()
   * @param {("lowest-first"|"highest-first")} order - order for sorting
   * @returns {(1|0|-1)} value for .sort() method
   */
  function createPriceSorter(order) {
    /**
     * @param {PriceListItem} a
     * @param {PriceListItem} b
     */
    return (a, b) => {
      const aPrice = a?.price;
      const bPrice = b?.price;

      if (aPrice == null && bPrice == null) return 0;
      if (aPrice == null) return 1;
      if (bPrice == null) return -1;

      const aNum =
        typeof aPrice === "number" ? aPrice : Number(aPrice);
      const bNum =
        typeof bPrice === "number" ? bPrice : Number(bPrice);

      return order === "highest-first" ? bNum - aNum : aNum - bNum;
    };
  }

  /**
   * Applies all active filters (search, brand, sorting) to the price list.
   * Creates a filtered copy of allItems and renders the results
   */
  function applyFilters() {
    const nameQueryRaw = searchInput?.value ?? "";
    const nameQuery = nameQueryRaw.trim();
    const brandValueRaw = brandFilterSelect?.value ?? "";
    const brandValue = brandValueRaw.trim();
    /** @type {('none'|'name'|'brand'|'price-lowest-first'|'price-highest-first')} */
    const sortValue = sortSelect?.value || "none";

    const brandLabel = brandValue
      ? brandFilterSelect && brandFilterSelect.selectedIndex >= 0
        ? brandFilterSelect.options[brandFilterSelect.selectedIndex]
            ?.textContent || brandValue
        : brandValue
      : "";

    if (!Array.isArray(allItems)) {
      renderItems([], { name: nameQuery, brandLabel });
      return;
    }

    // creates shallow copy of the allItems
    let filtered = allItems.slice();

    if (nameQuery) {
      const normalisedQuery = nameQuery.toLocaleLowerCase("uk"); // якщо всі товари (і артикули) англійською мовою, то треба забрати "uk" (нижче по коду). Це додаткова нагузка + може щось поламатися в майбутньому. Можна залишити .toLocaleLowerCase().

      // правильна строчка якщо всі товари англійською мовою
      // const normalisedQuery = nameQuery.toLocaleLowerCase();

      filtered = filtered.filter(item => {
        const name = item?.name;
        const article = item?.article;

        const nameMatches =
          name != null &&
          name
            .toString()
            .toLocaleLowerCase("uk")
            .includes(normalisedQuery);

        const articleMatches =
          article != null &&
          article
            .toString()
            .toLocaleLowerCase("uk")
            .includes(normalisedQuery);

        return nameMatches || articleMatches;
      });
    }

    // видалити з 5 завданням
    if (brandValue) {
      const brandQuery = brandValue.toLocaleLowerCase("uk");

      // // завдання 5 недороблене
      // if (selectedBrands.size > 0) {

      filtered = filtered.filter(item => {
        const brand = item?.brand;
        if (brand == null) {
          return false;
        }

        // видалити з 5 завданням
        return (
          brand.toString().trim().toLocaleLowerCase("uk") ===
          brandQuery
        );

        // // завдання 5 недороблене
        // const brandKey = brand
        //   .toString()
        //   .trim()
        //   .toLocaleLowerCase("uk");
        // return selectedBrands.has(brandKey);
      });
    }

    if (sortValue === "name") {
      filtered.sort(createSorter("name"));
    } else if (sortValue === "brand") {
      filtered.sort(createSorter("brand"));
    } else if (sortValue === "price-lowest-first") {
      filtered.sort(createPriceSorter("lowest-first"));
    } else if (sortValue === "price-highest-first") {
      filtered.sort(createPriceSorter("highest-first"));
    }

    renderItems(filtered, { name: nameQuery, brandLabel });
  }

  async function loadData() {
    showLoading();

    try {
      const response = await fetch(dataEndpoint, {
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        let message = "Не вдалося отримати дані.";
        try {
          const body = await response.json();
          if (body && typeof body.message === "string") {
            message = body.message;
          }
        } catch (err) {
          // ignore
        }
        throw new Error(message);
      }

      /** @type {PriceListResponse} */
      const data = await response.json();
      allItems = Array.isArray(data?.items) ? data.items : [];
      populateBrandFilterOptions(allItems);
      applyFilters();
    } catch (err) {
      showError(err?.message || "Сталася помилка");
    }
  }

  searchInput?.addEventListener("input", () => {
    applyFilters();
  });

  brandFilterSelect?.addEventListener("change", event => {
    // завдання 5 недороблене
    // /** @type {string} */
    // const selectedValue = event.target.value.trim();

    // if (!selectedValue) return;

    // const brandKey = selectedValue.toLocaleLowerCase("uk");

    // if (selectedBrands.has(brandKey)) {
    //   selectedBrands.delete(brandKey);
    // } else {
    //   selectedBrands.add(brandKey);
    // }

    // event.target.value = "";

    applyFilters();
  });

  sortSelect?.addEventListener("change", () => {
    applyFilters();
  });

  loadData();
})();
