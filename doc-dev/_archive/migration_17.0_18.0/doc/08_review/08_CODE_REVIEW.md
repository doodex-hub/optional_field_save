# Code Review — optional_field_save

**Step:** 8 — Code Review (gate)
**Ref:** `03_spec/03_MIGRATION_SPEC.md`, `05_acceptance/05a_MIGRATION_ACCEPTANCE_CRITERIA.md`, `06_implementation/06c_IMPLEMENTATION_LOG.md`, `01_intake/01b_BASELINE_SPEC.md`
**Odoo Version:** 18.0
**Files reviewed:** `__manifest__.py`, `models/res_partner.py`, `static/src/js/list_renderer.js`, `static/src/js/webclient.js`, `static/src/js/user_menu_items.js` (semua file yang disentuh migrasi — file dead/housekeeping F-01/F-04/F-05 di-skip, di luar scope per `01a_MIGRATION_INTAKE.md` §5)
**Tanggal:** 2026-08-24

---

## A. Issues (Lint, Konvensi Odoo, Business Logic, Security, Performance, Code Quality)

| ID | Severity | Kategori | File | Baris | Issue | Rekomendasi |
|---|---|---|---|---|---|---|
| CR-01 | 🔵 Info | Code Quality | `list_renderer.js` | 5 | Import `registry` tidak pernah dipakai di body file (dead import) — **pre-existing dari source 17.0**, bukan diperkenalkan migrasi | Tidak perlu difix sekarang — di luar scope migrasi port-kode (anti-refactor rule). Kandidat housekeeping independen kalau pemilik modul mau |
| CR-02 | 🔵 Info | Code Quality | `list_renderer.js` | 49 | `setDatabase()`: `let old_value = {}` langsung di-overwrite baris berikutnya (`old_value = datapartnerId[0].optional_field_save`) — inisialisasi mati, **pre-existing dari source 17.0** | Tidak perlu difix — di luar scope |
| CR-03 | ~~🔵 Info~~ **⚠️ REVISI 2026-08-26 (Step 9) — TERBUKTI BUKAN cuma teori** | Business Logic | `list_renderer.js` | 50 | `setDatabase()`: `datapartnerId[0].optional_field_save` diakses SEBELUM cek `datapartnerId.length > 0`. Prediksi awal review ini ("nyaris tidak pernah ter-trigger") **TERBUKTI SALAH** — tour test Step 9 memicu ini PERSIS di percobaan toggle PERTAMA, karena akar masalahnya BUKAN "partner tidak ada" (jarang), tapi `partnerId` itu sendiri `undefined` (`session.partner_id` dihapus di 18.0, lihat **MF-05** `FINDINGS.md`) — kondisi yang SELALU terjadi di 18.0, bukan edge case langka. Sudah diperbaiki bersamaan dengan fix MF-05 (root cause-nya sama). | Sudah diperbaiki — lihat MF-05. Baris ini sendiri (`datapartnerId[0]` tanpa guard) TETAP ada di kode (tidak diubah, karena dengan `partnerId` yang benar sekarang selalu ada tepat 1 partner), tapi risiko praktisnya sudah hilang karena akar masalah (partnerId undefined) sudah tidak ada |
| CR-04 | 🔵 Info | Code Quality | `webclient.js` | 4 | `useService` diimpor tapi HANYA dipakai untuk `this.orm` (fix MF-02) — bukan issue, cuma catatan bahwa import ini BARU (bagian dari fix, bukan pre-existing) | — (sudah benar, tidak perlu tindakan) |

**Tidak ditemukan issue 🔴 Critical maupun 🟡 Warning** — semua temuan bersifat pre-existing/kosmetik dan sudah di luar scope migrasi (dikonfirmasi `01a_MIGRATION_INTAKE.md` §5), atau (CR-04) justru bagian dari fix yang sudah benar.

**Severity:** 🔴 Critical (bug/security/AC tidak cover — wajib fix) · 🟡 Warning (convention/performance — fix kalau memungkinkan) · 🔵 Info (saran, opsional)

## B. Gap Analysis — Implementasi vs Migration Spec

