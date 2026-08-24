# Findings — optional_field_save (migrasi 17.0 → 18.0)

**Modul:** optional_field_save
**Migrasi:** 17.0 → 18.0
**Terakhir update:** 2026-08-24

---

## Ringkasan

| ID | Judul | Ditemukan di Step | Tag | Prioritas | Status |
|---|---|---|---|---|---|
| MF-01 | `ListRenderer.getOptionalActiveFields()` dihapus di 18.0 — override modul jadi dead code kalau tidak di-rewrite | Step 2 | `[GAP-MIGRASI]` | **Tinggi** | Terbuka — jadi input wajib `03_MIGRATION_SPEC.md` |
| MF-02 | `this.orm` kemungkinan `undefined` di `webclient.js` patch — belum pernah diverifikasi eksekusi nyata | Step 2 | `[PERLU-KEPUTUSAN]` | **Tinggi (kondisional)** | Terbuka — wajib verifikasi browser nyata di Step 9 sebelum disimpulkan |
| MF-03 | F-10 (write `res.partner` gagal silent untuk user tanpa grup Contact Creation) — dipastikan tetap identik di 18.0 | Step 1 (backfill), dikonfirmasi ulang Step 2 | `[DIWARISI-SOURCE]` | Tinggi | Dikonfirmasi tetap sama — tidak perlu tindakan migrasi, WAJIB dipertahankan |
| MF-04 | F-11 (`default={}` selalu jadi `False`) — dipastikan tetap identik di 18.0 | Step 1 (backfill), dikonfirmasi ulang Step 2 | `[DIWARISI-SOURCE]` | Sedang | Dikonfirmasi tetap sama — tidak perlu tindakan migrasi, WAJIB dipertahankan |

---

## Detail

### MF-01 — `ListRenderer.getOptionalActiveFields()` dihapus di 18.0 — override modul jadi dead code kalau tidak di-rewrite
**Ditemukan di:** Step 2 (2026-08-24)
**Tag:** `[GAP-MIGRASI]`
**Ref:** `DIFF-01` (`02_diff/02_DIFF_ANALYSIS.md`), terkait `BSL-005` (`01_intake/01b_BASELINE_SPEC.md`)
**Lokasi:** `optional_field_save/static/src/js/list_renderer.js:17-37` (override modul) vs `native-target` (`odoo18/addons/web/static/src/views/list/list_renderer.js:954` — `computeOptionalActiveFields()`)
**Deskripsi:** Core `ListRenderer` 18.0 menghapus total method `getOptionalActiveFields()` yang di-patch modul ini. Diganti `computeOptionalActiveFields()` dengan kontrak berbeda: pure function (return value, bukan mutasi `this.optionalActiveFields` + callback `onOptionalFieldsChanged`), dipanggil TIAP `onWillRender` (bukan sekali di `setup()`).
**Dampak:** Kalau di-port dengan nama method yang sama (tidak disesuaikan), patch modul tidak pernah terpanggil framework — fitur "baca preferensi dari sessionStorage saat render" (BSL-003) diam-diam tidak berfungsi di 18.0. Tidak ada error muncul (silent), gejalanya mirip F-10 — user tidak sadar fitur lintas-browser tidak jalan sampai benar-benar pindah browser dan preferensi tidak ikut.
**Rekomendasi:** `03_MIGRATION_SPEC.md` step 3 WAJIB merencanakan override baru yang men-target `computeOptionalActiveFields()`: baca sessionStorage dulu (fallback localStorage, logic sama seperti sekarang), RETURN dict aktif fields (bukan mutasi `this.optionalActiveFields` langsung), hapus baris pemanggilan `this.props.onOptionalFieldsChanged` (prop itu sendiri sudah dihapus dari core 18.0, lihat `DIFF-04`).
**Keputusan pemilik modul:** *(kosong — diisi manusia, atau dikonfirmasi di gate Step 4)*

