# Cross-Version Compare — optional_field_save

**Sifat:** Cross-cutting, BUKAN bagian dari 11-step alur migrasi (bukan "Step 12").
**Dipicu dari:** Titik B (independen) — dev eksplisit minta setelah MF-05 (bug logout) lolos dari
SEMUA step statis (2/3/8) dan cuma ketemu lewat verifikasi visual/live manual di step 10. Modul ini
TIDAK masuk kriteria wajib Titik A (single module, tidak ada Enterprise, cuma 5 `MF-NNN` — di bawah
ambang 10) — dijalankan atas permintaan eksplisit dev, bukan otomatis.
**Tanggal:** 2026-09-21

---

## 1. Setup Environment

Dua instance Odoo hidup BERSAMAAN (sesuai Prinsip 1):

| Versi | Peran | Image | Port | Sumber kode modul |
|---|---|---|---|---|
| 19.0 | Source (baseline pembanding) | `odoo:19.0` (image resmi Docker Hub, tersedia — beda dari 20.0) | `8092` | `git archive origin/migration/19.0 -- optional_field_save` (export bersih, read-only, TIDAK menyentuh working tree `target-codebase`) |
| 20.0 | Target (hasil migrasi) | build-from-source `native-target` (`odoo20`) — lihat `docker-env/Dockerfile` | `8091` | `target-codebase` saat ini (branch `migration/20.0`) |

Database `--without-demo=all` di kedua instance (data bersih, perbandingan apple-to-apple).
Environment 19.0 dibuat sementara di scratchpad sesi (`docker-compose.yml` ad-hoc, ditutup setelah
compare selesai — TIDAK menjadi bagian permanen `docker-env/` project ini, beda dari environment 20.0
yang permanen untuk G1/step 9).

## 2. Enumerasi Scope

Single module, 2 versi langsung (tidak ada versi antara) — seluruh permukaan UI modul:
1. Load & restore preferensi (webclient mount)
2. Toggle kolom optional + persist ke DB
3. Self-write ACL (`base.group_user` biasa vs `group_partner_manager`)
4. Cleanup logout

## 3. Static-Diff (Prinsip 3 — dilakukan SEBELUM live-test)

`diff -ru` (dengan `--strip-trailing-cr` untuk mengabaikan noise CRLF/LF `git archive` vs working
tree Windows) antara export 19.0 dan `target-codebase` 20.0 saat ini:

| File | Beda? | Isi beda | Klasifikasi |
|---|---|---|---|
| `__manifest__.py` | Ya | `version` 19.0.1.0.0→20.0.1.0.0; baris baru `optional_field_save_logout_tour.js` di `web.assets_tests` | Perubahan disengaja (bagian migrasi, sudah terdokumentasi) |
| `static/src/js/user_menu_items.js` | Ya | DIFF-02 (hapus dead import) + DIFF-08 (fix logout POST) | Perubahan disengaja, sudah terdokumentasi |
| `README.md`, `LISEZMOI.md` | Ya | Versi Odoo basi diperbaiki (Fase A6) | Perubahan disengaja, sudah terdokumentasi |
| `tests/__init__.py`, `tests/test_optional_field_save.py` | Ya | Test baru ditambahkan (self-write, logout tour) | Perubahan disengaja, sudah terdokumentasi |
| **`models/res_partner.py`, `static/src/js/list_renderer.js`, `static/src/js/webclient.js`, `static/tests/tours/optional_field_save_tour.js`, `controllers/controllers.py`, `security/ir.model.access.csv`, `__init__.py` (root+submodule)** | **TIDAK** (setelah `--strip-trailing-cr`) | — | **Dikonfirmasi byte-identik** — klaim "TIDAK diubah sama sekali" di `06c_IMPLEMENTATION_LOG.md` Fase E TERVERIFIKASI benar, bukan asumsi |

**Kesimpulan static-diff: BERSIH.** Tidak ada satupun perubahan kode yang tidak tertelusuri ke
dokumentasi migrasi yang sudah ada. Static-diff TIDAK menemukan kandidat regresi baru — konsisten
dengan sifat MF-05 (bug logout) yang akar masalahnya BUKAN di kode modul, tapi di kontrak native yang
berubah (tidak kelihatan dari diff kode modul semata, cuma kelihatan dari live-test).

## 4. Live-Test & Visual Pass (Prinsip 4/5)

Dijalankan side-by-side di kedua instance (built-in browser, login admin):

| Skenario | 19.0 (source) | 20.0 (target) | Match? |
|---|---|---|---|
| Login page | Layout identik (placeholder "Your logo") | Layout identik | ✅ Match |
| Contacts list view — kolom default | Email, Phone, Activities, Country tampil | Sama | ✅ Match |
| Dropdown kolom optional — isi | Tax ID, Email, Phone, Salesperson, Activities, Street, City, State, Country, Stats, Tags | **Tax ID, Email, Phone, Salesperson, Activities, Street, City, State, Country, Stats, Tags, DAN `Created on`** | ⚠️ **Beda — lihat RMV-01 di bawah** |
| Toggle kolom "Street" | Muncul di tabel, `sessionStorage` terisi `"...,street,..."` | Sama persis | ✅ Match |
| **Logout (admin)** | **Redirect bersih ke `/web/login`, TIDAK ADA error** | **SEBELUM fix: `405 Method Not Allowed`. SETELAH fix: redirect bersih, sama seperti 19.0** | ⚠️→✅ **Lihat RMV-02 (= MF-05) di bawah — dikonfirmasi A/B langsung, bukan cuma baca kode** |
| Cleanup `sessionStorage` setelah logout | Key `optional_field.*` terhapus | Sama (setelah fix) | ✅ Match |

