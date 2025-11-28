/**
 * Кодує Telegram initData в base64
 * @param {string} value - Дані для кодування
 * @returns {string} - Закодовані дані в base64 або порожній рядок при помилці
 */
export function encodeInitData(value) {
  // 1. Якщо нічого не передано - повертаємо порожній рядок
  if (!value) {
    return "";
  }

  try {
    // 2. СУЧАСНИЙ СПОСІБ (якщо браузер підтримує TextEncoder)
    if (window.TextEncoder) {
      const encoder = new TextEncoder();
      const bytes = encoder.encode(value); // Перетворюємо рядок в байти UTF-8

      let binary = "";
      // Перетворюємо кожен байт в символ
      for (let index = 0; index < bytes.length; index += 1) {
        binary += String.fromCharCode(bytes[index]);
      }

      return window.btoa(binary); // Кодуємо в base64
    }

    // 3. СТАРИЙ СПОСІБ (для старих браузерів)
    // unescape + encodeURIComponent - старий метод роботи з UTF-8
    return window.btoa(unescape(encodeURIComponent(value)));
  } catch (error) {
    // 4. Якщо щось пішло не так - повертаємо порожній рядок
    return "";
  }
}
