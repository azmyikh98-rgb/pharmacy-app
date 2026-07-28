/**
 * stock.js
 * -----------------------------------------------------------------------
 * State & logic halaman Persediaan, terbagi 6 tab. Setiap tab punya form
 * state sendiri supaya error/loading tidak saling mengganggu antar tab.
 * -----------------------------------------------------------------------
 */

function stockPage() {
  return {
    moduleName: window.APP_CONFIG.MODULES.STOCK,
    activeTab: "in",
    tabs: [
      { key: "in", label: "Stock Masuk" },
      { key: "out", label: "Stock Keluar" },
      { key: "opname", label: "Stock Opname" },
      { key: "transfer", label: "Transfer Stock" },
      { key: "expired", label: "Expired Monitoring" },
      { key: "history", label: "Riwayat Pergerakan" },
    ],

    medicines: [],

    formIn: { medicine_id: "", qty: 1, reference: "", notes: "" },
    savingIn: false,
    errorIn: "",

    formOut: { medicine_id: "", qty: 1, reference: "", notes: "" },
    savingOut: false,
    errorOut: "",

    formOpname: { medicine_id: "", physical_stock: 0, notes: "" },
    savingOpname: false,
    errorOpname: "",
    opnameResult: null,

    formTransfer: { medicine_id: "", to_location: "", notes: "" },
    savingTransfer: false,
    errorTransfer: "",

    nearExpiry: [],
    expired: [],
    loadingExpired: true,

    history: [],
    historyTotal: 0,
    historyPage: 1,
    historyPageSize: window.APP_CONFIG.DEFAULT_PAGE_SIZE,
    historyLoading: true,
    historySearch: "",
    _debouncedHistorySearch: null,

    async init() {
      try {
        this.medicines = await Api.get(this.moduleName, "activeMedicines");
      } catch (err) {
        Toast.error("Gagal memuat daftar obat");
      }
      await this.loadExpired();
      await this.loadHistory();
    },

    setTab(tab) {
      this.activeTab = tab;
    },

    selectedStock(medicineId) {
      const m = this.medicines.find((x) => String(x.id) === String(medicineId));
      return m ? m.stock : null;
    },

    async submitIn() {
      this.errorIn = "";
      this.savingIn = true;
      try {
        await Api.post(this.moduleName, "stockIn", this.formIn);
        Toast.success("Stock Masuk berhasil dicatat");
        this.formIn = { medicine_id: "", qty: 1, reference: "", notes: "" };
        await this.refreshAfterChange();
      } catch (err) {
        this.errorIn = err.message || "Gagal mencatat Stock Masuk";
      } finally {
        this.savingIn = false;
      }
    },

    async submitOut() {
      this.errorOut = "";
      this.savingOut = true;
      try {
        await Api.post(this.moduleName, "stockOut", this.formOut);
        Toast.success("Stock Keluar berhasil dicatat");
        this.formOut = { medicine_id: "", qty: 1, reference: "", notes: "" };
        await this.refreshAfterChange();
      } catch (err) {
        this.errorOut = err.message || "Gagal mencatat Stock Keluar";
      } finally {
        this.savingOut = false;
      }
    },

    async submitOpname() {
      this.errorOpname = "";
      this.savingOpname = true;
      try {
        const result = await Api.post(this.moduleName, "opname", this.formOpname);
        this.opnameResult = result;
        Toast.success("Stock Opname berhasil disimpan, stok sistem disesuaikan");
        await this.refreshAfterChange();
      } catch (err) {
        this.errorOpname = err.message || "Gagal menyimpan Stock Opname";
      } finally {
        this.savingOpname = false;
      }
    },

    async submitTransfer() {
      this.errorTransfer = "";
      this.savingTransfer = true;
      try {
        await Api.post(this.moduleName, "transfer", this.formTransfer);
        Toast.success("Transfer lokasi rak berhasil dicatat");
        this.formTransfer = { medicine_id: "", to_location: "", notes: "" };
        await this.loadHistory();
      } catch (err) {
        this.errorTransfer = err.message || "Gagal transfer stok";
      } finally {
        this.savingTransfer = false;
      }
    },

    async refreshAfterChange() {
      try {
        this.medicines = await Api.get(this.moduleName, "activeMedicines");
      } catch (err) {
        // Non-fatal — daftar obat lokal cukup di-refresh saat tab dibuka lagi.
      }
      await this.loadExpired();
      await this.loadHistory();
    },

    async loadExpired() {
      this.loadingExpired = true;
      try {
        const result = await Api.get(this.moduleName, "expiredMonitoring");
        this.nearExpiry = result.nearExpiry;
        this.expired = result.expired;
      } catch (err) {
        Toast.error(err.message || "Gagal memuat data expired");
      } finally {
        this.loadingExpired = false;
      }
    },

    onHistorySearchInput() {
      if (!this._debouncedHistorySearch) {
        this._debouncedHistorySearch = Utils.debounce(() => {
          this.historyPage = 1;
          this.loadHistory();
        });
      }
      this._debouncedHistorySearch();
    },

    async loadHistory() {
      this.historyLoading = true;
      try {
        const result = await Api.get(this.moduleName, "movementHistory", {
          search: this.historySearch,
          page: this.historyPage,
          pageSize: this.historyPageSize,
        });
        this.history = result.rows;
        this.historyTotal = result.total;
      } catch (err) {
        Toast.error(err.message || "Gagal memuat riwayat pergerakan stok");
      } finally {
        this.historyLoading = false;
      }
    },

    get historyTotalPages() {
      return Math.max(1, Math.ceil(this.historyTotal / this.historyPageSize));
    },

    goToHistoryPage(p) {
      if (p < 1 || p > this.historyTotalPages || p === this.historyPage) return;
      this.historyPage = p;
      this.loadHistory();
    },

    formatRupiah(v) { return Utils.formatRupiah(v); },
    formatDate(v) { return Utils.formatDate(v); },

    movementTypeLabel(type) {
      return (
        {
          in: "Stock Masuk",
          out: "Stock Keluar",
          adjustment: "Adjustment",
          opname: "Opname",
          transfer: "Transfer",
          purchase: "Pembelian",
          purchase_return: "Retur Pembelian",
          sale: "Penjualan",
          sales_return: "Retur Penjualan",
        }[type] || type
      );
    },
  };
}

window.stockPage = stockPage;
