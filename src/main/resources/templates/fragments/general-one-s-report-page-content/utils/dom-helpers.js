export const show = el => el && el.classList.remove("is-hidden");

export const hide = el => el && el.classList.add("is-hidden");

export const toggle = (el, shouldShow) =>
  shouldShow ? show(el) : hide(el);

export const showAlert = message => {
  if (!message) return;
  const tg = window.Telegram?.WebApp;
  if (tg && typeof tg.showAlert === "function") {
    tg.showAlert(message);
  } else {
    alert(message);
  }
};

export const getVisibleLayout = () => {
  const mobileLayout = document.querySelector(".s__mobile-layout");
  const desktopLayout = document.querySelector(".s__desktop-layout");

  // Перевіряємо, який контейнер видимий через getComputedStyle
  if (mobileLayout) {
    const mobileStyle = window.getComputedStyle(mobileLayout);
    if (mobileStyle.display !== "none") {
      return mobileLayout;
    }
  }

  if (desktopLayout) {
    const desktopStyle = window.getComputedStyle(desktopLayout);
    if (desktopStyle.display !== "none") {
      return desktopLayout;
    }
  }

  // Якщо не знайдено видимий контейнер, використовуємо document
  return document;
};
