# Dev Testing — optional_field_save

**Step:** 9 — Dev Testing (gate)
**Ref:** `05_acceptance/05a_MIGRATION_ACCEPTANCE_CRITERIA.md`, `05_acceptance/05b_TEST_PLAN_MIGRATION.md`, `01_intake/01b_BASELINE_SPEC.md`
**Tanggal:** 2026-09-21

---

> **Eksekusi resmi lewat `docker-env/run-test.sh`** (diinstansiasi sesi ini dari
> `templates/run-test.sh.template`) — bukan `docker compose up`/`odoo-bin` mentah. Command:
> `./run-test.sh odoo optional_field_save_20_test optional_field_save`, dijalankan dari `docker-env/`.
> Wrapper ini otomatis `down -v` sebelum run (mencegah 2 pola false-pass yang SUDAH ditemukan sesi ini
> di step 6/8: MSYS tag-mangling DAN DB stale) dan sanity-check jumlah "Starting" line.

## 9a. Audit Kesiapan Test

Diaudit dengan baca isi tiap method (bukan `grep -c "def test_"`) — semua method dikonfirmasi
berisi assertion nyata, tidak ada stub.

| AC | Deskripsi | File test | Status | Catatan |
|---|---|---|---|---|
| AC-01-01/02/03 | Load & restore preferensi | `test_optional_field_save_tour.py::test_optional_field_save_tour` (delegasi ke tour JS) | ✅ Lengkap | Tour meng-cover write path penuh; load path (webclient.js) diverifikasi tidak langsung (lihat komentar di tour JS file) |
| AC-02-01/02/03 | Toggle & simpan preferensi | `test_optional_field_save.py::test_write_and_read_roundtrip_matches_js_pattern` | ✅ Lengkap | `assertEqual` round-trip dict non-kosong |
| AC-05-01 | `default={}` → `False` | `test_optional_field_save.py::test_new_partner_default_is_falsy_not_empty_dict` | ✅ Lengkap | `assertFalse` |
| **AC-05-02** | **Self-write `base.group_user` (skenario relevan: partner MILIK SENDIRI)** | `test_optional_field_save.py::test_plain_internal_user_can_write_own_partner_record` (**BARU, ditambahkan step 8** setelah gap ditemukan pada test warisan) | ✅ Lengkap | `write()` + `assertEqual` — mereplikasi persis pola `setDatabase()` (`orm.call` ke `user.partnerId`) |
| AC-05-02 (companion, skenario TIDAK relevan tapi tetap valid diuji) | Write ke partner TAK TERKAIT tetap ditolak | `test_optional_field_save.py::test_plain_internal_user_cannot_write_own_partner_field` (warisan 17.0) | ✅ Lengkap | `assertRaises(AccessError)` — TIDAK diedit, skenarionya beda (bukan self) tapi tetap valid sebagai regresi "write ke record tak terkait tetap ditolak" |
| AC-05-03 | Self-write `group_partner_manager` | `test_optional_field_save.py::test_user_with_partner_manager_group_can_write` | ✅ Lengkap | `assertEqual` |
| AC-03-01/02 | Cleanup logout | ~~*(tidak ada test otomatis)*~~ **`test_optional_field_save_logout_tour.py::test_optional_field_save_logout_tour` (BARU, ditambahkan step 10 setelah bug nyata ditemukan — lihat FINDINGS.md MF-05)** | ✅ Lengkap | **⚠️ REVISI RETROAKTIF:** audit ini AWALNYA (baris di atas, saat pertama ditulis) menandai "Tidak ada" dan menilai risikonya rendah — itu KELIRU. Verifikasi visual/live manual (dipaksa dev) menemukan logout RUSAK TOTAL (405) yang tidak pernah tertangkap justru KARENA ketiadaan test ini. Gap ditutup permanen. |

**Verdict audit (REVISI):**
- [x] Semua AC prioritas tinggi (AC-05-02, AC-03 setelah revisi) berstatus **Lengkap** — lanjut ke eksekusi.
- [x] ~~AC-03 (cleanup logout) berstatus "Tidak ada" tapi BUKAN prioritas tinggi/risiko migrasi~~ —
  **PENILAIAN AWAL INI SALAH.** AC-03 TERNYATA prioritas tinggi (satu-satunya jalur di modul yang
  benar-benar rusak di 20.0) — ketiadaan test justru yang menyembunyikan bug MF-05 sampai step 10.
  Pelajaran: "tidak disentuh DIFF manapun di step 2/3" TIDAK BOLEH otomatis dibaca sebagai "risiko
  rendah, aman diloloskan tanpa test" — DIFF-08 sendiri baru ketahuan SETELAH step 2/3 selesai.

## Baseline

