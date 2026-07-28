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
 * Setelah fragment disisipkan, Alpine.initTree() dipanggil supaya
 * x-data/x-show/x-for di dalam fragment ikut aktif (karena fragment
 * disisipkan setelah Alpine pertama kali melakukan scan halaman).
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
      if (window.Alpine && typeof window.Alpine.initTree === "function") {
        window.Alpine.initTree(el);
      }
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
document.addEventListener("DOMContentLoaded", () => Components.loadAll());
