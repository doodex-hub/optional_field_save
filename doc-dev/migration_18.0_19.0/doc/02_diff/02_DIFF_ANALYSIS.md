# Diff & Compatibility Analysis — optional_field_save

**Step:** 2 — Diff & Compatibility Analysis
**Versi:** 18.0 → 19.0
**Tanggal:** 2026-08-26
**Ref:** `01_intake/01a_MIGRATION_INTAKE.md`, `migration-tool/knowledge/`

---

## 0. Knowledge Base Check

| Sumber | Sudah ada entry? | Lokasi |
|---|---|---|
| `version-diffs/18-to-19.md` | Ya | §1 (OCA wiki + verifikasi source 19.0), §1a (temuan project nyata `advanced_sales_analysis`) |
| `version-diffs/17-to-18.md` | Ya | Baris `ListRenderer.getOptionalActiveFields()`, `session.partner_id`/`session.uid` — riwayat breaking change modul ini sendiri di migrasi sebelumnya (MF-01/MF-05), dipakai sebagai starting point area yang wajib dicek ulang di 19.0 |
| `dependency-compat/sale_report/18-to-19.md` | Ya | Tidak relevan modul ini (tidak depend `sale`) |

## 0b. Gate Community vs Enterprise

- [x] Baca ulang `01_intake/01a_MIGRATION_INTAKE.md` §2 — **TIDAK ADA** baris bertipe "Native Enterprise" (cuma `base`+`web`, keduanya Community).
- [x] Lanjut §1 cukup `native-target` (Community, bagian dari `enterprise19.0` gabungan) — dikonfirmasi `base`/`web` tetap Community-only di 19.0 (folder `enterprise19.0/odoo/addons/base/` dan `.../web/` ada di level yang sama dengan modul Enterprise lain, tidak dipindah/berubah lisensi).
- [x] `native-source-enterprise` (`enterprise18`) tetap tersedia tapi tidak diperlukan aktif dicek — tidak ada dependency Enterprise di source maupun target.

## 0c. Gate Transitive Dependency

- [x] N/A — tidak ada `depends` yang dihapus dari manifest (`base`, `web` keduanya tetap ada, tidak berubah, tidak hilang di 19.0).

## 1. Perubahan Native (Core/Enterprise)

Simbol yang dipakai/di-inherit modul ini, dicek langsung terhadap `native-target` (`enterprise19.0`) vs `native-source` (`odoo18`) — bukan cuma dari daftar knowledge base umum.

