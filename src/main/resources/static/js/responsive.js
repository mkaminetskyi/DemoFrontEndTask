// Отримати видимий елемент
function getVisibleElement(elementId) {
  const mobileEl = document.querySelector(
    ".s__mobile-layout #" + elementId,
  );
  const desktopEl = document.querySelector(
    ".s__desktop-layout #" + elementId,
  );

  if (
    mobileEl &&
    window.getComputedStyle(mobileEl.closest(".s__mobile-layout"))
      .display !== "none"
  ) {
    return mobileEl;
  }
  if (
    desktopEl &&
    window.getComputedStyle(desktopEl.closest(".s__desktop-layout"))
      .display !== "none"
  ) {
    return desktopEl;
  }
  return null;
}

// Зберігаємо обробники
const listeners = new Map();

// Додати обробник
function addResponsiveListener(elementId, eventType, handler) {
  const key = elementId + "-" + eventType;

  listeners.set(key, {
    elementId,
    eventType,
    handler,
    element: null,
  });

  const el = getVisibleElement(elementId);
  if (el) {
    el.addEventListener(eventType, handler);
    listeners.get(key).element = el;
  }
}

// Перемикає обробники при resize
let isMobile =
  window.getComputedStyle(document.querySelector(".s__mobile-layout"))
    .display !== "none";

window.addEventListener("resize", function () {
  const nowMobile =
    window.getComputedStyle(
      document.querySelector(".s__mobile-layout"),
    ).display !== "none";

  if (isMobile !== nowMobile) {
    isMobile = nowMobile;

    listeners.forEach(function (entry) {
      if (entry.element) {
        entry.element.removeEventListener(
          entry.eventType,
          entry.handler,
        );
      }

      const el = getVisibleElement(entry.elementId);
      if (el) {
        el.addEventListener(entry.eventType, entry.handler);
        entry.element = el;
      }
    });
  }
});
