/**
 * lookup.gs
 * -----------------------------------------------------------------------
 * Tiga modul master data paling sederhana: Kategori Obat, Satuan, Merk.
 * Digabung dalam satu file karena strukturnya identik (hanya CRUD nama +
 * status) — tetap 3 Spreadsheet terpisah (category / unit / brand) sesuai
 * arsitektur "1 modul = 1 spreadsheet", hanya file .gs-nya yang digabung
 * supaya tidak ada 3 file nyaris kosong berulang.
 *
 * Sheet 'Data' masing-masing, kolom: id | name | status
 * -----------------------------------------------------------------------
 */

const CategoryModule = {
  list(params) { return genericList_("category", "Data", params); },
  create(payload) {
    validateLookup_(payload);
    if (isDuplicate_("category", "Data", "name", payload.name)) throw new Error("Kategori sudah ada");
    return genericCreate_("category", "Data", payload);
  },
  update(payload) {
    validateLookup_(payload);
    if (isDuplicate_("category", "Data", "name", payload.name, payload.id)) throw new Error("Kategori sudah ada");
    return genericUpdate_("category", "Data", payload.id, payload);
  },
  delete(params) { return genericDelete_("category", "Data", params.id); },
};
MODULE_REGISTRY_.category = CategoryModule;

const UnitModule = {
  list(params) { return genericList_("unit", "Data", params); },
  create(payload) {
    validateLookup_(payload);
    if (isDuplicate_("unit", "Data", "name", payload.name)) throw new Error("Satuan sudah ada");
    return genericCreate_("unit", "Data", payload);
  },
  update(payload) {
    validateLookup_(payload);
    if (isDuplicate_("unit", "Data", "name", payload.name, payload.id)) throw new Error("Satuan sudah ada");
    return genericUpdate_("unit", "Data", payload.id, payload);
  },
  delete(params) { return genericDelete_("unit", "Data", params.id); },
};
MODULE_REGISTRY_.unit = UnitModule;

const BrandModule = {
  list(params) { return genericList_("brand", "Data", params); },
  create(payload) {
    validateLookup_(payload);
    if (isDuplicate_("brand", "Data", "name", payload.name)) throw new Error("Merk sudah ada");
    return genericCreate_("brand", "Data", payload);
  },
  update(payload) {
    validateLookup_(payload);
    if (isDuplicate_("brand", "Data", "name", payload.name, payload.id)) throw new Error("Merk sudah ada");
    return genericUpdate_("brand", "Data", payload.id, payload);
  },
  delete(params) { return genericDelete_("brand", "Data", params.id); },
};
MODULE_REGISTRY_.brand = BrandModule;

function validateLookup_(data) {
  if (!data.name || !String(data.name).trim()) throw new Error("Nama wajib diisi");
}
