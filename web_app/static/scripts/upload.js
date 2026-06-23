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
    uploadQueue = Array.from(fileInput.files);
    queueIndex = 0;
    await processQueueItem();
  });
}
