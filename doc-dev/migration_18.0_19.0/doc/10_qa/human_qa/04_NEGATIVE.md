# Negative Test — optional_field_save

**Level:** Negative — hal yang HARUS ditolak/tidak boleh terjadi. Direkomendasikan dijalankan minimal sekali sebelum rilis besar apapun.
**Estimasi waktu:** ~5 menit.
**Sumber:** S-04, S-05 di `../10_BUSINESS_FLOW_MIGRATION.md`.

## Bagian 1 — User tanpa akses penuh (S-04)

```
1. Buat/pakai user Internal biasa yang TIDAK punya grup "Contact Creation"
   (Settings > Users > cek "Extra Rights").
2. Login sebagai user itu, buka list view Contacts, toggle kolom optional apapun.
```

**Expected:** Kolom TETAP kelihatan aktif di browser itu sendiri (localStorage
fallback tetap jalan) -- **TAPI** ini SENGAJA tidak benar-benar tersimpan ke
server (bug lama yang dipertahankan, F-10). TIDAK BOLEH ada notifikasi
error/toast muncul ke user -- kegagalan ini memang silent by design, jangan
"diperbaiki" tanpa persetujuan eksplisit pemilik modul.

## Bagian 2 — Cleanup saat logout (S-05)

```
1. Login, toggle beberapa kolom optional di beberapa list view berbeda
   (supaya ada beberapa key "optional_field.*" di sessionStorage -- cek DevTools
   > Application > Session Storage).
2. Klik "Log out".
3. Login lagi dengan user LAIN di tab/browser yang SAMA.
4. Cek DevTools > Application > Session Storage.
```

**Expected:** Key `optional_field.*` dari user sebelumnya SUDAH HILANG (dibersihkan
saat logout) -- user baru tidak melihat preferensi kolom user lama lewat
sessionStorage. Key lain (non-`optional_field`) tetap seperti biasa.

## Hasil eksekusi

| Tanggal | Environment | Dijalankan oleh | Hasil | Catatan |
|---|---|---|---|---|
| 2026-08-26 | Docker `odoo:19.0` + module, kombinasi (test Python otomatis + review kode statis) | AI (test suite + baca kode) | Pass | Bagian 1: `AccessError` terkonfirmasi test Python (`test_plain_internal_user_cannot_write_own_partner_field`), tidak ada notifikasi UI dikonfirmasi baca kode `setDatabase()`. Bagian 2: `user_menu_items.js` byte-identik dengan versi yang SUDAH dieksekusi nyata & PASS di migrasi 17->18 (`git diff` kosong) -- diterima tanpa re-eksekusi interaktif karena file tidak tersentuh migrasi ini sama sekali, bukan karena diasumsikan |
