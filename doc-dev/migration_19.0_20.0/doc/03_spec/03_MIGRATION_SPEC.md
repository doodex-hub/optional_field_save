# Migration Spec (Teknis) — optional_field_save

**Step:** 3 — Migration Spec
**Versi:** 19.0 → 20.0
**Ref:** `02_diff/02_DIFF_ANALYSIS.md`
**Tanggal:** 2026-09-21

> Dokumen ini memandu IMPLEMENTASI (step 6). Ini **bukan** dasar testing/acceptance criteria —
> itu datang dari `01b_BASELINE_SPEC.md`. Lihat step 5.

> **⚠️ ADDENDUM 2026-09-21 (step 10, setelah dokumen ini "selesai"):** DIFF-08 ditambahkan
> BELAKANGAN — ditemukan lewat verifikasi visual/live manual (bukan dari analisis step 2/3 di
> bawah ini), setelah gate step 10 sempat menandai skenario logout "Pass" berdasarkan Desk Review
> saja dan ditegur dev. `/web/session/logout` di 20.0 menolak GET — modul ini (`CustomLogOutItem`)
> masih navigasi GET, jadi logout RUSAK TOTAL (405) sampai fix ini ditulis. Lihat `FINDINGS.md`
> MF-05 dan `02_DIFF_ANALYSIS.md` DIFF-08 untuk detail lengkap. Isi dokumen ini DI BAWAH baris ini
> masih mencerminkan analisis SEBELUM temuan itu — dibiarkan apa adanya untuk jejak historis,
> koreksi/tambahan ditulis di baris ini dan di §2 tabel strategi (baris baru DIFF-08).

---

## 1. Ringkasan Strategi

Modul ini kecil (1 field, 3 file JS, tidak ada views/wizard/controller aktif) — **sebagian besar port
langsung tanpa perubahan kode**. Dari 7 titik yang dianalisis di step 2 (DIFF-01 s/d DIFF-07), hanya
**1 titik butuh perubahan kode wajib** (DIFF-02 — hapus dead import yang sekarang resolve `undefined`).
2 titik lain (DIFF-01, DIFF-03) adalah perubahan BEHAVIOR NATIVE yang tidak butuh kode modul diubah,
tapi wajib dicatat karena mengubah ekspektasi fungsional/testing. 4 titik sisanya (DIFF-04/05/06/07)
dikonfirmasi tidak berubah — tidak ada aksi. **(Lihat ADDENDUM di atas — belakangan ternyata ADA
titik kedelapan, DIFF-08, yang butuh perubahan kode wajib juga, TIDAK ketahuan di analisis awal ini.)**

**Tidak ada rewrite besar, tidak ada widget Owl baru, tidak ada perubahan `views/`/controller** (semua
N/A sejak intake). Effort keseluruhan step 6: **rendah** — satu penghapusan baris kode.

## 2. Strategi per File/Simbol (ringkasan umum)

