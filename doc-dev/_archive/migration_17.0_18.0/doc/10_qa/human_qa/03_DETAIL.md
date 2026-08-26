# Detail Test — optional_field_save

**Level:** Detail — varian/edge-case.
**Estimasi waktu:** ~2 menit.
**Sumber:** S-03 di `../10_BUSINESS_FLOW_MIGRATION.md`.

```
1. Buka browser/profil yang BENAR-BENAR belum pernah membuka instance ini
   sebelumnya (localStorage & sessionStorage kosong total untuk domain ini).
2. Login, buka list view apapun yang punya kolom optional (mis. Contacts).
```

## Expected

List view HARUS tampil normal dengan kolom default (sesuai definisi
`optional="show"`/`optional="hide"` di view) — TIDAK boleh ada halaman error
atau kolom hilang semua.

## Hasil eksekusi

| Tanggal | Environment | Dijalankan oleh | Hasil | Catatan |
|---|---|---|---|---|
| 2026-08-26 | Docker `odoo:18.0` + module, AI-interaktif | AI (Claude Browser tool) | Pass | Terverifikasi berulang kali — setiap sesi test dimulai dari kondisi ini (state awal fresh) sebelum toggle apapun, list view selalu render normal |
