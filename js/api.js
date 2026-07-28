/**
 * api.js
 * -----------------------------------------------------------------------
 * Lapisan komunikasi tunggal antara Frontend dan Google Apps Script.
 * Semua file js/<modul>.js WAJIB memanggil backend lewat Api.*, bukan
 * fetch() langsung, supaya:
 *  - Loading state, error handling, retry, timeout konsisten di semua modul
 *  - Saat backend pindah dari Apps Script ke MySQL/PostgreSQL REST API,
 *    cukup ubah isi file ini saja tanpa menyentuh kode setiap halaman.
 * -----------------------------------------------------------------------
 */

const Api = {
  /**
   * Request generik ke Apps Script Web App.
   * Apps Script doGet/doPost mengharapkan parameter "module" dan "action".
   *
   * @param {string} module  - nama modul, mis. APP_CONFIG.MODULES.MEDICINE
   * @param {string} action  - nama aksi, mis. "list", "create", "update", "delete"
   * @param {object} payload - data yang dikirim (untuk POST) / query (untuk GET)
   * @param {object} options - { method: "GET" | "POST" }
   */
  async request(module, action, payload = {}, options = {}) {
    const method = options.method || "GET";
    const baseUrl = window.APP_CONFIG.API_BASE_URL;

    if (!baseUrl) {
      console.warn(
        "[Api] API_BASE_URL belum diisi di config.js. " +
          "Isi setelah Apps Script Web App di-deploy."
      );
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      window.APP_CONFIG.API_TIMEOUT_MS
    );

    let attempt = 0;
    const maxAttempt = window.APP_CONFIG.API_RETRY_COUNT + 1;
    let lastError = null;

    while (attempt < maxAttempt) {
      attempt++;
      try {
        let url = baseUrl;
        const fetchOptions = { method, signal: controller.signal };

        if (method === "GET") {
          const params = new URLSearchParams({
            module,
            action,
            ...Api._flattenParams(payload),
          });
          url += `?${params.toString()}`;
        } else {
          // Apps Script Web App menerima POST sebagai text/plain
          // untuk menghindari preflight CORS yang tidak didukung.
          fetchOptions.headers = { "Content-Type": "text/plain;charset=utf-8" };
          fetchOptions.body = JSON.stringify({ module, action, payload });
        }

        const response = await fetch(url, fetchOptions);
        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const json = await response.json();

        if (!json.success) {
          throw new Error(json.message || "Terjadi kesalahan pada server");
        }

        return json.data;
      } catch (err) {
        lastError = err;
        if (err.name === "AbortError") {
          lastError = new Error("Permintaan ke server timeout, coba lagi.");
          break;
        }
        // retry hanya untuk error jaringan, bukan error logika bisnis
        if (attempt >= maxAttempt) break;
      }
    }

    clearTimeout(timeoutId);
    throw lastError;
  },

  get(module, action, params) {
    return Api.request(module, action, params, { method: "GET" });
  },

  post(module, action, payload) {
    return Api.request(module, action, payload, { method: "POST" });
  },

  /**
   * Mengubah objek nested sederhana menjadi query param flat
   * (Apps Script doGet hanya menerima query string flat).
   */
  _flattenParams(payload) {
    const flat = {};
    Object.entries(payload || {}).forEach(([key, value]) => {
      flat[key] =
        typeof value === "object" && value !== null
          ? JSON.stringify(value)
          : value;
    });
    return flat;
  },
};

window.Api = Api;
