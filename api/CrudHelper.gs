/**
 * CrudHelper.gs
 * -----------------------------------------------------------------------
 * Operasi CRUD generik untuk sheet master data sederhana. SEMUA modul di
 * Tahap 5 (medicine, supplier, customer, user, category, unit, brand)
 * memakai helper ini alih-alih menulis ulang logic baca/tulis Spreadsheet
 * masing-masing — supaya query pattern (pagination, search) konsisten dan
 * bug performa (mis. getValues() berulang) cukup diperbaiki di satu tempat.
 *
 * ASUMSI WAJIB setiap sheet yang dipakai helper ini:
 *  - Baris 1 adalah header
 *  - Kolom pertama (paling kiri) adalah "id" (angka, auto increment)
 * -----------------------------------------------------------------------
 */

function genericGenerateId_(sheet) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return 1;
  const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues().flat().map(Number).filter((n) => !isNaN(n));
  return ids.length ? Math.max(...ids) + 1 : 1;
}

function rowToObject_(headers, row) {
  const obj = {};
  headers.forEach((h, i) => (obj[h] = row[i]));
  return obj;
}

/**
 * List dengan search sederhana (cari di semua kolom) + pagination server-side.
 * params: { search, page, pageSize }
 */
function genericList_(moduleName, sheetName, params) {
  const sheet = getSheet_(moduleName, sheetName);
  const values = sheet.getDataRange().getValues();
  const headers = values[0];
  let rows = values.slice(1).map((row) => rowToObject_(headers, row));

  const search = String(params.search || "").toLowerCase().trim();
  if (search) {
    rows = rows.filter((row) =>
      Object.values(row).some((v) => String(v).toLowerCase().includes(search))
    );
  }

  const total = rows.length;
  const page = Math.max(1, Number(params.page) || 1);
  const pageSize = Number(params.pageSize) || 20;
  const start = (page - 1) * pageSize;

  return { rows: rows.slice(start, start + pageSize), total, page, pageSize };
}

function genericGetById_(moduleName, sheetName, id) {
  const sheet = getSheet_(moduleName, sheetName);
  const values = sheet.getDataRange().getValues();
  const headers = values[0];
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][0]) === String(id)) return rowToObject_(headers, values[i]);
  }
  return null;
}

function genericCreate_(moduleName, sheetName, data) {
  const sheet = getSheet_(moduleName, sheetName);
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const id = genericGenerateId_(sheet);
  const row = headers.map((h) => (h === "id" ? id : data[h] !== undefined ? data[h] : ""));
  sheet.appendRow(row);
  return rowToObject_(headers, row);
}

function genericUpdate_(moduleName, sheetName, id, data) {
  const sheet = getSheet_(moduleName, sheetName);
  const values = sheet.getDataRange().getValues();
  const headers = values[0];
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][0]) === String(id)) {
      const newRow = headers.map((h, idx) =>
        h === "id" ? values[i][idx] : data[h] !== undefined ? data[h] : values[i][idx]
      );
      sheet.getRange(i + 1, 1, 1, headers.length).setValues([newRow]);
      return rowToObject_(headers, newRow);
    }
  }
  throw new Error("Data dengan id " + id + " tidak ditemukan");
}

function genericDelete_(moduleName, sheetName, id) {
  const sheet = getSheet_(moduleName, sheetName);
  const values = sheet.getDataRange().getValues();
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][0]) === String(id)) {
      sheet.deleteRow(i + 1);
      return { id };
    }
  }
  throw new Error("Data dengan id " + id + " tidak ditemukan");
}

/** Duplicate Validation generik: cek apakah `value` di `column` sudah dipakai baris lain. */
function isDuplicate_(moduleName, sheetName, column, value, excludeId) {
  const sheet = getSheet_(moduleName, sheetName);
  const values = sheet.getDataRange().getValues();
  const headers = values[0];
  const colIdx = headers.indexOf(column);
  for (let i = 1; i < values.length; i++) {
    if (excludeId && String(values[i][0]) === String(excludeId)) continue;
    if (String(values[i][colIdx]).toLowerCase() === String(value).toLowerCase()) return true;
  }
  return false;
}

/** Email Validation generik (dipakai supplier & customer). */
function isValidEmail_(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email));
}

/** Ambil daftar {id, name} sederhana — dipakai untuk isi dropdown di form (mis. kategori di form obat). */
function listNames_(moduleName, sheetName) {
  const sheet = getSheet_(moduleName, sheetName);
  const values = sheet.getDataRange().getValues();
  const headers = values[0];
  const nameIdx = headers.indexOf("name");
  return values.slice(1).map((row) => ({ id: row[0], name: row[nameIdx] }));
}
