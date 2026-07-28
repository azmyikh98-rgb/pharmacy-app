/**
 * supplier.gs
 * -----------------------------------------------------------------------
 * Sheet 'Data' modul supplier, kolom:
 *   id | name | pic | address | phone | email | npwp | status
 * -----------------------------------------------------------------------
 */

const SupplierModule = {
  list(params) { return genericList_("supplier", "Data", params); },

  get(params) {
    const data = genericGetById_("supplier", "Data", params.id);
    if (!data) throw new Error("Supplier tidak ditemukan");
    return data;
  },

  create(payload) {
    validateSupplier_(payload);
    if (isDuplicate_("supplier", "Data", "name", payload.name)) {
      throw new Error("Nama supplier sudah terdaftar");
    }
    return genericCreate_("supplier", "Data", payload);
  },

  update(payload) {
    validateSupplier_(payload);
    if (isDuplicate_("supplier", "Data", "name", payload.name, payload.id)) {
      throw new Error("Nama supplier sudah terdaftar");
    }
    return genericUpdate_("supplier", "Data", payload.id, payload);
  },

  delete(params) { return genericDelete_("supplier", "Data", params.id); },
};

MODULE_REGISTRY_.supplier = SupplierModule;

function validateSupplier_(data) {
  if (!data.name || !String(data.name).trim()) throw new Error("Nama Supplier wajib diisi");
  if (data.email && !isValidEmail_(data.email)) throw new Error("Format email tidak valid");
}
