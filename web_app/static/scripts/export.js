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

document.getElementById("exportExcelBtn")?.addEventListener("click", () => {
  exportReqsToExcel(collectFormReqs(), "rekvizity.xlsx");
});

document.getElementById("exportJsonBtn")?.addEventListener("click", () => {
  const data = collectFormReqs();

  const json1C = [
    {
      Дата: data.date || "",
      Сумма: data.summa || "",
      НДС_процент: data.nds_percent || "",
      НДС_сумма: data.nds_sum || "",
      Поставщик_название: data.provider_name || "",
      Поставщик_ИНН: data.provider_inn || "",
      Поставщик_расчётный_счёт: data.provider_account || "",
      Покупатель_название: data.buyer_name || "",
      Покупатель_ИНН: data.buyer_inn || "",
      Покупатель_ФИО: data.buyer_fio || "",
    },
  ];

  const jsonString = JSON.stringify(json1C, null, 2);

  const blob = new Blob([jsonString], {
    type: "application/json;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "schet_1c.json";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  if (copyTextarea) {
    copyTextarea.value = jsonString;
  }
  if (copyModalEl && window.bootstrap) {
    const modal = new bootstrap.Modal(copyModalEl);
    modal.show();
  }
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
