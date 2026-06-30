const fileInput = document.getElementById("file_input");
const uploadBtn = document.getElementById("button_upload");
const fileNameSpan = document.getElementById("file_name");
const previewImg = document.getElementById("preview_image");
const pdfPreview = document.getElementById("pdf_preview");
const previewPlaceholder = document.getElementById("preview_placeholder");
const queueProgress = document.getElementById("queue_progress");
const carouselControls = document.getElementById("carousel_controls");
const prevBtn = document.getElementById("prev_btn");
const nextBtn = document.getElementById("next_btn");
const skipBtn = document.getElementById("skip_btn");

const ALLOWED_FORMATS = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/bmp",
  "image/tiff",
  "image/webp",
  "application/pdf",
];
const MAX_FILE_SIZE = 10 * 1024 * 1024;

function showError(message, detail) {
  const errorContainer = document.getElementById("upload_error");
  if (!errorContainer) {
    alert(message + (detail ? ": " + detail : ""));
    return;
  }

  let html = `<div class="alert alert-danger alert-dismissible fade show" role="alert">
    <strong>${message}</strong>`;
  if (detail) {
    html += `<br><small>${detail}</small>`;
  }
  html += ` <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button></div>`;
  errorContainer.innerHTML = html;
  errorContainer.style.display = "block";

  setTimeout(() => {
    errorContainer.style.display = "none";
  }, 8000);
}

function hideError() {
  const errorContainer = document.getElementById("upload_error");
  if (errorContainer) {
    errorContainer.style.display = "none";
  }
}

function validateFile(file) {
  if (!ALLOWED_FORMATS.includes(file.type)) {
    return {
      valid: false,
      message: "Неподдерживаемый формат",
      detail: `Формат "${file.type}" не поддерживается. Используйте PNG, JPG, BMP, TIFF, WEBP или PDF.`,
    };
  }
  if (file.size > MAX_FILE_SIZE) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      message: "Файл слишком большой",
      detail: `Размер: ${sizeMB} МБ, максимум: 10 МБ`,
    };
  }
  return { valid: true };
}

function showPreview(file) {
  if (currentPreviewUrl) {
    URL.revokeObjectURL(currentPreviewUrl);
    currentPreviewUrl = null;
  }

  if (!file) return;

  if (previewImg) previewImg.style.display = "none";
  if (pdfPreview) pdfPreview.style.display = "none";
  if (previewPlaceholder) previewPlaceholder.style.display = "none";

  if (file.type.startsWith("image/")) {
    currentPreviewUrl = URL.createObjectURL(file);
    if (previewImg) {
      previewImg.src = currentPreviewUrl;
      previewImg.style.display = "block";
    }
  } else if (file.type === "application/pdf") {
    currentPreviewUrl = URL.createObjectURL(file);
    if (pdfPreview) {
      pdfPreview.src = currentPreviewUrl;
      pdfPreview.style.display = "block";
    }
  } else {
    if (previewPlaceholder) {
      previewPlaceholder.textContent = file.name;
      previewPlaceholder.style.display = "block";
    }
  }
}

if (fileInput && fileNameSpan) {
  fileInput.addEventListener("change", function () {
    hideError();
    if (this.files && this.files.length > 1) {
      fileNameSpan.textContent = `Выбрано файлов: ${this.files.length}`;
    } else if (this.files && this.files.length === 1) {
      fileNameSpan.textContent = this.files[0].name;
      showPreview(this.files[0]);
    } else {
      fileNameSpan.textContent = "Файл не выбран";
      showPreview(null);
    }
  });
}

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

  hideError();
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
      let message = "Ошибка распознавания";
      try {
        const err = await response.json();
        message = err.detail || message;
      } catch (e) {
        message = response.statusText || message;
      }
      showError(message);
      throw new Error(message);
    }

    const data = await response.json();
    fillForm(data.payment_details, data.full_text);

    if (editorContainer) {
      editorContainer.style.display = "block";
      editorContainer.scrollIntoView({ behavior: "smooth" });
    }
  } catch (err) {
  } finally {
    uploadBtn.disabled = false;
    uploadBtn.innerHTML = btnText;
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

if (uploadBtn && fileInput) {
  uploadBtn.addEventListener("click", async () => {
    if (!fileInput.files.length) {
      alert("Для обработки необходимо загрузить изображение или PDF");
      return;
    }

    const file = fileInput.files[0];
    const validation = validateFile(file);
    if (!validation.valid) {
      showError(validation.message, validation.detail);
      return;
    }

    uploadQueue = Array.from(fileInput.files);
    queueIndex = 0;
    await processQueueItem();
  });
}
