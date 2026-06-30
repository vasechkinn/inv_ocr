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
  if (providerAccountField)
    providerAccountField.value = pd.provider_account || "";
  if (buyerNameField) buyerNameField.value = pd.buyer_name || "";
  if (buyerInnField) buyerInnField.value = pd.buyer_inn || "";
  if (buyerFioField) buyerFioField.value = fullText?.buyer_fio || "";
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
      alert(
        "Для сохранения необходимо войти в аккаунт. Нажмите 'Войти' в верхнем меню.",
      );
      return;
    }

    const innFields = [
      { id: "provider_inn", label: "ИНН поставщика" },
      { id: "buyer_inn", label: "ИНН покупателя" },
    ];
    const accountFields = [
      { id: "provider_account", label: "Расчётный счёт поставщика" },
    ];

    for (const field of innFields) {
      const el = document.getElementById(field.id);
      const val = el?.value || "";
      if (val && !/^\d+$/.test(val)) {
        alert(`${field.label} должен содержать только цифры`);
        el?.focus();
        return;
      }
      if (val && val.length !== 10 && val.length !== 12) {
        alert(`${field.label} должен содержать 10 или 12 цифр`);
        el?.focus();
        return;
      }
    }

    for (const field of accountFields) {
      const el = document.getElementById(field.id);
      const val = el?.value || "";
      if (val && !/^\d+$/.test(val)) {
        alert(`${field.label} должен содержать только цифры`);
        el?.focus();
        return;
      }
      if (val && val.length !== 20) {
        alert(`${field.label} должен содержать 20 цифр`);
        el?.focus();
        return;
      }
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
        if (err.detail && Array.isArray(err.detail)) {
          const messages = err.detail.map((e) => e.msg).join("; ");
          throw new Error(messages);
        }
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

      updateCarouselButtons();

      if (queueIndex >= uploadQueue.length - 1) {
        if (copyModalEl && window.bootstrap) {
          const modalWin = new bootstrap.Modal(copyModalEl);

          copyModalEl.addEventListener(
            "shown.bs.modal",
            () => {
              copyTextarea?.focus();
            },
            { once: true },
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

  summaField.addEventListener("input", function () {
    let val = this.value.replace(",", ".");
    let num = parseFloat(val);
    if (isNaN(num) || num < 0) {
      this.setCustomValidity("Сумма не может быть отрицательной");
    } else {
      this.setCustomValidity("");
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

document
  .getElementById("copyRequisitesBtn")
  ?.addEventListener("click", function () {
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
    if (pdfPreview) {
      pdfPreview.src = "";
      pdfPreview.style.display = "none";
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
