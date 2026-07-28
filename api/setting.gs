/**
 * setting.gs
 * -----------------------------------------------------------------------
 * Modul Setting — Tahap 10 (tahap terakhir).
 *
 * Spreadsheet 'setting', 1 sheet 'Data', HANYA 1 baris data (singleton):
 *   id | store_name | logo_url | address | phone | tax_percent | printer_name
 *
 * Backup Data: membaca SEMUA sheet dari SEMUA Spreadsheet yang sudah
 * dikonfigurasi di SPREADSHEET_IDS_ (Config.gs) — bukan hardcode nama
 * sheet per modul, supaya otomatis ikut ter-backup walau ada tab baru
 * yang ditambahkan manual di kemudian hari (mis. sheet audit tambahan).
 *
 * Restore Data: MENIMPA (clearContents + set ulang) isi sheet yang sama
 * persis dengan hasil backup. Ini operasi DESTRUKTIF — frontend WAJIB
 * menampilkan Confirm Dialog tegas sebelum memanggil action ini.
 * -----------------------------------------------------------------------
 */

const SettingModule = {
  get() {
    return getOrCreateSettingsRow_();
  },

  update(payload) {
    validateSettings_(payload);
    const current = getOrCreateSettingsRow_();
    return genericUpdate_("setting", "Data", current.id, {
      store_name: payload.store_name,
      logo_url: payload.logo_url || "",
      address: payload.address || "",
      phone: payload.phone || "",
      tax_percent: payload.tax_percent || 0,
      printer_name: payload.printer_name || "",
    });
  },

  backupData() {
    const backup = {};
    Object.keys(SPREADSHEET_IDS_).forEach((moduleName) => {
      const id = SPREADSHEET_IDS_[moduleName];
      if (!id) return; // modul belum dikonfigurasi — lewati, bukan error
      try {
        const ss = SpreadsheetApp.openById(id);
        const sheets = {};
        ss.getSheets().forEach((sheet) => {
          sheets[sheet.getName()] = sheet.getDataRange().getValues();
        });
        backup[moduleName] = sheets;
      } catch (err) {
        backup[moduleName] = { error: err.message };
      }
    });
    return { generatedAt: new Date().toISOString(), data: backup };
  },

  restoreData(payload) {
    if (!payload || !payload.data) throw new Error("Format file backup tidak valid");
    const result = {};
    Object.keys(payload.data).forEach((moduleName) => {
      const id = SPREADSHEET_IDS_[moduleName];
      if (!id) {
        result[moduleName] = "dilewati (Spreadsheet modul ini belum dikonfigurasi)";
        return;
      }
      try {
        const ss = SpreadsheetApp.openById(id);
        const sheetsData = payload.data[moduleName];
        Object.keys(sheetsData).forEach((sheetName) => {
          const rows = sheetsData[sheetName];
          if (!Array.isArray(rows) || rows.length === 0) return;
          let sheet = ss.getSheetByName(sheetName);
          if (!sheet) sheet = ss.insertSheet(sheetName);
          sheet.clearContents();
          sheet.getRange(1, 1, rows.length, rows[0].length).setValues(rows);
        });
        result[moduleName] = "berhasil dipulihkan";
      } catch (err) {
        result[moduleName] = "gagal: " + err.message;
      }
    });
    return result;
  },
};

MODULE_REGISTRY_.setting = SettingModule;

/* ------------------------------------------------------------------- */

function getOrCreateSettingsRow_() {
  const sheet = getSheet_("setting", "Data");
  const values = sheet.getDataRange().getValues();
  const headers = values[0];
  if (values.length < 2) {
    const defaultRow = headers.map((h) => {
      if (h === "id") return 1;
      if (h === "tax_percent") return 0;
      return "";
    });
    sheet.appendRow(defaultRow);
    return rowToObject_(headers, defaultRow);
  }
  return rowToObject_(headers, values[1]);
}

function validateSettings_(data) {
  if (!data.store_name || !String(data.store_name).trim()) throw new Error("Nama Apotek wajib diisi");
  if (data.tax_percent !== undefined && Number(data.tax_percent) < 0) {
    throw new Error("Pajak tidak boleh negatif");
  }
}
