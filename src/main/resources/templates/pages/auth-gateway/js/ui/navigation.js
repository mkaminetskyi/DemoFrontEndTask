/**
 * Навігація застосунку
 */

/**
 * Редіректить на головну сторінку
 */
export function redirectHome() {
  window.setTimeout(() => {
    window.location.replace("/home");
  }, 150);
}