| File/simbol | Ref `DIFF-NNN` (02_DIFF_ANALYSIS §1) | Strategi migrasi | Risiko | Ref `BSL-NNN` |
|---|---|---|---|---|
| `static/src/js/user_menu_items.js` — `import { logOutItem as OriginalLogOutItem } from "@web/webclient/user_menu/user_menu_items";` + `export { OriginalLogOutItem };` | DIFF-02 | **Hapus kedua baris ini** (import + export). Simbol `OriginalLogOutItem` dikonfirmasi dead code (tidak pernah dipanggil) — penghapusan murni kompatibilitas, tidak mengubah behavior fungsional apapun. Sisa file (registry `remove("log_out")` + `add("log_out", CustomLogOutItem)`, isi `CustomLogOutItem`) **tidak disentuh sama sekali**. | Rendah — fix sudah terverifikasi aman di step 2 (simbol memang tidak dipakai) | BSL-007, BSL-014 |
| **`static/src/js/user_menu_items.js` — `CustomLogOutItem` callback, `browser.location.href = route` (GET)** | **DIFF-08 (ditemukan step 10, BUKAN step 2/3 — lihat ADDENDUM)** | **Ganti navigasi GET jadi POST+redirect**, persis pola native `logOutItem()` 20.0: `const url = await post(route, {csrf_token: odoo.csrf_token}, "url"); redirect(url);`. Import baru: `post` (`@web/core/network/http_service`), `redirect` (`@web/core/utils/urls`). Import `browser` dihapus (jadi unused akibat fix ini). SessionStorage cleanup logic (BSL-007) TIDAK diubah. | **Tinggi sampai fix (logout 405, RUSAK TOTAL) → Rendah setelah fix** (dikonfirmasi 2x live + tour test baru) | BSL-007 |
| `static/src/js/list_renderer.js` — `computeOptionalActiveFields()` (override) | DIFF-01 | **Tidak diubah — port apa adanya.** Keputusan default step 2: tidak extend override untuk mendukung `list_optional_show` (itu = fitur baru, di luar scope port-kode). | Rendah (fitur native baru jadi inert, bukan regresi) | BSL-003, BSL-005 |
| `static/src/js/list_renderer.js`/`webclient.js` — `setDatabase()`/`orm.call(..., "write", ...)` | DIFF-03 | **Tidak diubah — port apa adanya.** ACL berubah di native (`base`), bukan tanggung jawab kode modul — **dikonfirmasi EMPIRIS (step 6+8): self-write sekarang berhasil, BSL-010 tidak lagi silent-fail untuk skenario nyata.** | Tinggi (behavior berubah — dikonfirmasi, bukan lagi ekspektasi) | BSL-006, BSL-010 |
| `static/src/js/list_renderer.js`/`webclient.js` — `patch()`, `require()` legacy syntax, `user.partnerId` | DIFF-04, DIFF-05 | Tidak diubah — dikonfirmasi tidak breaking. | Rendah | BSL-001, BSL-002, BSL-005b |
| `models/res_partner.py` — `fields.Json(default={})` | DIFF-06 | Tidak diubah — bug kosmetik warisan (F-11/MF-04) tetap dipertahankan apa adanya. | Rendah | BSL-009 |
| `static/tests/tours/optional_field_save_tour.js` | DIFF-07 | Tidak diubah — selector/xmlid dikonfirmasi masih valid di 20.0. Verifikasi final tetap di step 9 (eksekusi nyata). | Rendah | — |
| `__manifest__.py` — `version` | *(implisit, standar tiap migrasi)* | `"19.0.1.0.0"` → `"20.0.1.0.0"` (version bump murni, pola sama seperti 18→19). | Rendah | BSL-008 |

## 2b. Risk Analysis Terstruktur (detail, per kategori)

> Analisis, bukan kode migrasi. Jangan tulis kode di sini — cuma identifikasi risiko & lokasi.

### Critical Migration Blockers
*(Mencegah instalasi atau operasi inti di 20.0)*

| # | Isu | Lokasi | Rujukan knowledge base |
|---|---|---|---|
| 1 | Manifest version — harus `20.0.x` | `__manifest__.py` baris 17 (`"version": "19.0.1.0.0"`) | Tidak ada entry `knowledge/version-diffs/19-to-20.md` (belum ada file ini) — standar tiap migrasi, tidak butuh riset tambahan |
| 2 | `logOutItem` import resolve `undefined` — berisiko break loading asset bundle `web.assets_backend` kalau tidak dihapus | `static/src/js/user_menu_items.js` baris 6, 32 | `02_DIFF_ANALYSIS.md` DIFF-02, `migration-records/optional_field_save_19.0_20.0/SUMMARY.md` |
| 3 | **`/web/session/logout` menolak GET (405) — logout RUSAK TOTAL sampai fix diterapkan.** Ditemukan step 10 (visual/live), BUKAN step 2 — TIDAK ADA di daftar blocker asli dokumen ini | `static/src/js/user_menu_items.js`, `CustomLogOutItem` callback | `02_DIFF_ANALYSIS.md` DIFF-08, `FINDINGS.md` MF-05 |

