/**
 * config.js
 * -----------------------------------------------------------------------
 * Konfigurasi global aplikasi Pharmacy Management System.
 * File ini adalah SATU-SATUNYA tempat yang boleh diubah ketika:
 *  - URL Web App Google Apps Script berubah (setelah deploy ulang)
 *  - Nama aplikasi / versi berubah
 *  - Role & permission ditambah
 *
 * Jangan hardcode URL Apps Script di file lain. Selalu ambil dari sini.
 * -----------------------------------------------------------------------
 */

const APP_CONFIG = Object.freeze({
  // Nama aplikasi (dipakai di title, header, cetak struk, dsb)
  APP_NAME: "Modern Pharmacy Management System",
  APP_SHORT_NAME: "PharmaSys",
  VERSION: "1.0.0-tahap1",

  // URL Web App Google Apps Script.
  // Diisi setelah deploy Apps Script di Tahap 3 (Authentication) / Tahap 5 (Master Data).
  // Contoh: "https://script.google.com/macros/s/XXXXXXXX/exec"
  API_BASE_URL: "",

  // Timeout request ke Apps Script (ms). Apps Script relatif lambat,
  // jadi diberi toleransi lebih tinggi dari API biasa.
  API_TIMEOUT_MS: 20000,

  // Jumlah percobaan ulang otomatis jika request gagal karena jaringan
  API_RETRY_COUNT: 2,

  // Konfigurasi pagination default di seluruh aplikasi
  DEFAULT_PAGE_SIZE: 20,

  // Waktu debounce untuk search (ms) — dipakai di semua fitur search
  SEARCH_DEBOUNCE_MS: 400,

  // Key yang dipakai untuk menyimpan data di localStorage / sessionStorage
  STORAGE_KEYS: {
    AUTH_TOKEN: "pharmasys_auth_token",
    USER_PROFILE: "pharmasys_user_profile",
    REMEMBER_LOGIN: "pharmasys_remember_login",
    THEME: "pharmasys_theme",
  },

  // Daftar role yang dikenal aplikasi (dipakai untuk role-based permission)
  ROLES: Object.freeze({
    ADMIN: "admin",
    APOTEKER: "apoteker",
    KASIR: "kasir",
    GUDANG: "gudang",
    OWNER: "owner",
  }),

  // Nama spreadsheet/modul backend (harus sama persis dengan yang dipakai di Apps Script Config.gs)
  MODULES: Object.freeze({
    LOGIN: "login",
    MEDICINE: "medicine",
    SUPPLIER: "supplier",
    CUSTOMER: "customer",
    USER: "user",
    SALES: "sales",
    PURCHASE: "purchase",
    STOCK: "stock",
    STOCK_OPNAME: "stock_opname",
    CATEGORY: "category",
    UNIT: "unit",
    BRAND: "brand",
    BATCH: "batch",
    ADJUSTMENT: "adjustment",
    REPORT: "report",
    SETTING: "setting",
  }),
});

// Dibekukan (Object.freeze) supaya tidak sengaja ter-override di runtime.
// Diekspos ke window supaya semua file js/*.js maupun halaman inline script bisa memakainya.
window.APP_CONFIG = APP_CONFIG;
