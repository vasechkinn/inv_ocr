const fileInput = document.getElementById("file_input");
const uploadBtn = document.getElementById("button_upload");
const editorContainer = document.getElementById("container_form");
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

if (editorContainer) {
  editorContainer.style.display = "none";
}

if (dateField) {
  let now = new Date().toISOString().split("T")[0];
  dateField.setAttribute("max", now);
}

if (uploadBtn && fileInput) {
  uploadBtn.addEventListener("click", async () => {
    if (!fileInput.files.length) {
      alert("Для обработки необходимо загрузить изображение или PDF");
      return;
    }
    const formData = new FormData();
    formData.append("file", fileInput.files[0]);

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
      const pd = data.payment_details;

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
      if (buyerFioField) buyerFioField.value = data.full_text?.buyer_fio || "";

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
  });
}

if (editForm && saveBtn) {
  editForm.addEventListener("submit", async (e) => {
    e.preventDefault();

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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!response.ok) {
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
      if (copyModalEl && window.bootstrap) {
        const modalWin = new bootstrap.Modal(copyModalEl);
        modalWin.show();
      } else if (copyModalEl) {
        copyModalEl.style.display = "block";
      }
    } catch (err) {
      alert("Ошибка при сохранении: " + err.message);
    } finally {
      saveBtn.disabled = false;
      saveBtn.innerHTML = btnText;
    }
  });
}

if (copyBtn && copyTextarea) {
    copyBtn.addEventListener('click', async () => {
        try {
            await navigator.clipboard.writeText(copyTextarea.value);
            alert('Текст скопирован в буфер обмена');
        } catch (err) {
            alert('Не удалось скопировать текст')
        }
    });
}

if (fileInput && previewImg) {
    fileInput.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (file && file.type.startsWith("image/")) {
            const url = URL.createObjectURL(file);
            previewImg.src = url;
            previewImg.style.display = "block";
            previewImg.onload = () => URL.revokeObjectURL(url);
        } else if (file && file.type === "application/pdf") {
            previewImg.src = "/static/img/pdf-icon.png";
            previewImg.style.display = "block";
        } else {
            // Ничего не показываем
            previewImg.src = "";
            previewImg.style.display = "none";
        }
    });
}


