/**
 * Code.gs
 * -----------------------------------------------------------------------
 * Entry point Web App Google Apps Script.
 * File ini HANYA bertugas sebagai ROUTER: menerima request dari frontend,
 * lalu meneruskan ke handler modul yang sesuai (medicine.gs, sales.gs, dst
 * yang akan dibuat pada tahap-tahap berikutnya).
 *
 * Jangan tulis logic bisnis di sini. Logic bisnis wajib ada di file
 * <modul>.gs masing-masing agar kode tetap modular.
 * -----------------------------------------------------------------------
 */

/**
 * Menangani request GET, dipakai untuk operasi "read" (list, detail, search).
 * Contoh: <WEB_APP_URL>?module=medicine&action=list
 */
function doGet(e) {
  return handleRequest_(e.parameter.module, e.parameter.action, e.parameter);
}

/**
 * Menangani request POST, dipakai untuk operasi "write" (create, update, delete).
 * Body dikirim sebagai text/plain berisi JSON: { module, action, payload }.
 */
function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    return handleRequest_(body.module, body.action, body.payload);
  } catch (err) {
    return jsonResponse_(false, null, "Format request tidak valid: " + err.message);
  }
}

/**
 * Router internal: memetakan (module, action) ke fungsi handler modul.
 * REGISTRY diisi bertahap seiring modul dibangun (login.gs di Tahap 3,
 * medicine.gs & supplier.gs di Tahap 5, dst).
 */
function handleRequest_(module, action, params) {
  try {
    if (!module || !action) {
      return jsonResponse_(false, null, "Parameter 'module' dan 'action' wajib diisi");
    }

    const handler = MODULE_REGISTRY_[module];
    if (!handler) {
      return jsonResponse_(false, null, `Modul '${module}' belum terdaftar`);
    }

    const fn = handler[action];
    if (typeof fn !== "function") {
      return jsonResponse_(false, null, `Aksi '${action}' tidak ditemukan pada modul '${module}'`);
    }

    const data = fn(params);
    return jsonResponse_(true, data, null);
  } catch (err) {
    // Semua error tak terduga ditangkap di sini supaya frontend
    // selalu menerima format JSON yang konsisten, bukan HTML error Apps Script.
    return jsonResponse_(false, null, err.message || "Terjadi kesalahan internal server");
  }
}

/**
 * Registry modul. Setiap file <modul>.gs pada tahap berikutnya wajib
 * mendaftarkan dirinya di sini, contoh (akan ditambahkan di Tahap 3/5):
 *
 *   const MODULE_REGISTRY_ = {
 *     login: LoginModule,
 *     medicine: MedicineModule,
 *     supplier: SupplierModule,
 *     ...
 *   };
 *
 * Untuk Tahap 1, registry masih kosong karena belum ada modul bisnis.
 */
const MODULE_REGISTRY_ = {
  ping: {
    check: function () {
      return { status: "ok", time: new Date().toISOString() };
    },
  },
};

/**
 * Helper standar untuk membungkus response menjadi format JSON konsisten:
 * { success, data, message }
 */
function jsonResponse_(success, data, message) {
  return ContentService.createTextOutput(
    JSON.stringify({ success, data, message })
  ).setMimeType(ContentService.MimeType.JSON);
}
