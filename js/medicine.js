/**
 * medicine.js — konfigurasi halaman Master Data > Obat.
 * Lebih kompleks dari modul master lain karena butuh data dropdown
 * (kategori/satuan/merk/supplier) dan menghitung Margin otomatis.
 */
function medicinePage() {
  const page = crudPage({
    moduleName: window.APP_CONFIG.MODULES.MEDICINE,
    columns: [
      { key: "code", label: "Kode" },
      { key: "name", label: "Nama Obat" },
      { key: "category", label: "Kategori" },
      { key: "stock", label: "Stok", align: "right" },
      { key: "sell_price", label: "Harga Jual", align: "right" },
      { key: "status", label: "Status" },
    ],
    deleteLabel: (row) => row.name,
    defaultForm: () => ({ status: "active" }),
  });

  page.lookups = { categories: [], units: [], brands: [], suppliers: [] };

  page.onInit = async function () {
    try {
      this.lookups = await Api.get(this.moduleName, "lookups");
    } catch (err) {
      Toast.error("Gagal memuat data dropdown (kategori/satuan/merk/supplier)");
    }
  };

  /** Margin dihitung otomatis dari harga beli & jual — tidak disimpan sebagai kolom. */
  page.marginPercent = function () {
    const buy = Number(this.form.buy_price) || 0;
    const sell = Number(this.form.sell_price) || 0;
    if (!buy) return "-";
    return (((sell - buy) / buy) * 100).toFixed(1) + "%";
  };

  page.formatRupiah = function (value) {
    return Utils.formatRupiah(value);
  };

  return page;
}
window.medicinePage = medicinePage;
