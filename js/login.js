/**
 * login.js
 * -----------------------------------------------------------------------
 * State & logic untuk pages/login.html. Memanggil Api.post('login', ...)
 * lalu menyimpan sesi lewat Auth.setSession() bila berhasil.
 * -----------------------------------------------------------------------
 */

function loginForm() {
  return {
    username: "",
    password: "",
    remember: false,
    loading: false,
    errorMessage: "",
    appName: window.APP_CONFIG?.APP_NAME || "",
    version: window.APP_CONFIG?.VERSION || "",

    async submit() {
      this.errorMessage = "";

      if (!this.username.trim() || !this.password) {
        this.errorMessage = "Username dan password wajib diisi";
        return;
      }

      this.loading = true;
      try {
        const result = await Api.post(window.APP_CONFIG.MODULES.LOGIN, "authenticate", {
          username: this.username.trim(),
          password: this.password,
        });
        Auth.setSession(result.token, result.user, this.remember);
        window.location.href = "dashboard.html";
      } catch (err) {
        this.errorMessage = err.message || "Login gagal, silakan coba lagi";
        this.loading = false;
      }
    },
  };
}

window.loginForm = loginForm;
