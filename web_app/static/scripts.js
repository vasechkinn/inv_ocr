const API_AUTH = "/api/auth";
let currentUser = null;
let myDocsPage = 1;
let isLoginForm = true;
let uploadQueue = [];
let queueIndex = 0;
let currentPreviewUrl = null;
let loadedInvoices = [];

function getAuthToken() {
  return localStorage.getItem("auth_token");
}

function setAuthToken(token) {
  localStorage.setItem("auth_token", token);
}

function clearAuthToken() {
  localStorage.removeItem("auth_token");
}

function updateAuthUI() {
  const token = getAuthToken();
  const btnLogin = document.getElementById("btn_login");
  const btnRegister = document.getElementById("btn_register");
  const btnLogout = document.getElementById("btn_logout");
  const btnMyDocs = document.getElementById("btn_my_docs");
  const userInfo = document.getElementById("user_info");
  const saveBtn = document.getElementById("save_btn");

  if (token) {
    if (btnLogin) btnLogin.style.display = "none";
    if (btnRegister) btnRegister.style.display = "none";
    if (btnLogout) btnLogout.style.display = "inline-block";
    if (btnMyDocs) btnMyDocs.style.display = "inline-block";
    if (userInfo) {
      userInfo.textContent = "👤 " + (currentUser?.email || "Авторизован");
      userInfo.style.display = "inline";
    }
    if (saveBtn) {
      saveBtn.style.display = "inline-block";
      saveBtn.disabled = false;
      saveBtn.classList.remove("btn-secondary");
      saveBtn.classList.add("btn-outline-success");
      saveBtn.title = "";
    }
  } else {
    if (btnLogin) btnLogin.style.display = "inline-block";
    if (btnRegister) btnRegister.style.display = "inline-block";
    if (btnLogout) btnLogout.style.display = "none";
    if (btnMyDocs) btnMyDocs.style.display = "none";
    if (userInfo) userInfo.style.display = "none";
    if (saveBtn) {
      saveBtn.style.display = "inline-block";
      saveBtn.disabled = true;
      saveBtn.classList.remove("btn-outline-success");
      saveBtn.classList.add("btn-secondary");
      saveBtn.title = "Для сохранения необходимо войти в аккаунт";
    }
  }
}

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
  if (toggleText) toggleText.innerHTML = 'Нет аккаунта? <a href="#" id="show_register">Зарегистрироваться</a>';
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
  if (toggleText) toggleText.innerHTML = 'Уже есть аккаунт? <a href="#" id="show_login">Войти</a>';
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

document.getElementById("btn_login")?.addEventListener("click", () => {
  showLoginForm();
  openAuthModal();
});
document.getElementById("btn_register")?.addEventListener("click", () => {
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
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Вход...';

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
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Регистрация...';

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
        
        showAuthMessage("Регистрация успешна! Вы автоматически вошли.", "success");
      }
    } catch (err) {
      showAuthMessage(err.message, "danger");
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = btnText;
    }
  });
}

const btnLogout = document.getElementById("btn_logout");
if (btnLogout) {
  btnLogout.addEventListener("click", () => {
    clearAuthToken();
    currentUser = null;
    updateAuthUI();
    showAuthMessage("Вы вышли из аккаунта", "info");
  });
}

const prevBtn = document.getElementById("prev_btn");
const nextBtn = document.getElementById("next_btn");
const skipBtn = document.getElementById("skip_btn");
const carouselControls = document.getElementById("carousel_controls");

