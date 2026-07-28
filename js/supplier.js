/**
 * supplier.js — konfigurasi halaman Master Data > Supplier.
 * Logic CRUD sepenuhnya dari js/crud-page.js, file ini hanya definisi
 * kolom tabel & default form.
 */
function supplierPage() {
  return crudPage({
    moduleName: window.APP_CONFIG.MODULES.SUPPLIER,
    columns: [
      { key: "name", label: "Nama" },
      { key: "pic", label: "PIC" },
      { key: "phone", label: "Telepon" },
      { key: "email", label: "Email" },
      { key: "status", label: "Status" },
    ],
    deleteLabel: (row) => row.name,
    defaultForm: () => ({ status: "active" }),
  });
}
window.supplierPage = supplierPage;
