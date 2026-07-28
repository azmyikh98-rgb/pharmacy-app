/**
 * purchase.gs
 * -----------------------------------------------------------------------
 * Modul Pembelian — Tahap 6.
 *
 * Spreadsheet 'purchase' berisi 3 sheet:
 *   Data    : id | po_number | date | supplier | status | invoice_url | notes | total
 *   Items   : id | purchase_id | medicine_id | medicine_name | qty | buy_price | subtotal
 *   Returns : id | purchase_id | medicine_id | qty | reason | date
 *
 * Alur status: draft -> approved -> received (final)
 *              draft/approved -> cancelled (final)
 * Stok obat (medicine.stock) bertambah otomatis saat status berubah ke
 * "received", dan berkurang saat ada Retur Pembelian. Ini SEMENTARA
 * langsung mengubah kolom stock di sheet medicine — begitu modul
 * Persediaan (Tahap 8) dibangun dengan ledger Stock Movement, fungsi
 * adjustMedicineStock_() di bawah ini yang akan diperluas untuk juga
 * mencatat baris histori, tanpa mengubah pemanggilnya.
 *
 * Upload Invoice: disimpan sebagai invoice_url (link dokumen), bukan file
 * upload biner, mengikuti pola yang sama dengan Foto Obat di Tahap 5
 * (keterbatasan Google Spreadsheet sebagai database).
 * -----------------------------------------------------------------------
 */

const PurchaseModule = {
  list(params) { return genericList_("purchase", "Data", params); },

  get(params) {
    const header = genericGetById_("purchase", "Data", params.id);
    if (!header) throw new Error("Purchase Order tidak ditemukan");
    header.items = getPurchaseItems_(params.id);
    return header;
  },

  create(payload) {
    validatePurchasePayload_(payload);
    const total = calculateItemsTotal_(payload.items);
    const header = genericCreate_("purchase", "Data", {
      po_number: generatePoNumber_(),
      date: payload.date || formatDateOnly_(new Date()),
      supplier: payload.supplier,
      status: "draft",
      invoice_url: payload.invoice_url || "",
      notes: payload.notes || "",
      total,
    });
    savePurchaseItems_(header.id, payload.items);
    header.items = payload.items;
    return header;
  },

  update(payload) {
    const header = genericGetById_("purchase", "Data", payload.id);
    if (!header) throw new Error("Purchase Order tidak ditemukan");
    if (header.status !== "draft") throw new Error("Hanya PO berstatus Draft yang bisa diedit");

    validatePurchasePayload_(payload);
    const total = calculateItemsTotal_(payload.items);
    const updated = genericUpdate_("purchase", "Data", payload.id, {
      date: payload.date,
      supplier: payload.supplier,
      invoice_url: payload.invoice_url || "",
      notes: payload.notes || "",
      total,
    });
    replacePurchaseItems_(payload.id, payload.items);
    updated.items = payload.items;
    return updated;
  },

  approve(params) {
    return transitionStatus_(params.id, ["draft"], "approved");
  },

  receive(params) {
    const header = genericGetById_("purchase", "Data", params.id);
    if (!header) throw new Error("Purchase Order tidak ditemukan");
    if (header.status !== "approved") throw new Error("PO harus berstatus Approved sebelum diterima");

    getPurchaseItems_(params.id).forEach((item) => {
      adjustMedicineStock_(item.medicine_id, Number(item.qty), {
        type: "purchase",
        reference: header.po_number,
        notes: "Penerimaan barang",
      });
    });
    return genericUpdate_("purchase", "Data", params.id, { status: "received" });
  },

  cancel(params) {
    const header = genericGetById_("purchase", "Data", params.id);
    if (!header) throw new Error("Purchase Order tidak ditemukan");
    if (header.status === "received") throw new Error("PO yang sudah diterima tidak bisa dibatalkan");
    return genericUpdate_("purchase", "Data", params.id, { status: "cancelled" });
  },

  retur(payload) {
    const header = genericGetById_("purchase", "Data", payload.purchase_id);
    if (!header) throw new Error("Purchase Order tidak ditemukan");
    if (header.status !== "received") throw new Error("Retur hanya berlaku untuk PO yang sudah diterima");
    if (!payload.medicine_id) throw new Error("Obat yang diretur wajib dipilih");
    if (!payload.qty || Number(payload.qty) <= 0) throw new Error("Qty retur harus lebih dari 0");

    adjustMedicineStock_(payload.medicine_id, -Number(payload.qty), {
      type: "purchase_return",
      reference: header.po_number,
      notes: payload.reason || "Retur pembelian",
    });
    return genericCreate_("purchase", "Returns", {
      purchase_id: payload.purchase_id,
      medicine_id: payload.medicine_id,
      qty: payload.qty,
      reason: payload.reason || "",
      date: formatDateOnly_(new Date()),
    });
  },

  /** Dropdown obat aktif untuk item Purchase Order (id, name, buy_price). */
  activeMedicines() {
    return trySafe_(() => listActiveMedicines_(), []);
  },
};

