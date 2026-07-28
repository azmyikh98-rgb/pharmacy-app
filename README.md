# Modern Pharmacy Management System

Aplikasi manajemen apotek berbasis web, dibangun bertahap dari fondasi
Google Spreadsheet menuju MySQL/PostgreSQL, tanpa perubahan arsitektur besar.

## Tahap Pengembangan

- [x] Tahap 1 — Project Initialization *(selesai)*
- [x] Tahap 2 — Design System *(selesai)*
- [x] Tahap 3 — Authentication *(selesai)*
- [x] Tahap 4 — Dashboard *(selesai)*
- [x] Tahap 5 — Master Data *(selesai)*
- [x] Tahap 6 — Pembelian *(selesai)*
- [x] Tahap 7 — Penjualan *(selesai)*
- [x] Tahap 8 — Persediaan *(selesai)*
- [x] Tahap 9 — Laporan *(selesai)*
- [x] **Tahap 10 — Setting** *(selesai — SEMUA TAHAP SELESAI)*
- [ ] Tahap 4 — Dashboard
- [ ] Tahap 5 — Master Data
- [ ] Tahap 6 — Pembelian
- [ ] Tahap 7 — Penjualan
- [ ] Tahap 8 — Persediaan
- [ ] Tahap 9 — Laporan
- [ ] Tahap 10 — Setting

## Teknologi

| Layer      | Teknologi                              |
|------------|-----------------------------------------|
| Frontend   | HTML5, CSS3, TailwindCSS, JS ES6, AlpineJS |
| Backend    | Google Apps Script                      |
| Database   | Google Spreadsheet (1 spreadsheet / modul) |
| Hosting    | GitHub Pages (awal) → Hostinger (lanjutan) |
| Versioning | Git / GitHub                            |

## Struktur Folder

Lihat [`docs/STRUCTURE.md`](docs/STRUCTURE.md).

## Menjalankan di Localhost

Karena aplikasi ini tidak memakai bundler/build step (murni HTML/CSS/JS),
**jangan** dibuka langsung dengan double-click (`file://...`) karena:
- `fetch()` ke Apps Script akan diblokir oleh browser untuk protokol `file://`
- Beberapa fitur module JS (`type="module"`, jika dipakai di tahap lanjutan) butuh HTTP server

Gunakan salah satu cara berikut dari dalam folder `pharmacy-app/`:

```bash
# Opsi 1 — Node.js (tanpa install global)
npx serve .

# Opsi 2 — Python 3
python3 -m http.server 8080

# Opsi 3 — VS Code
# Klik kanan index.html -> "Open with Live Server"
```

Lalu buka `http://localhost:8080` (atau port yang ditampilkan).
Jika bootstrap check di halaman utama menunjukkan semua status **OK**,
berarti Tahap 1 berhasil dan environment siap untuk Tahap 2.

## Menghubungkan ke Google Apps Script

