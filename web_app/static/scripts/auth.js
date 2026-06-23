function showAuthMessage(message, type = "success") {
  let messageEl = document.getElementById("authMessage");
  if (!messageEl) {
    messageEl = document.createElement("div");
    messageEl.id = "authMessage";
    messageEl.className = "alert";
    messageEl.style.display = "none";
    const loginForm = document.getElementById("login_form");
    if (loginForm) {
      loginForm.parentNode.insertBefore(messageEl, loginForm);
    }
  }
  messageEl.className = `alert alert-${type}`;
  messageEl.textContent = message;
  messageEl.style.display = "block";
  setTimeout(() => {
    messageEl.style.display = "none";
  }, 5000);
}

function clearAuthMessage() {
  const messageEl = document.getElementById("authMessage");
  if (messageEl) {
    messageEl.style.display = "none";
  }
}

function showLoginForm() {
  isLoginForm = true;
  const loginForm = document.getElementById("login_form");
  const registerForm = document.getElementById("register_form");
  const title = document.getElementById("authModalTitle");
  const toggleText = document.getElementById("auth_toggle_text");

  clearAuthMessage();
  if (loginForm) loginForm.style.display = "block";
  if (registerForm) registerForm.style.display = "none";
  if (title) title.textContent = "Вход";
  if (toggleText)
    toggleText.innerHTML =
      'Нет аккаунта? <a href="#" id="show_register">Зарегистрироваться</a>';
}

function showRegisterForm() {
  isLoginForm = false;
  const loginForm = document.getElementById("login_form");
  const registerForm = document.getElementById("register_form");
  const title = document.getElementById("authModalTitle");
  const toggleText = document.getElementById("auth_toggle_text");

  clearAuthMessage();
  if (loginForm) loginForm.style.display = "none";
  if (registerForm) registerForm.style.display = "block";
  if (title) title.textContent = "Регистрация";
  if (toggleText)
    toggleText.innerHTML =
      'Уже есть аккаунт? <a href="#" id="show_login">Войти</a>';
}

function openAuthModal() {
  const modalEl = document.getElementById("authModal");
  if (modalEl) {
    const modal = new bootstrap.Modal(modalEl);
    modal.show();
  }
}

document.addEventListener("click", (e) => {
  if (e.target.closest("#show_register")) {
    e.preventDefault();
    showRegisterForm();
  }
  if (e.target.closest("#show_login")) {
    e.preventDefault();
    showLoginForm();
  }
});

btnLogin?.addEventListener("click", () => {
  showLoginForm();
  openAuthModal();
});
btnRegister?.addEventListener("click", () => {
  showRegisterForm();
  openAuthModal();
});

const loginForm = document.getElementById("login_form");
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearAuthMessage();

    const email = document.getElementById("login_email").value;
    const password = document.getElementById("login_password").value;

    if (!email || !password) {
      showAuthMessage("Введите email и пароль", "danger");
      return;
    }

    const submitBtn = loginForm.querySelector('button[type="submit"]');
    const btnText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML =
      '<span class="spinner-border spinner-border-sm me-1"></span> Вход...';

    try {
      const res = await fetch(`${API_AUTH}/token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Ошибка входа");
      }

      const data = await res.json();
      setAuthToken(data.access_token);
      currentUser = { email };
      updateAuthUI();

      const modalEl = document.getElementById("authModal");
      const modal = bootstrap.Modal.getInstance(modalEl);
      if (modal) modal.hide();
      loginForm.reset();

      showAuthMessage("Вы успешно вошли!", "success");
    } catch (err) {
      showAuthMessage(err.message, "danger");
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = btnText;
    }
  });
}

const registerForm = document.getElementById("register_form");
if (registerForm) {
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearAuthMessage();

    const email = document.getElementById("register_email").value;
    const password = document.getElementById("register_password").value;

    if (!email || !password) {
      showAuthMessage("Введите email и пароль", "danger");
      return;
    }
    if (password.length < 6) {
      showAuthMessage("Пароль должен быть не менее 6 символов", "danger");
      return;
    }

    const submitBtn = registerForm.querySelector('button[type="submit"]');
    const btnText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML =
      '<span class="spinner-border spinner-border-sm me-1"></span> Регистрация...';

    try {
      const res = await fetch(`${API_AUTH}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Ошибка регистрации");
      }

      const loginRes = await fetch(`${API_AUTH}/token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (loginRes.ok) {
        const loginData = await loginRes.json();
        setAuthToken(loginData.access_token);
        currentUser = { email };
        updateAuthUI();

        const modalEl = document.getElementById("authModal");
        const modal = bootstrap.Modal.getInstance(modalEl);
        if (modal) modal.hide();
        registerForm.reset();

        showAuthMessage(
          "Регистрация успешна! Вы автоматически вошли.",
          "success",
        );
      }
    } catch (err) {
      showAuthMessage(err.message, "danger");
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = btnText;
    }
  });
}

if (btnLogout) {
  btnLogout.addEventListener("click", () => {
    clearAuthToken();
    currentUser = null;
    updateAuthUI();
    showAuthMessage("Вы вышли из аккаунта", "info");
  });
}