function updateCarouselButtons() {
  if (!carouselControls || uploadQueue.length <= 1) {
    if (carouselControls) carouselControls.classList.remove("active");
    if (prevBtn) prevBtn.classList.add("carousel-btn-hidden");
    if (nextBtn) nextBtn.classList.add("carousel-btn-hidden");
    if (skipBtn) skipBtn.classList.add("carousel-btn-hidden");
    return;
  }

  if (carouselControls) carouselControls.classList.add("active");

  if (prevBtn) {
    if (queueIndex > 0) {
      prevBtn.classList.remove("carousel-btn-hidden");
    } else {
      prevBtn.classList.add("carousel-btn-hidden");
    }
  }

  if (nextBtn) {
    if (queueIndex < uploadQueue.length - 1) {
      nextBtn.classList.remove("carousel-btn-hidden");
    } else {
      nextBtn.classList.add("carousel-btn-hidden");
    }
  }

  if (skipBtn) {
    if (queueIndex < uploadQueue.length - 1) {
      skipBtn.classList.remove("carousel-btn-hidden");
    } else {
      skipBtn.classList.add("carousel-btn-hidden");
    }
    skipBtn.disabled = false;
    skipBtn.classList.remove("btn-secondary");
    skipBtn.classList.add("btn-outline-warning");
    skipBtn.title = "";
  }
}

if (prevBtn) {
  prevBtn.addEventListener("click", async () => {
    if (queueIndex > 0) {
      queueIndex--;
      await processQueueItem();
    }
  });
}

if (nextBtn) {
  nextBtn.addEventListener("click", async () => {
    if (queueIndex < uploadQueue.length - 1) {
      queueIndex++;
      await processQueueItem();
    }
  });
}

if (skipBtn) {
  skipBtn.addEventListener("click", async () => {
    if (queueIndex < uploadQueue.length - 1) {

      fillForm({}, {});
      if (fileInput) fileInput.value = "";
      queueIndex++;
      await processQueueItem();
    }
  });
}

async function loadMyDocs(page = 1) {
  const token = getAuthToken();
  if (!token) {
    alert("Необходимо авторизоваться");
    return;
  }

  myDocsPage = page;
  const listEl = document.getElementById("invoices_list");
  const paginationEl = document.getElementById("invoices_pagination");

  if (listEl) listEl.innerHTML = '<div class="text-center"><div class="spinner-border"></div></div>';

  try {
    const res = await fetch(`/save/my-invoices?page=${page}&limit=10`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      if (res.status === 401) {
        clearAuthToken();
        updateAuthUI();
        throw new Error("Сессия истекла. Войдите снова.");
      }
      throw new Error("Ошибка загрузки документов");
    }

    const data = await res.json();
    renderInvoicesList(data);
    renderPagination(data);
  } catch (err) {
    if (listEl) listEl.innerHTML = `<div class="alert alert-danger">${err.message}</div>`;
  }
}

function renderInvoicesList(data) {
  const listEl = document.getElementById("invoices_list");
  if (!listEl) return;

  loadedInvoices = data.invoices || [];

  if (!data.invoices || data.invoices.length === 0) {
    listEl.innerHTML = '<div class="alert alert-info">У вас пока нет сохранённых документов</div>';
    return;
  }

  listEl.innerHTML = data.invoices
    .map(
      (inv) => `
    <div class="list-group-item">
      <div class="d-flex justify-content-between align-items-center">
        <div>
          <strong>Дата:</strong> ${inv.date || "—"} &nbsp;
          <strong>Сумма:</strong> ${inv.summ ? inv.summ + " ₽" : "—"} &nbsp;
          <strong>НДС:</strong> ${inv.nds_percent || "—"}%
        </div>
        <div class="d-flex align-items-center gap-2">
          <small class="text-muted">#${inv.id}</small>
          <div class="dropdown">
            <button class="btn btn-sm btn-outline-primary dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
              Копировать
            </button>
            <ul class="dropdown-menu dropdown-menu-end">
              <li><a class="dropdown-item" href="#" data-copy-inv="${inv.id}">Копировать текст</a></li>
              <li><a class="dropdown-item" href="#" data-excel-inv="${inv.id}">Скачать Excel</a></li>
            </ul>
          </div>
        </div>
      </div>
      <div class="mt-1">
        <small>
          ${inv.supplier?.name_sup ? `<strong>Поставщик:</strong> ${inv.supplier.name_sup} (ИНН: ${inv.supplier.inn_sup || "—"})` : ""}
          ${inv.buyer?.buyer_company ? ` | <strong>Покупатель:</strong> ${inv.buyer.buyer_company}` : ""}
        </small>
      </div>
    </div>
  `
    )
    .join("");
}

