/**
 * Config.gs
 * -----------------------------------------------------------------------
 * Satu-satunya tempat menyimpan ID Spreadsheet untuk setiap modul.
 * Sesuai arsitektur: SATU spreadsheet per modul, BUKAN satu spreadsheet
 * untuk semua data.
 *
 * Isi SPREADSHEET_IDS_ setelah masing-masing Spreadsheet dibuat pada
 * Tahap 5 (Master Data) dan seterusnya. Untuk Tahap 1, nilai masih
 * kosong ("") sebagai placeholder struktur.
 * -----------------------------------------------------------------------
 */

const SPREADSHEET_IDS_ = {
  medicine: "",       // Master Medicine
  supplier: "",       // Master Supplier
  customer: "",       // Master Customer
  user: "",           // Master User
  sales: "",          // Sales Transaction
  purchase: "",       // Purchase Transaction
  stock: "",          // Stock Movement
  stock_opname: "",   // Stock Opname
  category: "",       // Medicine Category
  unit: "",           // Medicine Unit
  brand: "",          // Medicine Brand
  batch: "",          // Medicine Batch
  adjustment: "",     // Adjustment
  report: "",         // Report
  setting: "",        // Setting
};

/**
 * Mengambil object Spreadsheet untuk suatu modul.
 * Melempar error jelas jika ID belum dikonfigurasi, supaya mudah
 * di-debug saat modul baru mulai dikembangkan.
 */
function getSpreadsheet_(moduleName) {
  const id = SPREADSHEET_IDS_[moduleName];
  if (!id) {
    throw new Error(
      `Spreadsheet ID untuk modul '${moduleName}' belum dikonfigurasi di Config.gs`
    );
  }
  return SpreadsheetApp.openById(id);
}

/**
 * Mengambil satu Sheet (tab) tertentu di dalam Spreadsheet modul.
 * Contoh: getSheet_('medicine', 'Data')
 */
function getSheet_(moduleName, sheetName) {
  const ss = getSpreadsheet_(moduleName);
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    throw new Error(`Sheet '${sheetName}' tidak ditemukan di modul '${moduleName}'`);
  }
  return sheet;
}
