/**
 * utils.js
 * -----------------------------------------------------------------------
 * Kumpulan fungsi helper murni (pure function) yang dipakai lintas modul.
 * Tidak boleh ada fungsi di sini yang langsung menyentuh DOM spesifik
 * suatu halaman — itu tugas file js/<nama-halaman>.js masing-masing.
 * -----------------------------------------------------------------------
 */

const Utils = {
  /**
   * Debounce: menunda eksekusi fungsi sampai user berhenti mengetik
   * selama `delay` ms. Dipakai untuk search input supaya tidak
   * memanggil server di setiap ketukan keyboard.
   */
  debounce(fn, delay = window.APP_CONFIG.SEARCH_DEBOUNCE_MS) {
    let timer = null;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  },

  /**
   * Format angka menjadi format Rupiah, mis. 15000 -> "Rp 15.000"
   */
  formatRupiah(value) {
    const number = Number(value) || 0;
    return "Rp " + number.toLocaleString("id-ID", { maximumFractionDigits: 0 });
  },

  /**
   * Format tanggal ISO / Date menjadi format Indonesia, mis. "22 Jul 2026"
   */
  formatDate(date, options = {}) {
    if (!date) return "-";
    const d = date instanceof Date ? date : new Date(date);
    if (isNaN(d.getTime())) return "-";
    return d.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      ...options,
    });
  },

  /**
   * Format tanggal + jam, mis. "22 Jul 2026, 14:30"
   */
  formatDateTime(date) {
    if (!date) return "-";
    const d = date instanceof Date ? date : new Date(date);
    if (isNaN(d.getTime())) return "-";
    return (
      Utils.formatDate(d) +
      ", " +
      d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
    );
  },

  /**
   * Menghitung sisa hari menuju tanggal expired.
   * Return negatif berarti sudah expired.
   */
  daysUntil(dateString) {
    const target = new Date(dateString);
    const today = new Date();
    target.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    return Math.round((target - today) / (1000 * 60 * 60 * 24));
  },

  /**
   * Sanitasi input string sederhana untuk mencegah XSS ketika
   * data ditulis ke innerHTML (validasi utama tetap di sisi server/Apps Script).
   */
  sanitize(str) {
    if (typeof str !== "string") return str;
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  },

  /**
   * Validasi email sederhana di sisi client.
   */
  isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || ""));
  },

  /**
   * Generate id unik sementara di sisi client (bukan pengganti Auto Number
   * dari server, hanya dipakai misalnya untuk key baris di UI/cart POS).
   */
  generateTempId(prefix = "tmp") {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  },

  /**
   * Ambil query param dari URL, mis. ?page=medicine -> getQueryParam('page')
   */
  getQueryParam(key) {
    return new URLSearchParams(window.location.search).get(key);
  },

  /**
   * Deep clone sederhana untuk objek JSON-safe (state cart, filter, dsb).
   */
  clone(obj) {
    return JSON.parse(JSON.stringify(obj));
  },
};

window.Utils = Utils;
