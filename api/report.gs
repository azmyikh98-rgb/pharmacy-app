/**
 * report.gs
 * -----------------------------------------------------------------------
 * Modul Laporan — Tahap 9. Tidak punya Spreadsheet sendiri — murni
 * membaca & mengagregasi data dari modul lain yang sudah ada (medicine,
 * sales, purchase). Export Excel/PDF dilakukan di sisi client (SheetJS
 * untuk Excel, window.print() untuk PDF/Print) — modul ini hanya
 * menyediakan datanya dalam bentuk JSON siap tampil/export.
 *
 * Laporan Laba (profitReport) menghitung profit dengan mengambil
 * buy_price OBAT SAAT INI sebagai estimasi HPP — BUKAN harga beli
 * historis pada saat transaksi terjadi (karena sales.Items tidak
 * menyimpan snapshot harga beli). Ini simplifikasi yang wajar untuk
 * skala apotek kecil-menengah; jika harga beli sering berubah drastis,
 * angka laba di laporan lama bisa sedikit bergeser dari kondisi
 * historis sebenarnya.
 * -----------------------------------------------------------------------
 */

const ReportModule = {
  salesReport(params) {
    const sales = trySafe_(() => getSalesInRange_(params.startDate, params.endDate), []);
    const totalRevenue = sales.reduce((sum, s) => sum + Number(s.total || 0), 0);
    return { rows: sales, summary: { totalTransactions: sales.length, totalRevenue } };
  },

  purchaseReport(params) {
    const purchases = trySafe_(() => getPurchasesInRange_(params.startDate, params.endDate), []);
    const totalValue = purchases.reduce((sum, p) => sum + Number(p.total || 0), 0);
    return { rows: purchases, summary: { totalPO: purchases.length, totalValue } };
  },

  /** Snapshot nilai persediaan saat ini (bukan rentang tanggal). */
  inventoryReport() {
    return trySafe_(() => {
      const { values, headers } = readSheet_("medicine", "Data");
      const idx = (key) => headers.indexOf(key);
      return values.slice(1).map((row) => {
        const stock = Number(row[idx("stock")] || 0);
        const buyPrice = Number(row[idx("buy_price")] || 0);
        return {
          code: row[idx("code")],
          name: row[idx("name")],
          category: row[idx("category")],
          stock,
          min_stock: row[idx("min_stock")],
          buy_price: buyPrice,
          sell_price: row[idx("sell_price")],
          stock_value: stock * buyPrice,
        };
      });
    }, []);
  },

  profitReport(params) {
    return trySafe_(() => {
      const sales = getSalesInRange_(params.startDate, params.endDate);
      const items = getSalesItemsForSaleIds_(sales.map((s) => s.id));
      const costMap = getMedicineBuyPriceMap_();

      let totalRevenue = 0;
      let totalCost = 0;
      items.forEach((item) => {
        totalRevenue += Number(item.qty) * Number(item.price);
        totalCost += Number(item.qty) * (costMap[item.medicine_id] || 0);
      });

      return {
        transactionCount: sales.length,
        totalRevenue,
        totalCost,
        grossProfit: totalRevenue - totalCost,
      };
    }, { transactionCount: 0, totalRevenue: 0, totalCost: 0, grossProfit: 0 });
  },

  expiredReport() {
    return {
      nearExpiry: trySafe_(() => listNearExpiry_(30), []),
      expired: trySafe_(() => listExpired_(), []),
    };
  },

  /** Produk terlaris dalam rentang tanggal (hanya yang benar-benar terjual). */
  fastMovingReport(params) {
    return trySafe_(() => rankMedicinesSold_(params.startDate, params.endDate, "desc", 10), []);
  },

  /** Produk paling jarang terjual — TERMASUK yang sama sekali tidak terjual (qty 0). */
  slowMovingReport(params) {
    return trySafe_(() => slowMovingWithZero_(params.startDate, params.endDate, 10), []);
  },

  supplierReport(params) {
    return trySafe_(() => {
      const purchases = getPurchasesInRange_(params.startDate, params.endDate);
      const totals = {};
      purchases.forEach((p) => {
        const key = p.supplier || "-";
        if (!totals[key]) totals[key] = { supplier: key, poCount: 0, totalValue: 0 };
        totals[key].poCount += 1;
        totals[key].totalValue += Number(p.total || 0);
      });
      return Object.values(totals).sort((a, b) => b.totalValue - a.totalValue);
    }, []);
  },
};

MODULE_REGISTRY_.report = ReportModule;

/* ------------------------------------------------------------------- */

function getSalesInRange_(startDate, endDate) {
  const { values, headers } = readSheet_("sales", "Data");
  const dateIdx = headers.indexOf("date");
  const start = new Date(startDate);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);
  return values
    .slice(1)
    .filter((row) => {
      const d = new Date(row[dateIdx]);
      return d >= start && d <= end;
    })
    .map((row) => rowToObject_(headers, row));
}

function getPurchasesInRange_(startDate, endDate) {
  const { values, headers } = readSheet_("purchase", "Data");
  const dateIdx = headers.indexOf("date");
  const start = new Date(startDate);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);
  return values
    .slice(1)
    .filter((row) => {
      const d = new Date(row[dateIdx]);
      return d >= start && d <= end;
    })
    .map((row) => rowToObject_(headers, row));
}

function getSalesItemsForSaleIds_(saleIds) {
  const { values, headers } = readSheet_("sales", "Items");
  const sidIdx = headers.indexOf("sale_id");
  const idSet = new Set(saleIds.map(String));
  return values
    .slice(1)
    .filter((row) => idSet.has(String(row[sidIdx])))
    .map((row) => rowToObject_(headers, row));
}

function getMedicineBuyPriceMap_() {
  const { values, headers } = readSheet_("medicine", "Data");
  const buyIdx = headers.indexOf("buy_price");
  const map = {};
  values.slice(1).forEach((row) => {
    map[row[0]] = Number(row[buyIdx] || 0);
  });
  return map;
}

function rankMedicinesSold_(startDate, endDate, order, limit) {
  const sales = getSalesInRange_(startDate, endDate);
  const items = getSalesItemsForSaleIds_(sales.map((s) => s.id));
  const totals = {};
  items.forEach((item) => {
    const key = item.medicine_id;
    if (!totals[key]) totals[key] = { medicine_id: key, name: item.medicine_name, qty: 0, revenue: 0 };
    totals[key].qty += Number(item.qty);
    totals[key].revenue += Number(item.qty) * Number(item.price);
  });
  return Object.values(totals).sort((a, b) => (order === "desc" ? b.qty - a.qty : a.qty - b.qty)).slice(0, limit);
}

function slowMovingWithZero_(startDate, endDate, limit) {
  const sales = getSalesInRange_(startDate, endDate);
  const items = getSalesItemsForSaleIds_(sales.map((s) => s.id));
  const soldQty = {};
  items.forEach((item) => {
    soldQty[item.medicine_id] = (soldQty[item.medicine_id] || 0) + Number(item.qty);
  });
  const medicines = listActiveMedicines_();
  return medicines
    .map((m) => ({ medicine_id: m.id, name: m.name, qty: soldQty[m.id] || 0 }))
    .sort((a, b) => a.qty - b.qty)
    .slice(0, limit);
}
