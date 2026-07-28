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

  // Override openEdit bawaan supaya field password selalu dikosongkan saat edit
  const baseOpenEdit = page.openEdit.bind(page);
  page.openEdit = function (row) {
    baseOpenEdit(row);
    this.form.password = "";
  };

  return page;
}
window.usersPage = usersPage;
