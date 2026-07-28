/**
 * master-lookup.js — konfigurasi halaman gabungan Kategori Obat / Satuan / Merk.
 * Ketiganya digabung dalam satu halaman bertab karena strukturnya identik
 * (CRUD nama + status) — tetap 3 modul & 3 Spreadsheet terpisah di backend.
 */
function masterLookupPage() {
  return {
    activeTab: "category",

    tabs: [
      { key: "category", label: "Kategori Obat" },
      { key: "unit", label: "Satuan" },
      { key: "brand", label: "Merk" },
    ],

    pages: {
      category: crudPage({
        moduleName: window.APP_CONFIG.MODULES.CATEGORY,
        columns: [{ key: "name", label: "Nama Kategori" }, { key: "status", label: "Status" }],
        deleteLabel: (row) => row.name,
        defaultForm: () => ({ status: "active" }),
      }),
      unit: crudPage({
        moduleName: window.APP_CONFIG.MODULES.UNIT,
        columns: [{ key: "name", label: "Nama Satuan" }, { key: "status", label: "Status" }],
        deleteLabel: (row) => row.name,
        defaultForm: () => ({ status: "active" }),
      }),
      brand: crudPage({
        moduleName: window.APP_CONFIG.MODULES.BRAND,
        columns: [{ key: "name", label: "Nama Merk" }, { key: "status", label: "Status" }],
        deleteLabel: (row) => row.name,
        defaultForm: () => ({ status: "active" }),
      }),
    },

    async init() {
      await Promise.all([this.pages.category.init(), this.pages.unit.init(), this.pages.brand.init()]);
    },

    setTab(tab) {
      this.activeTab = tab;
    },
  };
}
window.masterLookupPage = masterLookupPage;
