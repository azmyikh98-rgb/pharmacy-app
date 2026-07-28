# Panduan Setup Lengkap — GitHub & Google Spreadsheet

Panduan ini merangkum semua langkah setup dari Tahap 1-10 menjadi satu alur kerja
yang bisa diikuti dari awal sampai aplikasi benar-benar jalan.

---

## BAGIAN 1 — Setup GitHub

### 1.1 Buat repository baru
1. Buka https://github.com/new
2. Isi nama repo, mis. `pharmacy-app`
3. Pilih **Public** atau **Private** (bebas)
4. **JANGAN** centang "Add a README" (repo lokal kita sudah punya README sendiri)
5. Klik **Create repository** — biarkan halaman "quick setup" terbuka, kita akan pakai URL-nya

### 1.2 Push project dari komputer Anda
Ekstrak file `pharmacy-app-final.zip` yang sudah diberikan, lalu dari dalam folder `pharmacy-app/`:

```bash
cd pharmacy-app
git init
git add .
git commit -m "Initial commit: Tahap 1-10 lengkap"
git branch -M main
git remote add origin https://github.com/<username-anda>/pharmacy-app.git
git push -u origin main
```

Ganti `<username-anda>` dengan username GitHub Anda. Jika diminta login, gunakan
Personal Access Token (bukan password) — buat di
https://github.com/settings/tokens jika belum punya.

### 1.3 Aktifkan GitHub Pages (hosting sementara)
1. Di halaman repo GitHub → **Settings** → **Pages**
2. Source: **Deploy from a branch**
3. Branch: **main**, folder **/ (root)**
4. Simpan — tunggu 1-2 menit, URL akan muncul di halaman yang sama
   (biasanya `https://<username-anda>.github.io/pharmacy-app/`)

> Setelah GitHub Pages aktif, aplikasi bisa diakses dari URL tersebut. Tapi ingat:
> `js/config.js` (`API_BASE_URL`) masih harus diisi URL Apps Script (lihat Bagian 3)
> supaya aplikasi bisa membaca/menulis data.

---

## BAGIAN 2 — Buat Semua Google Spreadsheet

Anda perlu membuat **10 Google Spreadsheet terpisah** (satu per modul). Sarannya:
buat 1 Google Drive folder khusus (mis. "PharmaSys Data") supaya semuanya rapi di
satu tempat, lalu buat spreadsheet-spreadsheet ini di dalamnya.

Untuk SETIAP spreadsheet di bawah: buat sheet dengan nama tab PERSIS seperti
tertulis, isi baris pertama (header) PERSIS seperti tertulis (huruf kecil semua,
pakai underscore, tanpa spasi). Setelah dibuat, catat **ID Spreadsheet**-nya
(bagian di URL antara `/d/` dan `/edit`), akan dipakai di Bagian 3.

### 2.1 Modul `medicine` — Master Obat
Tab **`Data`**:
```
id | code | barcode | name | category | golongan | brand | unit | buy_price | sell_price | stock | min_stock | batch | expired_date | rack_location | supplier | status | photo_url | notes
```

### 2.2 Modul `supplier` — Master Supplier
Tab **`Data`**:
```
id | name | pic | address | phone | email | npwp | status
```

### 2.3 Modul `customer` — Master Customer
Tab **`Data`**:
```
id | name | type | address | phone | email | member_point | status
```

### 2.4 Modul `user` — Master User (WAJIB diisi 1 baris admin manual, lihat 2.4.1)
Tab **`Data`**:
```
id | username | password_hash | name | role | status
```

**2.4.1 — Isi user admin pertama secara manual:**
Baris kedua (baris data pertama), isi kolom `id`=1, `username`=`admin`,
`name`=`Administrator`, `role`=`admin`, `status`=`active`. Kolom `password_hash`
diisi BELAKANGAN setelah Apps Script siap (Bagian 3.4) — jangan diisi manual
sebagai teks biasa.