MODULE_REGISTRY_.purchase = PurchaseModule;

/* ------------------------------------------------------------------- */

function transitionStatus_(id, allowedFrom, toStatus) {
  const header = genericGetById_("purchase", "Data", id);
  if (!header) throw new Error("Purchase Order tidak ditemukan");
  if (allowedFrom.indexOf(header.status) === -1) {
    throw new Error(`Status saat ini (${header.status}) tidak bisa diubah ke ${toStatus}`);
  }
  return genericUpdate_("purchase", "Data", id, { status: toStatus });
}

function getPurchaseItems_(purchaseId) {
  const sheet = getSheet_("purchase", "Items");
  const values = sheet.getDataRange().getValues();
  const headers = values[0];
  const pidIdx = headers.indexOf("purchase_id");
  return values
    .slice(1)
    .filter((row) => String(row[pidIdx]) === String(purchaseId))
    .map((row) => rowToObject_(headers, row));
}

function savePurchaseItems_(purchaseId, items) {
  const sheet = getSheet_("purchase", "Items");
  items.forEach((item) => {
    sheet.appendRow([
      genericGenerateId_(sheet),
      purchaseId,
      item.medicine_id,
      item.medicine_name,
      item.qty,
      item.buy_price,
      Number(item.qty) * Number(item.buy_price),
    ]);
  });
}

function replacePurchaseItems_(purchaseId, items) {
  const sheet = getSheet_("purchase", "Items");
  const values = sheet.getDataRange().getValues();
  const headers = values[0];
  const pidIdx = headers.indexOf("purchase_id");
  // Hapus dari baris paling bawah dulu supaya index baris tidak bergeser saat dihapus.
  for (let i = values.length - 1; i >= 1; i--) {
    if (String(values[i][pidIdx]) === String(purchaseId)) sheet.deleteRow(i + 1);
  }
  savePurchaseItems_(purchaseId, items);
}

/**
 * Menyesuaikan stok Obat. Parameter `meta` OPSIONAL — jika diisi
 * { type, reference, notes }, perubahan ini juga dicatat ke Stock
 * Movement Ledger (modul 'stock', Tahap 8) lewat logStockMovement_().
 * Jika Tahap 8 belum di-setup, logStockMovement_() gagal secara diam-diam
 * (dibungkus trySafe_ di dalamnya) sehingga TIDAK menggagalkan proses
 * Pembelian/Penjualan yang memanggil fungsi ini.
 */
function adjustMedicineStock_(medicineId, deltaQty, meta) {
  const sheet = getSheet_("medicine", "Data");
  const values = sheet.getDataRange().getValues();
  const headers = values[0];
  const stockIdx = headers.indexOf("stock");
  const nameIdx = headers.indexOf("name");
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][0]) === String(medicineId)) {
      const newStock = Number(values[i][stockIdx] || 0) + deltaQty;
      sheet.getRange(i + 1, stockIdx + 1).setValue(Math.max(0, newStock));
      if (meta) {
        logStockMovement_(medicineId, values[i][nameIdx], deltaQty, meta.type, meta.reference, meta.notes);
      }
      return;
    }
  }
  // Obat tidak ditemukan (mis. data demo tidak lengkap) — lewati tanpa menggagalkan proses.
}

function calculateItemsTotal_(items) {
  return items.reduce((sum, item) => sum + Number(item.qty || 0) * Number(item.buy_price || 0), 0);
}

function generatePoNumber_() {
  const datePart = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyyMMdd");
  return "PO-" + datePart + "-" + Math.floor(1000 + Math.random() * 9000);
}

function validatePurchasePayload_(payload) {
  if (!payload.supplier) throw new Error("Supplier wajib dipilih");
  if (!Array.isArray(payload.items) || payload.items.length === 0) {
    throw new Error("Minimal 1 item obat wajib diisi");
  }
  payload.items.forEach((item) => {
    if (!item.medicine_id) throw new Error("Obat pada setiap item wajib dipilih");
    if (!item.qty || Number(item.qty) <= 0) throw new Error("Qty item harus lebih dari 0");
    if (item.buy_price === undefined || Number(item.buy_price) < 0) throw new Error("Harga beli item tidak valid");
  });
}

function listActiveMedicines_() {
  const { values, headers } = readSheet_("medicine", "Data");
  const codeIdx = headers.indexOf("code");
  const barcodeIdx = headers.indexOf("barcode");
  const nameIdx = headers.indexOf("name");
  const buyIdx = headers.indexOf("buy_price");
  const sellIdx = headers.indexOf("sell_price");
  const stockIdx = headers.indexOf("stock");
  const statusIdx = headers.indexOf("status");
  return values
    .slice(1)
    .filter((row) => row[statusIdx] === "active")
    .map((row) => ({
      id: row[0],
      code: row[codeIdx],
      barcode: row[barcodeIdx],
      name: row[nameIdx],
      buy_price: row[buyIdx],
      sell_price: row[sellIdx],
      stock: row[stockIdx],
    }));
}
