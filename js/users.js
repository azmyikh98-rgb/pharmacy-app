/**
 * users.js — konfigurasi halaman Master Data > User.
 * Field password sengaja TIDAK di-prefill saat edit (harus diisi ulang
 * hanya jika ingin mengganti password), sesuai praktik keamanan standar.
 */
function usersPage() {
  const page = crudPage({
    moduleName: window.APP_CONFIG.MODULES.USER,
    columns: [
      { key: "name", label: "Nama" },
      { key: "username", label: "Username" },
      { key: "role", label: "Role" },
      { key: "status", label: "Status" },
    ],
    deleteLabel: (row) => row.name,
    defaultForm: () => ({ status: "active", role: "kasir" }),
  });

  page.roles = ["admin", "apoteker", "kasir", "gudang", "owner"];

  // Override openEdit bawaan supaya field password selalu dikosongkan saat edit.
  // PENTING: simpan referensi fungsi ASLI tanpa .bind() ke `page` (objek mentah
  // sebelum Alpine membungkusnya jadi reaktif) — kalau di-bind ke `page` langsung,
  // perubahan this.showModal/this.form di dalamnya tidak akan terdeteksi Alpine
  // (mengubah objek mentah tidak memicu reactivity proxy Alpine). Panggil lewat
  // .call(this, row) supaya `this` yang dipakai selalu instance reaktif yang aktif
  // saat tombol Edit benar-benar diklik.
  const baseOpenEdit = page.openEdit;
  page.openEdit = function (row) {
    baseOpenEdit.call(this, row);
    this.form.password = "";
  };

  return page;
}
window.usersPage = usersPage;
