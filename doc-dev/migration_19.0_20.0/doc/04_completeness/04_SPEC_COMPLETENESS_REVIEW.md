# Spec Completeness Review — optional_field_save

**Step:** 4 — Spec Completeness Review (gate)
**Ref:** `03_spec/03_MIGRATION_SPEC.md`, `01_intake/01b_BASELINE_SPEC.md`, source module (`optional_field_save/`, byte-identik dengan `source-codebase` per `01b_BASELINE_SPEC.md` §0)
**Tanggal:** 2026-09-21

> Tujuan: pastikan `03_MIGRATION_SPEC.md` mencakup 100% elemen source module — bukan review
> kualitas kode (itu step 8). Enumerasi semua elemen modul dari `source-codebase`, cocokkan
> satu-satu ke spec.

---

## Tabel Cakupan

Enumerasi lengkap dari `find optional_field_save -type f` (semua file modul, tidak ada yang dilewat).

| Elemen source module | Ada di Migration Spec? | Status | Catatan |
|---|---|---|---|
| `__manifest__.py` | Ya — §2 baris "version", §2b Critical Blocker #1 | ✅ Covered | Version bump `19.0.1.0.0`→`20.0.1.0.0`, `depends`/`assets` dikonfirmasi tidak berubah (§2b Assets & Dependency) |
| `__init__.py` (root) | Tidak eksplisit disebut, tapi tidak ada isi yang perlu diubah (cuma `from . import models, controllers`) | ✅ Covered (implisit) | File boilerplate, tidak ada simbol yang terpengaruh DIFF manapun — tidak perlu baris terpisah |
| `models/__init__.py` | Sama seperti di atas | ✅ Covered (implisit) | Boilerplate (`from . import res_partner`) |
| `models/res_partner.py` | Ya — §2 baris `fields.Json`, §2b Kompatibilitas Data Model #1 & #2 | ✅ Covered | DIFF-06 (default={}, tidak berubah) + DIFF-03 (ACL berubah, TIDAK butuh ubah kode model tapi berdampak ke test — lihat baris test di bawah) |
| `controllers/__init__.py` | Sama seperti di atas | ✅ Covered (implisit) | Boilerplate |
| `controllers/controllers.py` | Ya — §2b "Controller & Route" | ✅ Covered | Dikonfirmasi dead/kosong total (BSL-012), tidak ada yang perlu dimigrasi |
| `security/ir.model.access.csv` | **Awalnya TIDAK ada baris eksplisit** | ⚠️ Gap ditemukan → **diperbaiki di bawah** | Lihat "Gap Ditemukan & Diperbaiki" #1 |
| `static/src/js/list_renderer.js` | Ya — §2 baris list_renderer, §2b Risiko Integrasi #1 | ✅ Covered | DIFF-01 (list_optional_show, port as-is), DIFF-03 (setDatabase, tidak diubah), DIFF-04/DIFF-05 (patch/user.partnerId, tidak berubah) |
| `static/src/js/webclient.js` | Ya — §2 baris "list_renderer.js/webclient.js", §2b DIFF-04/05 | ✅ Covered | Sama seperti list_renderer.js untuk bagian `patch()`/`user.partnerId`/`require()` |
| `static/src/js/user_menu_items.js` | Ya — §2 baris user_menu_items.js, §2b Critical Blocker #2, Risiko Integrasi #2 | ✅ Covered | DIFF-02 (fix wajib: hapus dead import) |
| `static/tests/tours/optional_field_save_tour.js` | Ya — §2 baris tour, §2b Urutan Prioritas Testing #6 | ✅ Covered | DIFF-07, tidak berubah |
| `tests/__init__.py` | Sama seperti boilerplate lain | ✅ Covered (implisit) | Boilerplate |
| `tests/test_optional_field_save.py` | **Awalnya TIDAK disebut eksplisit di §2/§2b** meski isinya method test `test_plain_internal_user_cannot_write_own_partner_field` LANGSUNG terdampak DIFF-03 | ⚠️ Gap ditemukan → **diperbaiki di bawah** | Lihat "Gap Ditemukan & Diperbaiki" #2 — INI gap paling signifikan di review ini |
| `tests/test_optional_field_save_tour.py` | Tidak eksplisit disebut, tapi dicek: `HttpCase`, `start_tour()`, `tagged` — semua dikonfirmasi masih ada persis di `odoo/tests/common.py` 20.0 (baris 1305, 2603, 2981, 3137) | ✅ Covered (setelah verifikasi tambahan sesi ini) | Tidak ada breaking change API test framework yang relevan |
| `LICENSE` | N/A | ✅ Covered (N/A) | Bukan kode, tidak terpengaruh migrasi versi |
| `LISEZMOI.md` | N/A | ✅ Covered (N/A) | Dokumentasi, bukan kode |
| `README.md` | N/A | ✅ Covered (N/A) | Dokumentasi, bukan kode |
| `googleaeed8a7b9ec156e7.html` | N/A (BSL-013, F-05) | ✅ Covered (N/A) | File statis nyasar, di luar scope migrasi (dikonfirmasi intake §5) |
| `static/description/*` (png, index.html) | N/A | ✅ Covered (N/A) | Asset listing Apps store, tidak ada kode yang terpengaruh versi Odoo |

