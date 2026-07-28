/**
 * toast.js
 * -----------------------------------------------------------------------
 * Sistem notifikasi toast global, dipakai di SELURUH modul (Master Data,
 * Pembelian, Penjualan, dst) lewat helper `Toast.success(...)`, dsb.
 *
 * Membutuhkan container di components/toast.html yang di-include SEKALI
 * saja di setiap halaman utama (bukan per-komponen), karena store bersifat
 * global untuk seluruh halaman.
 * -----------------------------------------------------------------------
 */

document.addEventListener("alpine:init", () => {
  Alpine.store("toast", {
    items: [],

    push(type, message, duration = 3500) {
      const id = Utils.generateTempId("toast");
      this.items.push({ id, type, message });
      setTimeout(() => this.remove(id), duration);
    },

    remove(id) {
      this.items = this.items.filter((t) => t.id !== id);
    },
  });
});

/**
 * Helper global dipanggil dari mana saja: Toast.success("Data tersimpan")
 */
const Toast = {
  success: (message) => Alpine.store("toast").push("success", message),
  error: (message) => Alpine.store("toast").push("danger", message),
  warning: (message) => Alpine.store("toast").push("warning", message),
  info: (message) => Alpine.store("toast").push("info", message),
};

window.Toast = Toast;
