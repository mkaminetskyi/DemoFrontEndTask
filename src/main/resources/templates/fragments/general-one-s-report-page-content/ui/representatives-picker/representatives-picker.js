(function () {
  // Перевірка, чи елемент вже ініціалізований
  const adminView = document.getElementById("adminView");
  if (!adminView || adminView.dataset.initialized === "true") {
    return;
  }
  adminView.dataset.initialized = "true";

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
