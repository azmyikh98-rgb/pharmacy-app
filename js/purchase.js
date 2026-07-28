/**
 * purchase.js
 * -----------------------------------------------------------------------
 * State & logic halaman Pembelian. Tidak memakai factory crudPage() dari
 * Tahap 5 apa adanya karena transaksi Pembelian punya kebutuhan tambahan
 * yang tidak dimiliki Master Data sederhana: multi-item per PO, dan aksi
 * berbasis status (Approve/Terima Barang/Batalkan/Retur) alih-alih hanya
 * Edit/Hapus. Pola pagination & search tetap identik dengan crud-page.js
 * supaya konsisten secara UX.
 * -----------------------------------------------------------------------
 */

function purchasePage() {
  return {
    moduleName: window.APP_CONFIG.MODULES.PURCHASE,

    rows: [],
    total: 0,
    page: 1,
    pageSize: window.APP_CONFIG.DEFAULT_PAGE_SIZE,
    search: "",
    loading: true,
    medicines: [],

    showModal: false,
    isEdit: false,
    form: {},
    saving: false,
    formError: "",

    showReturModal: false,
    returForm: {},
    returItems: [],
    returSaving: false,
    returError: "",

    _debouncedSearch: null,

    async init() {
      try {
        this.medicines = await Api.get(this.moduleName, "activeMedicines");
      } catch (err) {
        Toast.error("Gagal memuat daftar obat aktif");
      }
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
        Toast.error(err.message || "Gagal memuat data Purchase Order");
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

    statusBadgeClass(status) {
      return (
        { draft: "badge-neutral", approved: "badge-warning", received: "badge-success", cancelled: "badge-danger" }[status] ||
        "badge-neutral"
      );
    },

    statusLabel(status) {
      return (
        { draft: "Draft", approved: "Approved", received: "Received", cancelled: "Cancelled" }[status] || status
      );
    },

    emptyItem() {
      return { medicine_id: "", medicine_name: "", qty: 1, buy_price: 0 };
    },

    openCreate() {
      this.isEdit = false;
      this.form = {
        supplier: "",
        date: new Date().toISOString().slice(0, 10),
        invoice_url: "",
        notes: "",
        items: [this.emptyItem()],
      };
      this.formError = "";
      this.showModal = true;
    },

    async openEdit(row) {
      this.formError = "";
      try {
        const detail = await Api.get(this.moduleName, "get", { id: row.id });
        this.isEdit = true;
        this.form = detail;
        this.showModal = true;
      } catch (err) {
        Toast.error(err.message || "Gagal memuat detail Purchase Order");
      }
    },

    closeModal() {
      this.showModal = false;
    },

    addItemRow() {
      this.form.items.push(this.emptyItem());
    },

    removeItemRow(index) {
      if (this.form.items.length > 1) this.form.items.splice(index, 1);
    },

    onMedicineChange(item) {
      const med = this.medicines.find((m) => String(m.id) === String(item.medicine_id));
      if (med) {
        item.medicine_name = med.name;
        item.buy_price = med.buy_price;
      }
    },

    itemSubtotal(item) {
      return (Number(item.qty) || 0) * (Number(item.buy_price) || 0);
    },

    get formTotal() {
      return (this.form.items || []).reduce((sum, item) => sum + this.itemSubtotal(item), 0);
    },

    async submitForm() {
      this.formError = "";
      this.saving = true;
      try {
        if (this.isEdit) {
          await Api.post(this.moduleName, "update", this.form);
          Toast.success("Purchase Order berhasil diperbarui");
        } else {
          await Api.post(this.moduleName, "create", this.form);
          Toast.success("Purchase Order berhasil dibuat");
        }
        this.showModal = false;
        await this.fetchData();
      } catch (err) {
        this.formError = err.message || "Gagal menyimpan Purchase Order";
      } finally {
        this.saving = false;
      }
    },

    askApprove(row) {
      Confirm.ask({
        title: "Approve Purchase Order?",
        message: `PO ${row.po_number} akan disetujui dan siap diterima.`,
        variant: "primary",
        onConfirm: async () => {
          try {
            await Api.post(this.moduleName, "approve", { id: row.id });
            Toast.success("Purchase Order disetujui");
            await this.fetchData();
          } catch (err) {
            Toast.error(err.message || "Gagal approve Purchase Order");
          }
        },
      });
    },

    askReceive(row) {
      Confirm.ask({
        title: "Terima Barang?",
        message: `Stok obat pada PO ${row.po_number} akan otomatis bertambah sesuai item.`,
        variant: "primary",
        onConfirm: async () => {
          try {
            await Api.post(this.moduleName, "receive", { id: row.id });
            Toast.success("Barang diterima, stok obat diperbarui");
            await this.fetchData();
          } catch (err) {
            Toast.error(err.message || "Gagal menerima barang");
          }
        },
      });
    },

    askCancel(row) {
      Confirm.ask({
        title: "Batalkan Purchase Order?",
        message: `PO ${row.po_number} akan dibatalkan dan tidak bisa diproses lagi.`,
        variant: "danger",
        onConfirm: async () => {
          try {
            await Api.post(this.moduleName, "cancel", { id: row.id });
            Toast.success("Purchase Order dibatalkan");
            await this.fetchData();
          } catch (err) {
            Toast.error(err.message || "Gagal membatalkan Purchase Order");
          }
        },
      });
    },

    async openRetur(row) {
      this.returError = "";
      try {
        const detail = await Api.get(this.moduleName, "get", { id: row.id });
        this.returItems = detail.items;
        this.returForm = {
          purchase_id: row.id,
          medicine_id: detail.items[0] ? detail.items[0].medicine_id : "",
          qty: 1,
          reason: "",
        };
        this.showReturModal = true;
      } catch (err) {
        Toast.error(err.message || "Gagal memuat detail Purchase Order");
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
        Toast.success("Retur pembelian berhasil dicatat, stok obat disesuaikan");
        this.showReturModal = false;
        await this.fetchData();
      } catch (err) {
        this.returError = err.message || "Gagal mencatat retur pembelian";
      } finally {
        this.returSaving = false;
      }
    },
  };
}

window.purchasePage = purchasePage;