function renderPagination(data) {
  const paginationEl = document.getElementById("invoices_pagination");
  if (!paginationEl) return;

  const totalPages = Math.ceil(data.total / data.limit);
  if (totalPages <= 1) {
    paginationEl.innerHTML = "";
    return;
  }

  let html = '<nav><ul class="pagination mb-0">';
  html += `<li class="page-item ${data.page === 1 ? "disabled" : ""}"><a class="page-link" href="#" onclick="loadMyDocs(${data.page - 1}); return false;">Назад</a></li>`;
  html += `<li class="page-item active"><span class="page-link">${data.page} / ${totalPages}</span></li>`;
  html += `<li class="page-item ${!data.has_more ? "disabled" : ""}"><a class="page-link" href="#" onclick="loadMyDocs(${data.page + 1}); return false;">Вперёд</a></li>`;
  html += "</ul></nav>";

  paginationEl.innerHTML = html;
}

const btnMyDocs = document.getElementById("btn_my_docs");
if (btnMyDocs) {
  btnMyDocs.addEventListener("click", () => loadMyDocs(1));
}

const fileInput = document.getElementById("file_input");
const uploadBtn = document.getElementById("button_upload");
const editorContainer = document.getElementById("postUploadBlock");
const editForm = document.getElementById("edit_form");
const saveBtn = document.getElementById("save_btn");
const dateField = document.getElementById("date");
const summaField = document.getElementById("summa");
const ndsPercentField = document.getElementById("nds_percent");
const ndsSumField = document.getElementById("nds_sum");
const providerNameField = document.getElementById("provider_name");
const providerInnField = document.getElementById("provider_inn");
const providerAccountField = document.getElementById("provider_account");
const buyerNameField = document.getElementById("buyer_name");
const buyerInnField = document.getElementById("buyer_inn");
const buyerFioField = document.getElementById("buyer_fio");
const copyModalEl = document.getElementById("copyModal");
const copyTextarea = document.getElementById("copyText");
const copyBtn = document.getElementById("copyBtn");
const clearBtn = document.getElementById("clearBtn");
const previewImg = document.getElementById("preview_image");
const noImagePlaceholder = document.getElementById("no-image-placeholder");
const fileNameSpan = document.getElementById("file_name");
const queueProgress = document.getElementById("queue_progress");
const previewPlaceholder = document.getElementById("preview_placeholder");

if (fileInput && fileNameSpan) {
  fileInput.addEventListener("change", function () {
    if (this.files && this.files.length > 1) {
      fileNameSpan.textContent = `Выбрано файлов: ${this.files.length}`;
    } else if (this.files && this.files.length === 1) {
      fileNameSpan.textContent = this.files[0].name;
    } else {
      fileNameSpan.textContent = "Файл не выбран";
    }
  });
}
if (editorContainer) {
  editorContainer.style.display = "none";
}

if (dateField) {
  let now = new Date().toISOString().split("T")[0];
  dateField.setAttribute("max", now);
}

function fillForm(pd, fullText) {
  if (dateField) dateField.value = pd.date || "";
  if (summaField) summaField.value = pd.total_sum || "";
  if (ndsPercentField) ndsPercentField.value = pd.nds_percent ?? "";
  if (ndsSumField) ndsSumField.value = pd.nds_sum ?? "";
  if (providerNameField) providerNameField.value = pd.provider_name || "";
  if (providerInnField) providerInnField.value = pd.provider_inn || "";
  if (providerAccountField) providerAccountField.value = pd.provider_account || "";
  if (buyerNameField) buyerNameField.value = pd.buyer_name || "";
  if (buyerInnField) buyerInnField.value = pd.buyer_inn || "";
  if (buyerFioField) buyerFioField.value = fullText?.buyer_fio || "";
}

