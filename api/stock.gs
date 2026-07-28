/**
 * stock.gs
 * -----------------------------------------------------------------------
 * Modul Persediaan — Tahap 8.
 *
 * Spreadsheet 'stock' berisi 1 sheet:
 *   Movements: id | date | medicine_id | medicine_name | type | qty |
 *              reference | notes | created_by
 *
 * `qty` bertanda (+ untuk stok masuk, - untuk stok keluar). `type` salah
 * satu dari: in, out, adjustment, opname, transfer, purchase,
 * purchase_return, sale, sales_return.
 *
 * logStockMovement_() DIPANGGIL DARI purchase.gs & sales.gs (lewat
 * adjustMedicineStock_()) sehingga transaksi Pembelian/Penjualan Tahap 6-7
 * OTOMATIS tercatat di sini begitu Spreadsheet 'stock' dikonfigurasi —
 * tanpa perlu mengubah kode Tahap 6-7 sama sekali.
 *
 * Transfer Stock pada tahap ini disederhanakan menjadi PEMINDAHAN LOKASI
 * RAK (bukan transfer antar cabang — fitur Multi Cabang ada di roadmap
 * pengembangan lanjutan brief, belum termasuk lingkup Tahap 1-10 ini).
 * Batch Management memakai field `batch` yang sudah ada di Master Obat
 * (Tahap 5); ledger di sini mencatat pergerakan per obat, bukan per batch
 * terpisah, karena skema saat ini satu obat = satu batch aktif.
 * -----------------------------------------------------------------------
 */

const StockModule = {
  movementHistory(params) {
    return genericList_("stock", "Movements", params);
  },

  stockIn(payload) {
    validateStockPayload_(payload);
    adjustMedicineStock_(payload.medicine_id, Number(payload.qty), {
      type: "in",
      reference: payload.reference || "-",
      notes: payload.notes || "Stock Masuk manual",
    });
    return { success: true };
  },

  stockOut(payload) {
    validateStockPayload_(payload);
    ensureSufficientStock_(payload.medicine_id, Number(payload.qty));
    adjustMedicineStock_(payload.medicine_id, -Number(payload.qty), {
      type: "out",
      reference: payload.reference || "-",
      notes: payload.notes || "Stock Keluar manual",
    });
    return { success: true };
  },

  adjustment(payload) {
    if (!payload.medicine_id) throw new Error("Obat wajib dipilih");
    const delta = Number(payload.qty);
    if (!delta) throw new Error("Qty penyesuaian tidak boleh 0");
    if (delta < 0) ensureSufficientStock_(payload.medicine_id, Math.abs(delta));
    adjustMedicineStock_(payload.medicine_id, delta, {
      type: "adjustment",
      reference: payload.reference || "-",
      notes: payload.notes || "Penyesuaian stok manual",
    });
    return { success: true };
  },

  opname(payload) {
    if (!payload.medicine_id) throw new Error("Obat wajib dipilih");
    if (payload.physical_stock === undefined || Number(payload.physical_stock) < 0) {
      throw new Error("Stok fisik hasil opname tidak valid");
    }
    const medicine = genericGetById_("medicine", "Data", payload.medicine_id);
    if (!medicine) throw new Error("Obat tidak ditemukan");

    const systemStock = Number(medicine.stock || 0);
    const physicalStock = Number(payload.physical_stock);
    const difference = physicalStock - systemStock;

    genericUpdate_("medicine", "Data", payload.medicine_id, { stock: physicalStock });
    logStockMovement_(
      payload.medicine_id,
      medicine.name,
      difference,
      "opname",
      payload.reference || "-",
      `Stock Opname: sistem ${systemStock} -> fisik ${physicalStock} (${payload.notes || "-"})`
    );
    return { systemStock, physicalStock, difference };
  },

  transfer(payload) {
    if (!payload.medicine_id) throw new Error("Obat wajib dipilih");
    if (!payload.to_location || !String(payload.to_location).trim()) {
      throw new Error("Lokasi rak tujuan wajib diisi");
    }
    const medicine = genericGetById_("medicine", "Data", payload.medicine_id);
    if (!medicine) throw new Error("Obat tidak ditemukan");

    const fromLocation = medicine.rack_location || "-";
    genericUpdate_("medicine", "Data", payload.medicine_id, { rack_location: payload.to_location });
    logStockMovement_(
      payload.medicine_id,
      medicine.name,
      0,
      "transfer",
      payload.reference || "-",
      `Pindah rak: ${fromLocation} -> ${payload.to_location} (${payload.notes || "-"})`
    );
    return { success: true };
  },

  /** Obat mendekati expired (≤30 hari) & yang sudah expired — untuk halaman Expired Monitoring. */
  expiredMonitoring() {
    return {
      nearExpiry: trySafe_(() => listNearExpiry_(30), []),
      expired: trySafe_(() => listExpired_(), []),
    };
  },

  activeMedicines() {
    return trySafe_(() => listActiveMedicines_(), []);
  },
};

MODULE_REGISTRY_.stock = StockModule;

/* ------------------------------------------------------------------- */

function validateStockPayload_(payload) {
  if (!payload.medicine_id) throw new Error("Obat wajib dipilih");
  if (!payload.qty || Number(payload.qty) <= 0) throw new Error("Qty harus lebih dari 0");
}

function ensureSufficientStock_(medicineId, qty) {
  const medicine = genericGetById_("medicine", "Data", medicineId);
  if (!medicine) throw new Error("Obat tidak ditemukan");
  if (Number(medicine.stock || 0) < qty) {
    throw new Error(`Stok ${medicine.name} tidak mencukupi (tersedia ${medicine.stock})`);
  }
}

function listExpired_() {
  const { values, headers } = readSheet_("medicine", "Data");
  const nameIdx = headers.indexOf("name");
  const expIdx = headers.indexOf("expired_date");
  const stockIdx = headers.indexOf("stock");
  const today = new Date();
  const result = [];
  for (let i = 1; i < values.length; i++) {
    const exp = new Date(values[i][expIdx]);
    if (exp < today && Number(values[i][stockIdx]) > 0) {
      result.push({ id: values[i][0], name: values[i][nameIdx], expiredDate: values[i][expIdx], stock: values[i][stockIdx] });
    }
  }
  return result;
}

/**
 * Menulis satu baris histori ke Stock Movement Ledger. Dibungkus try/catch
 * supaya kegagalan (mis. Spreadsheet 'stock' belum dikonfigurasi) TIDAK
 * pernah menggagalkan proses Pembelian/Penjualan/Persediaan yang
 * memanggilnya — ledger ini bersifat pelengkap (audit trail), bukan
 * bagian kritis dari alur transaksi utama.
 */
function logStockMovement_(medicineId, medicineName, qty, type, reference, notes) {
  try {
    const sheet = getSheet_("stock", "Movements");
    sheet.appendRow([
      genericGenerateId_(sheet),
      formatDateOnly_(new Date()),
      medicineId,
      medicineName,
      type,
      qty,
      reference || "-",
      notes || "",
    ]);
  } catch (err) {
    Logger.log("[Stock] Gagal mencatat histori: " + err.message);
  }
}
