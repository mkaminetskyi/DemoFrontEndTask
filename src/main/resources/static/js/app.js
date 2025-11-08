(function () {
  const byId = (id) => document.getElementById(id);
  const tg = window.Telegram?.WebApp;
  const ctx = window.__APP_CONTEXT__ || {};

  const ROLE_TITLES = {
    SUPERVISOR: "Супервайзер",
    OWNER: "Власник",
    MANAGER: "Менеджер",
    CLIENT: "Клієнт",
    ALL: "Розширений доступ",
    ANONYMOUS: "Гість",
  };

  const nameEl = byId("name");
  const roleEl = byId("role");
  const avatarEl = byId("avatar");
  const initialsEl = byId("initials");
  const statusEl = byId("status");

  function applyRole(roleCode) {
    if (!roleEl) {
      return;
    }

    roleEl.textContent = ROLE_TITLES[roleCode] || ROLE_TITLES.ANONYMOUS;
  }

  function setAvatar(photoUrl, firstName, username) {
    if (!avatarEl) {
      return;
    }

    if (photoUrl) {
      const img = new Image();
      img.alt = "avatar";
      img.src = photoUrl;
      img.onload = () => {
        avatarEl.innerHTML = "";
        avatarEl.appendChild(img);
      };
      img.onerror = () => {
        avatarEl.innerHTML = "";
        if (initialsEl) {
          avatarEl.appendChild(initialsEl);
        }
      };
    } else if (initialsEl) {
      initialsEl.textContent =
        (firstName || username || "U").toString().trim().charAt(0).toUpperCase() || "U";
    }
  }

  function setStatus(text, modifier) {
    if (!statusEl) {
      return;
    }

    statusEl.textContent = text;
    statusEl.className = "status" + (modifier ? " " + modifier : "");
  }

  const contextName = ctx.displayName || ctx.userName;
  if (nameEl && contextName) {
    nameEl.textContent = contextName;
  }

  const contextRole = (ctx.userRole || ctx.userRoleName || "ANONYMOUS").toString();
  applyRole(contextRole);

  if (tg) {
    try {
      tg.expand();
    } catch (error) {
      /* ignore */
    }
    const user = tg.initDataUnsafe?.user;
    const firstName = user?.first_name;
    const username = user?.username;
    const photo = user?.photo_url;

    if (nameEl && !contextName && (firstName || username)) {
      nameEl.textContent = firstName || username;
    }

    setAvatar(photo, firstName, username);

    const bgColor = tg.themeParams?.bg_color;
    if (bgColor) {
      document.body.style.backgroundColor = bgColor;
    }
  } else {
    setAvatar(null, ctx.displayName, ctx.userName);
  }

  const logoutBtn = byId("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      if (tg) {
        try {
          tg.close();
          return;
        } catch (error) {
          console.warn("Unable to close Telegram WebApp", error);
        }
      }

      window.location.replace("/");
    });
  }

  document.querySelectorAll('[data-nav="home"]').forEach((button) => {
    button.addEventListener("click", () => {
      window.location.href = "/home";
    });
  });

  if (ctx.statusText) {
    setStatus(ctx.statusText, ctx.statusModifier);
  }

  window.App = window.App || {};
  window.App.setStatus = setStatus;
})();