function showPreview(file) {
  if (currentPreviewUrl) {
    URL.revokeObjectURL(currentPreviewUrl);
    currentPreviewUrl = null;
  }
  if (file && file.type && file.type.startsWith("image/")) {
    currentPreviewUrl = URL.createObjectURL(file);
    if (previewImg) {
      previewImg.src = currentPreviewUrl;
      previewImg.style.display = "block";
    }
    if (previewPlaceholder) previewPlaceholder.style.display = "none";
  } else {
    if (previewImg) {
      previewImg.src = "";
      previewImg.style.display = "none";
    }
    if (previewPlaceholder) {
      previewPlaceholder.textContent = file ? file.name : "";
      previewPlaceholder.style.display = "block";
    }
  }
}

function updateQueueProgress() {
  if (!queueProgress) return;
  if (uploadQueue.length > 1) {
    queueProgress.textContent = `Документ ${queueIndex + 1} из ${uploadQueue.length}`;
  } else {
    queueProgress.textContent = "";
  }
}

async function processQueueItem() {
  const file = uploadQueue[queueIndex];
  if (!file) return;

  showPreview(file);
  updateQueueProgress();
  updateCarouselButtons();
  fillForm({}, {});

  const formData = new FormData();
  formData.append("file", file);

  const btnText = uploadBtn.innerHTML;
  uploadBtn.disabled = true;
  uploadBtn.innerHTML =
    '<span class="spinner-border spinner-border-sm me-1"></span> Обработка...';

  try {
    const response = await fetch("/upload/", {
      method: "POST",
      body: formData,
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.detail || "Ошибка распознавания");
    }

    const data = await response.json();
    fillForm(data.payment_details, data.full_text);

    if (editorContainer) {
      editorContainer.style.display = "block";
      editorContainer.scrollIntoView({ behavior: "smooth" });
    }
  } catch (err) {
    alert("Ошибка: " + err.message);
  } finally {
    uploadBtn.disabled = false;
    uploadBtn.innerHTML = btnText;
  }
}

if (uploadBtn && fileInput) {
  uploadBtn.addEventListener("click", async () => {
    if (!fileInput.files.length) {
      alert("Для обработки необходимо загрузить изображение или PDF");
      return;
    }
    uploadQueue = Array.from(fileInput.files);
    queueIndex = 0;
    await processQueueItem();
  });
}

if (editForm && saveBtn) {
  const token = getAuthToken();
  if (!token) {
    saveBtn.disabled = true;
    saveBtn.classList.remove("btn-outline-success");
    saveBtn.classList.add("btn-secondary");
    saveBtn.title = "Для сохранения необходимо войти в аккаунт";
  }

  editForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const token = getAuthToken();
    if (!token) {
      alert("Для сохранения необходимо войти в аккаунт. Нажмите 'Войти' в верхнем меню.");
      return;
    }

    const formData = {
      date: dateField ? dateField.value : null,
      summa: summaField ? summaField.value : null,
      nds_percent: ndsPercentField
        ? ndsPercentField.value
          ? parseInt(ndsPercentField.value)
          : null
        : null,
      nds_sum: ndsSumField
        ? ndsSumField.value
          ? parseFloat(ndsSumField.value)
          : null
        : null,
      provider_name: providerNameField ? providerNameField.value : null,
      provider_inn: providerInnField ? providerInnField.value : null,
      provider_account: providerAccountField
        ? providerAccountField.value
        : null,
      buyer_name: buyerNameField ? buyerNameField.value : null,
      buyer_inn: buyerInnField ? buyerInnField.value : null,
      buyer_fio: buyerFioField ? buyerFioField.value : null,
    };

    const btnText = saveBtn.innerHTML;
    saveBtn.disabled = true;
    saveBtn.innerHTML =
      '<span class="spinner-border spinner-border-sm me-1"></span> Сохраняем...';

    try {
      const response = await fetch("/save/invoice", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        if (response.status === 401) {
          clearAuthToken();
          updateAuthUI();
          throw new Error("Сессия истекла. Войдите снова.");
        }
        const err = await response.json();
        throw new Error(err.detail || "Ошибка сохранения");
      }
      const res = await response.json();

      const userText = `Дата: ${formData.date || "—"}
        Сумма: ${formData.summa || "—"} руб.
        НДС (%): ${formData.nds_percent || "—"}
        Сумма НДС: ${formData.nds_sum || "—"} руб.

        Поставщик:
        - Название: ${formData.provider_name || "—"}
        - ИНН: ${formData.provider_inn || "—"}
        - Расчётный счёт: ${formData.provider_account || "—"}

        Покупатель:
        - Название: ${formData.buyer_name || "—"}
        - ИНН: ${formData.buyer_inn || "—"}
        - ФИО: ${formData.buyer_fio || "—"}`;
      if (copyTextarea) {
        copyTextarea.value = userText;
      }

      // Обновляем кнопки карусели
      updateCarouselButtons();

      // Если это последний документ — показываем модальное окно
      if (queueIndex >= uploadQueue.length - 1) {
        if (copyModalEl && window.bootstrap) {
          const modalWin = new bootstrap.Modal(copyModalEl);

          copyModalEl.addEventListener(
            "shown.bs.modal",
            () => {
              copyTextarea?.focus();
            },
            { once: true }
          );

          modalWin.show();
        } else if (copyModalEl) {
          copyModalEl.style.display = "block";
        }
        uploadQueue = [];
        queueIndex = 0;
        updateQueueProgress();
      }
    } catch (err) {
      alert("Ошибка при сохранении: " + err.message);
    } finally {
      saveBtn.disabled = false;
      saveBtn.innerHTML = btnText;
    }
  });
}

