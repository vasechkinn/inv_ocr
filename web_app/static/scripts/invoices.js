async function loadMyDocs(page = 1) {
  const token = getAuthToken();
  if (!token) {
    alert("Необходимо авторизоваться");
    return;
  }

  myDocsPage = page;
  const listEl = document.getElementById("invoices_list");
  const paginationEl = document.getElementById("invoices_pagination");

  if (listEl)
    listEl.innerHTML =
      '<div class="text-center"><div class="spinner-border"></div></div>';

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
    if (listEl)
      listEl.innerHTML = `<div class="alert alert-danger">${escapeHtml(err.message)}</div>`;
  }
}

function renderInvoicesList(data) {
  const listEl = document.getElementById("invoices_list");
  if (!listEl) return;

  loadedInvoices = data.invoices || [];

  if (!data.invoices || data.invoices.length === 0) {
    listEl.innerHTML =
      '<div class="alert alert-info">У вас пока нет сохранённых документов</div>';
    return;
  }

  listEl.innerHTML = data.invoices
    .map(
      (inv) => `
    <div class="list-group-item">
      <div class="d-flex justify-content-between align-items-center">
        <div>
          <strong>Дата:</strong> ${escapeHtml(inv.date) || "—"} &nbsp;
          <strong>Сумма:</strong> ${inv.summ ? escapeHtml(inv.summ) + " ₽" : "—"} &nbsp;
          <strong>НДС:</strong> ${escapeHtml(inv.nds_percent) || "—"}%
        </div>
        <div class="d-flex align-items-center gap-2">
          <small class="text-muted">#${escapeHtml(inv.id)}</small>
          <div class="dropdown">
            <button class="btn btn-sm btn-outline-primary dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
              Копировать
            </button>
            <ul class="dropdown-menu dropdown-menu-end">
              <li><a class="dropdown-item" href="#" data-copy-inv="${escapeHtml(inv.id)}">Копировать текст</a></li>
              <li><a class="dropdown-item" href="#" data-excel-inv="${escapeHtml(inv.id)}">Скачать Excel</a></li>
            </ul>
          </div>
        </div>
      </div>
      <div class="mt-1">
        <small>
          ${inv.supplier?.name_sup ? `<strong>Поставщик:</strong> ${escapeHtml(inv.supplier.name_sup)} (ИНН: ${escapeHtml(inv.supplier.inn_sup) || "—"})` : ""}
          ${inv.buyer?.buyer_company ? ` | <strong>Покупатель:</strong> ${escapeHtml(inv.buyer.buyer_company)}` : ""}
        </small>
      </div>
    </div>
  `,
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

if (btnMyDocsEl) {
  btnMyDocsEl.addEventListener("click", () => loadMyDocs(1));
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

document
  .getElementById("exportAllExcelBtn")
  ?.addEventListener("click", async (e) => {
    if (typeof XLSX === "undefined") {
      alert(
        "Библиотека Excel не загружена. Проверьте подключение к интернету.",
      );
      return;
    }
    const btn = e.currentTarget;
    const btnText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML =
      '<span class="spinner-border spinner-border-sm me-1"></span> Экспорт...';
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
