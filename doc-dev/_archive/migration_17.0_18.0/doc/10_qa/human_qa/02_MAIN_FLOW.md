# Main Flow Test — optional_field_save

**Level:** Main Flow — flow bisnis inti modul ini.
**Estimasi waktu:** ~5 menit.
**Sumber:** S-02 di `../10_BUSINESS_FLOW_MIGRATION.md`.

```
1. Login sebagai user apapun di Browser A. Buka list view apapun yang punya
   kolom optional (mis. Contacts, menu "⚙" pojok kanan atas tabel).
2. Klik ikon "⚙" (kolom optional), aktifkan satu kolom yang tadinya tidak aktif
   (mis. "Mobile").
3. Tunggu beberapa detik (memberi waktu penyimpanan ke server selesai).
4. Buka browser LAIN (atau mode Incognito/profil lain) di komputer yang sama,
   login dengan akun yang SAMA.
5. Buka list view yang SAMA (mis. Contacts).
```

## Expected

Kolom yang diaktifkan di langkah 2 (mis. "Mobile") HARUS SUDAH aktif/muncul di
Browser B tanpa perlu diaktifkan ulang — preferensi ikut lintas browser.

## Hasil eksekusi

| Tanggal | Environment | Dijalankan oleh | Hasil | Catatan |
|---|---|---|---|---|
| 2026-08-26 | Docker `odoo:18.0` + module, AI-interaktif (simulasi via RPC + clear storage, bukan 2 browser fisik) | AI (Claude Browser tool) | Pass | Preferensi ter-restore otomatis dari DB setelah localStorage+sessionStorage dikosongkan total (setara "browser baru") |