if (summaField) {
  summaField.addEventListener("keydown", function (e) {
    if (e.key === "-" || e.key === "Minus" || e.key === "е" || e.key === "–") {
      e.preventDefault();
      alert("Отрицательная сумма не допускается");
    }
  });
  
  summaField.addEventListener('input', function() {
        let val = this.value.replace(',', '.');
        let num = parseFloat(val);
        if (isNaN(num) || num < 0) {
            this.setCustomValidity('Сумма не может быть отрицательной');
        } else {
            this.setCustomValidity('');
        }
    });

  summaField.addEventListener("paste", function (e) {
    let pasted = (e.clipboardData || window.clipboardData).getData("text");
    if (pasted.includes("-")) {
      e.preventDefault();
      alert("Вставка отрицательного числа запрещена");
    }
  });
}

if (copyBtn && copyTextarea) {
  copyBtn.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(copyTextarea.value);
      alert("Текст скопирован в буфер обмена");
    } catch (err) {
      alert("Не удалось скопировать текст");
    }
  });
}

document.getElementById("copyRequisitesBtn")?.addEventListener("click", function () {
    const getVal = (id) => document.getElementById(id)?.value || "";
    
    const formData = {
        date: getVal("date"),
        summa: getVal("summa"),
        nds_percent: getVal("nds_percent"),
        nds_sum: getVal("nds_sum"),
        provider_name: getVal("provider_name"),
        provider_inn: getVal("provider_inn"),
        provider_account: getVal("provider_account"),
        buyer_name: getVal("buyer_name"),
        buyer_inn: getVal("buyer_inn"),
        buyer_fio: getVal("buyer_fio"),
    };

    const text = `Дата: ${formData.date || "—"}
Сумма: ${formData.summa || "—"} руб.
НДС (%): ${formData.nds_percent || "—"}
Сумма НДС: ${formData.nds_sum || "—"} руб.

Поставщик:
  - Название: ${formData.provider_name || "—"}
  - ИНН: ${formData.provider_inn || "—"}
  - Расчётный счёт: ${formData.provider_account || "—"}

Покупатель:
  - Название: ${formData.buyer_name || "—"}
  - ИНН: ${formData.buyer_inn || "—"}
  - ФИО: ${formData.buyer_fio || "—"}`.trim();

    const copyTextarea = document.getElementById("copyText");
    if (copyTextarea) {
        copyTextarea.value = text;
    }

    const modalEl = document.getElementById("copyModal");
    if (modalEl && window.bootstrap) {
        const modal = new bootstrap.Modal(modalEl);
        
        modalEl.addEventListener("shown.bs.modal", function onShown() {
            modalEl.removeEventListener("shown.bs.modal", onShown);
            copyTextarea?.focus();
        });
        
        modal.show();
    } else if (modalEl) {
        modalEl.style.display = "block";
    }
});

