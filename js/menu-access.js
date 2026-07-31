/**
 * menu-access.js
 * -----------------------------------------------------------------------
 * State & logic halaman Setting > Akses Menu. Bisa mengatur akses secara
 * umum (per role) atau khusus (per user, override role-nya).
 * -----------------------------------------------------------------------
 */

function menuAccessPage() {
  return {
    menuKeys: ["dashboard", "master_data", "purchase", "sales", "stock", "report", "setting"],
    menuMeta: {
      dashboard: { label: "Dashboard" },
      master_data: { label: "Master Data" },
      purchase: { label: "Pembelian" },
      sales: { label: "Penjualan" },
      stock: { label: "Persediaan" },
      report: { label: "Laporan" },
      setting: { label: "Setting" },
    },
    roleLabels: { kasir: "Kasir", apoteker: "Apoteker", gudang: "Gudang", owner: "Owner" },

    roles: [],
    users: [],
    selectedTarget: "role:kasir",
    targetType: "role",
    targetId: "kasir",
    useCustom: false,
    menus: {},

    loading: true,
    saving: false,

    async init() {
      try {
        const t = await Api.get(window.APP_CONFIG.MODULES.MENU_ACCESS, "targets");
        this.roles = t.roles;
        this.users = t.users;
      } catch (err) {
        Toast.error("Gagal memuat daftar role/user");
      }
      await this.loadAccess();
    },

    get selectedUser() {
      if (this.targetType !== "user") return null;
      return this.users.find((u) => String(u.id) === String(this.targetId)) || null;
    },

    roleLabel(role) {
      return this.roleLabels[role] || role;
    },

    onTargetChange() {
      const [type, id] = this.selectedTarget.split(":");
      this.targetType = type;
      this.targetId = id;
      this.loadAccess();
    },

    async loadAccess() {
      this.loading = true;
      try {
        const result = await Api.get(window.APP_CONFIG.MODULES.MENU_ACCESS, "getAccess", {
          targetType: this.targetType,
          targetId: this.targetId,
        });
        this.useCustom = result.useCustom;
        this.menus = result.menus;
      } catch (err) {
        Toast.error(err.message || "Gagal memuat akses menu");
      } finally {
        this.loading = false;
      }
    },

    /** Toggle terkunci untuk target user selama "Akses Khusus" belum diaktifkan. */
    get togglesLocked() {
      return this.targetType === "user" && !this.useCustom;
    },

    toggleMenu(key) {
      if (this.togglesLocked) return;
      this.menus[key] = !this.menus[key];
    },

    async save() {
      this.saving = true;
      try {
        await Api.post(window.APP_CONFIG.MODULES.MENU_ACCESS, "saveAccess", {
          targetType: this.targetType,
          targetId: this.targetId,
          useCustom: this.useCustom,
          menus: this.menus,
        });
        Toast.success("Akses menu berhasil disimpan");
      } catch (err) {
        Toast.error(err.message || "Gagal menyimpan akses menu");
      } finally {
        this.saving = false;
      }
    },
  };
}

window.menuAccessPage = menuAccessPage;
