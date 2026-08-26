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
`optional="show"`/`optional="hide"` di view) -- TIDAK boleh ada halaman error
atau kolom hilang semua.

## Hasil eksekusi

| Tanggal | Environment | Dijalankan oleh | Hasil | Catatan |
|---|---|---|---|---|
| 2026-08-26 | Docker `odoo:19.0` + module, bukti eksekusi nyata tour test (setiap run tour dimulai dari state sessionStorage/localStorage kosong) | AI (test suite Odoo, tour `[3/7]`-`[4/7]`) | Pass | List view Contacts render normal dengan kolom default sebelum toggle apapun dilakukan, di setiap percobaan G1 (#1 dan #3) |