**Priority:** HIGH — perbaiki (isu #2) sebelum runtime testing apapun. Isu #1 standar, tidak perlu didiskusikan lebih jauh.

### OWL Widget yang Butuh Rewrite/Review

| Widget | File | Risiko | Detail |
|---|---|---|---|
| *(tidak ada)* | — | — | Modul ini TIDAK punya komponen Owl baru — cuma `patch()` ke component native (`ListRenderer`, `WebClient`) dan registry extension (`user_menuitems`). Ketiganya dikonfirmasi kompatibel di step 2 (DIFF-01, DIFF-02 [setelah fix], DIFF-04, DIFF-05) — tidak ada widget yang perlu di-rewrite dari nol. |

**Urutan wajib:** N/A untuk modul ini — tidak ada template `.xml`/QWeb custom sama sekali (Fase F step 6 N/A, dikonfirmasi intake §2b), jadi tidak ada isu urutan JS-dulu-baru-template.

### Controller & Route

| # | Isu | Lokasi | Priority |
|---|---|---|---|
| *(tidak ada)* | `controllers/controllers.py` dead/kosong total (BSL-012, F-04) — tidak ada route terdaftar, tidak ada yang perlu dimigrasi | — | — |

### Assets & Dependency

| # | Isu | Lokasi | Priority |
|---|---|---|---|
| 1 | `depends: ['base', 'web']` tetap sama — kedua dependency dikonfirmasi tersedia di 20.0 (§2 `02_DIFF_ANALYSIS.md`), tidak ada dependency yang dihapus/ditambah | `__manifest__.py` baris 18-21 | Rendah |
| 2 | Asset paths (`web.assets_backend`, `web.assets_tests`) — key manifest ini TIDAK berubah antar versi Odoo manapun sejauh diverifikasi (masih dipakai identik oleh addon native 20.0 sendiri) | `__manifest__.py` baris 23-31 | Rendah |

### Kompatibilitas Data Model

| # | Isu | Lokasi | Priority | Ref `BSL-NNN` |
|---|---|---|---|---|
| 1 | `fields.Json(default={})` — perilaku `default={}` selalu jadi `False` di DB TIDAK berubah di 20.0 (dikonfirmasi `odoo/orm/fields_misc.py` `class Json`) — bug kosmetik F-11/MF-04 tetap ada, TIDAK diperbaiki (instruksi warisan bug) | `models/res_partner.py` baris 7 | Rendah | BSL-009 |
| 2 | ACL `res.partner` untuk `base.group_user` BERUBAH (baris baru `res_partner_rule_write_self` di `ir.access.csv` — self-write SEKARANG diizinkan, **dikonfirmasi EMPIRIS lewat 2 putaran verifikasi step 6+8**) — TIDAK butuh perubahan kode model. **Dampak nyata dikonfirmasi:** BSL-010/F-10/MF-03 (bug silent-fail warisan) HILANG untuk skenario self-write yang dieksekusi `setDatabase()`. Test warisan `tests/test_optional_field_save.py::test_plain_internal_user_cannot_write_own_partner_field` TETAP PASS (menulis ke partner LAIN, tidak terpengaruh perubahan ini) — TIDAK diedit. Test BARU ditambahkan step 8 (`test_plain_internal_user_can_write_own_partner_record`) yang menutup gap cakupan (menulis ke partner user sendiri, mereplikasi persis pola JS) — PASS, mengonfirmasi write berhasil. Companion test `test_user_with_partner_manager_group_can_write` tetap PASS (tidak terpengaruh). Lihat `FINDINGS.md` MF-01 untuk riwayat investigasi lengkap (2 putaran, termasuk kesimpulan-antara yang sempat salah). | `odoo/addons/base/security/ir.access.csv` baris 58 (native, bukan file modul); test terdampak/ditambah: `tests/test_optional_field_save.py` | Tinggi (behavior berubah, wajib dikomunikasikan) | BSL-010 |

### Risiko Integrasi

| # | Isu | Lokasi | Priority |
|---|---|---|---|
| 1 | `computeOptionalActiveFields()` — override modul membuat fitur native baru `list_optional_show` inert (tidak crash, cuma UX enhancement yang tidak "ikut lewat") — keputusan default: diterima apa adanya, tidak di-extend | `static/src/js/list_renderer.js` | Rendah |
| 2 | `CustomLogOutItem` — total-replace `log_out` di registry `user_menuitems` membuat fitur PWA-redirect baru native (`useService("pwa")`, `?redirect=`) juga otomatis hilang — pola replace-total ini sudah ada sejak 17.0, bukan regresi baru dari migrasi ini, dicatat supaya tidak dianggap temuan baru di step 9/10 kalau ketemu saat modul dijalankan sebagai installed PWA | `static/src/js/user_menu_items.js` | Rendah |

### Urutan Prioritas Testing

1. Install & startup — manifest version bump, dependency `base`/`web` tersedia, asset bundle `web.assets_backend` ter-load TANPA error (verifikasi DIFF-02 sudah benar-benar fixed — ini yang paling kritis, kalau gagal seluruh 3 file JS modul tidak jalan)
2. Core user flow — load preferensi saat webclient mount (`getOptionalActiveFields()`), toggle kolom optional di list view Contacts → persist ke DB (`setDatabase()`) → restore lintas browser
3. Persistensi data — `res.partner.optional_field_save` (Json field), verifikasi `default={}` tetap `False` (BSL-009, tidak diperbaiki)
4. **SELESAI — BSL-010 (F-10/MF-03) dengan user `base.group_user` biasa TANPA `base.group_partner_manager`:** dikonfirmasi EMPIRIS (2 putaran, step 6+8) — `write` ke `res.partner` (partner milik user sendiri) SEKARANG BERHASIL (tidak lagi silent-fail seperti 19.0) — akibat ACL baru `res_partner_rule_write_self` (DIFF-03). Lihat `FINDINGS.md` MF-01.
5. Cleanup saat logout — `user_menu_items.js` custom logout item, cek sessionStorage ter-cleanup, cek loading module TIDAK error (memverifikasi fix DIFF-02)
6. Tour test warisan (`optional_field_save_tour.js`) — jalankan ulang, verifikasi selector/xmlid yang sudah dicek statis di DIFF-07 benar-benar valid saat eksekusi nyata

### View List (dulu Tree) Checklist

| # | Apa | Di mana | Perubahan |
|---|---|---|---|
| *(N/A)* | Modul ini TIDAK punya folder `views/` sama sekali (dikonfirmasi intake §2b) — tidak ada `<tree>`/`<list>` milik modul yang perlu dicek. Modul cuma PATCH `ListRenderer` (component JS, bukan XML view) — sudah dicek di §2b atas (Risiko Integrasi #1), tidak terkait `<tree>`→`<list>` migrasi XML. | — | — |

### Estimasi Effort

| Area | Effort | Catatan |
|---|---|---|
| `__manifest__.py` version bump | Sangat rendah (1 baris) | Pola standar tiap migrasi |
| `user_menu_items.js` — hapus dead import (DIFF-02) | Sangat rendah (2 baris dihapus) | Satu-satunya perubahan kode wajib di step 6 |
| Verifikasi eksekusi nyata BSL-010 (DIFF-03) | Rendah-Sedang (SELESAI) | Bukan kode modul, tapi butuh skenario test BARU (self-write, ditambahkan step 8 setelah test warisan ketahuan tidak menguji skenario relevan) — hasil: bug hilang untuk skenario nyata |
| Sisanya (DIFF-01, DIFF-04/05/06/07) | Nihil | Tidak ada aksi kode — port apa adanya |

## 3. Data Migration (ringkas — detail di step 7)

Tidak ada field/model yang berubah struktur — `res.partner.optional_field_save` (Json) tetap sama
persis di 20.0 (DIFF-06). Step 7 tetap **N/A** (port kode saja, instalasi baru, sesuai intake §3).

## 4. Scope

### Termasuk
- Version bump manifest `19.0.1.0.0` → `20.0.1.0.0`
- Hapus dead import `OriginalLogOutItem` di `user_menu_items.js` (DIFF-02, wajib kompatibilitas)
- Verifikasi eksekusi nyata seluruh baseline behavior (`BSL-001` s/d `BSL-014`) tetap identik, KECUALI
  ekspektasi BSL-010 yang WAJIB diuji ulang tanpa asumsi (DIFF-03)

### Di Luar Scope (sengaja, disetujui di intake)
- Extend `computeOptionalActiveFields()` untuk mendukung `list_optional_show` (DIFF-01) — fitur baru,
  bukan port. Bisa diminta eksplisit oleh user sebagai perubahan terpisah SETELAH migrasi ini selesai.
- Memperbaiki bug warisan F-10/F-11 (BSL-009, BSL-010) — dipertahankan apa adanya, TERMASUK kalau
  ternyata behavior BSL-010 "membaik sendiri" akibat ACL native berubah (itu bukan modul yang
  diperbaiki, itu konsekuensi native yang harus diterima & didokumentasikan, bukan dibatalkan).
- Housekeeping F-01/F-04/F-05/F-07/BSL-014 (dead ACL csv modul, dead controller, file Google
  verification nyasar, dead import lain) — tetap di luar scope sesuai intake §5.