## 5. Temuan & Klasifikasi

### RMV-01 — Native menambah opsi kolom "Created on" di Contacts list (20.0), tidak ada di 19.0
**Klasifikasi:** `NATIVE-DIFF` — redesign/penambahan native Odoo (Contacts app), disengaja upstream,
tidak terkait modul ini sama sekali (modul tidak pernah menyentuh definisi kolom `create_date`).
**Tindak lanjut:** Tidak difix, tidak ada dampak ke modul — dicatat murni untuk kelengkapan visual
pass. Konsisten Prinsip 2 (bukan area custom).

### RMV-02 — Logout 405 Method Not Allowed di 20.0 (= MF-05/DIFF-08, dikonfirmasi ulang via A/B langsung)
**Klasifikasi:** `REGRESI` — CLOSED sebelum cross-version compare ini dimulai (ditemukan &
difix di step 10 sebelum sesi ini). Cross-version compare ini MENGKONFIRMASI ULANG lewat perbandingan
langsung side-by-side (19.0 logout bersih vs 20.0 sebelum-fix 405 vs 20.0 setelah-fix bersih) —
bukti tambahan independen bahwa root cause genuinely spesifik ke kontrak `/web/session/logout` 20.0,
bukan faktor lain (konfigurasi environment, dst). **Cross-link:** `FINDINGS.md` MF-05,
`02_DIFF_ANALYSIS.md` DIFF-08.
**Tindak lanjut:** Sudah fix, tidak ada aksi tambahan.

### RMV-03 — ACL self-write `res.partner` berubah 19.0→20.0 (= MF-01/DIFF-03, TIDAK diulang live di sesi ini)
**Klasifikasi:** `NATIVE-DIFF` (bukan bug modul — ACL native `base` yang berubah, sudah dikonfirmasi
2 putaran empiris sebelumnya via `TransactionCase`, BUKAN via browser).
**Catatan:** Cross-version compare sesi ini TIDAK mengulang skenario ini via browser (sudah punya
bukti eksekusi nyata kuat dari step 6/8 — `TransactionCase` terhadap Odoo hidup, bukan mock).
Diputuskan tidak perlu duplikasi verifikasi untuk skenario yang provenance-nya sudah
`[DIKONFIRMASI]` kuat. **Cross-link:** `FINDINGS.md` MF-01, `02_DIFF_ANALYSIS.md` DIFF-03.

**Tidak ada temuan `PERLU-DEV`** — semua temuan terklasifikasi jelas (`NATIVE-DIFF` x2, `REGRESI` x1
yang sudah closed).

## 6. Laporan Penutup

- **3 finding** (`RMV-01`, `RMV-02`, `RMV-03`) — 0 baru yang belum pernah tercatat (RMV-02/03
  cross-link ke MF-05/MF-01 existing), 1 genuinely baru (`RMV-01`, native-diff kosmetik, tidak
  actionable).
- **Tidak ada gap yang tersisa terbuka** dari proses ini — static-diff bersih, live-test/visual pass
  mengonfirmasi ulang temuan existing DAN tidak menemukan regresi baru yang belum tertangkap.
- **Rekomendasi human QA sebelum go-live produksi:** tidak ada tambahan di luar yang sudah
  direkomendasikan di `10_BUSINESS_FLOW_MIGRATION.md`/`human_qa/`. Proses cross-version compare ini
  MEMPERKUAT confidence bahwa migrasi sudah genuinely lengkap — bukan menemukan celah baru yang
  butuh ditutup sebelum Step 11.
- **Nilai proses ini:** membuktikan secara independen (metodologi berbeda — 2 environment hidup
  bersamaan, bukan baca kode/single-environment test) bahwa (a) tidak ada regresi kode modul yang
  terlewat, (b) MF-05 genuinely spesifik ke perubahan kontrak native 20.0 (dikonfirmasi A/B), (c)
  satu-satunya perbedaan visual yang ditemukan (RMV-01) murni kosmetik native, tidak terkait modul.

## Kontribusi ke Knowledge Base

- [x] Tidak ada temuan baru yang perlu dicatat sebagai kandidat knowledge — RMV-02/RMV-03 sudah
  tercatat sebagai kandidat di `migration-records/optional_field_save_19.0_20.0/SUMMARY.md` (lewat
  MF-05/MF-01 asalnya). RMV-01 murni kosmetik native, tidak general/actionable untuk dicatat sebagai
  kandidat knowledge dependency/version-diff.
