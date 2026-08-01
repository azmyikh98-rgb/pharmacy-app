/**
 * sales.gs
 * -----------------------------------------------------------------------
 * Modul Penjualan — Tahap 7.
 *
 * Spreadsheet 'sales' berisi 3 sheet (pola sama dengan modul 'purchase'):
 *   Data    : id | invoice_number | date | customer_id | customer_name |
 *             subtotal | discount | voucher | tax | total | payment_method |
 *             paid_amount | change_amount | cashier | status
 *   Items   : id | sale_id | medicine_id | medicine_name | qty | price | subtotal
 *   Returns : id | sale_id | medicine_id | qty | reason | date
 *
 * Fungsi adjustMedicineStock_(), listActiveMedicines_(), formatDateOnly_(),
 * readSheet_(), dan trySafe_() DIPAKAI ULANG dari purchase.gs/dashboard.gs
 * (satu project Apps Script, satu scope global) — tidak ditulis ulang di
 * sini supaya logic penyesuaian stok tetap konsisten di seluruh aplikasi.
 *
 * Diskon & Voucher saat ini adalah input nominal manual oleh kasir (bukan
 * validasi kode voucher ke database terpisah) — cukup untuk kebutuhan POS
 * dasar; validasi kode voucher sungguhan bisa ditambahkan sebagai modul
 * terpisah di tahap lanjutan tanpa mengubah struktur ini.
 * Pajak (%) juga input manual per transaksi karena modul Setting (Tahap 10)
 * yang menyimpan tarif pajak default apotek belum dibangun.
 * -----------------------------------------------------------------------
 */

const VALID_PAYMENT_METHODS_ = ["cash", "qris", "transfer", "debit", "credit"];

const SalesModule = {
  list(params) { return genericList_("sales", "Data", params); },

  get(params) {
    const header = genericGetById_("sales", "Data", params.id);
    if (!header) throw new Error("Transaksi penjualan tidak ditemukan");
    header.items = getSalesItems_(params.id);
    return header;
  },

  create(payload) {
    validateSalesPayload_(payload);
    checkStockAvailability_(payload.items);
    const totals = calculateSalesTotals_(payload);

    const header = genericCreate_("sales", "Data", {
      invoice_number: generateInvoiceNumber_(),
      date: payload.date || formatDateOnly_(new Date()),
      customer_id: payload.customer_id || "",
      customer_name: payload.customer_name || "Umum",
      subtotal: totals.subtotal,
      discount: totals.discount,
      voucher: totals.voucher,
      tax: totals.tax,
      total: totals.total,
      payment_method: payload.payment_method,
      paid_amount: payload.paid_amount,
      change_amount: totals.change,
      cashier: payload.cashier || "",
      status: "completed",
    });

    saveSalesItems_(header.id, payload.items);
    payload.items.forEach((item) =>
      adjustMedicineStock_(item.medicine_id, -Number(item.qty), {
        type: "sale",
        reference: header.invoice_number,
        notes: "Penjualan POS",
      })
    );

    if (payload.customer_id) {
      addMemberPoint_(payload.customer_id, Math.floor(totals.total / 10000));
    }

    header.items = payload.items;
    return header;
  },

  retur(payload) {
    const header = genericGetById_("sales", "Data", payload.sale_id);
    if (!header) throw new Error("Transaksi penjualan tidak ditemukan");
    if (!payload.medicine_id) throw new Error("Obat yang diretur wajib dipilih");
    if (!payload.qty || Number(payload.qty) <= 0) throw new Error("Qty retur harus lebih dari 0");

    adjustMedicineStock_(payload.medicine_id, Number(payload.qty), {
      type: "sales_return",
      reference: header.invoice_number,
      notes: payload.reason || "Retur penjualan",
    });
    return genericCreate_("sales", "Returns", {
      sale_id: payload.sale_id,
      medicine_id: payload.medicine_id,
      qty: payload.qty,
      reason: payload.reason || "",
      date: formatDateOnly_(new Date()),
    });
  },

  /** Dropdown/search obat aktif untuk POS (termasuk stock & barcode). */
  activeMedicines() {
    return trySafe_(() => listActiveMedicines_(), []);
  },

  /** Dropdown pencarian member/customer di POS. */
  customers() {
    return trySafe_(() => listCustomersBrief_(), []);
  },
};

