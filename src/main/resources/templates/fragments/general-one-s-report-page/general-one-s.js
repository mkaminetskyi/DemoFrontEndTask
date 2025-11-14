(function(){
    const section = document.getElementById("accountsWithClientsSection");
    if (!section) return;
    const dataEndpoint = section.dataset.dataEndpoint;
    const exportEndpointRaw = section.dataset.exportEndpoint;
    const exportEndpoint = exportEndpointRaw && exportEndpointRaw !== "null" ? exportEndpointRaw : null;
    const aiEndpointRaw = section.dataset.aiEndpoint;
    const aiEndpoint = aiEndpointRaw && aiEndpointRaw !== "null" ? aiEndpointRaw : null;
    if (!dataEndpoint) return;
    const $ = id => document.getElementById(id);
    const getBtn = $("getBtn");
    const downloadBtn = $("downloadBtn");
    if (downloadBtn && !downloadBtn.dataset.originalText) {
        const initialText = downloadBtn.textContent?.trim();
        if (initialText) {
            downloadBtn.dataset.originalText = initialText;
        }
    }
    const tg = window.Telegram?.WebApp;
    const dateFromEl = $("dateFrom");
    const dateToEl = $("dateTo");
    const hasDateRange = !!dateFromEl || !!dateToEl;
    function toISODateLocal(d) {
        const tz = d.getTimezoneOffset() * 60000;
        const local = new Date(d.getTime() - tz);
        return local.toISOString().slice(0, 10);
    }
    function setDefaultRange() {
        const now = new Date();
        const shouldUseRollingMonth = typeof dataEndpoint === "string"
            && (dataEndpoint.includes("accounts-reconciliation") || dataEndpoint.includes("cash-registers"));
        const start = shouldUseRollingMonth
            ? (() => {
                const date = new Date(now);
                date.setMonth(date.getMonth() - 1);
                return date;
            })()
            : new Date(now.getFullYear(), now.getMonth(), 1);
        const end = shouldUseRollingMonth
            ? now
            : new Date(now.getFullYear(), now.getMonth() + 1, 0);
        if (dateFromEl && !dateFromEl.value) dateFromEl.value = toISODateLocal(start);
        if (dateToEl && !dateToEl.value) dateToEl.value = toISODateLocal(end);
    }
    if (hasDateRange) {
        setDefaultRange();
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
    const DEFAULT_CONTRACTOR_VALUE = "всі клієнти";
    const normaliseValue = (value) => (value || "").trim();
    const isDefaultContractor = (value) => normaliseValue(value).toLowerCase() === DEFAULT_CONTRACTOR_VALUE;

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
    let zoom = 1;
    const show = (el) => el && el.classList.remove("is-hidden");
    const hide = (el) => el && el.classList.add("is-hidden");
    const toggle = (el, shouldShow) => shouldShow ? show(el) : hide(el);
    const showAlert = (message) => {
        if (!message) return;
        if (tg && typeof tg.showAlert === "function") {
            tg.showAlert(message);
        } else {
            alert(message);
        }
    };
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
            const originalText = analysisButton.dataset.originalText || analysisButton.textContent || "Проаналізувати [AI]";
            analysisButton.textContent = originalText;
        }
    };

    const hideAnalysisSection = () => {
        resetAnalysis();
        hide(analysisSection);
    };
    function showLoading(){
        show(loading);
        hide(err);
        hide(box);
        hide(zoombar);
        hide(downloadBtn);
        lastParams = null;
        lastSearchParams = null;
        hideAnalysisSection();
    }
    function showError(msg){
        hide(loading);
        hide(box);
        hide(zoombar);
        if (err){
            err.textContent = msg || "Сталася помилка";
            show(err);
        }
        hide(downloadBtn);
        lastParams = null;
        lastSearchParams = null;
        hideAnalysisSection();
    }
    function showTable(html){
        if (box) box.innerHTML = html;
        hide(loading);
        hide(err);
        show(box);
        const zoomTarget = box ? box.querySelector("#tableZoomTarget") : null;
        toggle(zoombar, !!zoomTarget);
        zoom = 1;
        applyZoom();
        if (analysisSection && aiEndpoint) {
            resetAnalysis();
            show(analysisSection);
        }
    }
    function applyZoom(){
        const zoomTarget = box ? box.querySelector("#tableZoomTarget") : null;
        if (!zoomTarget) return;
        zoomTarget.style.transform = `scale(${zoom})`;
        if (zoomLabel) zoomLabel.textContent = Math.round(zoom * 100) + "%";
    }
    zoomInBtn?.addEventListener("click", () => { zoom = Math.min(2, zoom + 0.1); applyZoom(); });
    zoomOutBtn?.addEventListener("click", () => { zoom = Math.max(0.5, zoom - 0.1); applyZoom(); });
    zoomResetBtn?.addEventListener("click", () => { zoom = 1; applyZoom(); });
    const shouldUsePartnerSearch = typeof dataEndpoint === "string"
        && (dataEndpoint.includes("overdue-debts") || dataEndpoint.includes("accounts-reconciliation"));
    const MATCH_API = shouldUsePartnerSearch ? "/api/find-partner" : "/api/find-client";
    const suggestionsDropdown = $("contractorSuggestions");
    const COLLECTION_KEYS = ["results", "items", "data", "clients", "values", "matches", "list"];
    const MAX_SUGGESTIONS = 30;
    let suggestionItems = [];
    let highlightedSuggestionIndex = -1;
    let suggestionsRenderId = 0;

    const toDisplayString = (value) => {
        if (value == null) return "";
        if (typeof value === "string") return value.trim();
        if (typeof value === "number") return value.toString();
        return "";
    };

    const isSuggestionsOpen = () => !!suggestionsDropdown && !suggestionsDropdown.classList.contains("is-hidden");

    const setComboboxExpanded = (expanded) => {
        if (contractorInput) {
            contractorInput.setAttribute("aria-expanded", expanded ? "true" : "false");
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

    const ensureOptionVisible = (option) => {
        if (!option) return;
        const parent = option.parentElement;
        if (!parent) return;
        const optionTop = option.offsetTop;
        const optionBottom = optionTop + option.offsetHeight;
        if (optionTop < parent.scrollTop) {
            parent.scrollTop = optionTop;
        } else if (optionBottom > parent.scrollTop + parent.clientHeight) {
            parent.scrollTop = optionBottom - parent.clientHeight;
        }
    };

    const highlightSuggestion = (index) => {
        if (!suggestionsDropdown) return;
        const options = Array.from(suggestionsDropdown.querySelectorAll(".combo-option"));
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
                const optionId = activeOption.dataset.optionId || activeOption.id;
                if (optionId) {
                    activeOption.id = optionId;
                    contractorInput.setAttribute("aria-activedescendant", optionId);
                } else {
                    contractorInput.removeAttribute("aria-activedescendant");
                }
            } else {
                contractorInput.removeAttribute("aria-activedescendant");
            }
        }
    };

    const selectSuggestionByIndex = (index) => {
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

    const normaliseSuggestion = (item) => {
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
            const label = pickFirst(item, ["name", "contractor", "fullName", "title", "label", "description", "value", "text"]) || entries[0][1];
            const value = pickFirst(item, ["value", "name", "contractor", "fullName", "code", "id", "text", "label", "description"]) || label;
            const secondaryValues = entries
                .map(([, value]) => value)
                .filter((value) => value !== label)
                .filter((value, index, arr) => arr.indexOf(value) === index)
                .slice(0, 4);
            return {
                value,
                label,
                details: secondaryValues.length ? secondaryValues.join(" • ") : null
            };
        }
        return null;
    };

    const expandCollection = (data) => {
        if (data == null) return [];
        if (Array.isArray(data)) return data;
        if (typeof data === "string") {
            return data.split(/\r?\n/).map((item) => item.trim()).filter(Boolean);
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
            .map((item) => normaliseSuggestion(item))
            .filter(Boolean);
        const seen = new Set();
        suggestionItems = suggestionItems.filter((item) => {
            const key = `${(item.value || item.label || "").toLowerCase()}|${(item.label || "").toLowerCase()}|${item.details || ""}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        }).slice(0, MAX_SUGGESTIONS);
        clearSuggestions();
        suggestionsDropdown.scrollTop = 0;
        if (!suggestionItems.length) {
            const empty = document.createElement("div");
            empty.className = "combo-empty";
            empty.textContent = query ? `Збігів не знайдено для “${query}”.` : "Збігів не знайдено.";
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

            option.addEventListener("click", () => selectSuggestionByIndex(index));

            suggestionsDropdown.appendChild(option);
        });
        suggestionsDropdown.classList.remove("is-hidden");
        setComboboxExpanded(true);
        highlightSuggestion(0);
    };

    async function fetchContractorSuggestions(query) {
        const url = `${MATCH_API}?q=${encodeURIComponent(query)}`;
        const response = await fetch(url, { headers: { "Accept": "application/json, text/plain;q=0.8" } });
        const rawText = await response.text();
        if (!response.ok) {
            let message = toDisplayString(rawText);
            if (!message && rawText) {
                try {
                    const payload = JSON.parse(rawText);
                    message = toDisplayString(payload?.error || payload?.message);
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

    contractorInput?.addEventListener("keydown", (e) => {
        const open = isSuggestionsOpen();
        if (open) {
            if (e.key === "ArrowDown") {
                e.preventDefault();
                const nextIndex = highlightedSuggestionIndex < suggestionItems.length - 1 && highlightedSuggestionIndex >= 0
                    ? highlightedSuggestionIndex + 1
                    : 0;
                highlightSuggestion(nextIndex);
                return;
            }
            if (e.key === "ArrowUp") {
                e.preventDefault();
                const prevIndex = highlightedSuggestionIndex > 0
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
            const message = e && typeof e === "object" && "message" in e ? e.message : null;
            showError(message || "Не вдалося знайти клієнтів");
        } finally {
            searchBtn.disabled = false;
            searchBtn.classList.remove("loading");
        }
    });

    document.addEventListener("click", (event) => {
        if (!isSuggestionsOpen()) return;
        const target = event.target;
        if (!target) return;
        if (typeof Node !== "undefined" && !(target instanceof Node)) return;
        if (target === contractorInput || target === searchBtn) return;
        if (suggestionsDropdown && suggestionsDropdown.contains(target)) return;
        hideSuggestions();
    });
    downloadBtn?.addEventListener("click", async () => {
        if (!exportEndpoint || !lastParams || downloadBtn.disabled) return;

        const originalText = downloadBtn.dataset.originalText || downloadBtn.textContent.trim();
        downloadBtn.dataset.originalText = originalText;
        downloadBtn.disabled = true;
        downloadBtn.textContent = "Надсилаю…";

        try {
            const requestUrl = new URL(exportEndpoint, window.location.origin);
            const payloadParams = lastParams instanceof URLSearchParams
                ? lastParams
                : new URLSearchParams(lastParams);
            const response = await fetch(requestUrl.toString(), {
                method: "POST",
                headers: {
                    "Accept": "application/json",
                    "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8"
                },
                body: payloadParams.toString()
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
                const errorMessage = payload?.error || "Не вдалося завантажити дані";
                throw new Error(errorMessage);
            }

            const successMessage = payload?.message || "Файл надіслано в бот";
            showAlert(successMessage);
        } catch (e) {
            showAlert(e.message || "Сталася помилка");
        } finally {
            downloadBtn.disabled = false;
            downloadBtn.textContent = downloadBtn.dataset.originalText || "Завантажити";
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
            const contractor = isDefaultContractor(contractorRaw) ? "" : contractorRaw;
            if (contractor) {
                params.set("contractor", contractor);
            }
        }
        try {
            const requestUrl = new URL(dataEndpoint, window.location.origin);
            requestUrl.search = params.toString();
            const r = await fetch(requestUrl.toString(), { headers: { "Accept":"text/html" } });
            const html = await r.text();
            if (!r.ok) throw new Error("Не вдалося отримати дані");
            showTable(html);
            lastSearchParams = new URLSearchParams(params);
            if (downloadBtn && exportEndpoint) {
                lastParams = new URLSearchParams(params);
                show(downloadBtn);
                downloadBtn.disabled = false;
                downloadBtn.textContent = downloadBtn.dataset.originalText || downloadBtn.textContent || "Завантажити";
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

        const originalText = analysisButton.dataset.originalText || analysisButton.textContent?.trim() || "Проаналізувати [AI]";
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
                    "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
                    "Accept": "text/plain, text/html"
                },
                body: lastSearchParams.toString()
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
                analysisError.textContent = e.message || "Не вдалося виконати аналіз";
                show(analysisError);
            }
        } finally {
            hide(analysisLoading);
            analysisButton.disabled = false;
            analysisButton.textContent = analysisButton.dataset.originalText || originalText;
        }
    });
})();
