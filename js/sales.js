/**
 * sales.js
 * -----------------------------------------------------------------------
 * State & logic halaman Riwayat Penjualan + Retur Penjualan. Transaksi
 * baru dibuat lewat pages/pos.html (js/pos.js) — halaman ini murni untuk
 * melihat histori dan memproses retur.
 * -----------------------------------------------------------------------
 */

function salesPage() {
  return {
    moduleName: window.APP_CONFIG.MODULES.SALES,

    rows: [],
    total: 0,
    page: 1,
    pageSize: window.APP_CONFIG.DEFAULT_PAGE_SIZE,
    search: "",
    loading: true,

    showDetailModal: false,
    detail: null,

    showReturModal: false,
    returForm: {},
    returItems: [],
    returSaving: false,
    returError: "",

    _debouncedSearch: null,

    async init() {
      await this.fetchData();
    },

    onSearchInput() {
      if (!this._debouncedSearch) {
        this._debouncedSearch = Utils.debounce(() => {
          this.page = 1;
          this.fetchData();
        });
      }
      this._debouncedSearch();
    },

    async fetchData() {
      this.loading = true;
      try {
        const result = await Api.get(this.moduleName, "list", {
          search: this.search,
          page: this.page,
          pageSize: this.pageSize,
        });
        this.rows = result.rows;
        this.total = result.total;
      } catch (err) {
        Toast.error(err.message || "Gagal memuat riwayat penjualan");
      } finally {
        this.loading = false;
      }
    },

    get totalPages() {
      return Math.max(1, Math.ceil(this.total / this.pageSize));
    },
    get pageNumbers() {
      const total = this.totalPages;
      const current = this.page;
      const start = Math.max(1, current - 2);
      const end = Math.min(total, start + 4);
      const pages = [];
      for (let i = start; i <= end; i++) pages.push(i);
      return pages;
    },
    goToPage(p) {
      if (p < 1 || p > this.totalPages || p === this.page) return;
      this.page = p;
      this.fetchData();
    },
    nextPage() { this.goToPage(this.page + 1); },
    prevPage() { this.goToPage(this.page - 1); },

    formatRupiah(v) { return Utils.formatRupiah(v); },
    formatDate(v) { return Utils.formatDate(v); },

    async openDetail(row) {
      try {
        this.detail = await Api.get(this.moduleName, "get", { id: row.id });
        this.showDetailModal = true;
      } catch (err) {
        Toast.error(err.message || "Gagal memuat detail transaksi");
      }
    },

    closeDetail() {
      this.showDetailModal = false;
    },

    async openRetur(row) {
      this.returError = "";
      try {
        const detail = await Api.get(this.moduleName, "get", { id: row.id });
        this.returItems = detail.items;
        this.returForm = {
          sale_id: row.id,
          medicine_id: detail.items[0] ? detail.items[0].medicine_id : "",
          qty: 1,
          reason: "",
        };
        this.showReturModal = true;
      } catch (err) {
        Toast.error(err.message || "Gagal memuat detail transaksi");
      }
    },

    closeReturModal() {
      this.showReturModal = false;
    },

    async submitRetur() {
      this.returError = "";
      this.returSaving = true;
      try {
        await Api.post(this.moduleName, "retur", this.returForm);
        Toast.success("Retur penjualan berhasil dicatat, stok obat dikembalikan");
        this.showReturModal = false;
        await this.fetchData();
      } catch (err) {
        this.returError = err.message || "Gagal mencatat retur penjualan";
      } finally {
        this.returSaving = false;
      }
    },
  };
}

window.salesPage = salesPage;
