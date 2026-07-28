# Struktur Proyek — Tahap 10 (Final)

```
pharmacy-app/
├── ...(Tahap 1-9 tidak berubah)
├── js/
│   └── setting.js               # BARU — profil apotek, backup (download JSON), restore (upload + confirm)
├── pages/
│   └── setting.html               # BARU
└── api/
    └── setting.gs                   # BARU — get/update profil, backupData (semua sheet semua modul), restoreData
```

Spreadsheet modul `setting` berisi **1 sheet** `Data` dengan **1 baris data** (singleton, dibuat otomatis saat pertama kali dibuka).

Dengan ini, seluruh 10 tahap pengembangan (Project Initialization → Setting) telah selesai. Lihat ringkasan akhir di bagian bawah README.md.

Setiap tahap berikutnya HANYA menambah file baru sesuai daftar di atas,
tidak menumpuk logic baru ke file yang sudah ada di luar tanggung jawabnya.
Halaman baru di `/pages` WAJIB memakai ulang shell (sidebar+navbar+toast+modal)
dan class reusable dari `css/style.css` — dilarang menulis ulang style button/badge/dll.