### 2.5 Modul `category` — Kategori Obat
Tab **`Data`**:
```
id | name | status
```

### 2.6 Modul `unit` — Satuan
Tab **`Data`**:
```
id | name | status
```

### 2.7 Modul `brand` — Merk
Tab **`Data`**:
```
id | name | status
```

### 2.8 Modul `purchase` — Pembelian (1 spreadsheet, 3 TAB)
Tab **`Data`**:
```
id | po_number | date | supplier | status | invoice_url | notes | total
```
Tab **`Items`**:
```
id | purchase_id | medicine_id | medicine_name | qty | buy_price | subtotal
```
Tab **`Returns`**:
```
id | purchase_id | medicine_id | qty | reason | date
```

### 2.9 Modul `sales` — Penjualan (1 spreadsheet, 3 TAB)
Tab **`Data`**:
```
id | invoice_number | date | customer_id | customer_name | subtotal | discount | voucher | tax | total | payment_method | paid_amount | change_amount | cashier | status
```
Tab **`Items`**:
```
id | sale_id | medicine_id | medicine_name | qty | price | subtotal
```
Tab **`Returns`**:
```
id | sale_id | medicine_id | qty | reason | date
```

### 2.10 Modul `stock` — Persediaan
Tab **`Movements`**:
```
id | date | medicine_id | medicine_name | type | qty | reference | notes | created_by
```

### 2.11 Modul `setting` — Setting
Tab **`Data`**:
```
id | store_name | logo_url | address | phone | tax_percent | printer_name
```
**Jangan isi baris data** — dibuat otomatis oleh aplikasi saat pertama kali dibuka.

> Catat SEMUA 10 ID Spreadsheet di atas (mis. di catatan sementara) — akan
> ditempel ke `Config.gs` di langkah berikutnya.

---

## BAGIAN 3 — Setup Apps Script (Backend)

### 3.1 Buat 1 project Apps Script standalone
1. Buka https://script.google.com
2. Klik **New project**
3. Beri nama project, mis. "PharmaSys Backend"

### 3.2 Tempel semua file `.gs`
Dari folder `api/` hasil zip, ada **15 file**. Untuk SETIAP file:
1. Di Apps Script Editor, klik ikon **+** di sebelah "Files" → **Script**
2. Beri nama PERSIS sama dengan nama file aslinya (tanpa `.gs`, Apps Script
   menambahkannya otomatis), mis. file `Code.gs` → nama file baru `Code`
3. Hapus isi default, tempel isi file `.gs` yang sesuai

Urutan tidak masalah (semua fungsi saling terhubung otomatis), tapi supaya
tidak ada yang terlewat, ini daftar lengkapnya:
```
Code.gs
Config.gs
CrudHelper.gs
login.gs
dashboard.gs
medicine.gs
supplier.gs
customer.gs
users.gs
lookup.gs
purchase.gs
sales.gs
stock.gs
report.gs
setting.gs
```

### 3.3 Isi ID Spreadsheet di `Config.gs`
Buka file `Config.gs` di editor, isi `SPREADSHEET_IDS_` dengan ID-ID yang sudah
dicatat di Bagian 2:
```javascript
const SPREADSHEET_IDS_ = {
  medicine: "ID_SPREADSHEET_MEDICINE",
  supplier: "ID_SPREADSHEET_SUPPLIER",
  customer: "ID_SPREADSHEET_CUSTOMER",
  user: "ID_SPREADSHEET_USER",
  sales: "ID_SPREADSHEET_SALES",
  purchase: "ID_SPREADSHEET_PURCHASE",
  stock: "ID_SPREADSHEET_STOCK",
  stock_opname: "",   // tidak dipakai — opname ada di dalam modul stock
  category: "ID_SPREADSHEET_CATEGORY",
  unit: "ID_SPREADSHEET_UNIT",
  brand: "ID_SPREADSHEET_BRAND",
  batch: "",          // tidak dipakai — batch ada di dalam field medicine
  adjustment: "",     // tidak dipakai — adjustment ada di dalam modul stock
  report: "",         // tidak perlu — report murni baca modul lain
  setting: "ID_SPREADSHEET_SETTING",
};
```
Simpan (Ctrl+S / Cmd+S).