MODULE_REGISTRY_.sales = SalesModule;

/* ------------------------------------------------------------------- */

function getSalesItems_(saleId) {
  const sheet = getSheet_("sales", "Items");
  const values = sheet.getDataRange().getValues();
  const headers = values[0];
  const sidIdx = headers.indexOf("sale_id");
  return values
    .slice(1)
    .filter((row) => String(row[sidIdx]) === String(saleId))
    .map((row) => rowToObject_(headers, row));
}

function saveSalesItems_(saleId, items) {
  const sheet = getSheet_("sales", "Items");
  items.forEach((item) => {
    sheet.appendRow([
      genericGenerateId_(sheet),
      saleId,
      item.medicine_id,
      item.medicine_name,
      item.qty,
      item.price,
      Number(item.qty) * Number(item.price),
    ]);
  });
}

/** Stock Validation: pastikan stok cukup SEBELUM transaksi disimpan. */
function checkStockAvailability_(items) {
  const { values, headers } = readSheet_("medicine", "Data");
  const stockIdx = headers.indexOf("stock");
  const nameIdx = headers.indexOf("name");
  items.forEach((item) => {
    for (let i = 1; i < values.length; i++) {
      if (String(values[i][0]) === String(item.medicine_id)) {
        if (Number(values[i][stockIdx]) < Number(item.qty)) {
          throw new Error(`Stok ${values[i][nameIdx]} tidak mencukupi (tersedia ${values[i][stockIdx]})`);
        }
        return;
      }
    }
    throw new Error("Salah satu obat di keranjang tidak ditemukan di Master Data");
  });
}

function calculateSalesTotals_(payload) {
  const subtotal = payload.items.reduce((sum, item) => sum + Number(item.qty) * Number(item.price), 0);
  const discount = Number(payload.discount) || 0;
  const voucher = Number(payload.voucher) || 0;
  const taxPercent = Number(payload.tax_percent) || 0;
  const taxableBase = Math.max(0, subtotal - discount - voucher);
  const tax = (taxableBase * taxPercent) / 100;
  const total = taxableBase + tax;
  const paid = Number(payload.paid_amount) || 0;

  if (paid < total) throw new Error("Jumlah pembayaran kurang dari total tagihan");

  return { subtotal, discount, voucher, tax, total, change: paid - total };
}

function generateInvoiceNumber_() {
  const datePart = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyyMMdd");
  return "INV-" + datePart + "-" + Math.floor(1000 + Math.random() * 9000);
}

function addMemberPoint_(customerId, points) {
  if (!points) return;
  try {
    const current = genericGetById_("customer", "Data", customerId);
    if (!current) return;
    genericUpdate_("customer", "Data", customerId, {
      member_point: Number(current.member_point || 0) + points,
    });
  } catch (err) {
    // Kegagalan update poin tidak boleh menggagalkan transaksi yang sudah tercatat.
  }
}

function listCustomersBrief_() {
  const { values, headers } = readSheet_("customer", "Data");
  const nameIdx = headers.indexOf("name");
  const pointIdx = headers.indexOf("member_point");
  const statusIdx = headers.indexOf("status");
  return values
    .slice(1)
    .filter((row) => row[statusIdx] === "active")
    .map((row) => ({ id: row[0], name: row[nameIdx], member_point: row[pointIdx] }));
}

function validateSalesPayload_(payload) {
  if (!Array.isArray(payload.items) || payload.items.length === 0) {
    throw new Error("Keranjang belanja tidak boleh kosong");
  }
  if (!VALID_PAYMENT_METHODS_.includes(payload.payment_method)) {
    throw new Error("Metode pembayaran tidak valid");
  }
  payload.items.forEach((item) => {
    if (!item.medicine_id) throw new Error("Obat pada item keranjang wajib diisi");
    if (!item.qty || Number(item.qty) <= 0) throw new Error("Qty item harus lebih dari 0");
  });
}
