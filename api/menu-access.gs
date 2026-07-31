/**
 * menu-access.gs
 * -----------------------------------------------------------------------
 * Modul Akses Menu — pengaturan tambahan di dalam Setting.
 *
 * Menyimpan pengaturan menu mana yang boleh diakses, dengan 2 level:
 *  1. Umum per ROLE (mis. "Semua Kasir") — berlaku untuk semua user dengan
 *     role tersebut, kecuali user itu punya pengaturan khusus.
 *  2. Khusus per USER — override pengaturan umum untuk 1 user tertentu
 *     (aktif hanya jika use_custom = TRUE pada baris user tsb).
 *
 * Role "admin" SELALU punya akses penuh ke semua menu, tidak bisa diatur.
 *
 * Sheet 'MenuAccess' di Spreadsheet modul 'setting', kolom:
 *   id | target_type | target_id | use_custom | dashboard | master_data |
 *   purchase | sales | stock | report | setting
 *
 * target_type : "role" atau "user"
 * target_id   : nama role (kasir/apoteker/gudang/owner) ATAU id user
 * use_custom  : hanya relevan untuk baris "user" — TRUE/FALSE
 * kolom menu  : TRUE/FALSE (kosong dianggap TRUE / boleh akses)
 *
 * Granularitas menu sengaja setingkat menu utama di sidebar (bukan sampai
 * ke sub-halaman seperti Obat/Supplier terpisah) — cukup untuk kebutuhan
 * "role X tidak perlu lihat Laporan", tanpa kompleksitas berlebihan.
 * -----------------------------------------------------------------------
 */

const MENU_KEYS_ = ["dashboard", "master_data", "purchase", "sales", "stock", "report", "setting"];
const ROLES_FOR_ACCESS_ = ["apoteker", "kasir", "gudang", "owner"]; // admin selalu full access, tidak diatur di sini

const MenuAccessModule = {
  /** Dropdown target: daftar role (selain admin) + daftar user (selain admin). */
  targets() {
    return trySafe_(() => {
      const users = listUsersBrief_().filter((u) => u.role !== "admin");
      return { roles: ROLES_FOR_ACCESS_, users };
    }, { roles: ROLES_FOR_ACCESS_, users: [] });
  },

  /** Ambil pengaturan akses untuk 1 target (role atau user) — dipakai form Setting > Akses Menu. */
  getAccess(params) {
    return trySafe_(() => {
      const { headers, values } = readAccessRows_();
      const idx = findAccessRowIndex_(headers, values, params.targetType, params.targetId);
      if (idx === -1) return defaultAccessObject_(params.targetType, params.targetId);
      return rowToAccessObject_(headers, values[idx]);
    }, defaultAccessObject_(params.targetType, params.targetId));
  },

  /** Simpan (create atau update) pengaturan akses untuk 1 target. */
  saveAccess(payload) {
    if (!payload.targetType || !payload.targetId) throw new Error("Target pengaturan wajib dipilih");

    const sheet = getAccessSheet_();
    const { headers, values } = readAccessRows_();
    const idx = findAccessRowIndex_(headers, values, payload.targetType, payload.targetId);

    const rowData = headers.map((h) => {
      if (h === "id") return idx === -1 ? genericGenerateId_(sheet) : values[idx][0];
      if (h === "target_type") return payload.targetType;
      if (h === "target_id") return payload.targetId;
      if (h === "use_custom") return payload.useCustom ? "TRUE" : "FALSE";
      return payload.menus && payload.menus[h] === false ? "FALSE" : "TRUE";
    });

    if (idx === -1) {
      sheet.appendRow(rowData);
    } else {
      sheet.getRange(idx + 1, 1, 1, headers.length).setValues([rowData]);
    }
    return { success: true };
  },

  /**
   * Akses efektif untuk user yang SEDANG LOGIN — dipanggil sidebar.html
   * setiap halaman dimuat untuk menentukan menu mana yang ditampilkan.
   * params: { userId, role }
   */
  effectiveAccess(params) {
    return trySafe_(() => {
      if (params.role === "admin") return allTrueMenus_();

      const { headers, values } = readAccessRows_();

      const userIdx = findAccessRowIndex_(headers, values, "user", params.userId);
      if (userIdx !== -1) {
        const useCustomIdx = headers.indexOf("use_custom");
        if (String(values[userIdx][useCustomIdx]).toUpperCase() === "TRUE") {
          return rowToAccessObject_(headers, values[userIdx]).menus;
        }
      }

      const roleIdx = findAccessRowIndex_(headers, values, "role", params.role);
      if (roleIdx !== -1) return rowToAccessObject_(headers, values[roleIdx]).menus;

      return allTrueMenus_();
    }, allTrueMenus_());
  },
};

MODULE_REGISTRY_.menuAccess = MenuAccessModule;

/* ------------------------------------------------------------------- */

function getAccessSheet_() {
  return getSheet_("setting", "MenuAccess");
}

function readAccessRows_() {
  const sheet = getAccessSheet_();
  const values = sheet.getDataRange().getValues();
  return { values, headers: values[0] };
}

function findAccessRowIndex_(headers, values, targetType, targetId) {
  const typeIdx = headers.indexOf("target_type");
  const idIdx = headers.indexOf("target_id");
  for (let i = 1; i < values.length; i++) {
    if (values[i][typeIdx] === targetType && String(values[i][idIdx]) === String(targetId)) {
      return i;
    }
  }
  return -1;
}

function rowToAccessObject_(headers, row) {
  const menus = {};
  MENU_KEYS_.forEach((key) => {
    const idx = headers.indexOf(key);
    menus[key] = String(row[idx]).toUpperCase() !== "FALSE";
  });
  return {
    targetType: row[headers.indexOf("target_type")],
    targetId: row[headers.indexOf("target_id")],
    useCustom: String(row[headers.indexOf("use_custom")]).toUpperCase() === "TRUE",
    menus,
  };
}

function defaultAccessObject_(targetType, targetId) {
  return { targetType, targetId, useCustom: false, menus: allTrueMenus_() };
}

function allTrueMenus_() {
  const menus = {};
  MENU_KEYS_.forEach((key) => (menus[key] = true));
  return menus;
}

function listUsersBrief_() {
  const { values, headers } = readSheet_("user", "Data");
  const nameIdx = headers.indexOf("name");
  const usernameIdx = headers.indexOf("username");
  const roleIdx = headers.indexOf("role");
  return values.slice(1).map((row) => ({
    id: row[0],
    name: row[nameIdx],
    username: row[usernameIdx],
    role: row[roleIdx],
  }));
}
