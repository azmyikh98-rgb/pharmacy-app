/**
 * components.js
 * -----------------------------------------------------------------------
 * Loader sederhana untuk menyisipkan komponen HTML statis (navbar, sidebar,
 * modal shell, toast container, dll dari folder /components) ke dalam
 * elemen manapun yang memiliki atribut `data-include="path/ke/file.html"`.
 *
 * Contoh pemakaian di halaman:
 *   <div data-include="components/navbar.html"></div>
 *
 * PENTING — urutan start Alpine:
 * Alpine TIDAK dibiarkan auto-start begitu script-nya termuat. Lewat
 * `window.deferLoadingAlpine` (fitur bawaan Alpine), start Alpine ditunda
 * sampai SEMUA fragment [data-include] selesai di-fetch dan disisipkan ke
 * DOM. Ini untuk menghindari bug: Alpine sempat memindai halaman sebelum
 * fragment termuat, lalu memindai ULANG setelah fragment masuk — yang
 * menyebabkan <template x-for> di dalam fragment (mis. tabel Master Data)
 * dirender DUA KALI (kolom/baris dobel). Dengan pola ini, Alpine hanya
 * memindai dokumen SATU KALI, setelah semua konten final ada di DOM.
 * -----------------------------------------------------------------------
 */

const Components = {
  async load(el) {
    const src = el.getAttribute("data-include");
    if (!src) return;
    try {
      const res = await fetch(src);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      el.innerHTML = await res.text();
      el.removeAttribute("data-include");
      el.dispatchEvent(new CustomEvent("component:loaded", { bubbles: true, detail: { src } }));
    } catch (err) {
      console.error(`[Components] Gagal memuat komponen: ${src}`, err);
      el.innerHTML = `<div class="p-3 text-xs text-danger-600">Gagal memuat komponen (${src})</div>`;
    }
  },

  async loadAll(root = document) {
    const nodes = Array.from(root.querySelectorAll("[data-include]"));
    await Promise.all(nodes.map((el) => Components.load(el)));
  },
};

window.Components = Components;

// Beri tahu Alpine untuk menunda auto-start-nya (harus didaftarkan SEBELUM
// script Alpine dieksekusi — aman ditaruh di sini karena components.js
// non-defer, jadi selalu jalan lebih dulu daripada <script defer> Alpine).
window.deferLoadingAlpine = function (startAlpine) {
  window._startAlpineWhenReady = startAlpine;
};

document.addEventListener("DOMContentLoaded", async () => {
  await Components.loadAll();
  if (typeof window._startAlpineWhenReady === "function") {
    window._startAlpineWhenReady();
  } else {
    console.warn(
      "[Components] window.deferLoadingAlpine tidak terpasang sebelum Alpine dimuat — " +
        "Alpine mungkin sudah start duluan dan fragment bisa ter-render dobel."
    );
  }
});
