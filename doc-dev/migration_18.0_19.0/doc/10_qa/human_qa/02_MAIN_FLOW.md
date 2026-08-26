# Main Flow Test — optional_field_save

**Level:** Main Flow — flow bisnis inti modul ini.
**Estimasi waktu:** ~5 menit.
**Sumber:** S-02 di `../10_BUSINESS_FLOW_MIGRATION.md`.

```
1. Login sebagai user apapun di Browser A. Buka list view apapun yang punya
   kolom optional (mis. Contacts, menu "⚙" pojok kanan atas tabel).
2. Klik ikon "⚙" (kolom optional), aktifkan satu kolom yang tadinya tidak aktif
   (mis. "Street" -- lihat catatan versi di 00_README.md soal field "Mobile"
   yang sudah tidak ada lagi di 19.0).
3. Tunggu beberapa detik (memberi waktu penyimpanan ke server selesai).
4. Buka browser LAIN (atau mode Incognito/profil lain) di komputer yang sama,
   login dengan akun yang SAMA.
5. Buka list view yang SAMA (mis. Contacts).
```

## Expected

Kolom yang diaktifkan di langkah 2 (mis. "Street") HARUS SUDAH aktif/muncul di
Browser B tanpa perlu diaktifkan ulang -- preferensi ikut lintas browser.

## Hasil eksekusi

| Tanggal | Environment | Dijalankan oleh | Hasil | Catatan |
|---|---|---|---|---|
| 2026-08-26 | Docker `odoo:19.0` + module, AI-interaktif via RPC langsung (`/web/dataset/call_kw` -- browser pane sandbox tidak bisa dipakai interaktif sesi ini, lihat catatan environment di `10_BUSINESS_FLOW_MIGRATION.md`) | AI (curl JSON-RPC, method+argumen identik dengan `orm.call()` di JS modul) | Pass | `write` preferensi ke `res.partner` lalu `search_read` terpisah (mensimulasikan "browser lain") mengembalikan nilai yang sama persis |
