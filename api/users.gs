/**
 * users.gs
 * -----------------------------------------------------------------------
 * Sheet 'Data' modul user — SAMA PERSIS dengan yang dipakai login.gs:
 *   id | username | password_hash | name | role | status
 *
 * password_hash TIDAK PERNAH dikembalikan ke frontend (stripPasswordHash_)
 * dan hanya diisi/diubah lewat hashPassword_() dari login.gs — tidak
 * pernah ditulis manual sebagai plain text.
 * -----------------------------------------------------------------------
 */

const VALID_ROLES_ = ["admin", "apoteker", "kasir", "gudang", "owner"];

const UserModule = {
  list(params) {
    const result = genericList_("user", "Data", params);
    result.rows = result.rows.map(stripPasswordHash_);
    return result;
  },

  get(params) {
    const data = genericGetById_("user", "Data", params.id);
    if (!data) throw new Error("User tidak ditemukan");
    return stripPasswordHash_(data);
  },

  create(payload) {
    validateUser_(payload, true);
    if (isDuplicate_("user", "Data", "username", payload.username)) {
      throw new Error("Username sudah digunakan");
    }
    const data = {
      username: payload.username,
      name: payload.name,
      role: payload.role,
      status: payload.status || "active",
      password_hash: hashPassword_(payload.password),
    };
    return stripPasswordHash_(genericCreate_("user", "Data", data));
  },

  update(payload) {
    validateUser_(payload, false);
    if (isDuplicate_("user", "Data", "username", payload.username, payload.id)) {
      throw new Error("Username sudah digunakan");
    }
    const data = {
      username: payload.username,
      name: payload.name,
      role: payload.role,
      status: payload.status,
    };
    // Password hanya diganti jika field password diisi (opsional saat edit)
    if (payload.password) {
      if (payload.password.length < 6) throw new Error("Password minimal 6 karakter");
      data.password_hash = hashPassword_(payload.password);
    }
    return stripPasswordHash_(genericUpdate_("user", "Data", payload.id, data));
  },

  delete(params) { return genericDelete_("user", "Data", params.id); },
};

MODULE_REGISTRY_.user = UserModule;

function stripPasswordHash_(row) {
  const copy = Object.assign({}, row);
  delete copy.password_hash;
  return copy;
}

function validateUser_(data, isCreate) {
  if (!data.username || !String(data.username).trim()) throw new Error("Username wajib diisi");
  if (!data.name || !String(data.name).trim()) throw new Error("Nama wajib diisi");
  if (!VALID_ROLES_.includes(data.role)) throw new Error("Role tidak valid");
  if (isCreate && (!data.password || data.password.length < 6)) {
    throw new Error("Password minimal 6 karakter");
  }
}
