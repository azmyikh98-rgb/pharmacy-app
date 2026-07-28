/**
 * crud-page.js
 * -----------------------------------------------------------------------
 * Factory Alpine reusable untuk SEMUA halaman Master Data (Obat, Supplier,
 * Customer, User, Kategori/Satuan/Merk). Menangani: fetch list + search
 * debounce + pagination, buka modal create/edit, submit form (create atau
 * update otomatis terdeteksi), dan hapus data lewat Confirm Dialog global.
 *
 * Setiap halaman HANYA perlu menyediakan:
 *   - moduleName: nama modul di Api (harus sama dengan module di Code.gs)
 *   - columns: kolom yang ditampilkan di tabel (dipakai dataTable pattern)
 *   - deleteLabel(row): teks nama data yang ditampilkan di Confirm Dialog
 *
 * Markup form (field mana saja yang muncul di modal) TETAP ditulis manual
 * di masing-masing halaman karena bentuknya berbeda-beda per modul —
 * hanya *state & aksi*-nya yang reusable lewat factory ini.
 * -----------------------------------------------------------------------
 */

function crudPage(options) {
  return {
    moduleName: options.moduleName,
    columns: options.columns,
    deleteLabel: options.deleteLabel || ((row) => row.name || row.code || `#${row.id}`),

    rows: [],
    total: 0,
    page: 1,
    pageSize: window.APP_CONFIG.DEFAULT_PAGE_SIZE,
    search: "",
    loading: true,

    showModal: false,
    isEdit: false,
    form: {},
    saving: false,
    formError: "",

    _debouncedSearch: null,

    async init() {
      if (typeof this.onInit === "function") await this.onInit();
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
        Toast.error(err.message || "Gagal memuat data");
      } finally {
        this.loading = false;
      }
    },

    onPageChange(page) {
      this.page = page;
      this.fetchData();
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
      this.onPageChange(p);
    },

    nextPage() {
      this.goToPage(this.page + 1);
    },

    prevPage() {
      this.goToPage(this.page - 1);
    },

    cellValue(row, key) {
      return key.split(".").reduce((acc, k) => (acc && acc[k] !== undefined ? acc[k] : "-"), row);
    },

    openCreate() {
      this.isEdit = false;
      this.form = typeof options.defaultForm === "function" ? options.defaultForm() : {};
      this.formError = "";
      this.showModal = true;
    },

    openEdit(row) {
      this.isEdit = true;
      this.form = Object.assign({}, row);
      this.formError = "";
      this.showModal = true;
    },

    closeModal() {
      this.showModal = false;
    },

    async submitForm() {
      this.formError = "";
      this.saving = true;
      try {
        if (this.isEdit) {
          await Api.post(this.moduleName, "update", this.form);
          Toast.success("Data berhasil diperbarui");
        } else {
          await Api.post(this.moduleName, "create", this.form);
          Toast.success("Data berhasil disimpan");
        }
        this.showModal = false;
        await this.fetchData();
      } catch (err) {
        this.formError = err.message || "Gagal menyimpan data";
      } finally {
        this.saving = false;
      }
    },

    askDelete(row) {
      Confirm.ask({
        title: "Hapus Data?",
        message: `"${this.deleteLabel(row)}" akan dihapus permanen dan tidak dapat dikembalikan.`,
        onConfirm: async () => {
          try {
            await Api.post(this.moduleName, "delete", { id: row.id });
            Toast.success("Data berhasil dihapus");
            await this.fetchData();
          } catch (err) {
            Toast.error(err.message || "Gagal menghapus data");
          }
        },
      });
    },
  };
}

window.crudPage = crudPage;
