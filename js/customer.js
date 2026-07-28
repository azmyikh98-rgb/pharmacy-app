/**
 * customer.js — konfigurasi halaman Master Data > Customer.
 */
function customerPage() {
  return crudPage({
    moduleName: window.APP_CONFIG.MODULES.CUSTOMER,
    columns: [
      { key: "name", label: "Nama" },
      { key: "type", label: "Jenis" },
      { key: "phone", label: "Telepon" },
      { key: "member_point", label: "Poin", align: "right" },
      { key: "status", label: "Status" },
    ],
    deleteLabel: (row) => row.name,
    defaultForm: () => ({ status: "active", type: "umum" }),
  });
}
window.customerPage = customerPage;
