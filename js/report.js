/**
 * report.js
 * -----------------------------------------------------------------------
 * State & logic halaman Laporan. Setiap tab di-load sekali lalu di-cache
 * (loadedTabs) supaya berpindah tab tidak memanggil ulang Apps Script;
 * cache direset saat rentang tanggal diubah lewat "Terapkan".
 *
 * Export Excel memakai SheetJS (CDN) — generate file .xlsx murni di
 * browser dari data JSON yang sudah diambil, tanpa perlu request lagi ke
 * server. Export PDF/Print memakai window.print() + CSS @media print
 * (report.css) yang hanya menampilkan tabel aktif.
 * -----------------------------------------------------------------------
 */

function reportPage() {
  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  return {
    moduleName: window.APP_CONFIG.MODULES.REPORT,
    activeTab: "sales",
    tabs: [
      { key: "sales", label: "Penjualan" },
      { key: "purchase", label: "Pembelian" },
      { key: "inventory", label: "Persediaan" },
      { key: "profit", label: "Laba" },
      { key: "expired", label: "Obat Expired" },
      { key: "fast", label: "Fast Moving" },
      { key: "slow", label: "Slow Moving" },
      { key: "supplier", label: "Supplier" },
    ],

    startDate: firstDayOfMonth.toISOString().slice(0, 10),
    endDate: today.toISOString().slice(0, 10),
    loading: false,
    loadedTabs: {},

    salesRows: [],
    salesSummary: {},
    purchaseRows: [],
    purchaseSummary: {},
    inventoryRows: [],
    profitSummary: {},
    expiredData: { nearExpiry: [], expired: [] },
    fastRows: [],
    slowRows: [],
    supplierRows: [],

    async init() {
      await this.loadTab(this.activeTab);
    },

    async setTab(tab) {
      this.activeTab = tab;
      if (!this.loadedTabs[tab]) await this.loadTab(tab);
    },

    async applyDateRange() {
      this.loadedTabs = {};
      await this.loadTab(this.activeTab);
    },

    async loadTab(tab) {
      this.loading = true;
      const params = { startDate: this.startDate, endDate: this.endDate };
      try {
        if (tab === "sales") {
          const r = await Api.get(this.moduleName, "salesReport", params);
          this.salesRows = r.rows;
          this.salesSummary = r.summary;
        } else if (tab === "purchase") {
          const r = await Api.get(this.moduleName, "purchaseReport", params);
          this.purchaseRows = r.rows;
          this.purchaseSummary = r.summary;
        } else if (tab === "inventory") {
          this.inventoryRows = await Api.get(this.moduleName, "inventoryReport");
        } else if (tab === "profit") {
          this.profitSummary = await Api.get(this.moduleName, "profitReport", params);
        } else if (tab === "expired") {
          this.expiredData = await Api.get(this.moduleName, "expiredReport");
        } else if (tab === "fast") {
          this.fastRows = await Api.get(this.moduleName, "fastMovingReport", params);
        } else if (tab === "slow") {
          this.slowRows = await Api.get(this.moduleName, "slowMovingReport", params);
        } else if (tab === "supplier") {
          this.supplierRows = await Api.get(this.moduleName, "supplierReport", params);
        }
        this.loadedTabs[tab] = true;
      } catch (err) {
        Toast.error(err.message || "Gagal memuat laporan");
      } finally {
        this.loading = false;
      }
    },

    formatRupiah(v) { return Utils.formatRupiah(v); },
    formatDate(v) { return Utils.formatDate(v); },

    printReport() {
      window.print();
    },

    exportExcel(rows, filename) {
      if (typeof XLSX === "undefined") {
        Toast.error("Modul export Excel gagal dimuat");
        return;
      }
      if (!rows || rows.length === 0) {
        Toast.error("Tidak ada data untuk diekspor");
        return;
      }
      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan");
      XLSX.writeFile(workbook, filename + ".xlsx");
    },
  };
}

window.reportPage = reportPage;