### 3.4 Generate password admin pertama
1. Di dropdown fungsi (atas editor, sebelah tombol Run), pilih
   `generateInitialPasswordHash_`
2. Klik **Run** — pertama kali akan minta izin akses (Authorize), ikuti saja
3. Buka **Execution log** (Ctrl+Enter atau menu View → Logs)
4. Salin hasil hash yang muncul (deretan huruf-angka panjang)
5. Kembali ke Spreadsheet `user` → tempel hash tersebut ke kolom
   `password_hash` baris admin yang sudah diisi di Bagian 2.4.1

> Password defaultnya adalah `admin123` (bisa diganti di dalam fungsi
> `generateInitialPasswordHash_` di `login.gs` SEBELUM di-Run, jika mau password
> lain).

### 3.5 Deploy sebagai Web App
1. Klik **Deploy → New deployment**
2. Klik ikon gerigi di samping "Select type" → pilih **Web app**
3. Execute as: **Me**
4. Who has access: **Anyone**
5. Klik **Deploy**
6. Salin **Web app URL** yang muncul (formatnya
   `https://script.google.com/macros/s/XXXXXXXXXXXX/exec`)

> Untuk deploy ULANG di kemudian hari (setelah edit kode), JANGAN buat
> "New deployment" lagi — pakai **Manage deployments → Edit (ikon pensil) →
> Deploy**, supaya URL Web App tidak berubah.

---

## BAGIAN 4 — Hubungkan Frontend ke Backend

1. Buka file `js/config.js` di project GitHub Anda (lokal, lalu commit+push lagi)
2. Isi `API_BASE_URL` dengan URL dari Bagian 3.5:
   ```javascript
   API_BASE_URL: "https://script.google.com/macros/s/XXXXXXXXXXXX/exec",
   ```
3. Commit & push perubahan ini:
   ```bash
   git add js/config.js
   git commit -m "Set API_BASE_URL"
   git push
   ```
4. Tunggu 1-2 menit (GitHub Pages otomatis update), lalu buka
   `https://<username-anda>.github.io/pharmacy-app/`

---

## BAGIAN 5 — Verifikasi Akhir

1. Buka URL GitHub Pages Anda → harus otomatis redirect ke halaman Login
2. Login dengan `admin` / `admin123` (atau password yang Anda pilih di 3.4)
3. Harus berhasil masuk ke Dashboard
4. Coba tambah 1 data di Master Data → Obat, lalu cek langsung ke Google
   Spreadsheet `medicine` — baris baru harus muncul di sana
5. Jika semua langkah di atas berhasil, seluruh sistem sudah tersambung penuh
   dari Frontend (GitHub Pages) → Backend (Apps Script) → Database (Google
   Spreadsheet)

---

## Troubleshooting Umum

| Gejala | Kemungkinan Penyebab |
|---|---|
| Halaman blank / redirect terus-menerus | `API_BASE_URL` belum diisi atau salah ketik di `js/config.js` |
| Error "Spreadsheet ID ... belum dikonfigurasi" | Lupa isi salah satu ID di `SPREADSHEET_IDS_` (`Config.gs`) |
| Login gagal terus padahal username/password benar | `password_hash` di sheet `user` belum ditempel dari hasil `generateInitialPasswordHash_` |
| Data tidak muncul setelah submit form | Nama tab sheet tidak PERSIS sama (mis. `data` huruf kecil vs `Data`) — Apps Script case-sensitive |
| CORS / fetch error di Console browser | Pastikan Web App di-deploy dengan "Who has access: Anyone", dan memakai `Manage deployments → Edit`, bukan re-deploy URL baru tanpa update `config.js` |