| ID | File/simbol modul | Simbol native terkait | Status di target | Dampak | Sumber |
|---|---|---|---|---|---|
| DIFF-01 | `list_renderer.js` — `computeOptionalActiveFields()` (override, delegasi `super()`) | `web/static/src/views/list/list_renderer.js:1169` (`computeOptionalActiveFields`), dipanggil dari `onWillRender` via `Object.assign(this.optionalActiveFields, this.computeOptionalActiveFields())` (baris ~188) | **Tidak berubah** — nama method, signature (no-arg, return dict), titik panggil (`onWillRender`, pure function) byte-identik dengan 18.0 | Tidak ada — override modul tetap valid apa adanya | Analisis baru, verifikasi langsung `enterprise19.0` |
| DIFF-02 | `list_renderer.js` — `saveOptionalActiveFields()` (override total, tanpa `super()`) | `web/static/src/views/list/list_renderer.js:1970` (`saveOptionalActiveFields()`, no-arg, baca `this.optionalActiveFields` langsung) | **Tidak berubah** — signature no-arg sama; call site core (`onClickOptionalColumn`/`onClickOptionalColumnDropdownItem`, baris ~2086/2108) memanggil dengan argumen tapi method sendiri mengabaikannya (JS mengizinkan) — perilaku observable identik | Tidak ada | Analisis baru, verifikasi langsung `enterprise19.0` |
| DIFF-03 | `webclient.js` + `list_renderer.js` — `user.partnerId` (service `@web/core/user`, warisan fix MF-05) | `web/static/src/core/user.js:36-166` (`_makeUser`) — `partnerId` masih di-`return`, `session.partner_id` masih di-`delete` (baris 107) | **Tidak berubah** — kontrak service byte-identik dengan 18.0 | Tidak ada — fix MF-05 tetap valid tanpa modifikasi | Analisis baru, verifikasi langsung `enterprise19.0` |
| DIFF-04 | `webclient.js` — `this.orm = useService("orm")` (warisan fix MF-02) | `web/static/src/webclient/webclient.js` — `WebClient.setup()` core TETAP tidak set `this.orm` sendiri (pola generik `useService()` wajib eksplisit di consumer, tidak berubah) | **Tidak berubah** | Tidak ada — fix MF-02 tetap valid tanpa modifikasi | Analisis baru, verifikasi langsung `enterprise19.0` |
| DIFF-05 | `user_menu_items.js` — `registry.category("user_menuitems").remove("log_out")` + `.add("log_out", ...)` | `web/static/src/webclient/user_menu/user_menu_items.js:145` — key registry tetap `"log_out"` | **Tidak berubah** | Tidak ada | Analisis baru, verifikasi langsung `enterprise19.0` |
| DIFF-06 | `models/res_partner.py` — `fields.Json(default={})` | `odoo/orm/fields_misc.py:67-69` (`Json.convert_to_record`) — **catatan struktural:** `fields.py` monolitik 18.0 dipecah jadi beberapa file di `odoo/orm/` (`fields_misc.py`, dll) sebagai bagian refactor ORM 19.0 (lihat `knowledge/version-diffs/18-to-19.md` §1 — `models.Constraint`/`Index`, `odoo.fields.Domain`). Class `Json` publik (`odoo.fields.Json`) tetap importable sama seperti sebelumnya — hanya lokasi source internal yang pindah. Logic `False if value is None else deepcopy(value)` **byte-identik** 18.0↔19.0 | Tidak ada — F-11/BSL-009 (`default={}` selalu jadi `False`) tetap identik | Analisis baru, verifikasi langsung `enterprise19.0` |
| DIFF-07 | ACL `base.group_user` pada `res.partner` (dipakai `setDatabase()`/`orm.call write`, F-10/BSL-010) | `odoo/addons/base/security/ir.model.access.csv` baris `access_res_partner_group_user` — `perm_read=1, perm_write=0` | **Tidak berubah** — byte-identik 18.0↔19.0 | Tidak ada — F-10 (write gagal silent untuk user tanpa "Contact Creation") tetap identik | Analisis baru, verifikasi langsung `enterprise19.0` |
| DIFF-08 | `assets.web.assets_backend` / `assets.web.assets_tests` (manifest) | Kunci asset bundle `web.assets_backend`/`web.assets_tests` masih dipakai modul core (`mail/__manifest__.py`, `web/__manifest__.py`) di 19.0 | **Tidak berubah** | Tidak ada | Analisis baru, verifikasi langsung `enterprise19.0` |
| **DIFF-09** | **`tests/test_optional_field_save.py`** — `res.users.create({"groups_id": [(6, 0, [...])], ...})` (2 lokasi: baris 71, 93) | **`res.users.groups_id` (Many2many, 18.0) di-RENAME TOTAL jadi `group_ids` di 19.0** (`odoo/addons/base/models/res_users.py:257`, dikonfirmasi 18.0 `odoo18/odoo/addons/base/models/res_users.py:382` masih `groups_id`) | **BREAKING — Rename field.** `groups_id` tidak ada lagi sebagai field name di `res.users` 19.0 | **Test akan GAGAL** (bukan silent) — `create()`/`write()` dengan key field yang tidak dikenal ORM melempar `ValueError`, dua test (`test_plain_internal_user_cannot_write_own_partner_field`, `test_user_with_partner_manager_group_can_write`) akan error sebelum sempat menguji logic ACL yang dimaksud. Dicatat sebagai **MF-01** di `FINDINGS.md` — WAJIB diperbaiki di step 6 (rename `groups_id`→`group_ids` di 2 lokasi test), BUKAN perubahan business logic (murni kompatibilitas API test infrastructure, tidak menyentuh kode modul `optional_field_save/` itu sendiri) | Analisis baru, verifikasi langsung `enterprise19.0` vs `odoo18`, dikonfirmasi via `knowledge/version-diffs/18-to-19.md` §1 baris "Access rights (views/menus/actions)" |
| DIFF-10 | Tour test (`optional_field_save_tour.js`) — `registry.category("web_tour.tours").add(..., { test: true, ... })`, selector `.o_optional_columns_dropdown_toggle` | `web/static/src/views/list/list_renderer.xml:52` — class `o_optional_columns_dropdown_toggle` masih ada persis | **Tidak berubah** (selector dicek langsung). Kunci `test: true` pada registrasi tour BELUM diverifikasi langsung terhadap mekanisme tour-runner 19.0 (area `web_tour`) — ditandai untuk verifikasi lebih dalam saat eksekusi nyata di step 9 (bukan blocker step 2/3, karena scope tour test sendiri bukan bagian modul yang di-*port*, cuma test infrastructure) | Sebagian diverifikasi (selector), sebagian ditunda ke step 9 (eksekusi nyata) |
| DIFF-11 *(ditambahkan step 3/4, cross-check spec vs source module penuh)* | `tests/test_optional_field_save_tour.py` — `self.start_tour("/web", "optional_field_save_tour", login="admin")` | `odoo/tests/common.py:2555` — `HttpCase.start_tour(self, url_path, tour_name, step_delay=None, **kwargs)` | **Tidak berubah** — signature kompatibel, `login` diteruskan via `**kwargs` | Tidak ada | Analisis baru, verifikasi langsung `enterprise19.0` |