1. Buka [script.google.com](https://script.google.com) → buat Project baru.
2. Salin isi `api/Code.gs` dan `api/Config.gs` ke dalam project tersebut
   (masing-masing sebagai file `.gs` terpisah, nama file harus sama persis).
3. Klik **Deploy → New deployment**:
   - Type: **Web app**
   - Execute as: **Me**
   - Who has access: **Anyone** (atau **Anyone with Google account** sesuai kebutuhan)
4. Salin URL Web App yang dihasilkan (`https://script.google.com/macros/s/XXXX/exec`).
5. Tempel URL tersebut ke `js/config.js` pada properti `API_BASE_URL`.
6. Uji koneksi dengan membuka:
   `<API_BASE_URL>?module=ping&action=check`
   Harus mengembalikan JSON: `{ "success": true, "data": { "status": "ok", ... } }`

> Modul bisnis (`login.gs`, `medicine.gs`, dst) dan Spreadsheet-nya akan
> dibuat pada Tahap 3 dan Tahap 5, kemudian didaftarkan ke `MODULE_REGISTRY_`
> di `Code.gs` dan `SPREADSHEET_IDS_` di `Config.gs`.

## Deploy ke GitHub

```bash
cd pharmacy-app
git init
git add .
git commit -m "Tahap 1: Project Initialization"
git branch -M main
git remote add origin <URL_REPOSITORY_ANDA>
git push -u origin main
```

Setelah repo di-push, aktifkan **GitHub Pages** (Settings → Pages → Branch: main)
untuk hosting sementara sebelum pindah ke Hostinger pada tahap produksi.

## Testing Checklist — Tahap 1

- [ ] `index.html` terbuka tanpa error di console browser
- [ ] Tailwind CSS ter-render (utility class seperti `rounded-2xl`, `shadow-lg` tampil benar)
- [ ] Alpine JS aktif (kartu status checklist muncul dinamis)
- [ ] `config.js`, `utils.js`, `api.js` termuat berurutan tanpa error
- [ ] Endpoint `?module=ping&action=check` di Apps Script mengembalikan JSON sukses
- [ ] Struktur folder sesuai `docs/STRUCTURE.md`, tidak ada file di luar tempatnya
- [ ] `.gitignore` mencegah file sensitif (`.env`) ikut ter-commit
- [ ] Repository berhasil di-push ke GitHub

## Rekomendasi Sebelum Lanjut ke Tahap 2 (Tahap 1)

1. Pastikan URL Apps Script sudah stabil (deployment tidak "New deployment" terus-menerus
   setiap testing — gunakan "Manage deployments → Edit" agar URL tidak berubah-ubah).
2. Aktifkan Version History di setiap Google Spreadsheet yang akan dibuat nanti.
3. Siapkan akun Google terpisah (bukan akun pribadi) khusus untuk hosting Spreadsheet + Apps Script produksi.
4. Tetapkan konvensi commit message (mis. `feat:`, `fix:`, `docs:`) sebelum jumlah file bertambah banyak di tahap berikutnya.

---

## Testing Checklist — Tahap 2 (Design System)

- [ ] `index.html` menampilkan sidebar gelap (desktop) dan bisa di-toggle di ukuran mobile (< 1024px)
- [ ] Navbar menampilkan search bar, ikon notifikasi, dan dropdown user; keduanya bisa dibuka/tutup dan tertutup saat klik di luar (`@click.outside`)
- [ ] Semua warna sesuai token brief: primary `#2563EB`, success `#16A34A`, danger `#DC2626`, warning `#F59E0B`
- [ ] Font yang ter-render adalah **Inter** (cek di DevTools → Computed → font-family)
- [ ] Tombol `Trigger Success/Error/Warning` memunculkan toast di kanan atas dan hilang otomatis setelah ±3.5 detik
- [ ] Tombol `Hapus Obat (contoh)` memunculkan Confirm Dialog, tombol "Ya, Lanjutkan" memicu toast sukses
- [ ] Tabel demo tampil dengan data dummy, kolom rata kanan untuk Stok & Harga sesuai konfigurasi `align: 'right'`
- [ ] Kontrol pagination di bawah tabel menampilkan nomor halaman dan bisa diklik (event `page-change` bisa dicek lewat console)
- [ ] Blok Loading Skeleton menampilkan animasi pulse, bukan konten statis
- [ ] Tidak ada error di Console browser terkait fragment yang gagal dimuat (`[Components] Gagal memuat...`)
- [ ] Layout tetap rapi saat browser di-resize ke lebar tablet (768px) dan mobile (375px)

## Rekomendasi Sebelum Lanjut ke Tahap 3

1. Screenshot halaman `index.html` di 3 ukuran layar (desktop/tablet/mobile) sebagai baseline visual sebelum halaman bertambah banyak.
2. Jika ada penyesuaian warna/spacing, ubah HANYA di `js/tailwind.config.js` + `css/style.css` — jangan tempel hex color baru langsung di HTML.
3. Modul Authentication (Tahap 3) akan memakai ulang shell sidebar+navbar ini persis seperti di `index.html`; pastikan tidak ada bug layout tersisa sebelum lanjut, karena akan diduplikasi ke banyak halaman baru.
4. Simpan komponen `table.html` / `pagination.html` sebagai *pola*, bukan sesuatu yang di-include apa adanya di halaman bisnis nanti — setiap modul menyalin pola `dataTable({...})` dengan kolom & data sesuai kebutuhannya sendiri.

---

## Setup Awal Modul Authentication (Tahap 3)

1. Buat Google Spreadsheet baru khusus untuk Master User, beri 1 sheet bernama **`Data`** dengan header persis di baris pertama:
   ```
   id | username | password_hash | name | role | status
   ```
2. Buka **Extensions → Apps Script** dari Spreadsheet tersebut (bukan project Apps Script yang lama), lalu tempel isi `api/Code.gs`, `api/Config.gs`, dan `api/login.gs` (3 file `.gs` terpisah, nama file harus sama persis).
3. Isi `SPREADSHEET_IDS_.user` di `Config.gs` dengan ID Spreadsheet ini (lihat di URL Spreadsheet, di antara `/d/` dan `/edit`).
4. Di Apps Script Editor, pilih fungsi `generateInitialPasswordHash_` dari dropdown **Run**, jalankan, lalu buka **Execution log** (Ctrl+Enter / View → Logs) untuk menyalin hasil hash-nya.
5. Isi baris pertama data di sheet `Data`, contoh:
   ```
   id: 1 | username: admin | password_hash: <hasil hash dari langkah 4> | name: Administrator | role: admin | status: active
   ```
6. Deploy sebagai Web App (lihat panduan "Menghubungkan ke Google Apps Script" di atas), lalu isi `API_BASE_URL` di `js/config.js`.
7. Uji login di `pages/login.html` dengan `username: admin`, `password: admin123` (atau password lain yang dipakai di langkah 4).

> Password TIDAK PERNAH ditulis manual dalam bentuk plain text di Spreadsheet — selalu lewat `hashPassword_()` (langkah 4), sesuai requirement Security: Hash Password di brief.

## Testing Checklist — Tahap 3 (Authentication)

- [ ] Membuka `index.html` tanpa sesi login → otomatis redirect ke `pages/login.html`
- [ ] Login dengan username/password salah → muncul pesan error inline berwarna merah, tombol kembali ke state normal (tidak macet di "Memproses...")
- [ ] Login dengan username/password benar → redirect ke `pages/dashboard.html` dan menampilkan nama + role user yang login
- [ ] Centang "Ingat saya" saat login → tutup & buka ulang browser (bukan hanya refresh tab) → sesi tetap tersimpan (localStorage)
- [ ] Login TANPA centang "Ingat saya" → tutup seluruh browser lalu buka lagi → sesi hilang, kembali ke halaman login (sessionStorage)
- [ ] Membuka `pages/dashboard.html` langsung lewat URL tanpa login sama sekali → route guard (`Auth.requireAuth()`) redirect ke `pages/login.html`
- [ ] Klik "Keluar" di dropdown navbar → sesi terhapus dan kembali ke halaman login
- [ ] Membuka `pages/login.html` padahal sudah login → otomatis redirect ke dashboard (tidak menampilkan form login lagi)
- [ ] Endpoint `?module=login&action=authenticate` (via POST) mengembalikan `success:false` dengan pesan jelas untuk user tidak ditemukan / password salah / akun `status=inactive`

## Rekomendasi Sebelum Lanjut ke Tahap 4

1. Tambahkan minimal 4–5 user dummy di Spreadsheet `user` dengan role berbeda (admin, apoteker, kasir, gudang, owner) untuk memudahkan pengujian Role Permission mulai Tahap 4/5, ketika menu tertentu mulai dibatasi per role lewat `Auth.hasRole(...)` atau `Auth.requireAuth([...])`.
2. Catat `SPREADSHEET_IDS_.user` di tempat aman (mis. password manager tim) — ID ini dibutuhkan lagi setiap kali Apps Script di-redeploy ke project baru.
3. Token sesi saat ini adalah token sederhana (base64 + expiry), bukan JWT bertanda tangan — cukup untuk tahap Google Spreadsheet, namun WAJIB diganti dengan JWT bertanda tangan kriptografis saat migrasi ke MySQL/PostgreSQL dengan backend REST API sungguhan.
4. Pertimbangkan menambahkan rate limiting sederhana di `login.gs` (mis. hitung percobaan gagal per username dalam sheet terpisah) sebelum aplikasi dipakai di luar lingkungan development.

---

## Catatan Teknologi Tambahan — Tahap 4

Brief awal hanya menyebut HTML/CSS/Tailwind/AlpineJS di frontend, namun untuk kebutuhan
**Grafik** (Penjualan Bulanan, Pembelian Bulanan, Produk Terlaris, Kategori Terlaris) dashboard
memakai **Chart.js** lewat CDN (`cdn.jsdelivr.net/npm/chart.js`). Dipilih karena:
- Tanpa build step (sejalan dengan arsitektur "tanpa bundler" di seluruh project ini)
- Ukuran kecil dan cukup untuk grafik garis/batang/donat standar
- Tidak mengubah arsitektur file: tetap 1 file `dashboard.js` untuk semua logic halaman ini

## Kenapa Dashboard Sudah Bisa Diuji Sebelum Master Data/Pembelian/Penjualan Ada

`api/dashboard.gs` sengaja dibungkus `trySafe_()` di setiap fungsi: jika Spreadsheet modul
terkait (`medicine`, `sales`, `purchase`, dst) belum dikonfigurasi di `Config.gs` — seperti
kondisi saat ini — Dashboard tetap tampil dengan **nilai 0 / grafik kosong**, bukan error.
Begitu Tahap 5–7 selesai dan `SPREADSHEET_IDS_` diisi, Dashboard otomatis menampilkan data
asli tanpa perlu mengubah kode `dashboard.gs` maupun `dashboard.js`.

## Testing Checklist — Tahap 4 (Dashboard)

- [ ] Login lalu diarahkan ke `pages/dashboard.html`, tersapa dengan nama user yang login
- [ ] 8 summary card tampil dengan skeleton loading singkat sebelum data muncul (walau nilainya 0, karena Spreadsheet modul lain belum dibuat)
- [ ] 4 grafik (Penjualan Bulanan, Pembelian Bulanan, Produk Terlaris, Kategori Terlaris) ter-render tanpa error di Console meski datanya kosong
- [ ] Widget "Obat Mendekati Expired" dan "Stok di Bawah Minimum" menampilkan pesan "tidak ada data" dengan rapi (bukan error mentah)
- [ ] Widget "Aktivitas Terbaru" menampilkan pesan kosong yang rapi
- [ ] Shortcut Menu tampil 4 tombol (masih `href="#"`, aktif fungsinya mulai Tahap 5–7)
- [ ] Resize browser ke lebar tablet & mobile — grid summary card & grafik tetap rapi (2 kolom di mobile, 4 kolom di desktop)
- [ ] Setelah Spreadsheet `medicine`/`sales`/`purchase` diisi contoh data di tahap berikutnya, ulangi test ini — angka & grafik harus otomatis berubah dari 0 ke nilai asli

## Rekomendasi Sebelum Lanjut ke Tahap 5

1. Simpan nama kolom yang sudah diasumsikan `dashboard.gs` (`stock`, `min_stock`, `expired_date`, `date`, `total`, `qty`, `medicine_name`, `category`) sebagai acuan wajib saat mendesain skema sheet `medicine`, `sales`, `purchase` di Tahap 5–7 — supaya Dashboard langsung "menyambung" tanpa refactor.
2. Uji ulang seluruh Testing Checklist Tahap 4 setelah setiap modul baru (Master Data, Pembelian, Penjualan) selesai, karena outputnya berubah dari "kosong" ke "berisi data" — potensi bug baru biasanya muncul di titik peralihan ini.
3. Pertimbangkan menambah cache sederhana di `dashboard.gs` (mis. `CacheService` bawaan Apps Script, TTL 1–2 menit) jika nanti jumlah baris di sheet `sales`/`purchase` sudah besar, supaya `summary()` tidak scan seluruh baris di setiap pemanggilan.

---

## Setup Awal Master Data (Tahap 5)

Untuk SETIAP modul di bawah, buat 1 Google Spreadsheet baru dengan 1 sheet bernama **`Data`**, header persis di baris pertama, lalu isi `SPREADSHEET_IDS_.<nama_modul>` di `Config.gs`. Semua modul memakai project Apps Script YANG SAMA (satu Web App, banyak Spreadsheet) — tempel `CrudHelper.gs` + file modul terkait ke project Apps Script yang sudah ada (yang berisi `Code.gs`, `Config.gs`, `login.gs`, `dashboard.gs`).

| Modul | Header kolom (baris 1) |
|---|---|
| `medicine` | `id, code, barcode, name, category, golongan, brand, unit, buy_price, sell_price, stock, min_stock, batch, expired_date, rack_location, supplier, status, photo_url, notes` |
| `supplier` | `id, name, pic, address, phone, email, npwp, status` |
| `customer` | `id, name, type, address, phone, email, member_point, status` |
| `category` | `id, name, status` |
| `unit` | `id, name, status` |
| `brand` | `id, name, status` |
| `user` | *(sudah dibuat di Tahap 3 — tidak perlu diulang)* |

Tempel juga `CrudHelper.gs`, `medicine.gs`, `supplier.gs`, `customer.gs`, `users.gs`, dan `lookup.gs` ke project Apps Script, lalu **Deploy → Manage deployments → Edit → Deploy** (bukan New deployment, supaya `API_BASE_URL` tidak berubah).

> Isi 2–3 baris data contoh di tiap sheet (kecuali `id`, biarkan kosong — otomatis di-generate) supaya tabel di halaman tidak kosong saat testing.

## Testing Checklist — Tahap 5 (Master Data)

- [ ] Halaman **Kategori/Satuan/Merk**: tambah 1 data di tiap tab, coba tambah nama yang sama persis → muncul error "sudah ada" (Duplicate Validation)
- [ ] Halaman **Supplier**: tambah data dengan email tidak valid (mis. `abc`) → muncul error format email; perbaiki → berhasil simpan
- [ ] Halaman **Customer**: tambah data baru → `member_point` otomatis 0; edit data → field Member Point muncul dan bisa diubah manual
- [ ] Halaman **User** (login sebagai `admin`/`owner`): tambah user baru dengan role `kasir`, lalu logout dan login dengan akun baru tersebut → berhasil masuk sesuai role
- [ ] Login sebagai role selain admin/owner lalu buka `pages/users.html` langsung lewat URL → redirect ke dashboard (Role Permission bekerja)
- [ ] Halaman **Obat**: dropdown Kategori/Satuan/Merk/Supplier di form terisi otomatis dari data yang sudah dibuat di atas
- [ ] Tambah Obat dengan Kode Obat yang sama dengan data lain → muncul error duplikat; ganti kode → berhasil
- [ ] Isi Harga Beli & Harga Jual di form Obat → field Margin terhitung otomatis (read-only) tanpa perlu submit dulu
- [ ] Isi Stok dengan angka negatif → muncul error validasi sebelum submit terkirim ke server
- [ ] Search box di halaman manapun (mis. ketik nama obat) → hasil tabel ter-filter setelah jeda ±400ms (debounce), bukan di setiap ketukan huruf
- [ ] Hapus salah satu data (mis. supplier) → muncul Confirm Dialog dulu, data baru terhapus setelah klik "Ya, Lanjutkan"
- [ ] Pagination di tabel manapun dengan data >20 baris → tombol halaman berfungsi dan menampilkan rentang data yang benar
- [ ] Kembali ke Dashboard (Tahap 4) setelah mengisi data Obat/Sales/Purchase contoh → summary card & grafik yang sebelumnya 0 mulai menampilkan angka asli

## Rekomendasi Sebelum Lanjut ke Tahap 6

1. Pastikan minimal ada beberapa data Obat dengan Stok di bawah Minimum Stock dan beberapa dengan Expired Date dekat (≤30 hari) — dipakai untuk menguji ulang widget Dashboard Tahap 4 sekaligus modul Persediaan di Tahap 8.
2. `crud-page.js` dan `crud-table.html` sekarang jadi FONDASI seluruh Master Data — Tahap 6 (Pembelian) dan Tahap 7 (Penjualan) yang punya tabel serupa sebaiknya memakai ulang pola yang sama, bukan menulis ulang logic pagination/search dari nol.
3. Field "Foto" pada Obat saat ini hanya menyimpan URL gambar (bukan upload file) karena keterbatasan Spreadsheet sebagai database — beri tahu tim Apoteker/Gudang bahwa upload gambar perlu di-hosting di tempat lain dulu (mis. Google Drive dibagikan publik) sebelum linknya ditempel di sini.
4. Sebelum ke Tahap 6, uji ulang seluruh Testing Checklist Tahap 3 (Authentication) dan Tahap 4 (Dashboard) — pastikan penambahan Master Data tidak merusak alur login atau tampilan dashboard yang sudah berjalan.

---

## Setup Awal Pembelian (Tahap 6)

1. Buat 1 Google Spreadsheet baru untuk modul `purchase`, isi `SPREADSHEET_IDS_.purchase` di `Config.gs`.
2. Di dalam Spreadsheet tersebut, buat **3 sheet** dengan header persis berikut:

   **Sheet `Data`**
   ```
   id | po_number | date | supplier | status | invoice_url | notes | total
   ```
   **Sheet `Items`**
   ```
   id | purchase_id | medicine_id | medicine_name | qty | buy_price | subtotal
   ```
   **Sheet `Returns`**
   ```
   id | purchase_id | medicine_id | qty | reason | date
   ```
3. Tempel `purchase.gs` ke project Apps Script yang sudah ada (yang sama dipakai Tahap 3–5), lalu **Deploy → Manage deployments → Edit → Deploy**.
4. Pastikan sudah ada beberapa data Obat aktif (Tahap 5) — dropdown item PO diambil dari situ.

## Testing Checklist — Tahap 6 (Pembelian)

- [ ] Buat Purchase Order baru dengan 2+ item obat berbeda → status otomatis `Draft`, Total terhitung otomatis dari qty × harga beli tiap item
- [ ] Tombol "+ Tambah Item" menambah baris kosong; tombol `×` menghapus baris (minimal 1 baris tersisa)
- [ ] Memilih obat di dropdown item → Harga Beli terisi otomatis dari data Obat (bisa diedit manual jika perlu)
- [ ] Submit PO tanpa mengisi Supplier → muncul error validasi sebelum terkirim ke server
- [ ] Edit PO berstatus Draft → berhasil ubah item/qty, Total ikut berubah
- [ ] Klik "Lihat" pada PO yang statusnya BUKAN Draft → form tampil tapi semua field ter-disable (read-only lewat `<fieldset disabled>`)
- [ ] Klik "Approve" pada PO Draft → status berubah ke `Approved`, tombol "Approve" hilang berganti tombol "Terima"
- [ ] Klik "Terima" pada PO Approved → status berubah ke `Received`, lalu cek halaman **Obat** — stok obat yang ada di item PO bertambah sesuai qty
- [ ] Klik "Batal" pada PO Draft/Approved → status berubah ke `Cancelled`, tombol aksi lain hilang
- [ ] PO yang sudah `Received` TIDAK bisa dibatalkan (tombol Batal otomatis hilang)
- [ ] Klik "Retur" pada PO Received → pilih obat & qty retur → submit → cek halaman Obat, stok obat berkurang sesuai qty retur
- [ ] Search PO berdasarkan nomor PO atau nama supplier → hasil ter-filter dengan benar
- [ ] Refresh halaman Dashboard (Tahap 4) → "Pembelian Hari Ini" & grafik "Pembelian Bulanan" mulai menampilkan data asli jika PO dibuat hari ini

## Rekomendasi Sebelum Lanjut ke Tahap 7

1. `adjustMedicineStock_()` di `purchase.gs` saat ini LANGSUNG mengubah kolom `stock` di sheet `medicine` tanpa mencatat histori — saat Tahap 8 (Persediaan) membangun ledger Stock Movement, fungsi ini sebaiknya diperluas untuk juga menulis baris histori, tanpa mengubah cara modul lain memanggilnya.
2. Uji alur Retur Pembelian dengan qty lebih besar dari stok yang tersedia — saat ini `adjustMedicineStock_` membatasi hasil akhir minimal 0 (`Math.max(0, ...)`) supaya stok tidak pernah negatif, tapi tidak menolak requestnya; pertimbangkan apakah ini perlu jadi validasi keras (menolak retur) di tahap lanjutan.
3. Pola pagination manual di `purchase.js` sengaja identik dengan `crud-page.js` (Tahap 5) — kalau modul Penjualan (Tahap 7) juga butuh workflow status serupa (mis. status transaksi), pertimbangkan menarik logic status-transition ini jadi helper bersama di `js/` alih-alih disalin lagi.
4. Nomor PO (`generatePoNumber_`) memakai tanggal + angka acak — cukup untuk skala kecil, tapi tidak dijamin 100% unik pada volume transaksi tinggi. Pertimbangkan penomoran sekuensial per hari jika ini jadi masalah nyata di produksi.

---

## Setup Awal Penjualan (Tahap 7)

1. Buat 1 Google Spreadsheet baru untuk modul `sales`, isi `SPREADSHEET_IDS_.sales` di `Config.gs`.
2. Buat **3 sheet** dengan header persis berikut:

   **Sheet `Data`**
   ```
   id | invoice_number | date | customer_id | customer_name | subtotal | discount | voucher | tax | total | payment_method | paid_amount | change_amount | cashier | status
   ```
   **Sheet `Items`**
   ```
   id | sale_id | medicine_id | medicine_name | qty | price | subtotal
   ```
   **Sheet `Returns`**
   ```
   id | sale_id | medicine_id | qty | reason | date
   ```
3. Tempel `sales.gs` ke project Apps Script yang sama, lalu **Deploy → Manage deployments → Edit → Deploy**.
4. Pastikan ada beberapa Obat aktif dengan stok > 0 (Tahap 5) — POS mengambil daftar & harga jual dari situ.

## Testing Checklist — Tahap 7 (Penjualan / POS)

- [ ] Ketik nama/kode obat di kolom pencarian POS → daftar obat ter-filter langsung (Quick Search)
- [ ] Ketik nilai persis kolom Barcode salah satu obat lalu tekan Enter → obat otomatis masuk keranjang dan kolom pencarian kembali kosong (simulasi Barcode Scanner)
- [ ] Klik kartu obat di daftar → masuk ke keranjang; klik lagi obat yang sama → qty bertambah, bukan baris baru
- [ ] Tombol `+`/`−` di keranjang berfungsi; qty ke 0 otomatis menghapus baris dari keranjang
- [ ] Coba tambah qty melebihi stok tersedia → muncul toast error, qty tidak bertambah
- [ ] Isi Diskon dan Pajak (%) → Subtotal, Diskon+Voucher, Pajak, dan Total di ringkasan ter-update otomatis tanpa perlu submit
- [ ] Pilih member di dropdown → checkout → cek halaman Customer, Member Point bertambah (1 poin per Rp10.000 dari Total)
- [ ] Checkout dengan Jumlah Bayar KURANG dari Total → muncul error, transaksi tidak tersimpan
- [ ] Checkout berhasil → stok obat yang dibeli otomatis berkurang (cek halaman Obat)
- [ ] Setelah checkout berhasil, modal Struk muncul otomatis; klik "Cetak Struk" → dialog print browser muncul, HANYA berisi struk (bukan seluruh halaman)
- [ ] Buka halaman **Riwayat & Retur** → transaksi yang baru dibuat muncul di daftar; klik "Detail" menampilkan rincian item & total
- [ ] Klik "Retur" pada salah satu transaksi → pilih obat & qty → submit → cek halaman Obat, stok bertambah kembali sesuai qty retur
- [ ] Search di halaman Riwayat berdasarkan no. invoice atau nama customer → hasil ter-filter dengan benar
- [ ] Refresh halaman Dashboard (Tahap 4) → "Penjualan Hari Ini", "Pendapatan Hari Ini", grafik Penjualan Bulanan, Produk Terlaris, dan Kategori Terlaris mulai menampilkan data asli

## Rekomendasi Sebelum Lanjut ke Tahap 8

1. Diskon, Voucher, dan Pajak saat ini adalah input manual oleh kasir per transaksi — belum ada validasi kode voucher ke database maupun tarif pajak default dari modul Setting (baru dibangun di Tahap 10). Beri tahu tim kasir bahwa ketiga field ini masih "manual entry" untuk saat ini.
2. `addMemberPoint_()` di `sales.gs` memakai aturan sederhana (1 poin / Rp10.000) yang di-hardcode — pertimbangkan memindahkan aturan ini ke modul Setting begitu dibangun, supaya bisa diubah tanpa edit kode.
3. Uji ulang seluruh Testing Checklist Tahap 5 (Master Data → stok Obat) dan Tahap 6 (Pembelian) setelah beberapa transaksi POS dan retur — pastikan angka stok akhir masuk akal (Pembelian menambah, Penjualan mengurangi, kedua jenis Retur saling berlawanan arah).
4. Halaman POS sengaja TIDAK memakai pola `crud-page.js` (Tahap 5) karena kebutuhannya sangat berbeda (cart, kalkulasi real-time, cetak struk) — namun `sales.js` (Riwayat) sengaja meniru pola pagination manual yang sama dengan `purchase.js` (Tahap 6) untuk konsistensi.

---

## Setup Awal Persediaan (Tahap 8)

1. Buat 1 Google Spreadsheet baru untuk modul `stock`, isi `SPREADSHEET_IDS_.stock` di `Config.gs`.
2. Buat 1 sheet bernama **`Movements`** dengan header persis:
   ```
   id | date | medicine_id | medicine_name | type | qty | reference | notes | created_by
   ```
3. Tempel `stock.gs` ke project Apps Script yang sama. **PENTING**: `purchase.gs` dan `sales.gs` di project Apps Script Anda juga harus DIPERBARUI ke versi Tahap 8 ini (fungsi `adjustMedicineStock_` berubah signature-nya) — timpa ulang kedua file tersebut, jangan hanya menambah `stock.gs`.
4. **Deploy → Manage deployments → Edit → Deploy** seperti biasa.

> Begitu Spreadsheet `stock` aktif, SEMUA transaksi baru dari Pembelian (penerimaan barang, retur) dan Penjualan (checkout, retur) otomatis tercatat di `Movements` tanpa langkah tambahan apapun.

## Testing Checklist — Tahap 8 (Persediaan)

- [ ] Tab **Stock Masuk**: catat stok masuk untuk 1 obat → cek halaman Obat, stok bertambah sesuai qty
- [ ] Tab **Stock Keluar**: coba keluarkan qty lebih besar dari stok tersedia → muncul error, stok tidak berubah
- [ ] Tab **Stock Opname**: masukkan stok fisik berbeda dari stok sistem → hasil selisih (+/-) tertampil, stok obat di Master Data berubah sesuai stok fisik
- [ ] Tab **Transfer Stock**: pindahkan lokasi rak sebuah obat → cek halaman Obat, field Lokasi Rak berubah; stok TIDAK berubah (hanya lokasi)
- [ ] Tab **Expired Monitoring**: daftar "Mendekati Expired" dan "Sudah Expired" konsisten dengan data Obat yang diisi di Tahap 5
- [ ] Tab **Riwayat Pergerakan**: keempat aksi di atas (Masuk/Keluar/Opname/Transfer) muncul sebagai baris baru dengan tipe & catatan yang sesuai
- [ ] Lakukan 1 transaksi Pembelian (Tahap 6, sampai status Received) dan 1 transaksi Penjualan (Tahap 7) BARU setelah Spreadsheet `stock` aktif → keduanya otomatis muncul di Riwayat Pergerakan dengan tipe `purchase`/`sale` tanpa langkah manual
- [ ] Search di Riwayat Pergerakan berdasarkan nama obat atau nomor referensi (PO/Invoice) → hasil ter-filter dengan benar
- [ ] Pagination Riwayat Pergerakan berfungsi saat data sudah lebih dari 20 baris

## Rekomendasi Sebelum Lanjut ke Tahap 9

1. Transfer Stock pada tahap ini adalah PEMINDAHAN LOKASI RAK dalam satu apotek, BUKAN transfer antar cabang — fitur Multi Cabang ada di daftar Rekomendasi Pengembangan brief sebagai roadmap lanjutan, di luar cakupan Tahap 1-10.
2. Batch Management masih memakai satu field `batch` per Obat (Tahap 5) — untuk skenario satu obat dengan banyak batch aktif sekaligus (masing-masing tanggal expired berbeda), skema `medicine` perlu dipecah jadi tabel batch terpisah di pengembangan lanjutan.
3. `logStockMovement_()` sengaja tidak pernah melempar error ke pemanggilnya (dibungkus try/catch) — kalau Anda butuh memastikan SETIAP transaksi WAJIB tercatat di ledger (audit compliance ketat), pertimbangkan mengubah perilaku ini jadi "gagal keras" alih-alih diam-diam dilewati.
4. Uji ulang Dashboard (Tahap 4) — widget "Stok di Bawah Minimum" & "Obat Mendekati Expired" seharusnya tetap konsisten dengan tab Expired Monitoring di halaman Persediaan ini (keduanya membaca sumber data yang sama).

---

## Catatan Teknologi Tambahan — Tahap 9

- **Export Excel** memakai **SheetJS** (`xlsx` lewat CDN) — generate file `.xlsx` murni di browser dari data yang sudah diambil, tanpa request tambahan ke server.
- **Export PDF / Print** memakai `window.print()` bawaan browser + CSS `@media print` (bukan library PDF terpisah) — konsisten dengan pendekatan Cetak Struk di Tahap 7. Pengguna bisa memilih "Save as PDF" di dialog print browser untuk mendapatkan file PDF.
- Tidak perlu setup Spreadsheet baru untuk modul ini — `report.gs` murni membaca data dari modul `medicine`, `sales`, `purchase` yang sudah ada sejak Tahap 5-6.

## Testing Checklist — Tahap 9 (Laporan)

- [ ] Ubah rentang tanggal lalu klik "Terapkan" → semua tab me-refresh datanya (cache lama dibuang)
- [ ] Tab **Penjualan**: jumlah transaksi & total pendapatan sesuai transaksi POS yang dibuat di rentang tanggal tersebut
- [ ] Tab **Pembelian**: jumlah PO & total nilai sesuai Purchase Order pada rentang tanggal tersebut
- [ ] Tab **Persediaan**: menampilkan SEMUA obat dengan Nilai Stok (`stok × harga beli`) terhitung benar, tidak terpengaruh rentang tanggal
- [ ] Tab **Laba**: Total Pendapatan − Estimasi HPP = Laba Kotor (cek manual dengan kalkulator untuk 1-2 transaksi)
- [ ] Tab **Obat Expired**: daftar sinkron dengan tab Expired Monitoring di halaman Persediaan (Tahap 8)
- [ ] Tab **Fast Moving**: obat dengan qty terjual tertinggi pada rentang tanggal muncul di urutan atas
- [ ] Tab **Slow Moving**: obat yang SAMA SEKALI belum terjual pada rentang tanggal ikut muncul dengan Qty 0 di urutan atas
- [ ] Tab **Supplier**: total nilai pembelian per supplier sesuai jumlah PO yang di-approve/diterima pada rentang tersebut
- [ ] Klik "Export Excel" pada tab manapun yang datanya tidak kosong → file `.xlsx` terunduh dan bisa dibuka di Excel/Google Sheets dengan kolom sesuai data
- [ ] Klik "Export Excel" saat data kosong → muncul toast "Tidak ada data untuk diekspor", tidak mencoba mengunduh file kosong
- [ ] Klik "Cetak / Export PDF" → dialog print browser muncul, HANYA menampilkan tabel tab yang sedang aktif (bukan sidebar/navbar/tab lain)

## Rekomendasi Sebelum Lanjut ke Tahap 10

1. Laporan Laba memakai harga beli OBAT SAAT INI sebagai estimasi HPP, bukan harga beli historis saat transaksi terjadi — beri tahu tim Owner/Apoteker bahwa angka laba untuk periode lampau bisa sedikit bergeser jika harga beli obat sudah berubah drastis sejak saat itu. Perbaikan sesungguhnya butuh menyimpan snapshot harga beli di setiap `sales.Items` saat checkout — bisa jadi peningkatan Tahap 7 di pengembangan lanjutan.
2. Semua laporan berbasis rentang tanggal membaca ulang seluruh baris sheet `sales`/`purchase` setiap kali dipanggil (tanpa index) — cukup untuk skala apotek kecil-menengah; pertimbangkan `CacheService` atau paginasi data mentah jika volume transaksi sudah sangat besar.
3. Export Excel saat ini satu sheet polos tanpa styling (header tebal, lebar kolom, dst) — bisa ditingkatkan dengan format SheetJS lanjutan jika dibutuhkan tampilan laporan yang lebih formal untuk dicetak/dibagi ke pihak luar.
4. Sebelum ke Tahap 10, uji ulang seluruh alur inti (Login → Dashboard → Master Data → Pembelian → Penjualan → Persediaan) sekali lagi secara berurutan — Tahap 10 (Setting) akan menambahkan konfigurasi Profil Apotek, Pajak default, dan Printer yang sebaiknya diuji di atas fondasi yang sudah benar-benar stabil.

---

## Setup Awal Setting (Tahap 10)

1. Buat 1 Google Spreadsheet baru untuk modul `setting`, isi `SPREADSHEET_IDS_.setting` di `Config.gs`.
2. Buat 1 sheet bernama **`Data`** dengan header persis (JANGAN isi baris data — dibuat otomatis oleh aplikasi):
   ```
   id | store_name | logo_url | address | phone | tax_percent | printer_name
   ```
3. Tempel `setting.gs` ke project Apps Script yang sama, lalu **Deploy → Manage deployments → Edit → Deploy**.
4. Buka halaman Setting (login sebagai admin/owner) — baris data default otomatis terbuat saat pertama kali dibuka.

## Testing Checklist — Tahap 10 (Setting)

- [ ] Buka halaman Setting dengan role selain admin/owner → redirect ke dashboard (Role Permission)
- [ ] Tab **Profil Apotek**: isi Nama Apotek, Alamat, Pajak Default, lalu Simpan → refresh halaman, data tetap tersimpan
- [ ] Buka halaman **POS** (Tahap 7) setelah mengisi Pajak Default → field Pajak (%) otomatis terisi sesuai Setting (masih bisa diubah manual per transaksi)
- [ ] Tab **Backup Data**: klik "Unduh Backup Sekarang" → file `.json` terunduh; buka filenya, pastikan berisi data dari semua modul yang sudah dikonfigurasi (medicine, sales, purchase, dst)
- [ ] Tab **Restore Data**: unggah file backup yang baru saja diunduh → klik "Mulai Restore" → muncul Confirm Dialog peringatan sebelum benar-benar berjalan
- [ ] Setelah restore selesai, ringkasan hasil per modul ("berhasil dipulihkan" / "dilewati" / "gagal: ...") tampil dengan jelas
- [ ] Coba unggah file bukan hasil Backup Data (mis. file JSON acak) → muncul error yang jelas, bukan crash halaman

---

## Ringkasan Akhir — Seluruh 10 Tahap Selesai

Modern Pharmacy Management System telah selesai dibangun bertahap dari Project Initialization hingga Setting, dengan fondasi:
- **10 Spreadsheet Google** (medicine, supplier, customer, user, category, unit, brand, purchase, sales, stock, setting — beberapa berisi lebih dari 1 sheet) sebagai database sementara.
- **1 Web App Apps Script** yang melayani seluruh modul lewat satu router (`Code.gs`) dan registry modul yang bisa terus bertambah.
- **Frontend statis tanpa build step** (HTML/CSS/Tailwind/AlpineJS + Chart.js, SheetJS untuk kebutuhan spesifik) yang siap di-hosting di GitHub Pages maupun Hostinger tanpa perubahan.

**Migrasi ke MySQL/PostgreSQL di masa depan** hanya perlu menyentuh 2 lapisan:
1. `js/api.js` di frontend (ganti target request dari Apps Script Web App ke REST API baru) — seluruh halaman lain TIDAK perlu diubah karena semuanya memanggil lewat `Api.get()`/`Api.post()`.
2. Isi ulang fungsi-fungsi di `api/*.gs` menjadi endpoint REST API sungguhan dengan skema tabel yang sama persis dengan header sheet yang sudah dipakai di seluruh tahap ini.

**Yang sebaiknya dikerjakan sebelum benar-benar dipakai di apotek nyata** (di luar cakupan 10 tahap ini, sudah dicatat di masing-masing bagian README di atas):
- Ganti token sesi sederhana (Tahap 3) dengan JWT bertanda tangan sungguhan.
- Simpan snapshot harga beli di setiap transaksi Penjualan supaya Laporan Laba (Tahap 9) akurat secara historis.
- Pertimbangkan modul CRM & Membership, Resep Dokter, Multi Cabang, Approval Workflow sesuai Roadmap Pengembangan Lanjutan di brief awal, jika skala apotek bertambah besar.
