# Smoke Test — optional_field_save

**Level:** Smoke — kalau langkah ini gagal: STOP, jangan lanjut apapun, modul dianggap rusak total.
**Estimasi waktu:** ~2 menit.
**Sumber:** S-01 di `../10_BUSINESS_FLOW_MIGRATION.md`.

```
1. Login ke Odoo sebagai admin.
2. Buka menu apps (ikon grid di navbar kiri atas).
3. Klik app "Contacts".
4. Buka DevTools browser (F12) → tab Console.
```

**Hasil yang diharapkan:** Tidak ada error merah di Console yang menyebut
`optional_field_save`/`list_renderer`/`webclient`/`user_menu_items` — kalau ada, artinya asset
bundle `web.assets_backend` gagal load (modul ini rusak total, semua fitur di bawah pasti ikut gagal).

## Hasil eksekusi

*(isi tiap kali dipakai — jangan overwrite riwayat lama, tambah baris baru)*

| Tanggal | Environment | Dijalankan oleh | Hasil | Catatan |
|---|---|---|---|---|
| 2026-09-21 | `docker-env/` (native-target 20.0 built-from-source) | AI (otomatis, via tour test step 9) | ✅ Pass | Tidak ada error load bundle — tour test S-02 berhasil membuka webclient penuh, membuktikan bundle bersih |