if (clearBtn) {
  clearBtn.addEventListener("click", () => {
    if (dateField) dateField.value = "";
    if (summaField) summaField.value = "";
    if (ndsPercentField) ndsPercentField.value = "";
    if (ndsSumField) ndsSumField.value = "";
    if (providerNameField) providerNameField.value = "";
    if (providerInnField) providerInnField.value = "";
    if (providerAccountField) providerAccountField.value = "";
    if (buyerNameField) buyerNameField.value = "";
    if (buyerInnField) buyerInnField.value = "";
    if (buyerFioField) buyerFioField.value = "";

    if (fileInput) fileInput.value = "";
    if (fileNameSpan) fileNameSpan.textContent = "Файл не выбран";

    if (currentPreviewUrl) {
      URL.revokeObjectURL(currentPreviewUrl);
      currentPreviewUrl = null;
    }
    if (previewImg) {
      previewImg.src = "";
      previewImg.style.display = "none";
    }
    if (previewPlaceholder) {
      previewPlaceholder.textContent = "";
      previewPlaceholder.style.display = "none";
    }

    uploadQueue = [];
    queueIndex = 0;
    if (queueProgress) queueProgress.textContent = "";

    if (editorContainer) editorContainer.style.display = "none";
  });
}

function collectFormReqs() {
  const getVal = (id) => document.getElementById(id)?.value || "";
  return {
    date: getVal("date"),
    summa: getVal("summa"),
    nds_percent: getVal("nds_percent"),
    nds_sum: getVal("nds_sum"),
    provider_name: getVal("provider_name"),
    provider_inn: getVal("provider_inn"),
    provider_account: getVal("provider_account"),
    buyer_name: getVal("buyer_name"),
    buyer_inn: getVal("buyer_inn"),
    buyer_fio: getVal("buyer_fio"),
  };
}

function mapInvoiceToReqs(inv) {
  return {
    date: inv.date,
    summa: inv.summ,
    nds_percent: inv.nds_percent,
    nds_sum: inv.nds_sum,
    provider_name: inv.supplier?.name_sup,
    provider_inn: inv.supplier?.inn_sup,
    provider_account: inv.supplier?.num_acc,
    buyer_name: inv.buyer?.buyer_company,
    buyer_inn: inv.buyer?.inn_b,
    buyer_fio: inv.buyer?.fio,
  };
}

function reqsToRows(data) {
  const cell = (v) => (v === null || v === undefined ? "" : v);
  return [
    ["Поле", "Значение"],
    ["Дата", cell(data.date)],
    ["Сумма", cell(data.summa)],
    ["НДС (%)", cell(data.nds_percent)],
    ["Сумма НДС", cell(data.nds_sum)],
    ["Поставщик — Название", cell(data.provider_name)],
    ["Поставщик — ИНН", cell(data.provider_inn)],
    ["Поставщик — Расчётный счёт", cell(data.provider_account)],
    ["Покупатель — Название", cell(data.buyer_name)],
    ["Покупатель — ИНН", cell(data.buyer_inn)],
    ["Покупатель — ФИО", cell(data.buyer_fio)],
  ];
}

