/**
 * pos.js
 * -----------------------------------------------------------------------
 * State & logic halaman Kasir (POS). Barcode Scanner tidak butuh
 * integrasi hardware khusus — scanner USB standar bekerja sebagai
 * "keyboard" yang mengetik kode lalu menekan Enter, jadi cukup ditangkap
 * lewat @keydown.enter pada kolom pencarian (lihat onSearchEnter()).
 * -----------------------------------------------------------------------
 */

function posPage() {
  return {
    medicines: [],
    customers: [],
    search: "",
    selectedCategory: "Semua",
    cart: [],
    cartExpanded: false,
    favorites: [],
    heldCarts: [],
    showHeldList: false,

    customerId: "",
    customerName: "Umum",
    discount: 0,
    voucher: 0,
    taxPercent: 0,
    paymentMethod: "cash",
    paidAmount: 0,

    processing: false,
    checkoutError: "",
    showReceipt: false,
    lastReceipt: null,

    async init() {
      try {
        const [medicines, customers] = await Promise.all([
          Api.get(window.APP_CONFIG.MODULES.SALES, "activeMedicines"),
          Api.get(window.APP_CONFIG.MODULES.SALES, "customers"),
        ]);
        this.medicines = medicines;
        this.customers = customers;
      } catch (err) {
        Toast.error("Gagal memuat data obat/customer");
      }

      // Ambil Pajak Default dari Setting (Tahap 10) — tetap bisa diubah manual per transaksi.
      try {
        const settings = await Api.get(window.APP_CONFIG.MODULES.SETTING, "get");
        this.taxPercent = Number(settings.tax_percent) || 0;
      } catch (err) {
        // Setting belum dikonfigurasi — biarkan default 0, bukan error fatal untuk POS.
      }
    },

    /** Daftar kategori unik dari obat aktif — dipakai untuk pill filter ("Semua" + tiap kategori). */
    get categories() {
      const unique = [...new Set(this.medicines.map((m) => m.category).filter(Boolean))];
      return ["Semua", ...unique];
    },

    get filteredMedicines() {
      const q = this.search.toLowerCase().trim();
      return this.medicines.filter((m) => {
        const matchesCategory = this.selectedCategory === "Semua" || m.category === this.selectedCategory;
        const matchesSearch =
          !q ||
          (m.name || "").toLowerCase().includes(q) ||
          (m.code || "").toLowerCase().includes(q) ||
          (m.barcode || "").toLowerCase().includes(q);
        return matchesCategory && matchesSearch;
      });
    },

    /** Favorit produk bersifat LOKAL di browser (belum disimpan ke server) — murni penanda visual cepat. */
    toggleFavorite(id) {
      if (this.favorites.includes(id)) {
        this.favorites = this.favorites.filter((f) => f !== id);
      } else {
        this.favorites.push(id);
      }
    },

    isFavorite(id) {
      return this.favorites.includes(id);
    },

    get totalQty() {
      return this.cart.reduce((sum, item) => sum + Number(item.qty || 0), 0);
    },

    /** Ditangkap saat scanner barcode "mengetik" kode lalu mengirim Enter. */
    onSearchEnter() {
      const exact = this.medicines.find((m) => m.barcode && String(m.barcode) === this.search.trim());
      if (exact) {
        this.addToCart(exact);
        this.search = "";
      }
    },

    addToCart(medicine) {
      if (Number(medicine.stock) <= 0) {
        Toast.error(`Stok ${medicine.name} habis`);
        return;
      }
      const existing = this.cart.find((c) => c.medicine_id === medicine.id);
      if (existing) {
        if (existing.qty + 1 > Number(medicine.stock)) {
          Toast.error(`Stok ${medicine.name} tidak mencukupi`);
          return;
        }
        existing.qty += 1;
      } else {
        this.cart.push({
          medicine_id: medicine.id,
          medicine_name: medicine.name,
          price: medicine.sell_price,
          qty: 1,
          maxStock: Number(medicine.stock),
        });
      }
    },

    incrementQty(item) {
      if (item.qty + 1 > item.maxStock) {
        Toast.error("Qty melebihi stok tersedia");
        return;
      }
      item.qty += 1;
    },

    decrementQty(item) {
      item.qty -= 1;
      if (item.qty <= 0) this.removeFromCart(item);
    },

    removeFromCart(item) {
      this.cart = this.cart.filter((c) => c !== item);
    },

    itemSubtotal(item) {
      return (Number(item.qty) || 0) * (Number(item.price) || 0);
    },

    get subtotal() {
      return this.cart.reduce((sum, item) => sum + this.itemSubtotal(item), 0);
    },

    get taxableBase() {
      return Math.max(0, this.subtotal - (Number(this.discount) || 0) - (Number(this.voucher) || 0));
    },

    get taxAmount() {
      return (this.taxableBase * (Number(this.taxPercent) || 0)) / 100;
    },

    get total() {
      return this.taxableBase + this.taxAmount;
    },

    get changeAmount() {
      return Math.max(0, (Number(this.paidAmount) || 0) - this.total);
    },

    onCustomerChange() {
      const customer = this.customers.find((c) => String(c.id) === String(this.customerId));
      this.customerName = customer ? customer.name : "Umum";
    },

    formatRupiah(v) {
      return Utils.formatRupiah(v);
    },

    async checkout() {
      this.checkoutError = "";
      if (this.cart.length === 0) {
        this.checkoutError = "Keranjang belanja masih kosong";
        return;
      }
      if (Number(this.paidAmount) < this.total) {
        this.checkoutError = "Jumlah bayar kurang dari total tagihan";
        return;
      }

      this.processing = true;
      try {
        const payload = {
          customer_id: this.customerId || "",
          customer_name: this.customerName,
          items: this.cart.map((c) => ({
            medicine_id: c.medicine_id,
            medicine_name: c.medicine_name,
            qty: c.qty,
            price: c.price,
          })),
          discount: this.discount,
          voucher: this.voucher,
          tax_percent: this.taxPercent,
          payment_method: this.paymentMethod,
          paid_amount: this.paidAmount,
          cashier: (Auth.getUser() || {}).name || "",
        };

        const result = await Api.post(window.APP_CONFIG.MODULES.SALES, "create", payload);
        Toast.success(`Transaksi ${result.invoice_number} berhasil disimpan`);

        this.lastReceipt = Object.assign({}, result, {
          items: payload.items,
          subtotal: this.subtotal,
          discount: this.discount,
          voucher: this.voucher,
          tax: this.taxAmount,
          total: this.total,
          paid_amount: this.paidAmount,
          change_amount: this.changeAmount,
          payment_method: this.paymentMethod,
        });
        this.showReceipt = true;
        this.resetCart();

        // Refresh stok lokal supaya transaksi berikutnya tidak overselling tanpa reload halaman.
        this.medicines = await Api.get(window.APP_CONFIG.MODULES.SALES, "activeMedicines");
      } catch (err) {
        this.checkoutError = err.message || "Gagal menyimpan transaksi";
      } finally {
        this.processing = false;
      }
    },

    resetCart() {
      this.cart = [];
      this.customerId = "";
      this.customerName = "Umum";
      this.discount = 0;
      this.voucher = 0;
      this.taxPercent = 0;
      this.paymentMethod = "cash";
      this.paidAmount = 0;
    },

    /** Batalkan transaksi yang sedang disusun — keranjang dikosongkan setelah dikonfirmasi. */
    cancelTransaction() {
      if (this.cart.length === 0) {
        this.cartExpanded = false;
        return;
      }
      Confirm.ask({
        title: "Batalkan Transaksi?",
        message: "Keranjang belanja saat ini akan dikosongkan dan tidak bisa dikembalikan.",
        variant: "danger",
        onConfirm: () => {
          this.resetCart();
          this.cartExpanded = false;
          Toast.info("Transaksi dibatalkan");
        },
      });
    },

    /**
     * Tunda transaksi — keranjang saat ini "diparkir" ke daftar heldCarts
     * (disimpan sementara di browser, BUKAN ke server) supaya kasir bisa
     * melayani pelanggan lain dulu, lalu melanjutkan transaksi ini lagi
     * lewat tombol "Tertunda" di sebelah kolom pencarian.
     */
    holdTransaction() {
      if (this.cart.length === 0) {
        Toast.error("Keranjang masih kosong, tidak ada yang bisa ditunda");
        return;
      }
      this.heldCarts.push({
        id: Utils.generateTempId("held"),
        customerId: this.customerId,
        customerName: this.customerName,
        cart: this.cart,
        discount: this.discount,
        voucher: this.voucher,
        taxPercent: this.taxPercent,
        paymentMethod: this.paymentMethod,
        createdAt: new Date(),
      });
      this.resetCart();
      this.cartExpanded = false;
      Toast.success("Transaksi ditunda, bisa dilanjutkan lagi lewat tombol Tertunda");
    },

    resumeHeldTransaction(heldId) {
      const held = this.heldCarts.find((h) => h.id === heldId);
      if (!held) return;
      this.cart = held.cart;
      this.customerId = held.customerId;
      this.customerName = held.customerName;
      this.discount = held.discount;
      this.voucher = held.voucher;
      this.taxPercent = held.taxPercent;
      this.paymentMethod = held.paymentMethod;
      this.heldCarts = this.heldCarts.filter((h) => h.id !== heldId);
      this.showHeldList = false;
      this.cartExpanded = true;
    },

    removeHeldTransaction(heldId) {
      this.heldCarts = this.heldCarts.filter((h) => h.id !== heldId);
    },

    closeReceipt() {
      this.showReceipt = false;
    },

    printReceipt() {
      window.print();
    },
  };
}

window.posPage = posPage;