| Spec item (`DIFF-NNN`/Fase) | Implementasi | Status | Catatan |
|---|---|---|---|
| Critical Blocker #1 — manifest version | `__manifest__.py:17` = `"18.0.1.0.0"` | ✅ Match | — |
| Fase E — `computeOptionalActiveFields()` rewrite (MF-01) | `list_renderer.js:17-38` | ✅ Match | Logic sessionStorage-check 1:1, fallback `super()` sesuai keputusan Step 3, return value (bukan mutasi), baris `onOptionalFieldsChanged` sudah dihapus |
| `saveOptionalActiveFields()`, `setDatabase()`, `setup()` (list_renderer.js) | Tidak diubah | ✅ Match | Sesuai spec "port apa adanya" |
| `webclient.js`, `user_menu_items.js` | `webclient.js` diubah (fix MF-02); `user_menu_items.js` tidak diubah | ⚠️ **Revisi pasca-tulis** | Spec awal bilang `webclient.js` "port apa adanya" — DIREVISI di `03_MIGRATION_SPEC.md` §4 "Revisi Pasca-Tulis" setelah G2 menemukan MF-02 kritis. Perubahan konsisten dengan revisi spec, bukan penyimpangan tak tertelusuri |
| `models/res_partner.py` | Tidak diubah | ✅ Match | DIFF-09 byte-identik, sesuai spec |

## C. Gap Analysis — Implementasi vs Acceptance Criteria

| AC ID | Behavior | Status | Catatan |
|---|---|---|---|
| AC-01-01 | Instalasi modul sukses di 18.0 | ✅ Covered | Dikonfirmasi G1 (13 modul loaded, 0 error) |
| AC-02-01 | Toggle kolom → DB+localStorage+sessionStorage ter-update | ✅ Covered (kode tidak berubah) | Bagian DB dikonfirmasi `test_write_and_read_roundtrip_matches_js_pattern` (G1). Bagian localStorage/sessionStorage browser-level belum tour-tested (Step 9) |
| AC-02-02 | Load preferensi dari DB saat browser lain (KRITIS) | ✅ Implemented, ⚠️ belum full tour-tested | G2 konfirmasi `search_read` (mekanisme load) sukses tanpa error — skenario end-to-end dua-browser penuh masih Step 9/10 |
| AC-02-03 | Partner baru/lama sama-sama `False` | ✅ Covered | `test_new_partner_default_is_falsy_not_empty_dict` PASS (G1) |
| AC-02-04 | `setDatabase()` handle `old_value` falsy tanpa crash | ✅ Covered | Sama seperti AC-02-03, dibuktikan test yang sama |
| AC-03-01 | Fallback ke `super()` saat sessionStorage kosong | ✅ Implemented, ⚠️ belum tour-tested | Logic diverifikasi via code review (lihat analisis di §D), belum ada tour test browser untuk skenario spesifik ini |
| AC-04-01 | Cleanup sessionStorage saat logout | ✅ Covered (kode tidak berubah) | Belum tour-tested |
| AC-05-01 | Modul muncul di Apps tanpa menu | — | Visual/manual, Step 10 |
| AC-06-01 | User tanpa Contact Creation gagal write (tetap gagal) | ✅ Covered | `test_plain_internal_user_cannot_write_own_partner_field` + `test_user_with_partner_manager_group_can_write` PASS (G1) |
| AC-07-01 | Verifikasi `this.orm` di `webclient.js` (MF-02) | ✅ **RESOLVED** | G2: crash hilang, `search_read` 200 OK setelah fix. Lihat `FINDINGS.md` MF-02 untuk detail lengkap |

**Item belum full-covered (bukan gap, tapi tercatat eksplisit untuk Step 9):** AC-02-01 (bagian storage browser), AC-02-02 (end-to-end dua-browser), AC-03-01, AC-04-01 — semuanya butuh tour test (`HttpCase.start_tour`), sudah direncanakan di `05b_TEST_PLAN_MIGRATION.md` Step 9.

## D. Cek Khusus Migrasi — P1 Fidelity

