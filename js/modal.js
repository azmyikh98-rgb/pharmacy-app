/**
 * modal.js
 * -----------------------------------------------------------------------
 * Dua store global reusable:
 *
 * 1. Alpine.store('confirm')  -> Confirm Dialog generik, dipakai untuk
 *    semua aksi berisiko (hapus data, batalkan transaksi, dst) di seluruh
 *    modul mulai Tahap 5 dan seterusnya.
 *
 * 2. Shell modal (.modal-panel di components/modal.html) TIDAK memakai
 *    store global untuk kontennya — setiap fitur (form obat, form supplier,
 *    dst) membuat x-data lokal sendiri dan cukup meniru class CSS shell
 *    modal ini (.modal-backdrop / .modal-panel) supaya konsisten secara
 *    visual tanpa saling berebut satu state global.
 * -----------------------------------------------------------------------
 */

document.addEventListener("alpine:init", () => {
  Alpine.store("confirm", {
    isOpen: false,
    title: "",
    message: "",
    variant: "danger", // danger | warning | primary
    _onConfirm: null,

    open({ title, message, variant = "danger", onConfirm }) {
      this.title = title;
      this.message = message;
      this.variant = variant;
      this._onConfirm = onConfirm;
      this.isOpen = true;
    },

    confirm() {
      if (typeof this._onConfirm === "function") this._onConfirm();
      this.isOpen = false;
    },

    cancel() {
      this.isOpen = false;
    },
  });
});

/**
 * Helper global: Confirm.ask({ title, message, onConfirm })
 * Contoh pemakaian (dipakai mulai Tahap 5 saat hapus data master):
 *
 *   Confirm.ask({
 *     title: "Hapus Obat?",
 *     message: "Data yang dihapus tidak dapat dikembalikan.",
 *     onConfirm: () => deleteMedicine(id),
 *   });
 */
const Confirm = {
  ask(options) {
    Alpine.store("confirm").open(options);
  },
};

window.Confirm = Confirm;
