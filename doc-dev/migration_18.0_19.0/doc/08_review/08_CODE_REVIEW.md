# Code Review — optional_field_save

**Step:** 8 — Code Review (gate)
**Ref:** `03_spec/03_MIGRATION_SPEC.md`, `05_acceptance/05a_MIGRATION_ACCEPTANCE_CRITERIA.md`, `06_implementation/06c_IMPLEMENTATION_LOG.md`, `01_intake/01b_BASELINE_SPEC.md`, `FINDINGS.md`
**Odoo Version:** 19.0
**Files reviewed:** `optional_field_save/__manifest__.py`, `optional_field_save/tests/test_optional_field_save.py`, `optional_field_save/static/tests/tours/optional_field_save_tour.js`, `docker-env/Dockerfile`, `docker-env/docker-compose.yml` (semua file yang benar-benar diubah step 6 — lihat `06c_IMPLEMENTATION_LOG.md`; file lain modul di-port 1:1 tanpa perubahan, dicek ulang di §D)
**Tanggal:** 2026-08-26

---

## 0. FINDINGS.md Check

- [x] Dibaca — 2 entry, keduanya `✅ RESOLVED` (MF-01 `groups_id`→`group_ids`, MF-02 tour "Mobile"→"Street"), keduanya diverifikasi via eksekusi nyata G1 percobaan #3. Tidak ada finding terbuka.

## A. Issues (Lint, Konvensi Odoo, Business Logic, Security, Performance, Code Quality)

| ID | Severity | Kategori | File | Baris | Issue | Rekomendasi |
|---|---|---|---|---|---|---|
| CR-01 | 🔵 Info | Code Quality | `optional_field_save/static/tests/tours/optional_field_save_tour.js` | 18-24 | Komentar header sekarang menyebut dua migrasi berbeda (17→18 dan 18→19) yang KEDUANYA punya finding bernama "MF-02" — berpotensi ambigu di masa depan kalau dibaca lepas konteks | Sudah dimitigasi eksplisit di komentar itu sendiri (disambiguasi ditulis langsung) — tidak perlu perubahan lebih lanjut, dicatat di sini murni sebagai catatan transparansi review, bukan actionable defect |
| — | — | — | — | — | Tidak ada issue lain ditemukan | — |

**Severity:** 🔴 Critical (0) · 🟡 Warning (0) · 🔵 Info (1)

**Catatan cakupan review konvensi/security/performance:** perubahan kode di migrasi ini SANGAT sempit (version bump, 2 rename field key di test fixture, 3 selector di tour test) — tidak ada logic Python/JS baru yang ditulis, tidak ada query ORM baru, tidak ada field/model baru. Kategori Security/Performance/Business-Logic-baru tidak applicable karena tidak ada kode baru di kategori itu; verifikasi yang relevan adalah **kesetaraan** (lihat §D), bukan kualitas kode baru.

## B. Gap Analysis — Implementasi vs Migration Spec

| Spec item (`DIFF-NNN`/Fase) | Implementasi | Status | Catatan |
|---|---|---|---|
| A1 — manifest version bump | `__manifest__.py`: `"version": "19.0.1.0.0"` | ✅ Sesuai | — |
| DIFF-09/AC-07-01 — `groups_id`→`group_ids` | `tests/test_optional_field_save.py:71,93` — kedua lokasi diubah | ✅ Sesuai | Isi list `(6, 0, [...])` tidak berubah, murni key rename |
| DIFF-01..08, DIFF-11 — port apa adanya | Tidak ada perubahan di `models/res_partner.py`, `list_renderer.js`, `webclient.js`, `user_menu_items.js`, `test_optional_field_save_tour.py`, `security/`, `controllers/` | ✅ Sesuai | Dikonfirmasi `git diff` — hanya 5 file berubah total (manifest, 1 test file, 1 tour file, 2 docker-env file) |
| — (di luar spec awal) MF-02 — tour "Mobile"→"Street" | `static/tests/tours/optional_field_save_tour.js` | ✅ Sesuai (ditangani sesuai protokol, lihat §E) | Ditemukan G1 percobaan #1, dicatat `FINDINGS.md` sebelum fix |

## C. Gap Analysis — Implementasi vs Acceptance Criteria

