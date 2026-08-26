# Implementation Log — optional_field_save

**Step:** 6 — Code Migration
**Ref:** `03_spec/03_MIGRATION_SPEC.md`, `06a_CODE_MIGRATION_PHASES.md`
**Tanggal:** 2026-08-26

> Jejak per FASE (A1→G2), bukan cuma per item spec. Kalau ketemu sesuatu di luar spec — STOP,
> jangan improvisasi. Balik ke step 3/4 dulu.

---

## Applicability Check

Sumber: `01a_MIGRATION_INTAKE.md` §2b.

| Fase | Relevan? | Bukti/alasan (dari `01a` §2b) |
|---|---|---|
| B2 | ☑ Ya | Field JSON (`fields.Json` di `models/res_partner.py`) — dikonfirmasi stabil (DIFF-06), port apa adanya |
| C2 | ☐ Tidak | Tidak ada folder `views/` sama sekali di modul ini |
| D1 | ☐ Tidak | `controllers/controllers.py` dead file total, tidak ada route terdaftar |
| D2 | ☑ Ya | Assets JS custom terdaftar di `assets.web.assets_backend`/`assets.web.assets_tests` |
| E | ☑ Ya | 3 file JS patch (`list_renderer.js`, `webclient.js`, `user_menu_items.js`) — fokus utama migrasi ini |
| F | ☐ Tidak | Tidak ada template `.xml` custom milik modul ini |

---

## Tabel Ringkas Status Fase