- Characterization test / test asli source module: `tests/test_optional_field_save.py` +
  `tests/test_optional_field_save_tour.py`, keduanya sudah ada di `source-codebase` (branch
  `migration/19.0`, dari proses BACKFILL — lihat `doc-dev/backfill/`), dikonfirmasi byte-identik
  18.0↔19.0 kecuali rename `groups_id`→`group_ids` (`01b_BASELINE_SPEC.md` §0). Tidak ada
  characterization test di lokasi terpisah lain (dikonfirmasi intake §4a — tidak ada dokumen
  pelengkap lain di luar repo ini).
- Applicability Check Fase E (Owl/JS) dari step 6: **Ya, applicable** — tour test
  (`optional_field_save_tour.js` + `test_optional_field_save_tour.py`) WAJIB ada di run ini, sudah
  terdaftar di `tests/__init__.py`.

## Hasil Unit, Integration & Tour Test (target-codebase)

> Dieksekusi via `run-test.sh` (Mode C — shell persisten, Claude Code CLI). Hasil final berikut adalah
> gabungan dari BEBERAPA kali eksekusi sesi ini (step 6/8/9 awal + step 10 setelah bug MF-05 ditemukan
> & ditutup dengan test baru — lihat `06c_IMPLEMENTATION_LOG.md` "Riwayat Percobaan G1" untuk kronologi
> lengkap, termasuk 2 gotcha operasional dan 1 percobaan gagal karena tour framework butuh
> `expectUnloadPage: true`). Angka di tabel ini adalah hasil run BERSIH (fresh DB) TERAKHIR — 9 test.

| AC | Unit | Integration | Tour (Owl/JS) | Pass/Fail | Catatan |
|---|---|---|---|---|---|
| AC-01-01/02/03 | — | — | `test_optional_field_save_tour` | ✅ Pass | Tour 7/7 langkah "tour succeeded" |
| AC-02-01/02/03 | `test_write_and_read_roundtrip_matches_js_pattern` | (sama, integration nyata) | (dicek juga tour langkah 5-7) | ✅ Pass | — |
| AC-05-01 | `test_new_partner_default_is_falsy_not_empty_dict` | (sama) | — | ✅ Pass | — |
| **AC-05-02** | `test_plain_internal_user_can_write_own_partner_record` | (sama) | — | ✅ Pass | **Write berhasil — BSL-010 tidak lagi silent-fail untuk skenario nyata, lihat FINDINGS.md MF-01** |
| AC-05-02 (companion, partner tak terkait) | `test_plain_internal_user_cannot_write_own_partner_field` | (sama) | — | ✅ Pass | AccessError tetap terjadi (skenario ini tidak terpengaruh DIFF-03) |
| AC-05-03 | `test_user_with_partner_manager_group_can_write` | (sama) | — | ✅ Pass | — |
| **AC-03-01/02 (BARU, step 10)** | — | — | `test_optional_field_save_logout_tour` | ✅ Pass | **Menutup MF-05/DIFF-08 permanen** — klik "Log out" nyata (headless Chrome), assert landing di `#login` (bukan halaman 405). Butuh `expectUnloadPage: true` di step yang memicu navigasi (percobaan pertama gagal karena lupa flag ini, BUKAN karena fix-nya salah — log HTTP sudah membuktikan 303→200 valid) |
| **(sanity check wrapper)** | — | — | — | ✅ Pass | `run-test.sh` konfirmasi ≥1 baris "Starting" per test — bukan false-pass MSYS/DB-stale |

**Total: 9 test method, 0 failed, 0 error.** (Lihat log lengkap hasil run resmi di bawah entri ini — diproduksi `run-test.sh` sesi ini.)

## Kontribusi ke Knowledge Base

- [x] Ada — sudah dicatat di `migration-records/optional_field_save_19.0_20.0/SUMMARY.md`:
  - Sub-temuan ACL `ir.access` (self-write, pelajaran metodologis test regresi security)
  - Gotcha operasional Docker (`down -v` wajib sebelum rerun, di luar yang sudah diantisipasi
    `run-test.sh.template` versi MSYS — **kandidat perbaikan template itu sendiri**, lihat catatan
    di bawah)

**Catatan tool-fix (bukan migrasi modul ini — untuk sesi curation/maintenance `migration-tool`
terpisah):** `run-test.sh.template` versi asli SUDAH mengantisipasi false-pass akibat MSYS tag-mangling,
TAPI belum mengantisipasi false-pass akibat DB stale (`-i` no-op kalau database sudah pernah diinstall
sebelumnya) — gotcha KEDUA ini ditemukan sesi ini (lihat `06c_IMPLEMENTATION_LOG.md`). `run-test.sh`
project ini SUDAH ditambal (`docker compose down -v` otomatis di awal script) — kalau ini mau
dipromosikan balik ke `run-test.sh.template` supaya project migrasi lain juga terlindungi, itu keputusan
curation terpisah, bukan bagian migrasi modul ini.

## Verdict

- [x] ✅ Semua AC prioritas Unit/Integration/Tour pass — lanjut ke step 10
- [ ] ❌ Ada yang gagal