function exportReqsToExcel(data, filename) {
  if (typeof XLSX === "undefined") {
    alert("Библиотека Excel не загружена. Проверьте подключение к интернету.");
    return;
  }
  const ws = XLSX.utils.aoa_to_sheet(reqsToRows(data));
  ws["!cols"] = [{ wch: 28 }, { wch: 40 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Реквизиты");
  XLSX.writeFile(wb, filename || "rekvizity.xlsx");
}

function reqsToText(data) {
  return `Дата: ${data.date || "—"}
Сумма: ${data.summa ?? "—"} руб.
НДС (%): ${data.nds_percent ?? "—"}
Сумма НДС: ${data.nds_sum ?? "—"} руб.

Поставщик:
  - Название: ${data.provider_name || "—"}
  - ИНН: ${data.provider_inn || "—"}
  - Расчётный счёт: ${data.provider_account || "—"}

Покупатель:
  - Название: ${data.buyer_name || "—"}
  - ИНН: ${data.buyer_inn || "—"}
  - ФИО: ${data.buyer_fio || "—"}`.trim();
}

async function copyInvoiceText(inv) {
  try {
    await navigator.clipboard.writeText(reqsToText(mapInvoiceToReqs(inv)));
    alert("Реквизиты счёта скопированы");
  } catch (err) {
    alert("Не удалось скопировать текст");
  }
}

function invoicesToRows(invoices) {
  const cell = (v) => (v === null || v === undefined ? "" : v);
  const rows = [
    [
      "ID",
      "Дата",
      "Сумма",
      "НДС (%)",
      "Сумма НДС",
      "Поставщик",
      "ИНН поставщика",
      "Расчётный счёт",
      "Покупатель",
      "ИНН покупателя",
      "ФИО",
    ],
  ];
  invoices.forEach((inv) => {
    rows.push([
      cell(inv.id),
      cell(inv.date),
      cell(inv.summ),
      cell(inv.nds_percent),
      cell(inv.nds_sum),
      cell(inv.supplier?.name_sup),
      cell(inv.supplier?.inn_sup),
      cell(inv.supplier?.num_acc),
      cell(inv.buyer?.buyer_company),
      cell(inv.buyer?.inn_b),
      cell(inv.buyer?.fio),
    ]);
  });
  return rows;
}

async function fetchAllInvoices() {
  const token = getAuthToken();
  if (!token) {
    throw new Error("Необходимо авторизоваться");
  }
  let page = 1;
  const all = [];
  while (true) {
    const res = await fetch(`/save/my-invoices?page=${page}&limit=100`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      if (res.status === 401) {
        clearAuthToken();
        updateAuthUI();
      }
      throw new Error("Ошибка загрузки документов");
    }
    const data = await res.json();
    all.push(...(data.invoices || []));
    if (!data.has_more || !(data.invoices || []).length) break;
    page++;
  }
  return all;
}

document.getElementById("exportExcelBtn")?.addEventListener("click", () => {
  exportReqsToExcel(collectFormReqs(), "rekvizity.xlsx");
});

document.addEventListener("click", (e) => {
  const copyEl = e.target.closest("[data-copy-inv]");
  if (copyEl) {
    e.preventDefault();
    const id = parseInt(copyEl.getAttribute("data-copy-inv"));
    const inv = loadedInvoices.find((x) => x.id === id);
    if (inv) copyInvoiceText(inv);
  }
  const excelEl = e.target.closest("[data-excel-inv]");
  if (excelEl) {
    e.preventDefault();
    const id = parseInt(excelEl.getAttribute("data-excel-inv"));
    const inv = loadedInvoices.find((x) => x.id === id);
    if (inv) exportReqsToExcel(mapInvoiceToReqs(inv), `schet_${inv.id}.xlsx`);
  }
});

document.getElementById("exportAllExcelBtn")?.addEventListener("click", async (e) => {
  if (typeof XLSX === "undefined") {
    alert("Библиотека Excel не загружена. Проверьте подключение к интернету.");
    return;
  }
  const btn = e.currentTarget;
  const btnText = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Экспорт...';
  try {
    const invoices = await fetchAllInvoices();
    if (!invoices.length) {
      alert("Нет документов для экспорта");
      return;
    }
    const ws = XLSX.utils.aoa_to_sheet(invoicesToRows(invoices));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Счета");
    XLSX.writeFile(wb, "scheta.xlsx");
  } catch (err) {
    alert("Ошибка экспорта: " + err.message);
  } finally {
    btn.disabled = false;
    btn.innerHTML = btnText;
  }
});

updateAuthUI();
