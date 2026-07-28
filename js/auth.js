/**
 * auth.js
 * -----------------------------------------------------------------------
 * Satu-satunya tempat logic autentikasi sisi client. Semua halaman
 * pages/*.html WAJIB memanggil Auth.requireAuth() di awal <body> untuk
 * mencegah akses tanpa login (route guard sisi client).
 *
 * Session disimpan di localStorage (jika "Ingat Saya" dicentang) atau
 * sessionStorage (jika tidak — otomatis hilang saat tab ditutup, sesuai
 * fitur "Remember Login" di brief).
 * -----------------------------------------------------------------------
 */

const Auth = {
  /** Menyimpan token + profil user setelah login berhasil. */
  setSession(token, user, remember) {
    const store = remember ? localStorage : sessionStorage;
    const keys = window.APP_CONFIG.STORAGE_KEYS;
    store.setItem(keys.AUTH_TOKEN, token);
    store.setItem(keys.USER_PROFILE, JSON.stringify(user));
    store.setItem(keys.REMEMBER_LOGIN, remember ? "1" : "0");
  },

  getToken() {
    const keys = window.APP_CONFIG.STORAGE_KEYS;
    return localStorage.getItem(keys.AUTH_TOKEN) || sessionStorage.getItem(keys.AUTH_TOKEN);
  },

  getUser() {
    const keys = window.APP_CONFIG.STORAGE_KEYS;
    const raw = localStorage.getItem(keys.USER_PROFILE) || sessionStorage.getItem(keys.USER_PROFILE);
    return raw ? JSON.parse(raw) : null;
  },

  isLoggedIn() {
    return !!Auth.getToken();
  },

  /** Cek apakah user yang sedang login memiliki salah satu role yang diminta. */
  hasRole(...allowedRoles) {
    const user = Auth.getUser();
    return !!user && allowedRoles.includes(user.role);
  },

  /** Hapus session dari kedua storage lalu arahkan kembali ke halaman login. */
  logout() {
    const keys = window.APP_CONFIG.STORAGE_KEYS;
    [localStorage, sessionStorage].forEach((store) => {
      store.removeItem(keys.AUTH_TOKEN);
      store.removeItem(keys.USER_PROFILE);
      store.removeItem(keys.REMEMBER_LOGIN);
    });
    const inPagesFolder = window.location.pathname.includes("/pages/");
    window.location.href = inPagesFolder ? "login.html" : "pages/login.html";
  },

  /**
   * Route guard. Panggil di awal <body> setiap halaman di /pages/ (selain login.html):
   *   <script>Auth.requireAuth();</script>
   *   <script>Auth.requireAuth(['admin', 'owner']);</script>  // + role permission
   *
   * Return true jika lolos, false jika di-redirect (supaya pemanggil bisa
   * langsung `return` dan tidak melanjutkan render halaman).
   */
  requireAuth(allowedRoles = []) {
    if (!Auth.isLoggedIn()) {
      window.location.href = "login.html";
      return false;
    }
    if (allowedRoles.length > 0 && !Auth.hasRole(...allowedRoles)) {
      window.location.href = "dashboard.html";
      return false;
    }
    return true;
  },
};

window.Auth = Auth;
