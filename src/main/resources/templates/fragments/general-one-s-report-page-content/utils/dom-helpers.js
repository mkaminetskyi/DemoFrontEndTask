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
