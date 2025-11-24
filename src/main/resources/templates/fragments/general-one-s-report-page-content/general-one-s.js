import {
  show,
  hide,
  showAlert,
  toggle,
  getVisibleLayout,
} from "./utils/dom-helpers.js";
import {
  normaliseValue,
  toDisplayString,
  DEFAULT_CONTRACTOR_VALUE,
  isDefaultContractor,
} from "./utils/string.helpers.js";
import {
  toISODateLocal,
  setDefaultRange,
} from "./utils/date-helpers.js";
import { createZoomController } from "./controllers/zoom-controller.js";

(function () {
  const visibleLayout = getVisibleLayout();
  const section = visibleLayout.querySelector(
    "#accountsWithClientsSection",
  );

  if (!section) return;
  const dataEndpoint = section.dataset.dataEndpoint;
  const exportEndpointRaw = section.dataset.exportEndpoint;
  const exportEndpoint =
    exportEndpointRaw && exportEndpointRaw !== "null"
      ? exportEndpointRaw
      : null;
  const aiEndpointRaw = section.dataset.aiEndpoint;
  const aiEndpoint =
    aiEndpointRaw && aiEndpointRaw !== "null" ? aiEndpointRaw : null;
  if (!dataEndpoint) return;
  const $ = id => visibleLayout.querySelector(`#${id}`);
  const getBtn = $("getBtn");
  const downloadBtn = $("downloadBtn");
  const tg = window.Telegram?.WebApp;
  const dateFromEl = $("dateFrom");
  const dateToEl = $("dateTo");
  const hasDateRange = !!dateFromEl || !!dateToEl;

  if (hasDateRange) {
    setDefaultRange(dateFromEl, dateToEl, dataEndpoint);
  }
  const loading = $("loading");
  const box = $("tableContainer");
  const err = $("error");
  const zoombar = $("zoombar");
  const zoomOutBtn = $("zoomOut");
  const zoomInBtn = $("zoomIn");
  const zoomResetBtn = $("zoomReset");
  const zoomLabel = $("zoomLabel");
  const contractorInput = $("contractor");
  const analysisSection = $("analysisSection");
  const analysisButton = $("analysisButton");
  const analysisLoading = $("analysisLoading");
  const analysisError = $("analysisError");
  const analysisResult = $("analysisResult");

  if (contractorInput && !normaliseValue(contractorInput.value)) {
    contractorInput.value = DEFAULT_CONTRACTOR_VALUE;
  }

  contractorInput?.addEventListener("focus", () => {
    if (isDefaultContractor(contractorInput.value)) {
      contractorInput.select();
    }
  });

  contractorInput?.addEventListener("blur", () => {
    if (!normaliseValue(contractorInput.value)) {
      contractorInput.value = DEFAULT_CONTRACTOR_VALUE;
    }
  });
  const searchBtn = $("searchContractor");

  const zoomController = createZoomController({
    tableContainer: box,
    zoomOutBtn,
    zoomInBtn,
    zoomLabel,
  });

  zoomController.init();

  if (analysisButton && !analysisButton.dataset.originalText) {
    const initialText = analysisButton.textContent?.trim();
    if (initialText) {
      analysisButton.dataset.originalText = initialText;
    }
  }

  let lastParams = null;
  let lastSearchParams = null;

  const resetAnalysis = () => {
    hide(analysisLoading);
    hide(analysisError);
    hide(analysisResult);
    if (analysisResult) {
      analysisResult.innerHTML = "";
    }
    if (analysisButton) {
      analysisButton.disabled = false;
      const originalText =
        analysisButton.dataset.originalText ||
        analysisButton.textContent ||
        "Проаналізувати [AI]";
      analysisButton.textContent = originalText;
    }
  };

  const hideAnalysisSection = () => {
    resetAnalysis();
    hide(analysisSection);
  };
  function showLoading() {
    show(loading);
    hide(err);
    hide(box);
    hide(zoombar);
    hide(downloadBtn);
    lastParams = null;
    lastSearchParams = null;
    hideAnalysisSection();
  }
  function showError(msg) {
    hide(loading);
    hide(box);
    hide(zoombar);
    if (err) {
      err.textContent = msg || "Сталася помилка";
      show(err);
    }
    hide(downloadBtn);
    lastParams = null;
    lastSearchParams = null;
    hideAnalysisSection();
  }
  function showTable(html) {
    if (box) box.innerHTML = html;
    hide(loading);
    hide(err);
    show(box);
    const zoomTarget = box
      ? box.querySelector("#tableZoomTarget")
      : null;
    toggle(zoombar, !!zoomTarget);

    // можна видалити наступну строчку якщо хочете, щоб зум не відновлювався до 100% після того, як користувач виведе інший звіт
    zoomController.reset();

    if (analysisSection && aiEndpoint) {
      resetAnalysis();
      show(analysisSection);
    }
  }

  const shouldUsePartnerSearch =
    typeof dataEndpoint === "string" &&
    (dataEndpoint.includes("overdue-debts") ||
      dataEndpoint.includes("accounts-reconciliation"));
  const MATCH_API = shouldUsePartnerSearch
    ? "/api/find-partner"
    : "/api/find-client";
  const suggestionsDropdown = $("contractorSuggestions");
  const COLLECTION_KEYS = [
    "results",
    "items",
    "data",
    "clients",
    "values",
    "matches",
    "list",
  ];
  const MAX_SUGGESTIONS = 30;
  let suggestionItems = [];
  let highlightedSuggestionIndex = -1;
  let suggestionsRenderId = 0;

  const isSuggestionsOpen = () =>
    !!suggestionsDropdown &&
    !suggestionsDropdown.classList.contains("is-hidden");

  const setComboboxExpanded = expanded => {
    if (contractorInput) {
      contractorInput.setAttribute(
        "aria-expanded",
        expanded ? "true" : "false",
      );
    }
  };

  const clearSuggestions = () => {
    if (!suggestionsDropdown) return;
    suggestionsDropdown.innerHTML = "";
  };

  const hideSuggestions = () => {
    if (!suggestionsDropdown) return;
    clearSuggestions();
    suggestionsDropdown.classList.add("is-hidden");
    suggestionItems = [];
    highlightedSuggestionIndex = -1;
    setComboboxExpanded(false);
    contractorInput?.removeAttribute("aria-activedescendant");
  };

  const ensureOptionVisible = option => {
    if (!option) return;
    const parent = option.parentElement;
    if (!parent) return;
    const optionTop = option.offsetTop;
    const optionBottom = optionTop + option.offsetHeight;
    if (optionTop < parent.scrollTop) {
      parent.scrollTop = optionTop;
    } else if (
      optionBottom >
      parent.scrollTop + parent.clientHeight
    ) {
      parent.scrollTop = optionBottom - parent.clientHeight;
    }
  };

  const highlightSuggestion = index => {
    if (!suggestionsDropdown) return;
    const options = Array.from(
      suggestionsDropdown.querySelectorAll(".combo-option"),
    );
    if (!options.length) {
      highlightedSuggestionIndex = -1;
      contractorInput?.removeAttribute("aria-activedescendant");
      return;
    }
    if (index < 0) index = 0;
    if (index >= options.length) index = options.length - 1;
    options.forEach((option, idx) => {
      const isActive = idx === index;
      option.classList.toggle("is-active", isActive);
      if (isActive) ensureOptionVisible(option);
    });
    highlightedSuggestionIndex = index;
    const activeOption = options[index];
    if (contractorInput) {
      if (activeOption) {
        const optionId =
          activeOption.dataset.optionId || activeOption.id;
        if (optionId) {
          activeOption.id = optionId;
          contractorInput.setAttribute(
            "aria-activedescendant",
            optionId,
          );
        } else {
          contractorInput.removeAttribute("aria-activedescendant");
        }
      } else {
        contractorInput.removeAttribute("aria-activedescendant");
      }
    }
  };

  const selectSuggestionByIndex = index => {
    const item = suggestionItems[index];
    if (!item || !contractorInput) return;
    const value = item.value || item.label || "";
    contractorInput.value = value;
    contractorInput.dispatchEvent(new Event("input"));
    contractorInput.dispatchEvent(new Event("change"));
    hideSuggestions();
    contractorInput.focus();
    const caret = contractorInput.value.length;
    if (typeof contractorInput.setSelectionRange === "function") {
      contractorInput.setSelectionRange(caret, caret);
    }
  };

  const pickFirst = (source, keys) => {
    for (const key of keys) {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        const candidate = toDisplayString(source[key]);
        if (candidate) return candidate;
      }
    }
    return "";
  };

  const normaliseSuggestion = item => {
    if (item == null) return null;
    if (typeof item === "string" || typeof item === "number") {
      const value = toDisplayString(item);
      return value ? { value, label: value, details: null } : null;
    }
    if (typeof item === "object") {
      const entries = Object.entries(item)
        .map(([key, value]) => [key, toDisplayString(value)])
        .filter(([, value]) => !!value);
      if (!entries.length) return null;
      const label =
        pickFirst(item, [
          "name",
          "contractor",
          "fullName",
          "title",
          "label",
          "description",
          "value",
          "text",
        ]) || entries[0][1];
      const value =
        pickFirst(item, [
          "value",
          "name",
          "contractor",
          "fullName",
          "code",
          "id",
          "text",
          "label",
          "description",
        ]) || label;
      const secondaryValues = entries
        .map(([, value]) => value)
        .filter(value => value !== label)
        .filter((value, index, arr) => arr.indexOf(value) === index)
        .slice(0, 4);
      return {
        value,
        label,
        details: secondaryValues.length
          ? secondaryValues.join(" • ")
          : null,
      };
    }
    return null;
  };

  const expandCollection = data => {
    if (data == null) return [];
    if (Array.isArray(data)) return data;
    if (typeof data === "string") {
      return data
        .split(/\r?\n/)
        .map(item => item.trim())
        .filter(Boolean);
    }
    if (typeof data === "object") {
      for (const key of COLLECTION_KEYS) {
        if (Array.isArray(data[key])) return data[key];
      }
      return [data];
    }
    return [];
  };

  const renderSuggestions = (rawList, query) => {
    if (!suggestionsDropdown) return;
    suggestionsRenderId += 1;
    const renderId = suggestionsRenderId;
    suggestionItems = rawList
      .map(item => normaliseSuggestion(item))
      .filter(Boolean);
    const seen = new Set();
    suggestionItems = suggestionItems
      .filter(item => {
        const key = `${(item.value || item.label || "").toLowerCase()}|${(item.label || "").toLowerCase()}|${item.details || ""}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, MAX_SUGGESTIONS);
    clearSuggestions();
    suggestionsDropdown.scrollTop = 0;
    if (!suggestionItems.length) {
      const empty = document.createElement("div");
      empty.className = "combo-empty";
      empty.textContent = query
        ? `Збігів не знайдено для “${query}”.`
        : "Збігів не знайдено.";
      suggestionsDropdown.appendChild(empty);
      suggestionsDropdown.classList.remove("is-hidden");
      setComboboxExpanded(true);
      contractorInput?.removeAttribute("aria-activedescendant");
      return;
    }
    suggestionItems.forEach((item, index) => {
      const option = document.createElement("button");
      option.type = "button";
      option.className = "combo-option";
      option.dataset.index = String(index);
      option.dataset.value = item.value || item.label || "";
      option.setAttribute("role", "option");
      const optionId = `contractorSuggestion-${renderId}-${index}`;
      option.id = optionId;
      option.dataset.optionId = optionId;

      const title = document.createElement("div");
      title.className = "combo-option-title";
      title.textContent = item.label || item.value || "";
      option.appendChild(title);

      if (item.details) {
        const details = document.createElement("div");
        details.className = "combo-option-details";
        details.textContent = item.details;
        option.appendChild(details);
      }

      option.addEventListener("click", () =>
        selectSuggestionByIndex(index),
      );

      suggestionsDropdown.appendChild(option);
    });
    suggestionsDropdown.classList.remove("is-hidden");
    setComboboxExpanded(true);
    highlightSuggestion(0);
  };

  async function fetchContractorSuggestions(query) {
    const url = `${MATCH_API}?q=${encodeURIComponent(query)}`;
    const response = await fetch(url, {
      headers: { Accept: "application/json, text/plain;q=0.8" },
    });
    const rawText = await response.text();
    if (!response.ok) {
      let message = toDisplayString(rawText);
      if (!message && rawText) {
        try {
          const payload = JSON.parse(rawText);
          message = toDisplayString(
            payload?.error || payload?.message,
          );
        } catch {
          message = toDisplayString(rawText);
        }
      }
      throw new Error(message || "Не вдалося знайти клієнтів");
    }
    if (!rawText) {
      return [];
    }
    try {
      const data = JSON.parse(rawText);
      return expandCollection(data);
    } catch {
      return expandCollection(rawText);
    }
  }

  contractorInput?.addEventListener("keydown", e => {
    const open = isSuggestionsOpen();
    if (open) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        const nextIndex =
          highlightedSuggestionIndex < suggestionItems.length - 1 &&
          highlightedSuggestionIndex >= 0
            ? highlightedSuggestionIndex + 1
            : 0;
        highlightSuggestion(nextIndex);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        const prevIndex =
          highlightedSuggestionIndex > 0
            ? highlightedSuggestionIndex - 1
            : suggestionItems.length - 1;
        highlightSuggestion(prevIndex);
        return;
      }
      if (e.key === "Enter") {
        if (highlightedSuggestionIndex >= 0) {
          e.preventDefault();
          selectSuggestionByIndex(highlightedSuggestionIndex);
          return;
        }
      }
      if (e.key === "Escape") {
        hideSuggestions();
        return;
      }
      if (e.key === "Tab") {
        hideSuggestions();
      }
    }
    if (e.key === "Enter") {
      e.preventDefault();
      const raw = normaliseValue(contractorInput?.value);
      if (!raw || isDefaultContractor(raw)) {
        contractorInput.value = DEFAULT_CONTRACTOR_VALUE;
        hideSuggestions();
        return;
      }
      searchBtn?.click();
    }
  });

  contractorInput?.addEventListener("input", () => {
    const raw = normaliseValue(contractorInput.value);
    if (!raw || isDefaultContractor(raw)) {
      hideSuggestions();
    }
  });

  searchBtn?.addEventListener("click", async () => {
    const raw = normaliseValue(contractorInput?.value);
    const q = isDefaultContractor(raw) ? "" : raw;
    if (!q) {
      contractorInput?.focus();
      hideSuggestions();
      return;
    }
    searchBtn.classList.add("loading");
    searchBtn.disabled = true;
    try {
      const matches = await fetchContractorSuggestions(q);
      renderSuggestions(matches, q);
    } catch (e) {
      hideSuggestions();
      const message =
        e && typeof e === "object" && "message" in e
          ? e.message
          : null;
      showError(message || "Не вдалося знайти клієнтів");
    } finally {
      searchBtn.disabled = false;
      searchBtn.classList.remove("loading");
    }
  });

  document.addEventListener("click", event => {
    if (!isSuggestionsOpen()) return;
    const target = event.target;
    if (!target) return;
    if (typeof Node !== "undefined" && !(target instanceof Node))
      return;
    if (target === contractorInput || target === searchBtn) return;
    if (suggestionsDropdown && suggestionsDropdown.contains(target))
      return;
    hideSuggestions();
  });

  downloadBtn?.addEventListener("click", async () => {
    if (!exportEndpoint || !lastParams || downloadBtn.disabled)
      return;

    try {
      const requestUrl = new URL(
        exportEndpoint,
        window.location.origin,
      );
      const payloadParams =
        lastParams instanceof URLSearchParams
          ? lastParams
          : new URLSearchParams(lastParams);
      const response = await fetch(requestUrl.toString(), {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type":
            "application/x-www-form-urlencoded;charset=UTF-8",
        },
        body: payloadParams.toString(),
      });
      const text = await response.text();
      let payload = null;
      if (text) {
        try {
          payload = JSON.parse(text);
        } catch (err) {
          payload = null;
        }
      }

      if (!response.ok || (payload && payload.error)) {
        const errorMessage =
          payload?.error || "Не вдалося завантажити дані";
        throw new Error(errorMessage);
      }

      const successMessage =
        payload?.message || "Файл надіслано в бот";
      showAlert(successMessage);
    } catch (e) {
      showAlert(e.message || "Сталася помилка");
    } finally {
      downloadBtn.disabled = false;
    }
  });

  getBtn?.addEventListener("click", async () => {
    hideSuggestions();
    const from = dateFromEl?.value;
    const to = dateToEl?.value;

    if (hasDateRange) {
      if (!from || !to) {
        showError("Будь ласка, оберіть період.");
        return;
      }

      if (new Date(from) > new Date(to)) {
        showError("Початок не може бути пізніше за кінець.");
        return;
      }
    }

    showLoading();

    const params = new URLSearchParams();
    if (hasDateRange) {
      params.set("from", from);
      params.set("to", to);
    }

    if (contractorInput) {
      const contractorRaw = normaliseValue(contractorInput.value);
      const contractor = isDefaultContractor(contractorRaw)
        ? ""
        : contractorRaw;
      if (contractor) {
        params.set("contractor", contractor);
      }
    }
    try {
      const requestUrl = new URL(
        dataEndpoint,
        window.location.origin,
      );
      requestUrl.search = params.toString();
      const r = await fetch(requestUrl.toString(), {
        headers: { Accept: "text/html" },
      });
      const html = await r.text();
      if (!r.ok) throw new Error("Не вдалося отримати дані");
      showTable(html);
      lastSearchParams = new URLSearchParams(params);
      if (downloadBtn && exportEndpoint) {
        lastParams = new URLSearchParams(params);
        show(downloadBtn);
        downloadBtn.disabled = false;
      }
    } catch (e) {
      showError(e.message);
    }
  });

  analysisButton?.addEventListener("click", async () => {
    if (!aiEndpoint) return;
    if (!lastSearchParams) {
      show(analysisError);
      if (analysisError) {
        analysisError.textContent = "Спочатку завантажте дані.";
      }
      return;
    }

    const originalText =
      analysisButton.dataset.originalText ||
      analysisButton.textContent?.trim() ||
      "Проаналізувати [AI]";
    analysisButton.dataset.originalText = originalText;
    analysisButton.disabled = true;
    analysisButton.textContent = "Аналізую…";
    hide(analysisError);
    hide(analysisResult);
    show(analysisLoading);

    try {
      const requestUrl = new URL(aiEndpoint, window.location.origin);
      const response = await fetch(requestUrl.toString(), {
        method: "POST",
        headers: {
          "Content-Type":
            "application/x-www-form-urlencoded;charset=UTF-8",
          Accept: "text/plain, text/html",
        },
        body: lastSearchParams.toString(),
      });
      const text = await response.text();
      if (!response.ok) {
        throw new Error(text || "Не вдалося виконати аналіз");
      }
      if (analysisResult) {
        analysisResult.textContent = text || "";
        if (text) {
          show(analysisResult);
        } else {
          hide(analysisResult);
        }
      }
    } catch (e) {
      if (analysisError) {
        analysisError.textContent =
          e.message || "Не вдалося виконати аналіз";
        show(analysisError);
      }
    } finally {
      hide(analysisLoading);
      analysisButton.disabled = false;
      analysisButton.textContent =
        analysisButton.dataset.originalText || originalText;
    }
  });
})();

// Everything code is for renderRepresentativesPicker below must be cleaned
// Everything code is for renderRepresentativesPicker below must be cleaned
// Everything code is for renderRepresentativesPicker below must be cleaned
// Everything code is for renderRepresentativesPicker below must be cleaned
// Everything code is for renderRepresentativesPicker below must be cleaned
// Everything code is for renderRepresentativesPicker below must be cleaned
// Everything code is for renderRepresentativesPicker below must be cleaned
// Everything code is for renderRepresentativesPicker below must be cleaned
// Everything code is for renderRepresentativesPicker below must be cleaned
// Everything code is for renderRepresentativesPicker below must be cleaned
// Everything code is for renderRepresentativesPicker below must be cleaned
// Everything code is for renderRepresentativesPicker below must be cleaned
// Everything code is for renderRepresentativesPicker below must be cleaned
// Everything code is for renderRepresentativesPicker below must be cleaned
// Everything code is for renderRepresentativesPicker below must be cleaned
// Everything code is for renderRepresentativesPicker below must be cleaned
// Everything code is for renderRepresentativesPicker below must be cleaned
// Everything code is for renderRepresentativesPicker below must be cleaned
// Everything code is for renderRepresentativesPicker below must be cleaned
// Everything code is for renderRepresentativesPicker below must be cleaned
// Everything code is for renderRepresentativesPicker below must be cleaned
// Everything code is for renderRepresentativesPicker below must be cleaned
// Everything code is for renderRepresentativesPicker below must be cleaned
// Everything code is for renderRepresentativesPicker below must be cleaned
// Everything code is for renderRepresentativesPicker below must be cleaned
// Everything code is for renderRepresentativesPicker below must be cleaned
// Everything code is for renderRepresentativesPicker below must be cleaned
// Everything code is for renderRepresentativesPicker below must be cleaned
// Everything code is for renderRepresentativesPicker below must be cleaned
// Everything code is for renderRepresentativesPicker below must be cleaned
// Everything code is for renderRepresentativesPicker below must be cleaned
// Everything code is for renderRepresentativesPicker below must be cleaned
// Everything code is for renderRepresentativesPicker below must be cleaned
// Everything code is for renderRepresentativesPicker below must be cleaned
// Everything code is for renderRepresentativesPicker below must be cleaned
// Everything code is for renderRepresentativesPicker below must be cleaned
// Everything code is for renderRepresentativesPicker below must be cleaned
// Everything code is for renderRepresentativesPicker below must be cleaned
// Everything code is for renderRepresentativesPicker below must be cleaned
// Everything code is for renderRepresentativesPicker below must be cleaned
// Everything code is for renderRepresentativesPicker below must be cleaned
// Everything code is for renderRepresentativesPicker below must be cleaned
// Everything code is for renderRepresentativesPicker below must be cleaned
// Everything code is for renderRepresentativesPicker below must be cleaned
// Everything code is for renderRepresentativesPicker below must be cleaned
// Everything code is for renderRepresentativesPicker below must be cleaned
// Everything code is for renderRepresentativesPicker below must be cleaned
// Everything code is for renderRepresentativesPicker below must be cleaned

(function () {
  const section =
    document.querySelector(".section") ||
    document.querySelector(".page-section") ||
    document.querySelector("[data-user-role]");
  const userRole = section?.dataset?.userRole || "ANONYMOUS";
  const representativesCookieName =
    section?.dataset?.representativesCookie ||
    "salesPlanRepresentatives";
  const downloadToolbar = document.getElementById("downloadToolbar");
  const downloadDataBtn = document.getElementById("downloadDataBtn");

  const showAlert = message => {
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.showAlert(message);
    } else {
      alert(message);
    }
  };

  const hideDownloadButton = () => {
    if (downloadToolbar) {
      downloadToolbar.style.display = "none";
    }
    if (downloadDataBtn) {
      downloadDataBtn.disabled = true;
    }
  };

  const showDownloadButton = () => {
    if (downloadToolbar) {
      downloadToolbar.style.display = "";
    }
    if (downloadDataBtn) {
      downloadDataBtn.disabled = false;
    }
  };

  const requestPlanData = async () => {
    const response = await fetch("/api/sales/plan/data");
    const contentType = response.headers.get("content-type") || "";
    const text = await response.text();
    const isJson = contentType.includes("application/json");

    let payload = text;
    if (isJson) {
      try {
        payload = text ? JSON.parse(text) : {};
      } catch (err) {
        throw new Error("Неправильний формат даних");
      }
    }

    if (!response.ok) {
      const errorMessage = isJson ? payload?.error : text;
      throw new Error(errorMessage || "Не вдалося отримати дані");
    }

    return { isJson, payload };
  };

  const sendExportRequest = async () => {
    if (!downloadDataBtn) {
      return;
    }

    const originalText =
      downloadDataBtn.dataset.originalText ||
      downloadDataBtn.textContent.trim();
    downloadDataBtn.dataset.originalText = originalText;
    downloadDataBtn.disabled = true;
    downloadDataBtn.textContent = "Надсилаю…";

    try {
      const response = await fetch("/api/sales/plan/export", {
        method: "POST",
        headers: {
          Accept: "application/json",
        },
      });
      const text = await response.text();
      let payload = {};
      if (text) {
        try {
          payload = JSON.parse(text);
        } catch (err) {
          payload = {};
        }
      }

      if (!response.ok || payload.error) {
        const message =
          payload?.error || "Не вдалося завантажити дані";
        throw new Error(message);
      }

      const successMessage =
        payload?.message || "Файл надіслано в бот";
      showAlert(successMessage);
    } catch (error) {
      showAlert(error.message || "Сталася помилка");
    } finally {
      downloadDataBtn.disabled = false;
      downloadDataBtn.textContent =
        downloadDataBtn.dataset.originalText || "Завантажити дані";
    }
  };

  if (downloadDataBtn) {
    downloadDataBtn.addEventListener("click", event => {
      event.preventDefault();
      if (!downloadDataBtn.disabled) {
        sendExportRequest();
      }
    });
  }

  if (userRole === "MANAGER") {
    const $ = id => document.getElementById(id);
    const loading = $("loading");
    const planContent = $("planContent");
    const errorEl = $("error");

    const fmt = n => (n ?? 0).toLocaleString("uk-UA");
    const formatCurrency = n => `${fmt(Math.round(n ?? 0))} грн`;

    const renderSummary = data => {
      const overallPlan = Number(data.overallPlan ?? 0);
      const totalExecution = Number(data.totalExecution ?? 0);
      const remainingAmount = Number(
        data.remainingAmount ??
          Math.max(overallPlan - totalExecution, 0),
      );
      const overdueDebtAmount = Number(data.overdueDebtAmount ?? 0);
      const overdueDebtPercent = Number(
        data.overdueDebtPercent ??
          (overallPlan > 0
            ? (overdueDebtAmount * 100) / overallPlan
            : 0),
      );

      const totalWorkDays = Number(data.totalWorkDays ?? 0);
      const workedDays = Number(data.workedDays ?? 0);
      const remainingDays = Number(
        data.remainingWorkDays ??
          Math.max(totalWorkDays - workedDays, 0),
      );
      const workedRatio = Number(
        data.workedRatio ??
          (totalWorkDays > 0 ? workedDays / totalWorkDays : 0),
      );
      const workedPercent = Number(
        data.workedPercent ?? workedRatio * 100,
      );

      const percent = Number(
        data.percent ??
          (overallPlan > 0
            ? (totalExecution * 100) / overallPlan
            : 0),
      );
      const forecastAmount =
        workedRatio > 0
          ? totalExecution / workedRatio
          : totalExecution;
      const forecastPercent =
        overallPlan > 0 ? (forecastAmount * 100) / overallPlan : 0;
      const dailyNeed =
        remainingDays > 0
          ? Math.max(overallPlan - totalExecution, 0) / remainingDays
          : 0;

      $("overallPlan").textContent = formatCurrency(overallPlan);
      $("totalExecution").textContent =
        formatCurrency(totalExecution);
      $("remainingAmount").textContent =
        formatCurrency(remainingAmount);
      $("percent").textContent = `${percent.toFixed(1)}%`;
      $("progressBar").style.width =
        `${Math.min(percent, 100).toFixed(1)}%`;

      $("workedDays").textContent = workedDays.toString();
      $("remainingDays").textContent = remainingDays.toString();
      $("workedPercent").textContent = `${workedPercent.toFixed(0)}%`;

      $("tablePlan").textContent = fmt(overallPlan);
      $("tableExecution").textContent = fmt(totalExecution);
      $("tablePercent").textContent = `${percent.toFixed(1)}%`;
      $("tableForecastAmount").textContent = fmt(forecastAmount);
      $("tableForecastPercent").textContent =
        `${forecastPercent.toFixed(1)}%`;
      $("tableRemaining").textContent = fmt(remainingAmount);
      $("tableDailyNeed").textContent = fmt(dailyNeed);
      $("tableDebtPercent").textContent =
        `${overdueDebtPercent.toFixed(1)}%`;
      $("tableDebtAmount").textContent = fmt(overdueDebtAmount);

      const managerName = $("managerName");
      if (managerName) {
        managerName.textContent = data.representativeName || "—";
      }

      if (planContent) {
        planContent.style.display = "grid";
      }
      if (errorEl) {
        errorEl.style.display = "none";
      }
    };

    const showError = message => {
      if (planContent) {
        planContent.style.display = "none";
      }
      if (errorEl) {
        errorEl.style.display = "";
        errorEl.textContent = message || "Сталася помилка";
      }
    };

    const loadManagerData = async () => {
      if (loading) {
        loading.style.display = "";
      }
      if (errorEl) {
        errorEl.style.display = "none";
      }
      if (planContent) {
        planContent.style.display = "none";
      }

      try {
        const { isJson, payload } = await requestPlanData();
        if (!isJson) {
          throw new Error("Неправильний формат даних");
        }

        renderSummary(payload);
        showDownloadButton();
      } catch (error) {
        showError(error.message);
        hideDownloadButton();
        throw error;
      } finally {
        if (loading) {
          loading.style.display = "none";
        }
      }
    };

    hideDownloadButton();
    loadManagerData().catch(() => {});
  } else if (userRole === "SUPERVISOR" || userRole === "OWNER") {
    const loading = document.getElementById("loading");
    const tableContainer = document.getElementById(
      "adminTableContainer",
    );
    const errorEl = document.getElementById("adminError");
    const filterContainer = document.getElementById(
      "representativesFilter",
    );
    const optionsContainer = document.getElementById(
      "representativesOptions",
    );
    const summaryEl = document.getElementById(
      "representativesSummary",
    );
    const selectAllBtn = document.getElementById(
      "representativesSelectAll",
    );
    const fetchReportBtn = document.getElementById(
      "representativesFetchReport",
    );

    hideDownloadButton();

    const showLoading = () => {
      if (loading) {
        loading.style.display = "";
      }
      if (tableContainer) {
        tableContainer.style.display = "none";
      }
      if (errorEl) {
        errorEl.style.display = "none";
      }
    };

    const showError = message => {
      if (loading) {
        loading.style.display = "none";
      }
      if (tableContainer) {
        tableContainer.style.display = "none";
      }
      if (errorEl) {
        errorEl.style.display = "";
        errorEl.textContent = message || "Сталася помилка";
      }
    };

    const renderTable = html => {
      if (tableContainer) {
        tableContainer.innerHTML = html;
        tableContainer.style.display = "block";
      }
      if (loading) {
        loading.style.display = "none";
      }
      if (errorEl) {
        errorEl.style.display = "none";
      }
    };

    const resetTableView = () => {
      if (tableContainer) {
        tableContainer.innerHTML = "";
        tableContainer.style.display = "none";
      }
      if (loading) {
        loading.style.display = "";
      }
      if (errorEl) {
        errorEl.style.display = "none";
      }
      hideDownloadButton();
    };

    let isFetchingReport = false;
    let availableRepresentatives = [];

    const getCookieValue = name => {
      const cookies = document.cookie
        ? document.cookie.split(";")
        : [];
      const prefix = `${name}=`;
      for (const cookie of cookies) {
        const trimmed = cookie.trim();
        if (trimmed.startsWith(prefix)) {
          return trimmed.substring(prefix.length);
        }
      }
      return null;
    };

    const setCookieValue = (name, value) => {
      const encoded = encodeURIComponent(value);
      const maxAge = 60 * 60 * 24 * 30;
      document.cookie = `${name}=${encoded}; path=/; max-age=${maxAge}; SameSite=Lax`;
    };

    const normalizeSelection = values => {
      if (
        !Array.isArray(values) ||
        !values.length ||
        !availableRepresentatives.length
      ) {
        return [];
      }

      const availableSet = new Set(availableRepresentatives);
      const normalized = [];

      values.forEach(value => {
        if (typeof value !== "string") {
          return;
        }

        const trimmed = value.trim();
        if (
          !trimmed ||
          !availableSet.has(trimmed) ||
          normalized.includes(trimmed)
        ) {
          return;
        }

        normalized.push(trimmed);
      });

      return normalized;
    };

    const readSelectionFromCookie = () => {
      const rawValue = getCookieValue(representativesCookieName);
      if (!rawValue) {
        return [];
      }

      try {
        const decoded = decodeURIComponent(rawValue);
        const parsed = JSON.parse(decoded);
        return normalizeSelection(parsed);
      } catch (err) {
        console.warn(
          "Не вдалося прочитати кукі з представниками",
          err,
        );
        return [];
      }
    };

    const writeSelectionToCookie = selection => {
      const normalized = normalizeSelection(selection);
      const finalSelection = normalized.length
        ? normalized
        : [...availableRepresentatives];
      setCookieValue(
        representativesCookieName,
        JSON.stringify(finalSelection),
      );
      return finalSelection;
    };

    const updateSummaryLabel = selection => {
      if (!summaryEl) {
        return;
      }

      if (!availableRepresentatives.length) {
        summaryEl.textContent = "Представники";
        return;
      }

      if (
        !selection.length ||
        selection.length === availableRepresentatives.length
      ) {
        summaryEl.textContent = "Представники: всі";
      } else {
        summaryEl.textContent = `Представники: ${selection.length}`;
      }
    };

    const getSelectedFromDom = () => {
      if (!optionsContainer) {
        return [];
      }

      return Array.from(
        optionsContainer.querySelectorAll('input[type="checkbox"]'),
      )
        .filter(checkbox => checkbox.checked)
        .map(checkbox => checkbox.value);
    };

    const updateFetchButtonState = () => {
      if (!fetchReportBtn) {
        return;
      }

      const hasSelection =
        availableRepresentatives.length > 0 &&
        getSelectedFromDom().length > 0;
      fetchReportBtn.disabled = isFetchingReport || !hasSelection;
    };

    const renderRepresentatives = (
      representatives,
      initialSelection,
    ) => {
      if (!filterContainer || !optionsContainer) {
        return;
      }

      availableRepresentatives = representatives;
      optionsContainer.innerHTML = "";

      let selection = [];
      if (
        Array.isArray(initialSelection) &&
        initialSelection.length
      ) {
        selection = normalizeSelection(initialSelection);
      }

      if (!selection.length) {
        selection = readSelectionFromCookie();
      }

      if (!selection.length) {
        selection = [...availableRepresentatives];
      }

      selection = writeSelectionToCookie(selection);
      const selectionSet = new Set(selection);

      representatives.forEach((name, index) => {
        const optionId = `representative-${index}`;
        const wrapper = document.createElement("label");
        wrapper.setAttribute("for", optionId);
        wrapper.className = "representatives-option";

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.id = optionId;
        checkbox.value = name;
        checkbox.checked = selectionSet.has(name);

        checkbox.addEventListener("change", () => {
          const selectedValues = getSelectedFromDom();
          if (!selectedValues.length) {
            checkbox.checked = true;
            return;
          }

          const finalSelection =
            writeSelectionToCookie(selectedValues);
          updateSummaryLabel(finalSelection);
          resetTableView();
          updateFetchButtonState();
        });

        const textNode = document.createElement("span");
        textNode.textContent = name;

        wrapper.appendChild(checkbox);
        wrapper.appendChild(textNode);
        optionsContainer.appendChild(wrapper);
      });

      filterContainer.style.display = "";
      updateSummaryLabel(selection);
      updateFetchButtonState();
    };

    const fetchRepresentatives = async () => {
      if (!filterContainer || !optionsContainer) {
        return;
      }

      try {
        const response = await fetch(
          "/api/sales/plan/representatives",
          {
            headers: { Accept: "application/json" },
          },
        );
        const text = await response.text();
        let payload = null;
        if (text) {
          try {
            payload = JSON.parse(text);
          } catch (err) {
            payload = null;
          }
        }
        if (!payload) {
          payload = {};
        }

        if (!response.ok || !payload) {
          throw new Error(
            payload?.error ||
              "Не вдалося отримати список представників",
          );
        }

        const representatives = Array.isArray(payload.representatives)
          ? payload.representatives
              .filter(
                name =>
                  typeof name === "string" && name.trim().length,
              )
              .map(name => name.trim())
          : [];

        if (!representatives.length) {
          availableRepresentatives = [];
          filterContainer.style.display = "none";
          if (fetchReportBtn) {
            fetchReportBtn.disabled = true;
          }
          resetTableView();
          updateFetchButtonState();
          return;
        }

        const selected = Array.isArray(payload.selected)
          ? payload.selected
          : [];
        renderRepresentatives(representatives, selected);
      } catch (error) {
        console.error("Failed to load representatives", error);
        availableRepresentatives = [];
        if (filterContainer) {
          filterContainer.style.display = "none";
        }
        if (fetchReportBtn) {
          fetchReportBtn.disabled = true;
        }
        resetTableView();
        updateFetchButtonState();
      }
    };

    const loadTable = async () => {
      showLoading();
      try {
        const { isJson, payload } = await requestPlanData();
        if (isJson) {
          const message =
            payload?.error || "Не вдалося отримати звіт";
          throw new Error(message);
        }

        renderTable(payload);
        showDownloadButton();
      } catch (error) {
        showError(error.message);
        hideDownloadButton();
        throw error;
      }
    };

    const fetchReport = async () => {
      if (isFetchingReport) {
        return;
      }

      isFetchingReport = true;
      hideDownloadButton();

      if (fetchReportBtn) {
        const originalText =
          fetchReportBtn.dataset.originalText ||
          fetchReportBtn.textContent.trim();
        fetchReportBtn.dataset.originalText = originalText;
        fetchReportBtn.textContent = "Отримую…";
      }

      updateFetchButtonState();

      try {
        await loadTable();
      } finally {
        isFetchingReport = false;
        if (fetchReportBtn) {
          fetchReportBtn.textContent =
            fetchReportBtn.dataset.originalText || "Отримати звіт";
        }
        updateFetchButtonState();
      }
    };

    if (fetchReportBtn) {
      fetchReportBtn.addEventListener("click", event => {
        event.preventDefault();
        if (fetchReportBtn.disabled) {
          return;
        }
        fetchReport().catch(() => {});
      });
    }

    if (selectAllBtn) {
      selectAllBtn.addEventListener("click", event => {
        event.preventDefault();

        if (!availableRepresentatives.length) {
          return;
        }

        if (optionsContainer) {
          optionsContainer
            .querySelectorAll('input[type="checkbox"]')
            .forEach(checkbox => {
              checkbox.checked = true;
            });
        }

        const finalSelection = writeSelectionToCookie([
          ...availableRepresentatives,
        ]);
        updateSummaryLabel(finalSelection);
        resetTableView();
        updateFetchButtonState();
      });
    }

    resetTableView();
    fetchRepresentatives().then(() => {
      updateFetchButtonState();
    });
  }
})();