## Gap Ditemukan & Diperbaiki (sesi ini, sebelum gate diputuskan)

1. **`security/ir.model.access.csv` tidak disebut eksplisit di migration spec.** Setelah dicek ulang:
   file ini dikonfirmasi dead (BSL-011, tidak ada key `data` di manifest, tidak pernah di-load Odoo)
   — SAMA persis di 19.0 dan 20.0 (tidak ada mekanisme yang membuatnya tiba-tiba ter-load di 20.0,
   `data`/`assets` key manifest tidak berubah). **Tidak perlu tambahan baris di migration spec** —
   status "di luar scope" sudah cukup terwakili lewat referensi BSL-011 di `01b_BASELINE_SPEC.md`
   §8 dan intake §5. Diputuskan: bukan gap yang butuh perbaikan spec, cukup dicatat di sini sebagai
   bukti sudah dicek (bukan terlewat).
2. **`tests/test_optional_field_save.py::test_plain_internal_user_cannot_write_own_partner_field`
   tidak direferensikan eksplisit padahal LANGSUNG terdampak DIFF-03.** Ini GAP NYATA — migration
   spec versi awal cuma menyebut BSL-010 secara umum ("verifikasi eksekusi nyata BSL-010") tanpa
   menyebut file/baris test konkret yang kemungkinan besar akan GAGAL saat step 9 dijalankan.
   **Diperbaiki:** `03_MIGRATION_SPEC.md` §2b "Kompatibilitas Data Model" baris #2 diedit ulang
   (sesi ini) untuk menyebut eksplisit `tests/test_optional_field_save.py` baris 56-83 (test yang
   berisiko gagal) dan baris 85-112 (companion test yang kemungkinan tetap PASS), plus keputusan
   eksplisit "cara menangani ditunda sampai step 9 (butuh hasil eksekusi nyata)". Re-cek setelah
   edit: sekarang ✅ Covered.

## Verdict

- [x] ✅ **Lulus** — semua elemen Covered (2 gap ditemukan sesi ini, keduanya sudah diperbaiki/diverifikasi di atas SEBELUM verdict ini ditulis — bukan gap yang dibawa ke step 5 dalam kondisi terbuka). Lanjut ke Step 5 (Acceptance Criteria & Test Plan).
- [ ] ❌ Ditolak

**Catatan untuk Step 5:** Acceptance criteria untuk BSL-010 WAJIB memperhitungkan kemungkinan
`test_plain_internal_user_cannot_write_own_partner_field` gagal karena perubahan ACL native (DIFF-03,
MF-01) — bukan karena regresi migrasi. Test plan harus punya jalur eksplisit untuk kedua kemungkinan
hasil eksekusi nyata (AccessError masih terjadi / tidak lagi terjadi), bukan cuma satu asumsi.