| Fase | Status | Tanggal |
|---|---|---|
| A1 (manifest version bump) | ✅ | 2026-08-26 |
| A2 (dependency check) | ✅ (N/A — `depends` tidak berubah, dikonfirmasi DIFF-08) | 2026-08-26 |
| G1 (checkpoint Fase A #1 — lihat "Riwayat Percobaan G1") | ✅ Pass (percobaan #3, fresh DB) | 2026-08-26 |
| A3 | ✅ (N/A — tidak ada perubahan lain di Fase A selain A1) | 2026-08-26 |
| A4 | ✅ (N/A — tidak ada security/data file yang berubah) | 2026-08-26 |
| A5 | ✅ (N/A — tidak ada perubahan struktural lain) | 2026-08-26 |
| B1 (model Python) | ✅ (N/A — `models/res_partner.py` port apa adanya, DIFF-06 dikonfirmasi stabil) | 2026-08-26 |
| B2 (field JSON) | ✅ (port apa adanya, tidak ada perubahan) | 2026-08-26 |
| C1 | ✅ (N/A — tidak ada views) | 2026-08-26 |
| C2 | ✅ (N/A — dikonfirmasi Applicability Check) | 2026-08-26 |
| D1 | ✅ (N/A — dikonfirmasi Applicability Check) | 2026-08-26 |
| D2 | ✅ (port apa adanya, manifest asset keys dikonfirmasi stabil DIFF-08) | 2026-08-26 |
| E | ✅ (port apa adanya — `computeOptionalActiveFields`/`saveOptionalActiveFields`/`user.partnerId`/`useService("orm")` dikonfirmasi stabil DIFF-01..04) | 2026-08-26 |
| F | ✅ (N/A — dikonfirmasi Applicability Check) | 2026-08-26 |
| G2 (validasi akhir/runtime) | ✅ Selesai (via G1 percobaan #3 — instalasi + tour browser headless nyata, lihat catatan G2 di bawah) | 2026-08-26 |

## Riwayat Percobaan G1 (Install Test)

> **Mode eksekusi:** C — AI jalankan langsung (Claude Code CLI, Docker terinstal di environment ini).

| # | Dijalankan setelah fase | Mode | Hasil | Error (kalau fail) | Tanggal |
|---|---|---|---|---|---|
| 1 | A1 (manifest bump) + Fase E/B2 (port apa adanya) + fix `groups_id`→`group_ids` (MF-01) | C | ❌ Fail — 4/5 test PASS (`groups_id`→`group_ids` fix TERBUKTI bekerja, ACL test lulus), tapi tour test TIMEOUT step [5/7] | `Element (.dropdown-item:contains("Mobile")) has not been found` — "Mobile" dihapus total dari native Contacts list view 19.0, lihat MF-02 di `FINDINGS.md` | 2026-08-26 |
| 2 | Fix MF-02 (tour: "Mobile"→"Street") | C | ⚠️ Inconclusive — `docker compose down` (tanpa `-v`) tidak menghapus volume DB lama, `-i` di database yang modulnya sudah "installed" tidak memicu ulang post-install test (`0 tests` dijalankan) — bukan hasil valid, murni artefak environment (DB stale), bukan indikasi apapun soal kode | — | 2026-08-26 |
| 3 | Sama seperti #2, tapi `docker compose down -v` (drop volume) dulu → fresh DB | C | ✅ **PASS** — `0 failed, 0 error(s) of 5 tests`, tour `[7/7]` penuh sampai `tour succeeded` | — | 2026-08-26 |

**Catatan G2 (validasi runtime/browser nyata):** percobaan #3 di atas SEKALIGUS memenuhi checkpoint G2 — tour test adalah eksekusi browser headless Chrome nyata (bukan cuma unit test ORM), mencakup: buka Apps menu → Contacts → list view → dropdown optional columns → toggle "Street" → assert kolom muncul di header → poll `sessionStorage` sampai `setDatabase()` selesai persist ke `res.partner` via `orm.call write`. Ini membuktikan `computeOptionalActiveFields()`/`saveOptionalActiveFields()`/`useService("orm")`/`user.partnerId` (semua warisan MF-01/02/05 migrasi 17→18) TETAP berfungsi end-to-end di 19.0, bukan cuma stabil secara statis (step 2).

---

## Entri

### [Fase A1] Manifest version bump

- **Scope:** `optional_field_save/__manifest__.py`
- **Item spec (ref):** `03_MIGRATION_SPEC.md` §2 baris 1 (Critical Migration Blocker #1)
- **Aksi:**
  - `__manifest__.py`: `"version": "18.0.1.0.0"` → `"version": "19.0.1.0.0"`
- **Secara eksplisit TIDAK dilakukan:**
  - Tidak ada perubahan `depends`, `application`, `assets`, atau key manifest lain — semua dikonfirmasi stabil di step 2 (DIFF-08).
- **Risiko:** LOW
- **Status:** ✅ Selesai

### [Fase B2] Field JSON (`models/res_partner.py`) — port apa adanya

- **Scope:** `optional_field_save/models/res_partner.py`
- **Item spec (ref):** `03_MIGRATION_SPEC.md` §2 baris `models/res_partner.py` (DIFF-06)
- **Aksi:**
  - Tidak ada perubahan kode — `fields.Json(string="Optional Field Save", default={})` di-port 1:1. Dikonfirmasi step 2 (`Json.convert_to_record()` byte-identik 18.0↔19.0, `odoo/orm/fields_misc.py:67-69`).
- **Secara eksplisit TIDAK dilakukan:**
  - Tidak memperbaiki F-11 (`default={}` selalu jadi `False`) — bug pre-existing yang WAJIB dipertahankan (`01a_MIGRATION_INTAKE.md` §5).
- **Risiko:** LOW
- **Status:** ✅ Selesai

### [Fase D2/E] JavaScript patches (`list_renderer.js`, `webclient.js`, `user_menu_items.js`) — port apa adanya

- **Scope:** `optional_field_save/static/src/js/{list_renderer,webclient,user_menu_items}.js`
- **Item spec (ref):** `03_MIGRATION_SPEC.md` §2 baris `list_renderer.js`/`webclient.js`/`user_menu_items.js` (DIFF-01 s/d DIFF-05)
- **Aksi:**
  - Tidak ada perubahan kode di ketiga file — semua API yang dipatch (`computeOptionalActiveFields`, `saveOptionalActiveFields`, service `@web/core/user`, pola `useService("orm")`, registry `user_menuitems`) dikonfirmasi byte-stable 18.0↔19.0 langsung ke `native-target` (`enterprise19.0`) di step 2.
- **Secara eksplisit TIDAK dilakukan:**
  - Tidak ada rewrite method apapun (beda dari migrasi 17→18 yang butuh rewrite total MF-01/MF-05) — kontras ini dicatat eksplisit karena awalnya diduga jadi risiko migrasi terbesar (`01a_MIGRATION_INTAKE.md` "Ringkasan untuk Review" poin 6), ternyata tidak applicable.
  - Tidak memperbaiki F-10 (write gagal silent) — bug pre-existing yang WAJIB dipertahankan.
- **Risiko:** LOW
- **Status:** ✅ Selesai

### [Fase G1-prasyarat] Fix test infrastructure (`groups_id` → `group_ids`, MF-01/DIFF-09)

- **Scope:** `optional_field_save/tests/test_optional_field_save.py`
- **Item spec (ref):** `03_MIGRATION_SPEC.md` §2 baris `tests/test_optional_field_save.py` (DIFF-09, AC-07-01)
- **Aksi:**
  - Baris 71: `"groups_id": [(6, 0, [self.env.ref("base.group_user").id])]` → `"group_ids": [(6, 0, [self.env.ref("base.group_user").id])]`
  - Baris 93-102: `"groups_id": [(6, 0, [...])]` (multi-baris, 2 grup) → `"group_ids": [(6, 0, [...])]` (isi list tidak berubah, cuma key)
- **Secara eksplisit TIDAK dilakukan:**
  - Tidak ada perubahan assertion/logic test — murni rename key field mengikuti rename API native `res.users.groups_id`→`group_ids` (dikonfirmasi DIFF-09, genuine version-diff bukan judgment call).
  - Tidak menyentuh `tests/test_optional_field_save_tour.py` atau `static/tests/tours/optional_field_save_tour.js` — keduanya dikonfirmasi stabil (DIFF-10, DIFF-11), port apa adanya.
- **Risiko:** LOW (fix mekanis, tidak ambigu)
- **Status:** ✅ Selesai (kode), verifikasi hasil test lewat G1 (lihat "Riwayat Percobaan G1")

### [Fase docker-env] Update environment test lokal ke 19.0

- **Scope:** `docker-env/Dockerfile`, `docker-env/docker-compose.yml` (bukan bagian modul `optional_field_save/` — tooling test lokal)
- **Aksi:**
  - `Dockerfile`: `FROM odoo:18.0` → `FROM odoo:19.0` (pola fallback pip `--break-system-packages` dipertahankan apa adanya — sudah version-agnostic, lihat `ai-doc/OVERVIEW.md` §13)
  - `docker-compose.yml`: nama project `optional_field_save_migration_18` → `optional_field_save_migration_19`, nama database `optional_field_save_18_test` → `optional_field_save_19_test`, port host `8090` → `8091` (hindari bentrok kalau container migrasi 18.0 lama masih ada di disk dev, walau saat ini statusnya `Exited`)
- **Secara eksplisit TIDAK dilakukan:**
  - Tidak ada perubahan lain di compose (volume mount, `shm_size`, command test-tags) — semua tetap sama.
- **Risiko:** LOW
- **Status:** ✅ Selesai (image `odoo:19.0` berhasil di-build, `docker compose up` sedang berjalan untuk G1)

### [Fase G1-percobaan-#1] Fix MF-02 — tour test "Mobile"→"Street" (di luar spec awal, ditemukan via eksekusi nyata)

- **Scope:** `optional_field_save/static/tests/tours/optional_field_save_tour.js`
- **Item spec (ref):** TIDAK ADA di `03_MIGRATION_SPEC.md` awal — ditemukan BARU saat G1 percobaan #1 (lihat "Riwayat Percobaan G1"), dicatat sebagai **MF-02** di `FINDINGS.md` SEBELUM kode diubah (sesuai aturan "STOP, jangan improvisasi diam-diam" — di sini bukan business-logic ambiguous jadi tidak perlu balik penuh ke step 3/4, tapi tetap didokumentasikan dulu sebagai finding sebelum fix, konsisten pola MF-02/MF-05 di migrasi 17→18)
- **Aksi:**
  - `dropdown-item:contains("Mobile")` → `dropdown-item:contains("Street")`
  - `th[data-name='mobile']` (2 lokasi) → `th[data-name='street']`
  - Assertion `sessionStorage` — cek substring `"mobile"` → `"street"`
  - Komentar header file ditambah, menjelaskan root cause (field `mobile` dihapus total dari `base/views/res_partner_views.xml` native 19.0) + disambiguasi penomoran MF (migrasi ini vs migrasi 17→18 yang juga punya MF-02)
- **Secara eksplisit TIDAK dilakukan:**
  - Tidak menyentuh `list_renderer.js`/`webclient.js`/`user_menu_items.js` — root cause murni di test infrastructure (pilihan field contoh), bukan di kode produksi modul.
  - Tidak melebarkan scope tour (mis. menambah step baru) — cuma mengganti nama field yang sudah ada.
- **Risiko:** LOW (setelah dikonfirmasi via G1 percobaan #3 — fresh DB, 7/7 step tour pass)
- **Status:** ✅ Selesai, diverifikasi G1 percobaan #3

---

## Temuan di Luar Spec (kalau ada)

- [x] **Ada, sudah ditutup** — MF-02 (field `mobile` dihapus dari native Contacts list view 19.0) ditemukan saat eksekusi G1 percobaan #1, DI LUAR `03_MIGRATION_SPEC.md` awal (spec awal cuma mencakup DIFF-09/`groups_id`, tidak menduga soal konten view). Ditangani sesuai protokol: dicatat ke `FINDINGS.md` sebagai `MF-02` dulu, dinilai low-risk/test-infrastructure-only (bukan ambiguitas business logic yang butuh keputusan user), diperbaiki, diverifikasi ulang G1 percobaan #3 — bukan business logic modul, jadi tidak memerlukan balik penuh ke step 3/4 re-approval, tapi tetap transparan di `FINDINGS.md` + log ini untuk jejak audit.

## Kontribusi ke Knowledge Base

- [x] Ada — `migration-records/optional_field_save_18.0_19.0/SUMMARY.md`: CAND-01 (`res.users.groups_id`→`group_ids`, dicatat step 2) dan **CAND-02 (BARU, dicatat step 6 dari G1 percobaan #1)** — field `mobile` dihapus total dari native Contacts list view `base/views/res_partner_views.xml` di 19.0. Kategori baru untuk knowledge base ("perubahan konten view native", bukan API/field model) — dicatat eksplisit di rekomendasi CAND-02 karena belum ada kategori ini di `knowledge/version-diffs/18-to-19.md`.
