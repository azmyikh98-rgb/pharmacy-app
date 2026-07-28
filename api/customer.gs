/**
 * customer.gs
 * -----------------------------------------------------------------------
 * Sheet 'Data' modul customer, kolom:
 *   id | name | type | address | phone | email | member_point | status
 * -----------------------------------------------------------------------
 */

const CustomerModule = {
  list(params) { return genericList_("customer", "Data", params); },

  get(params) {
    const data = genericGetById_("customer", "Data", params.id);
    if (!data) throw new Error("Customer tidak ditemukan");
    return data;
  },

  create(payload) {
    validateCustomer_(payload);
    const data = Object.assign({ member_point: 0, status: "active" }, payload);
    return genericCreate_("customer", "Data", data);
  },

  update(payload) {
    validateCustomer_(payload);
    return genericUpdate_("customer", "Data", payload.id, payload);
  },

  delete(params) { return genericDelete_("customer", "Data", params.id); },
};

MODULE_REGISTRY_.customer = CustomerModule;

function validateCustomer_(data) {
  if (!data.name || !String(data.name).trim()) throw new Error("Nama Customer wajib diisi");
  if (data.email && !isValidEmail_(data.email)) throw new Error("Format email tidak valid");
}
