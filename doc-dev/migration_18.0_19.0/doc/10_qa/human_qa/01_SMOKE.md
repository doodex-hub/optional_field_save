# Smoke Test — optional_field_save

**Level:** Smoke — kalau ini gagal: STOP, jangan lanjut deploy/testing lain.
**Estimasi waktu:** ~1 menit.
**Sumber:** S-01 di `../10_BUSINESS_FLOW_MIGRATION.md`.

```
1. Buka instance Odoo 19.0 dengan modul optional_field_save terinstall.
2. Login dengan akun apapun.
3. Buka DevTools browser (F12) -> tab Console.
4. Amati: TIDAK boleh ada error "Cannot read properties of undefined (reading 'call')"
   atau error apapun yang menyebut "this.orm"/"user.partnerId".
5. Pastikan halaman backend (menu, navbar) benar-benar muncul, bukan halaman putih kosong.
```

## Hasil eksekusi

| Tanggal | Environment | Dijalankan oleh | Hasil | Catatan |
|---|---|---|---|---|
| 2026-08-26 | Docker `odoo:19.0` + module, tour test headless Chrome nyata (bukan browser pane sandbox — lihat catatan environment di `10_BUSINESS_FLOW_MIGRATION.md`) | AI (test suite Odoo, `odoo.tests.HttpCase.start_tour`) | Pass | Tour `[1/7]`-`[4/7]` (login sampai buka dropdown optional columns) sukses tanpa error console, log `docker-env/logs/odoo.log` G1 percobaan #3 |