- [x] Tidak ada perubahan behavior yang tidak disengaja — semua deviasi dari source (`source-codebase`) sudah eksplisit tercatat & disetujui:
  1. `computeOptionalActiveFields()` rewrite (MF-01) — **wajib untuk kompatibilitas** (method lama dihapus core), bukan pilihan. Behavior observable dipertahankan identik (dianalisis ulang di review ini: kasus sessionStorage `""` vs `null` tetap konsisten dengan behavior asli karena `saveOptionalActiveFields()` selalu menulis sessionStorage+localStorage bersamaan).
  2. `this.orm = useService("orm")` di `webclient.js` (MF-02) — **perubahan disengaja**, disetujui eksplisit pemilik modul setelah eskalasi, didokumentasikan `FINDINGS.md` MF-02 + `01a_MIGRATION_INTAKE.md` §5 (scope boundary) + `03_MIGRATION_SPEC.md` §4 (revisi pasca-tulis).
  - Tidak ada deviasi lain yang ditemukan.

**Cek tabrakan nama method dengan Odoo core (DUA ARAH):**
1. **Arah 1** (method yang DIPAKAI modul, apakah masih ada core yang sama) — sudah dicek tuntas di Step 2 (`02_DIFF_ANALYSIS.md` DIFF-01 s/d DIFF-10): `getOptionalActiveFields` DIHAPUS (ditangani MF-01), `saveOptionalActiveFields`/`setup()`/registry API STABIL. Python (`res_partner.py`) tidak override method core apapun — cuma `_inherit` + 1 field baru, jadi Arah 1 N/A untuk Python.
2. **Arah 2** (apakah core 18.0 MENAMBAH definisi baru dengan nama sama yang tidak ada di 17.0) — dicek `grep "optional_field_save"` di `odoo18/odoo/addons/base/models/` dan `odoo18/addons/web/` (2026-08-24, sesi ini): **tidak ada match** — tidak ada field/model baru bernama `optional_field_save` di core 18.0. Field `res.partner.optional_field_save` aman, tidak ada tabrakan.

- [x] Sudah dicek (kedua arah) — tidak ada tabrakan nama method/field dengan core/Enterprise. Diperkuat empiris: G1 (install) dan G2 (runtime) berdua sukses tanpa error tabrakan apapun.

## E. Perubahan Tak Tertelusuri (di luar spec)

- [x] Tidak ada perubahan yang tidak tertelusuri ke spec — satu-satunya penyimpangan dari draft spec awal (MF-02) sudah direvisi balik ke `03_MIGRATION_SPEC.md` §4 dengan jejak audit lengkap (bukan diam-diam).

## F. Kontribusi ke Knowledge Base

- [x] Ada — dicatat ke `migration-records/optional_field_save_17.0_18.0/SUMMARY.md` (kandidat baru dari review ini, kategori `version-diff`/pattern umum):
  - **CAND-01:** Pola "dual-write sessionStorage+localStorage bersamaan, lalu salah satu dipakai sebagai primary source + fallback ke sumber lain via `super()`" — kalau kedua storage SELALU ditulis bersamaan (seperti `saveOptionalActiveFields()` di modul ini), delegasi fallback via `super()` ke storage sekunder AMAN (tidak menyebabkan divergensi), bahkan untuk edge case "semua opsi dinonaktifkan" (string kosong). Berguna sebagai referensi pola migrasi override method Owl yang di-hapus/di-rename core, bukan cuma spesifik modul ini.

## G. Verdict

- Ringkasan Issues: 0 🔴 · 0 🟡 · 4 🔵
- [x] ✅ **Lulus** — tidak ada 🔴, lanjut ke step 9

**Catatan untuk Step 9:** meskipun gate ini lulus, beberapa AC (AC-02-01 bagian storage, AC-02-02 end-to-end, AC-03-01, AC-04-01) baru "Implemented" secara kode + review statis — BELUM divalidasi via tour test browser. Step 9 WAJIB menulis & menjalankan tour test untuk menutup gap verifikasi ini sebelum modul dianggap benar-benar siap Step 10/11.

**Update pasca-Step 9 (2026-08-26):** tour test menemukan bug KRITIS BARU (MF-05 — `session.partner_id` dihapus di 18.0, lihat `FINDINGS.md`) yang review statis SESI INI TIDAK menemukan — CR-03 di atas SEMULA dinilai "nyaris tidak pernah ter-trigger" ternyata jadi jalur crash utama begitu benar-benar dieksekusi browser nyata. Diperbaiki, diverifikasi ulang (G1 + tour, `0 failed, 0 error(s) of 5 tests`, ditambah verifikasi RPC manual untuk AC-02-02). Lihat `09_devtest/09_DEV_TESTING.md` untuk detail lengkap.
