/**
 * Entry point for Telegram auth-gateway
 * Initializes all modules and starts the application
 */

import { encodeInitData } from "./lib/encoding.js";
import { setupFetchInterceptor } from "./lib/fetch-interceptor.js";
import { createTelegramAuth } from "./model/telegram-auth.js";
import { initializeGateway } from "./ui/auth-gateway.js";

// Get global data
const appContext = window.__APP_CONTEXT__ || {};
const telegramApp = window.Telegram?.WebApp ?? null;

// Get and encode Telegram initData
const rawInitData = telegramApp?.initData || "";
const encodedInitData = encodeInitData(rawInitData);

// Setup fetch interceptor
setupFetchInterceptor(encodedInitData);

// Create global authentication API
window.TelegramAuth = createTelegramAuth(rawInitData, telegramApp);

// Initialize UI after DOM loads
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    initializeGateway(appContext, rawInitData, telegramApp);
  });
} else {
  initializeGateway(appContext, rawInitData, telegramApp);
}
