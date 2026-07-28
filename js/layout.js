/**
 * layout.js
 * -----------------------------------------------------------------------
 * Store kecil untuk state layout aplikasi yang dipakai lintas komponen
 * (navbar butuh tombol toggle, shell halaman butuh tahu kapan sidebar
 * mobile harus tampil/hilang).
 * -----------------------------------------------------------------------
 */

document.addEventListener("alpine:init", () => {
  Alpine.store("layout", {
    sidebarOpen: false,

    toggleSidebar() {
      this.sidebarOpen = !this.sidebarOpen;
    },

    closeSidebar() {
      this.sidebarOpen = false;
    },
  });
});
