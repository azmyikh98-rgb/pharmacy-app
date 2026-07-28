/**
 * medicine.gs
 * -----------------------------------------------------------------------
 * Sheet 'Data' modul medicine, kolom:
 *   id | code | barcode | name | category | golongan | brand | unit |
 *   buy_price | sell_price | stock | min_stock | batch | expired_date |
 *   rack_location | supplier | status | photo_url | notes
 *
 * Catatan desain:
 *  - "Margin" di brief dihitung otomatis di frontend dari
 *    (sell_price - buy_price) / buy_price — bukan kolom tersimpan, supaya
 *    tidak pernah tidak-sinkron saat salah satu harga diubah.
 *  - "Foto" disimpan sebagai photo_url (link gambar), bukan file upload
 *    biner — sesuai keterbatasan Google Spreadsheet sebagai database.
 * -----------------------------------------------------------------------
 */

const MedicineModule = {
  list(params) { return genericList_("medicine", "Data", params); },

  get(params) {
    const data = genericGetById_("medicine", "Data", params.id);
    if (!data) throw new Error("Obat tidak ditemukan");
    return data;
  },

  create(payload) {
    validateMedicine_(payload);
    if (isDuplicate_("medicine", "Data", "code", payload.code)) {
      throw new Error("Kode Obat sudah digunakan");
    }
    if (payload.barcode && isDuplicate_("medicine", "Data", "barcode", payload.barcode)) {
      throw new Error("Barcode sudah digunakan obat lain");
    }
    return genericCreate_("medicine", "Data", withDefaults_(payload));
  },

  update(payload) {
    validateMedicine_(payload);
    if (isDuplicate_("medicine", "Data", "code", payload.code, payload.id)) {
      throw new Error("Kode Obat sudah digunakan");
    }
    if (payload.barcode && isDuplicate_("medicine", "Data", "barcode", payload.barcode, payload.id)) {
      throw new Error("Barcode sudah digunakan obat lain");
    }
    return genericUpdate_("medicine", "Data", payload.id, payload);
  },

  delete(params) { return genericDelete_("medicine", "Data", params.id); },

  /** Dropdown data untuk form Tambah/Edit Obat. */
  lookups() {
    return {
      categories: trySafe_(() => listNames_("category", "Data"), []),
      units: trySafe_(() => listNames_("unit", "Data"), []),
      brands: trySafe_(() => listNames_("brand", "Data"), []),
      suppliers: trySafe_(() => listNames_("supplier", "Data"), []),
    };
  },
};

MODULE_REGISTRY_.medicine = MedicineModule;

function withDefaults_(payload) {
  return Object.assign({ status: "active" }, payload);
}

function validateMedicine_(data) {
  if (!data.code || !String(data.code).trim()) throw new Error("Kode Obat wajib diisi");
  if (!data.name || !String(data.name).trim()) throw new Error("Nama Obat wajib diisi");

  if (data.stock !== undefined && data.stock !== "" && Number(data.stock) < 0) {
    throw new Error("Stok tidak boleh negatif");
  }
  if (data.min_stock !== undefined && data.min_stock !== "" && Number(data.min_stock) < 0) {
    throw new Error("Minimum stok tidak boleh negatif");
  }
  if (data.buy_price !== undefined && data.buy_price !== "" && Number(data.buy_price) < 0) {
    throw new Error("Harga beli tidak boleh negatif");
  }
  if (data.sell_price !== undefined && data.sell_price !== "" && Number(data.sell_price) < 0) {
    throw new Error("Harga jual tidak boleh negatif");
  }
  if (data.expired_date) {
    const exp = new Date(data.expired_date);
    if (isNaN(exp.getTime())) throw new Error("Format tanggal expired tidak valid");
  }
}
