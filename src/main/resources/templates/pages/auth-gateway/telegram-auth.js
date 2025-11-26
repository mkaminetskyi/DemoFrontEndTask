(function (global) {
  const documentRef = global.document;
  const appContext = global.__APP_CONTEXT__ || {};
  const telegramApp = global.Telegram?.WebApp ?? null;

  const STRINGS = {
    instruction:
      "Відкрийте міні-застосунок Bulat+ у Telegram та підтвердьте вхід.",
    notAuthorized: "Ви не авторизовані.",
    alreadyAuthorized: "авторизація підтверджена",
    progress: "автентифікація…",
    success: "авторизація успішна",
    failurePrefix: "помилка автентифікації",
    genericError: "Auth failed",
  };

  const rawInitData = telegramApp?.initData || "";
  const encodedInitData = encodeInitData(rawInitData);
  const originalFetch = global.fetch.bind(global);

  global.fetch = function overrideFetch(input, init) {
    if (!encodedInitData) {
      return originalFetch(input, init);
    }

    const prepared = prepareRequest(input, init);
    return originalFetch(prepared.input, prepared.init);
  };

  global.TelegramAuth = createTelegramAuth();

  if (documentRef) {
    if (documentRef.readyState === "loading") {
      documentRef.addEventListener(
        "DOMContentLoaded",
        initializeGateway,
      );
    } else {
      initializeGateway();
    }
  }

  function createTelegramAuth() {
    let statusListener = null;

    const notify = (text, modifier) => {
      if (typeof statusListener === "function") {
        statusListener(text, modifier);
      }
    };

    const authenticate = async () => {
      if (!rawInitData) {
        notify(
          `${STRINGS.notAuthorized} ${STRINGS.instruction}`,
          telegramApp ? "warning" : "error",
        );
        throw new Error("Telegram init data is missing");
      }

      notify(STRINGS.progress);

      const response = await global.fetch("/api/auth/telegram", {
        method: "POST",
      });
      const payload = await parseResponse(response);

      if (!response.ok) {
        const message =
          typeof payload === "string"
            ? payload
            : payload?.error || STRINGS.genericError;
        throw new Error(message);
      }

      return payload;
    };

    const init = async (options = {}) => {
      statusListener = options.onStatusChange || null;

      if (telegramApp) {
        try {
          telegramApp.expand();
        } catch (error) {
          // Ignore errors from expand
        }
      }

      if (!rawInitData) {
        if (!options.authenticated) {
          notify(
            `${STRINGS.notAuthorized} ${STRINGS.instruction}`,
            telegramApp ? "warning" : "error",
          );
        }
        return { status: "no-init-data" };
      }

      if (options.authenticated) {
        notify(STRINGS.alreadyAuthorized, "success");
        return { status: "already-authenticated" };
      }

      try {
        const payload = await authenticate();
        notify(STRINGS.success, "success");

        if (typeof options.onAuthenticated === "function") {
          options.onAuthenticated(payload);
        }

        return payload;
      } catch (error) {
        notify(`${STRINGS.failurePrefix}: ${error.message}`, "error");

        if (typeof options.onError === "function") {
          options.onError(error);
        }

        throw error;
      }
    };

    return { init, authenticate };
  }

  function initializeGateway() {
    if (!documentRef?.body?.classList.contains("auth-gateway")) {
      return;
    }

    const ui = {
      message: select("authMessage"),
      loader: select("authLoader"),
      retry: select("retryButton"),
      widgetContainer: select("telegramWidgetContainer"),
      openMiniApp: select("openMiniAppButton"),
      browserHint: select("browserHint"),
    };

    const alreadyAuthenticated = Boolean(appContext.authenticated);
    const hasInitData = Boolean(rawInitData);
    const isTelegramEnv = Boolean(telegramApp);
    const botUsername = resolveBotUsername(
      ui.widgetContainer,
      appContext,
    );
    const miniAppUrl = buildMiniAppUrl(botUsername);
    const widget = createWidgetController({
      container: ui.widgetContainer,
      botUsername,
      onSuccess: showAuthSuccess,
      onError: error => {
        console.error("Telegram widget auth error", error);
        setMessage(
          ui.message,
          "Не вдалося підтвердити авторизацію через Telegram. " +
            STRINGS.instruction,
          "error",
        );
        setLoading(ui, false);
        toggleHidden(ui.retry, false);
      },
    });

    if (ui.retry) {
      ui.retry.addEventListener("click", startAuthFlow);
    }

    if (ui.openMiniApp) {
      ui.openMiniApp.addEventListener("click", () => {
        if (miniAppUrl) {
          global.open(miniAppUrl, "_blank", "noopener");
        }
        widget.mount();
      });
    }

    if (alreadyAuthenticated) {
      showAuthSuccess();
      return;
    }

    if (isTelegramEnv && hasInitData) {
      setLoading(ui, true);
      global.setTimeout(startAuthFlow, 50);
    } else {
      showBrowserInstruction();
    }

    function startAuthFlow() {
      if (!global.TelegramAuth) {
        setMessage(
          ui.message,
          "Схоже, щось пішло не так. Оновіть сторінку або спробуйте пізніше.",
          "error",
        );
        setLoading(ui, false);
        return;
      }

      setLoading(ui, true);

      global.TelegramAuth.init({
        authenticated: alreadyAuthenticated,
        onStatusChange: (text, modifier) =>
          setMessage(ui.message, text, modifier),
        onAuthenticated: showAuthSuccess,
        onError: error => {
          console.error("Auth error", error);
          setMessage(
            ui.message,
            "Не вдалося підтвердити авторизацію. " +
              STRINGS.instruction,
            "error",
          );
          setLoading(ui, false);
        },
      })
        .then(result => {
          if (result?.status === "already-authenticated") {
            showAuthSuccess();
            return;
          }

          if (result?.status === "no-init-data") {
            showBrowserInstruction();
          }
        })
        .catch(() => {
          // Errors are handled via onError
        });
    }

    function showAuthSuccess() {
      setMessage(
        ui.message,
        "Авторизація успішна, відкриваємо головну…",
        "success",
      );
      setLoading(ui, true);
      redirectHome();
    }

    function showBrowserInstruction() {
      setLoading(ui, false);

      if (!botUsername) {
        setMessage(
          ui.message,
          "Неможливо продовжити без налаштованого Telegram-бота.",
          "error",
        );
        toggleHidden(ui.retry, true);
        toggleHidden(ui.openMiniApp, true);
        toggleHidden(ui.widgetContainer, true);
        toggleHidden(ui.browserHint, true);
        return;
      }

      setMessage(
        ui.message,
        "Відкрийте Bulat+ у Telegram через авторизацію нижче.",
        "warning",
      );
      toggleHidden(ui.retry, true);
      toggleHidden(ui.openMiniApp, !miniAppUrl);
      toggleHidden(ui.widgetContainer, false);

      if (ui.browserHint) {
        ui.browserHint.textContent =
          "Щоб продовжити, увійдіть через свій Telegram-акаунт і відкрийте застосунок Bulat+.";
        ui.browserHint.classList.remove("is-hidden");
      }

      const { mounted } = widget.mount();
      if (!mounted) {
        setMessage(
          ui.message,
          "Не вдалося завантажити Telegram-віджет авторизації.",
          "error",
        );
      }
    }
  }

  function setMessage(element, text, modifier) {
    if (!element) {
      return;
    }
    element.textContent = text;

    element.classList.remove("warning", "error", "success");
    if (modifier) {
      element.classList.add(modifier);
    }
  }

  function setLoading(ui, isLoading) {
    if (ui.loader) {
      ui.loader.classList.toggle("is-hidden", !isLoading);
    }
    if (ui.retry) {
      ui.retry.classList.toggle("is-hidden", isLoading);
    }
  }

  function toggleHidden(element, shouldHide) {
    if (!element) {
      return;
    }
    element.classList.toggle("is-hidden", shouldHide);
  }

  function redirectHome() {
    global.setTimeout(() => {
      global.location.replace("/home");
    }, 150);
  }

  function select(id) {
    return documentRef?.getElementById(id) || null;
  }

  function resolveBotUsername(container, context) {
    const fromData = container?.dataset?.bot;
    if (fromData && typeof fromData === "string") {
      return fromData.trim();
    }

    const fromContext = context?.botUsername;
    return typeof fromContext === "string" ? fromContext.trim() : "";
  }

  function buildMiniAppUrl(botUsername) {
    return botUsername ? `https://t.me/${botUsername}` : "";
  }

  function encodeInitData(value) {
    if (!value) {
      return "";
    }

    try {
      if (global.TextEncoder) {
        const encoder = new TextEncoder();
        const bytes = encoder.encode(value);
        let binary = "";
        for (let index = 0; index < bytes.length; index += 1) {
          binary += String.fromCharCode(bytes[index]);
        }
        return global.btoa(binary);
      }

      return global.btoa(unescape(encodeURIComponent(value)));
    } catch (error) {
      return "";
    }
  }

  async function parseResponse(response) {
    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("json")) {
      return response.json();
    }
    return response.text();
  }

  function prepareRequest(input, init) {
    if (input instanceof Request) {
      const requestHeaders = new Headers(input.headers);
      const initHeaders = createHeaders(init?.headers);
      initHeaders.forEach((value, key) => {
        requestHeaders.set(key, value);
      });
      requestHeaders.set("X-Telegram-Init-Data", encodedInitData);

      const preparedRequest = new Request(input, {
        ...init,
        headers: requestHeaders,
      });

      return { input: preparedRequest, init: undefined };
    }

    const headers = createHeaders(init?.headers);
    headers.set("X-Telegram-Init-Data", encodedInitData);

    return {
      input,
      init: {
        ...(init || {}),
        headers,
      },
    };
  }

  function createHeaders(source) {
    return source instanceof Headers
      ? new Headers(source)
      : new Headers(source || {});
  }

  function createWidgetController(config) {
    const handlerName = "__bulatTelegramWidgetAuth";
    const { container, botUsername, onStart, onSuccess, onError } =
      config;

    const available = Boolean(container && botUsername);
    let mounted = false;

    if (!available) {
      return {
        available: false,
        mount() {
          if (!botUsername && typeof onError === "function") {
            onError(
              new Error("Telegram bot username is not configured."),
            );
          }
          return { mounted: false };
        },
      };
    }

    global[handlerName] = function handleWidgetAuth(user) {
      if (!user) {
        return;
      }

      try {
        if (typeof onStart === "function") {
          onStart();
        }
      } catch (error) {
        console.error("Telegram widget start handler failed", error);
      }

      sendWidgetAuthRequest(user)
        .then(payload => {
          if (typeof onSuccess === "function") {
            onSuccess(payload);
          }
        })
        .catch(error => {
          if (typeof onError === "function") {
            onError(error);
          }
        });
    };

    return {
      available: true,
      mount() {
        if (mounted) {
          return { mounted: true };
        }

        if (!container) {
          return { mounted: false };
        }

        container.textContent = "";

        const script = documentRef.createElement("script");
        script.src = "https://telegram.org/js/telegram-widget.js?22";
        script.async = true;
        script.setAttribute("data-telegram-login", botUsername);
        script.setAttribute("data-size", "large");
        script.setAttribute("data-userpic", "false");
        script.setAttribute("data-request-access", "write");
        script.setAttribute("data-onauth", `${handlerName}(user)`);

        container.appendChild(script);
        mounted = true;
        return { mounted: true };
      },
    };
  }

  function sendWidgetAuthRequest(user) {
    return global
      .fetch("/api/auth/telegram/widget", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(user),
      })
      .then(async response => {
        const payload = await parseResponse(response);

        if (!response.ok) {
          const message =
            typeof payload === "string"
              ? payload
              : payload?.error || "Telegram auth failed";
          throw new Error(message);
        }

        return payload;
      });
  }
})(window);
