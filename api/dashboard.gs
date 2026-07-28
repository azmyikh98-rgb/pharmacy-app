/**
 * dashboard.gs
 * -----------------------------------------------------------------------
 * Modul Dashboard — Tahap 4.
 *
 * PENTING: Modul ini membaca data dari Spreadsheet 'medicine', 'sales',
 * 'purchase', 'supplier', 'customer' yang BARU akan benar-benar dibuat &
 * diisi skema kolomnya di Tahap 5 (Master Data), Tahap 6 (Pembelian), dan
 * Tahap 7 (Penjualan). Supaya halaman Dashboard tetap bisa di-testing
 * SEKARANG tanpa error, setiap fungsi dibungkus trySafe_() yang otomatis
 * mengembalikan nilai fallback (0 / array kosong) jika Spreadsheet/kolom
 * terkait belum ada — begitu modul lain selesai dibangun, Dashboard akan
 * otomatis menampilkan data asli tanpa perubahan kode apapun di sini.
 *
 * Skema kolom yang diasumsikan (akan difinalisasi di tahap terkait):
 *   medicine : id, code, name, category, stock, min_stock, expired_date, ...
 *   sales    : id, date, medicine_name, category, qty, total, ...
 *   purchase : id, date, supplier, total, ...
 * -----------------------------------------------------------------------
 */

const DashboardModule = {
  summary() {
    return {
      totalObat: trySafe_(() => countRows_("medicine", "Data"), 0),
      obatHampirHabis: trySafe_(() => countLowStock_(), 0),
      obatExpired: trySafe_(() => countExpired_(), 0),
      penjualanHariIni: trySafe_(() => countTodayRows_("sales"), 0),
      pendapatanHariIni: trySafe_(() => sumTodayColumn_("sales", "total"), 0),
      pembelianHariIni: trySafe_(() => sumTodayColumn_("purchase", "total"), 0),
      totalSupplier: trySafe_(() => countRows_("supplier", "Data"), 0),
      totalCustomer: trySafe_(() => countRows_("customer", "Data"), 0),
    };
  },

  salesMonthly() {
    return trySafe_(() => monthlyTotals_("sales", "date", "total"), emptyMonthlySeries_());
  },

  purchaseMonthly() {
    return trySafe_(() => monthlyTotals_("purchase", "date", "total"), emptyMonthlySeries_());
  },

  topProducts() {
    return trySafe_(() => topByColumn_("sales", "medicine_name", "qty", 5), []);
  },

  topCategories() {
    return trySafe_(() => topByColumn_("sales", "category", "qty", 5), []);
  },

  nearExpiry() {
    return trySafe_(() => listNearExpiry_(30), []);
  },

  lowStock() {
    return trySafe_(() => listLowStock_(), []);
  },

  recentActivity() {
    return trySafe_(() => combineRecentActivity_(10), []);
  },
};

MODULE_REGISTRY_.dashboard = DashboardModule;

/* ------------------------------------------------------------------- */
/* Helper generik — dipakai lintas fungsi DashboardModule di atas       */
/* ------------------------------------------------------------------- */

function trySafe_(fn, fallback) {
  try {
    return fn();
  } catch (err) {
    Logger.log("[Dashboard] fallback dipakai: " + err.message);
    return fallback;
  }
}

function countRows_(moduleName, sheetName) {
  const sheet = getSheet_(moduleName, sheetName);
  return Math.max(0, sheet.getLastRow() - 1);
}

function countLowStock_() {
  const { values, headers } = readSheet_("medicine", "Data");
  const stockIdx = headers.indexOf("stock");
  const minIdx = headers.indexOf("min_stock");
  let count = 0;
  for (let i = 1; i < values.length; i++) {
    if (Number(values[i][stockIdx]) <= Number(values[i][minIdx])) count++;
  }
  return count;
}

function countExpired_() {
  const { values, headers } = readSheet_("medicine", "Data");
  const expIdx = headers.indexOf("expired_date");
  const today = new Date();
  let count = 0;
  for (let i = 1; i < values.length; i++) {
    if (new Date(values[i][expIdx]) < today) count++;
  }
  return count;
}

function countTodayRows_(moduleName) {
  const { values, headers } = readSheet_(moduleName, "Data");
  const dateIdx = headers.indexOf("date");
  const todayStr = formatDateOnly_(new Date());
  let count = 0;
  for (let i = 1; i < values.length; i++) {
    if (formatDateOnly_(new Date(values[i][dateIdx])) === todayStr) count++;
  }
  return count;
}

