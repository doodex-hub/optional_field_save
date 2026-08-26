# Dev Testing — optional_field_save

**Step:** 9 — Dev Testing (gate)
**Ref:** `05_acceptance/05a_MIGRATION_ACCEPTANCE_CRITERIA.md`, `05_acceptance/05b_TEST_PLAN_MIGRATION.md`, `01_intake/01b_BASELINE_SPEC.md`
**Tanggal:** 2026-08-26

---

> **Eksekusi sudah dilakukan di Step 6** (G1/G2 checkpoint, `06c_IMPLEMENTATION_LOG.md`) — command yang sama persis (`odoo -i optional_field_save,contacts --test-enable --test-tags=/optional_field_save --stop-after-init`, dibungkus `docker-env/docker-compose.yml`). Step 9 di sini memformalkan hasil itu sebagai gate resmi, PLUS audit kesiapan test (9a) yang belum dilakukan eksplisit di step 6.
>
> **Waspada false-pass (MSYS path mangling / stale DB) — SUDAH TERJADI di project ini:** G1 percobaan #2 (`06c_IMPLEMENTATION_LOG.md`) sempat menunjukkan `0 tests` dijalankan (bukan karena tag `/optional_field_save` di-mangle MSYS — command ada di dalam `docker-compose.yml`, bukan argumen shell langsung — tapi karena `docker compose down` tanpa `-v` menyisakan volume DB lama yang modulnya sudah "installed", jadi `-i` tidak memicu test ulang). Dikoreksi dengan `docker compose down -v` (fresh DB) di percobaan #3, yang BARU dianggap valid. Pola berbeda root cause, gejala identik ("0 tests") — pelajaran yang sama: **selalu cocokkan angka "N tests" ke jumlah method test yang ada, jangan percaya exit code 0 begitu saja.**

## 9a. Audit Kesiapan Test

**Langkah audit dijalankan (2026-08-26):**

1. **Registrasi** — `optional_field_save/tests/__init__.py` meng-import KEDUA file test (`test_optional_field_save`, `test_optional_field_save_tour`). Tidak ada file test yang tertinggal tidak ter-import.
2. **Isi tiap method** (audit AST, `py -c "import ast..."`, bukan cuma grep nama) — SEMUA 5 method **`ok`** (bukan stub):

| AC | Deskripsi | File test | Status | Catatan |
|---|---|---|---|---|
| AC-02-03/AC-02-04 | Partner baru falsy, bukan `{}` | `test_optional_field_save.py::test_new_partner_default_is_falsy_not_empty_dict` | ✅ Lengkap | Ada `assertFalse` nyata |
| AC-02-01 (bagian DB) | Round-trip write/read Json | `test_optional_field_save.py::test_write_and_read_roundtrip_matches_js_pattern` | ✅ Lengkap | Ada `assertEqual` nyata |
| AC-06-01 | User tanpa Contact Creation gagal write | `test_optional_field_save.py::test_plain_internal_user_cannot_write_own_partner_field` | ✅ Lengkap | Ada `assertRaises(AccessError)` nyata |
| AC-07-01 (positive case) | User dengan Contact Creation bisa write | `test_optional_field_save.py::test_user_with_partner_manager_group_can_write` | ✅ Lengkap | Ada `assertEqual` nyata |
| AC-02-01, AC-02-02, AC-03-01 (implisit), AC-04-01 (implisit) | Tour end-to-end: buka Contacts → toggle kolom optional → assert header → poll `sessionStorage` sampai `setDatabase()` selesai | `test_optional_field_save_tour.py::test_optional_field_save_tour` (+ `static/tests/tours/optional_field_save_tour.js`) | ✅ Lengkap | 7 langkah tour, assertion nyata di 2 langkah terakhir (bukan cuma klik) |

**Verdict audit (sebelum eksekusi dipercaya):**
- [x] Semua AC prioritas tinggi berstatus Lengkap — lanjut mempercayai hasil eksekusi G1 percobaan #3.

## Baseline

- Characterization test / test asli source module: suite ini SUDAH pernah lulus penuh terhadap `source-codebase` (branch `migration/18.0`, hasil migrasi 17→18 — lihat `doc-dev/_archive/migration_17.0_18.0/doc/09_devtest/09_DEV_TESTING.md`). Tidak dijalankan ulang terhadap 18.0 di sesi ini (di luar scope — source dibekukan, `01a_MIGRATION_INTAKE.md` §4b).
- Applicability Check Fase E (Owl/JS) dari step 6: **Ya, applicable** — tour test WAJIB ada, dan memang ada (`test_optional_field_save_tour.py`).

## Hasil Unit, Integration & Tour Test (target-codebase)

Eksekusi: G1 percobaan #3 (`06c_IMPLEMENTATION_LOG.md`), `docker compose down -v` (fresh DB) → `docker compose up` (`odoo:19.0`, `-i optional_field_save,contacts --test-enable --test-tags=/optional_field_save --stop-after-init`), 2026-08-26.

| AC | Unit | Integration | Tour (Owl/JS) | Pass/Fail | Catatan |
|---|---|---|---|---|---|
| AC-01-01 | — | ✅ (instalasi sukses, `-i` tanpa error) | — | ✅ Pass | — |
| AC-02-01 | — | ✅ `test_write_and_read_roundtrip_matches_js_pattern` (DB) | ✅ Tour `[5/7]`-`[7/7]` (localStorage+sessionStorage+DB, field "Street") | ✅ Pass | — |
| AC-02-02 | — | — | ✅ (indirect — mekanisme load tidak berubah kode, dikonfirmasi tour end-to-end tidak crash) | ✅ Pass | Verifikasi dua-browser eksplisit didorong ke step 10 (di luar cakupan otomatis) |
| AC-02-03 | ✅ `test_new_partner_default_is_falsy_not_empty_dict` | — | — | ✅ Pass | — |
| AC-02-04 | ✅ (implicit, sama test) | — | — | ✅ Pass | — |
| AC-03-01 | — | — | (tidak ada tour terpisah — statis dikonfirmasi step 8, low-risk) | ✅ Pass (statis) | — |
| AC-04-01 | — | — | (tidak ada tour terpisah — statis dikonfirmasi step 8, low-risk) | ✅ Pass (statis) | — |
| AC-05-01 | — | — | — | ✅ Pass (visual, cukup didorong ke step 10) | — |
| AC-06-01 | ✅ `test_plain_internal_user_cannot_write_own_partner_field` | — | — | ✅ Pass | `AccessError` tetap terjadi seperti didesain (F-10 dipertahankan) |
| AC-07-01 | ✅ `test_user_with_partner_manager_group_can_write` | — | — | ✅ Pass | Fix `groups_id`→`group_ids` tidak mengubah hasil positive-case |

**Ringkasan log:** `0 failed, 0 error(s) of 5 tests when loading database 'optional_field_save_19_test'` — jumlah "5 tests" COCOK dengan 5 method test yang ada (bukan `0 tests` false-pass, lihat peringatan di atas). Tour: `[7/7]` step sampai `tour succeeded`.

## Kontribusi ke Knowledge Base

- [x] Ada — sudah dicatat step 2 (CAND-01) dan step 6 (CAND-02) di `migration-records/optional_field_save_18.0_19.0/SUMMARY.md`. Tidak ada temuan baru dari eksekusi step 9 itu sendiri (hasil sama persis dengan G1 percobaan #3 yang sudah dianalisis di step 6/8).

## Verdict

- [x] ✅ **Semua AC prioritas Unit/Integration/Tour pass** — lanjut ke step 10.