## 2. Kompatibilitas Dependency (OCA/Third-Party)

| Dependency | Versi target tersedia? | Sumber cek | Risiko |
|---|---|---|---|
| — | N/A — tidak ada dependency OCA/third-party (dikonfirmasi `01a_MIGRATION_INTAKE.md` §0/§2) | — | — |

## 3. Temuan Baru — Tulis ke Migration Records

- [x] Temuan general (version-diff) → dicatat sebagai kandidat di `migration-tool/migration-records/optional_field_save_18.0_19.0/SUMMARY.md` (kategori `version-diff`) — lihat DIFF-09 (`res.users.groups_id`→`group_ids`), general untuk modul apapun yang bikin `res.users` test fixture pakai `groups_id`.
- [x] Tidak ada temuan per-dependency (tidak ada dependency non-native).
- [x] Promosi ke `knowledge/` ditunda ke sesi curation terpisah — tidak dilakukan di step ini.

## 4. Ringkasan Risiko

| Item | Level risiko | Catatan |
|---|---|---|
| DIFF-01/DIFF-02 — `computeOptionalActiveFields`/`saveOptionalActiveFields` | **Rendah** (turun dari "Tertinggi" di intake) | Diverifikasi langsung stabil 18.0→19.0 — kontrak sama persis seperti hasil migrasi 17→18, tidak perlu perubahan kode |
| DIFF-03/DIFF-04 — `user.partnerId`/`useService("orm")` (warisan MF-05/MF-02) | **Rendah** | Diverifikasi stabil, fix lama tetap valid apa adanya |
| DIFF-06/DIFF-07 — `fields.Json` default, ACL `res.partner` | **Rendah** | Byte-identik, F-10/F-11 tetap dipertahankan sesuai scope boundary |
| **DIFF-09 — `res.users.groups_id`→`group_ids` di test fixture** | **Sedang** | Breaking pasti (bukan dugaan) tapi terbatas ke 2 baris di `tests/`, tidak menyentuh kode modul produksi. Fix mekanis sederhana, tidak ada ambiguitas cara perbaikan |
| DIFF-10 — tour test `test: true` | **Rendah-Sedang (belum tuntas verifikasi)** | Selector DOM sudah dikonfirmasi stabil; mekanisme registrasi tour-runner ditunda verifikasi eksekusi nyata ke step 9 |
| Kesimpulan umum | **Rendah** | Modul ini SUDAH melewati breaking change API `web` addon paling signifikan (`getOptionalActiveFields`→`computeOptionalActiveFields`, `session.*`→`user.*`) di migrasi 17→18 sebelumnya — API yang sekarang dipakai (post-fix) terbukti stabil ke 19.0. Satu-satunya breaking change baru (DIFF-09) murni di test infrastructure, bukan business logic. |
