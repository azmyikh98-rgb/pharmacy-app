/**
 * dashboard.js
 * -----------------------------------------------------------------------
 * State & logic halaman pages/dashboard.html. Mengambil seluruh data lewat
 * Api.get('dashboard', <action>) secara paralel (Promise.all) supaya waktu
 * tunggu total = request paling lambat, bukan dijumlah satu-satu.
 *
 * Chart dirender pakai Chart.js (CDN) — dipilih karena ringan, tanpa
 * dependency build tool, dan cukup untuk grafik garis/batang/donat yang
 * diminta di brief (Penjualan Bulanan, Pembelian Bulanan, Produk Terlaris,
 * Kategori Terlaris).
 * -----------------------------------------------------------------------
 */

function dashboardPage() {
  return {
    loading: true,
    user: null,
    summary: {},
    salesMonthly: [],
    purchaseMonthly: [],
    topProducts: [],
    topCategories: [],
    nearExpiry: [],
    lowStock: [],
    recentActivity: [],

    async init() {
      this.user = Auth.getUser();
      try {
        const [
          summary,
          salesMonthly,
          purchaseMonthly,
          topProducts,
          topCategories,
          nearExpiry,
          lowStock,
          recentActivity,
        ] = await Promise.all([
          Api.get("dashboard", "summary"),
          Api.get("dashboard", "salesMonthly"),
          Api.get("dashboard", "purchaseMonthly"),
          Api.get("dashboard", "topProducts"),
          Api.get("dashboard", "topCategories"),
          Api.get("dashboard", "nearExpiry"),
          Api.get("dashboard", "lowStock"),
          Api.get("dashboard", "recentActivity"),
        ]);

        this.summary = summary;
        this.salesMonthly = salesMonthly;
        this.purchaseMonthly = purchaseMonthly;
        this.topProducts = topProducts;
        this.topCategories = topCategories;
        this.nearExpiry = nearExpiry;
        this.lowStock = lowStock;
        this.recentActivity = recentActivity;
      } catch (err) {
        Toast.error(err.message || "Gagal memuat data dashboard");
      } finally {
        this.loading = false;
        this.$nextTick(() => this.renderCharts());
      }
    },

    formatRupiah(value) {
      return Utils.formatRupiah(value);
    },

    formatDate(value) {
      return Utils.formatDate(value);
    },

    renderCharts() {
      this.renderLineChart(this.$refs.salesChart, this.salesMonthly, "#2563EB");
      this.renderLineChart(this.$refs.purchaseChart, this.purchaseMonthly, "#16A34A");
      this.renderBarChart(this.$refs.topProductsChart, this.topProducts);
      this.renderDoughnutChart(this.$refs.topCategoriesChart, this.topCategories);
    },

    renderLineChart(canvas, series, color) {
      if (!canvas || typeof Chart === "undefined") return;
      new Chart(canvas, {
        type: "line",
        data: {
          labels: series.map((s) => s.month),
          datasets: [
            {
              label: "Total",
              data: series.map((s) => s.total),
              borderColor: color,
              backgroundColor: color + "22",
              tension: 0.35,
              fill: true,
            },
          ],
        },
        options: {
          plugins: { legend: { display: false } },
          scales: { y: { beginAtZero: true } },
        },
      });
    },

    renderBarChart(canvas, items) {
      if (!canvas || typeof Chart === "undefined") return;
      new Chart(canvas, {
        type: "bar",
        data: {
          labels: items.map((i) => i.name),
          datasets: [{ label: "Qty", data: items.map((i) => i.total), backgroundColor: "#2563EB" }],
        },
        options: {
          indexAxis: "y",
          plugins: { legend: { display: false } },
        },
      });
    },

    renderDoughnutChart(canvas, items) {
      if (!canvas || typeof Chart === "undefined") return;
      new Chart(canvas, {
        type: "doughnut",
        data: {
          labels: items.map((i) => i.name),
          datasets: [
            {
              data: items.map((i) => i.total),
              backgroundColor: ["#2563EB", "#16A34A", "#F59E0B", "#DC2626", "#64748B"],
            },
          ],
        },
      });
    },
  };
}

window.dashboardPage = dashboardPage;