| AC ID | Behavior | Status | Catatan |
|---|---|---|---|
| AC-01-01 | Instalasi modul sukses di 19.0 | ✅ Terverifikasi | G1 percobaan #3: instalasi + test suite jalan tanpa error |
| AC-02-01 | Toggle kolom → DB+localStorage+sessionStorage ter-update | ✅ Terverifikasi | Tour `[5/7]`-`[7/7]` (dengan field "Street") + `test_write_and_read_roundtrip_matches_js_pattern` |
| AC-02-02 | Load preferensi dari DB saat browser lain | ✅ Terverifikasi (indirect) | Mekanisme `getOptionalActiveFields()`/`computeOptionalActiveFields()` tidak berubah kode & lulus tour end-to-end; tidak ada tour KHUSUS dua-browser terpisah (di luar scope otomatis, lihat `05b_TEST_PLAN_MIGRATION.md`) — cukup untuk step 8, verifikasi end-to-end dua-browser didorong ke step 10 |
| AC-02-03 | Partner baru/lama sama-sama `False` | ✅ Terverifikasi | `test_new_partner_default_is_falsy_not_empty_dict` PASS |
| AC-02-04 | `setDatabase()` handle `old_value` falsy tanpa crash | ✅ Terverifikasi (implicit) | Sama seperti di atas, tidak ada perubahan kode |
| AC-03-01 | Fallback ke localStorage saat sessionStorage kosong | ✅ Terverifikasi (statis) | DIFF-01 — `super()` (`computeOptionalActiveFields` core) dikonfirmasi tidak berubah; tidak ada regresi kode di jalur ini |
| AC-04-01 | Cleanup sessionStorage saat logout | ✅ Terverifikasi (statis) | DIFF-05 — registry key `"log_out"` tidak berubah, tidak ada regresi kode |
| AC-05-01 | Modul tidak muncul di Apps (`application: False`) | ✅ Terverifikasi (statis) | Manifest tidak diubah selain version |
| AC-06-01 | User tanpa Contact Creation gagal write (TETAP gagal) | ✅ Terverifikasi | `test_plain_internal_user_cannot_write_own_partner_field` PASS — `AccessError` tetap terjadi seperti didesain |
| AC-07-01 | Fix `groups_id`→`group_ids` tidak mengubah hasil AC-06 | ✅ Terverifikasi | Kedua test ACL (positive+negative) PASS setelah fix |

## D. Cek Khusus Migrasi — P1 Fidelity

- [x] **Tidak ada perubahan behavior yang tidak disengaja** — semua deviasi dari source (`origin/migration/18.0`) sudah eksplisit tercatat & disetujui: (1) `groups_id`→`group_ids` murni kompatibilitas test infra (bukan business logic), (2) tour "Mobile"→"Street" murni kompatibilitas test infra (root cause di view native, bukan modul). Nol perubahan di `models/`, `static/src/js/` produksi.

**Cek tabrakan nama method dengan Odoo core (kedua arah):**
1. **Arah 1** (method modul menimpa method core lewat MRO tanpa `super()`): `computeOptionalActiveFields()`/`saveOptionalActiveFields()` di `ListRenderer` — SUDAH memanggil `super()` sebagian (fallback path), dikonfirmasi kontrak stabil step 2 (DIFF-01/DIFF-02). `WebClient.setup()` — memanggil `super.setup()`. Tidak ada method modul yang menimpa core tanpa `super()` selain yang SUDAH dianalisis & disetujui di baseline 17→18 (warisan, bukan baru di migrasi ini).
2. **Arah 2** (core 19.0 menambah field/method baru dengan nama sama seperti yang didefinisikan modul): dicek langsung — `optional_field_save` (field `res.partner`) TIDAK ditemukan di `enterprise19.0/odoo/addons/base/models/res_partner.py`. `setDatabase` (method baru `ListRenderer` prototype, murni milik modul) TIDAK ditemukan di core `list_renderer.js` 19.0. `getOptionalActiveFields` (method baru `WebClient` prototype) TIDAK ditemukan di core `webclient.js` 19.0.

- [x] Sudah dicek (kedua arah) — tidak ada tabrakan nama method/field dengan core/Enterprise

## E. Perubahan Tak Tertelusuri (di luar spec)

- [x] **Ada — MF-02 (tour "Mobile"→"Street"), sudah ditangani sesuai protokol.** Ditemukan saat eksekusi G1 percobaan #1 (bukan direncanakan di `03_MIGRATION_SPEC.md` awal). Ditangani BUKAN dengan improvisasi diam-diam: dicatat ke `FINDINGS.md` sebagai `MF-02` dengan analisis root cause LENGKAP (dibandingkan langsung `native-source` vs `native-target`) SEBELUM kode diubah, dinilai eksplisit sebagai murni test-infrastructure (bukan ambiguitas business logic yang butuh keputusan user — field `mobile` dihapus dari VIEW native, bukan sesuatu yang modul ini kontrol), lalu diperbaiki dan diverifikasi ulang. Keputusan untuk tidak balik ke step 3/4 penuh dipertimbangkan aman karena risiko rendah dan tidak menyentuh kode produksi — dicatat di sini secara eksplisit untuk audit trail, konsisten pola MF-02/MF-05 di migrasi 17→18 sebelumnya.

## F. Kontribusi ke Knowledge Base

- [x] Ada — sudah dicatat step 2 (CAND-01) dan step 6 (CAND-02) di `migration-records/optional_field_save_18.0_19.0/SUMMARY.md`. Tidak ada temuan baru dari review step 8 itu sendiri.

## G. Verdict

- Ringkasan Issues: 0 🔴 · 0 🟡 · 1 🔵
- [x] ✅ **Lulus** — tidak ada 🔴, lanjut ke step 9

**Issue 🔴 yang wajib difix sebelum lanjut:** Tidak ada.