### MF-02 — `this.orm` kemungkinan `undefined` di `webclient.js` patch
**Ditemukan di:** Step 2 (2026-08-24)
**Tag:** `[PERLU-KEPUTUSAN]`
**Ref:** `DIFF-06` (`02_diff/02_DIFF_ANALYSIS.md`)
**Lokasi:** `optional_field_save/static/src/js/webclient.js:14-34` (method `getOptionalActiveFields()` milik modul, memanggil `this.orm.call(...)`)
**Deskripsi:** Patch `WebClient.prototype.setup()` di modul ini TIDAK PERNAH menginisialisasi `this.orm` (tidak ada `useService("orm")` di file ini). Dicek langsung ke `native-source` (odoo17) dan `native-target` (odoo18) — `WebClient.setup()` bawaan Odoo JUGA tidak pernah men-set `this.orm` di kedua versi. Jadi `this.orm` kemungkinan besar selalu `undefined`, di 17.0 MAUPUN 18.0 — ini BUKAN version-diff, kemungkinan bug pre-existing yang belum pernah ketahuan.
**Dampak:** Kalau benar `undefined`, `this.orm.call(...)` melempar `TypeError` setiap kali webclient mount — method ini dipanggil fire-and-forget tanpa `await`/try-catch (lihat BSL-001/002), jadi errornya cuma muncul sebagai unhandled promise rejection di console browser, TIDAK menghentikan aplikasi. Efek fungsionalnya: load-preferensi-dari-DB-ke-sessionStorage saat webclient mount (BSL-002) gagal total secara silent — TAPI `list_renderer.js` sendiri masih fallback ke `localStorage` (jalur terpisah), jadi user tetap "kelihatan" preferensinya tersimpan di browser yang sama, cuma tidak pernah benar-benar ter-load dari DB. Ini BISA menjelaskan kenapa F-10 (write gagal silent) belum tentu satu-satunya sebab fitur lintas-browser tidak jalan untuk sebagian user — mekanisme LOAD-nya sendiri mungkin sudah gagal duluan, terlepas dari masalah write.
**Status verifikasi:** BELUM diverifikasi eksekusi nyata. Backfill (`source-codebase/doc-dev/backfill/test/04A_DEV_TESTING.md`) hanya menguji level Python/ORM (`tests/test_optional_field_save.py`), tidak ada test browser/Owl yang menjalankan `webclient.js` sungguhan.
**Rekomendasi:** WAJIB diverifikasi via eksekusi browser nyata di Step 9 (Dev Testing) — buka DevTools console saat webclient mount, cek apakah muncul `TypeError` terkait `this.orm`. Kalau terkonfirmasi bug nyata: (a) ini SUDAH ada di 17.0 produksi (bukan regresi migrasi) — per aturan source-of-truth, TETAP dipertahankan apa adanya (jangan "diperbaiki" diam-diam) kecuali user eksplisit minta diperbaiki sebagai perubahan disengaja; (b) `01b_BASELINE_SPEC.md` BSL-002 perlu direvisi untuk mencatat temuan ini sebagai `[GAP]` (spec lama/pemahaman awal vs kode aktual yang ternyata gagal).
**Keputusan pemilik modul:** *(kosong — diisi manusia setelah verifikasi Step 9)*

### MF-03 — F-10 dipastikan tetap identik di 18.0
**Ditemukan di:** Step 1 (backfill, sebelum project ini), dikonfirmasi ulang Step 2 (2026-08-24)
**Tag:** `[DIWARISI-SOURCE]`
**Ref:** `F-10` (`source-codebase/doc-dev/backfill/FINDINGS.md`), `BSL-010` (`01b_BASELINE_SPEC.md`), `DIFF-10` (`02_DIFF_ANALYSIS.md`)
**Lokasi:** `base/security/ir.model.access.csv` baris `access_res_partner_group_user` — dicek `odoo17` dan `odoo18`, byte-identik (`perm_write=0` untuk `base.group_user` di kedua versi).
**Deskripsi:** Bug asli (write `res.partner` gagal silent untuk user tanpa grup "Contact Creation") berasal dari ACL core Odoo, bukan dari modul — dan ACL itu tidak berubah 17.0→18.0. Dipastikan akan berperilaku identik pasca migrasi TANPA perubahan kode apapun.
**Dampak:** Tidak ada tindakan migrasi yang diperlukan — WAJIB dipertahankan (jangan tambah `sudo()`/ACL baru kecuali user eksplisit minta).
**Keputusan pemilik modul:** Dipertahankan apa adanya (default, sesuai `01a_MIGRATION_INTAKE.md` §5) — belum ada permintaan eksplisit untuk mengubah.

### MF-04 — F-11 dipastikan tetap identik di 18.0
**Ditemukan di:** Step 1 (backfill, sebelum project ini), dikonfirmasi ulang Step 2 (2026-08-24)
**Tag:** `[DIWARISI-SOURCE]`
**Ref:** `F-11` (`source-codebase/doc-dev/backfill/FINDINGS.md`), `BSL-009` (`01b_BASELINE_SPEC.md`), `DIFF-09` (`02_DIFF_ANALYSIS.md`)
**Lokasi:** `odoo/fields.py` class `Json.convert_to_record()` — dicek `odoo17` dan `odoo18`, byte-identik (`False if value is None else deepcopy(value)`).
**Deskripsi:** `default={}` tidak pernah menghasilkan `{}` persisten karena perilaku field Json core, bukan bug modul — dan perilaku ini tidak berubah 17.0→18.0.
**Dampak:** Tidak ada tindakan migrasi yang diperlukan.
**Keputusan pemilik modul:** Dipertahankan apa adanya (default) — belum ada permintaan eksplisit untuk mengubah.
