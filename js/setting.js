/**
 * setting.js
 * -----------------------------------------------------------------------
 * State & logic halaman Setting. Backup diunduh sebagai file .json murni
 * di browser (Blob + object URL) — tidak melalui server perantara apapun.
 * Restore membaca file yang sama lalu mengirim isinya ke Apps Script.
 * -----------------------------------------------------------------------
 */

function settingPage() {
  return {
    moduleName: window.APP_CONFIG.MODULES.SETTING,
    activeTab: "profile",
    tabs: [
      { key: "profile", label: "Profil Apotek" },
      { key: "backup", label: "Backup Data" },
      { key: "restore", label: "Restore Data" },
    ],

    form: {},
    loading: true,
    saving: false,
    formError: "",

    backupRunning: false,

    restoreFile: null,
    restoreRunning: false,
    restoreSummary: null,

    async init() {
      // Buka tab sesuai link yang diklik dari sidebar (mis. setting.html?tab=backup)
      const requestedTab = Utils.getQueryParam("tab");
      if (requestedTab && this.tabs.some((t) => t.key === requestedTab)) {
        this.activeTab = requestedTab;
      }

      this.loading = true;
      try {
        this.form = await Api.get(this.moduleName, "get");
      } catch (err) {
        Toast.error(err.message || "Gagal memuat pengaturan");
      } finally {
        this.loading = false;
      }
    },

    setTab(tab) {
      this.activeTab = tab;
    },

    async saveProfile() {
      this.formError = "";
      this.saving = true;
      try {
        this.form = await Api.post(this.moduleName, "update", this.form);
        Toast.success("Pengaturan berhasil disimpan");
      } catch (err) {
        this.formError = err.message || "Gagal menyimpan pengaturan";
      } finally {
        this.saving = false;
      }
    },

    async runBackup() {
      this.backupRunning = true;
      try {
        const result = await Api.get(this.moduleName, "backupData");
        const blob = new Blob([JSON.stringify(result, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `backup-pharmasys-${new Date().toISOString().slice(0, 10)}.json`;
        link.click();
        URL.revokeObjectURL(url);
        Toast.success("Backup berhasil diunduh");
      } catch (err) {
        Toast.error(err.message || "Gagal membuat backup");
      } finally {
        this.backupRunning = false;
      }
    },

    onRestoreFileChange(event) {
      this.restoreFile = event.target.files[0] || null;
      this.restoreSummary = null;
    },

    confirmRestore() {
      if (!this.restoreFile) {
        Toast.error("Pilih file backup (.json) terlebih dahulu");
        return;
      }
      Confirm.ask({
        title: "Timpa Data Sekarang?",
        message:
          "Restore akan MENIMPA data pada Spreadsheet sesuai isi file backup ini. Tindakan ini tidak bisa dibatalkan.",
        variant: "danger",
        onConfirm: () => this.runRestore(),
      });
    },

    async runRestore() {
      this.restoreRunning = true;
      this.restoreSummary = null;
      try {
        const text = await this.restoreFile.text();
        const backup = JSON.parse(text);
        const result = await Api.post(this.moduleName, "restoreData", backup);
        this.restoreSummary = result;
        Toast.success("Proses restore selesai — cek ringkasan hasil di bawah");
      } catch (err) {
        Toast.error(err.message || "Gagal memproses restore (pastikan file adalah hasil Backup Data)");
      } finally {
        this.restoreRunning = false;
      }
    },
  };
}

window.settingPage = settingPage;
