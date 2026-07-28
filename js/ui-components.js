/**
 * ui-components.js
 * -----------------------------------------------------------------------
 * Factory function Alpine yang dipakai berulang oleh components/table.html
 * dan components/pagination.html. Dipisah dari components.js (yang hanya
 * bertugas fetch-include) supaya tanggung jawab tiap file tetap tunggal.
 *
 * Modul bisnis (medicine.js, sales.js, dst di tahap berikutnya) memanggil
 * factory ini, BUKAN menulis ulang logic table/pagination masing-masing.
 * -----------------------------------------------------------------------
 */

/**
 * dataTable(options)
 * Reusable state untuk tabel data: menerima rows yang sudah di-fetch oleh
 * modul pemanggil (table ini tidak tahu-menahu soal Api.*, supaya tetap
 * generik dan bisa dipakai modul apa saja).
 *
 * @param {object} options
 *   columns: [{ key, label, align? }]
 *   rows: array data (bisa diisi belakangan lewat this.setRows())
 *   loading: boolean status awal
 */
function dataTable(options = {}) {
  return {
    columns: options.columns || [],
    rows: options.rows || [],
    loading: options.loading ?? false,

    setRows(rows) {
      this.rows = rows;
      this.loading = false;
    },

    setLoading(state) {
      this.loading = state;
    },

    cellValue(row, key) {
      // Mendukung nested key sederhana, mis. "supplier.name"
      return key.split(".").reduce((acc, k) => (acc ? acc[k] : "-"), row);
    },
  };
}

/**
 * paginationControl(options)
 * Reusable state untuk kontrol pagination server-side.
 * Modul pemanggil bertanggung jawab memuat ulang data saat `page` berubah
 * (dengarkan lewat @page-change di komponen pemakai).
 *
 * @param {object} options
 *   totalItems: number
 *   pageSize: number (default dari APP_CONFIG.DEFAULT_PAGE_SIZE)
 *   currentPage: number (default 1)
 */
function paginationControl(options = {}) {
  return {
    totalItems: options.totalItems || 0,
    pageSize: options.pageSize || window.APP_CONFIG.DEFAULT_PAGE_SIZE,
    currentPage: options.currentPage || 1,

    get totalPages() {
      return Math.max(1, Math.ceil(this.totalItems / this.pageSize));
    },

    get pageNumbers() {
      // Tampilkan maksimal 5 nomor halaman di sekitar halaman aktif
      const total = this.totalPages;
      const current = this.currentPage;
      const start = Math.max(1, current - 2);
      const end = Math.min(total, start + 4);
      const pages = [];
      for (let i = start; i <= end; i++) pages.push(i);
      return pages;
    },

    goTo(page) {
      if (page < 1 || page > this.totalPages || page === this.currentPage) return;
      this.currentPage = page;
      this.$dispatch("page-change", { page });
    },

    next() {
      this.goTo(this.currentPage + 1);
    },

    prev() {
      this.goTo(this.currentPage - 1);
    },
  };
}

window.dataTable = dataTable;
window.paginationControl = paginationControl;