function sumTodayColumn_(moduleName, columnName) {
  const { values, headers } = readSheet_(moduleName, "Data");
  const dateIdx = headers.indexOf("date");
  const colIdx = headers.indexOf(columnName);
  const todayStr = formatDateOnly_(new Date());
  let sum = 0;
  for (let i = 1; i < values.length; i++) {
    if (formatDateOnly_(new Date(values[i][dateIdx])) === todayStr) {
      sum += Number(values[i][colIdx]) || 0;
    }
  }
  return sum;
}

function emptyMonthlySeries_() {
  return last6Months_().map((m) => ({ month: m.label, total: 0 }));
}

function monthlyTotals_(moduleName, dateColumn, valueColumn) {
  const { values, headers } = readSheet_(moduleName, "Data");
  const dateIdx = headers.indexOf(dateColumn);
  const valIdx = headers.indexOf(valueColumn);
  const months = last6Months_();
  const buckets = {};
  months.forEach((m) => (buckets[m.key] = { month: m.label, total: 0 }));

  for (let i = 1; i < values.length; i++) {
    const key = formatMonthKey_(new Date(values[i][dateIdx]));
    if (buckets[key]) buckets[key].total += Number(values[i][valIdx]) || 0;
  }
  return months.map((m) => buckets[m.key]);
}

function topByColumn_(moduleName, groupColumn, valueColumn, limit) {
  const { values, headers } = readSheet_(moduleName, "Data");
  const groupIdx = headers.indexOf(groupColumn);
  const valIdx = headers.indexOf(valueColumn);
  const totals = {};
  for (let i = 1; i < values.length; i++) {
    const key = values[i][groupIdx];
    totals[key] = (totals[key] || 0) + (Number(values[i][valIdx]) || 0);
  }
  return Object.entries(totals)
    .map(([name, total]) => ({ name, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, limit);
}

function listNearExpiry_(withinDays) {
  const { values, headers } = readSheet_("medicine", "Data");
  const nameIdx = headers.indexOf("name");
  const expIdx = headers.indexOf("expired_date");
  const today = new Date();
  const result = [];
  for (let i = 1; i < values.length; i++) {
    const exp = new Date(values[i][expIdx]);
    const daysLeft = Math.round((exp - today) / (1000 * 60 * 60 * 24));
    if (daysLeft >= 0 && daysLeft <= withinDays) {
      result.push({ name: values[i][nameIdx], expiredDate: values[i][expIdx], daysLeft });
    }
  }
  return result.sort((a, b) => a.daysLeft - b.daysLeft);
}

function listLowStock_() {
  const { values, headers } = readSheet_("medicine", "Data");
  const nameIdx = headers.indexOf("name");
  const stockIdx = headers.indexOf("stock");
  const minIdx = headers.indexOf("min_stock");
  const result = [];
  for (let i = 1; i < values.length; i++) {
    const stock = Number(values[i][stockIdx]);
    const minStock = Number(values[i][minIdx]);
    if (stock <= minStock) result.push({ name: values[i][nameIdx], stock, minStock });
  }
  return result.sort((a, b) => a.stock - b.stock);
}

function combineRecentActivity_(limit) {
  // Stock movement menyusul saat modul Persediaan dibangun di Tahap 8.
  const activities = [];
  ["sales", "purchase"].forEach((moduleName) => {
    try {
      const { values, headers } = readSheet_(moduleName, "Data");
      const dateIdx = headers.indexOf("date");
      for (let i = 1; i < values.length; i++) {
        activities.push({
          type: moduleName,
          date: values[i][dateIdx],
          summary: `${moduleName === "sales" ? "Penjualan" : "Pembelian"} #${values[i][0]}`,
        });
      }
    } catch (err) {
      // Modul terkait belum siap — lewati tanpa menggagalkan seluruh request.
    }
  });
  return activities.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, limit);
}

/* ------------------------------------------------------------------- */
/* Utilitas tanggal & sheet                                             */
/* ------------------------------------------------------------------- */

function readSheet_(moduleName, sheetName) {
  const sheet = getSheet_(moduleName, sheetName);
  const values = sheet.getDataRange().getValues();
  return { values, headers: values[0] };
}

function formatDateOnly_(date) {
  return Utilities.formatDate(date, Session.getScriptTimeZone(), "yyyy-MM-dd");
}

function formatMonthKey_(date) {
  return Utilities.formatDate(date, Session.getScriptTimeZone(), "yyyy-MM");
}

function last6Months_() {
  const tz = Session.getScriptTimeZone();
  const now = new Date();
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      key: Utilities.formatDate(d, tz, "yyyy-MM"),
      label: Utilities.formatDate(d, tz, "MMM yyyy"),
    });
  }
  return months;
}
