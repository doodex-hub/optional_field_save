# Spec Completeness Review — optional_field_save

**Step:** 4 — Spec Completeness Review (gate)
**Ref:** `03_spec/03_MIGRATION_SPEC.md`, source module (`origin/migration/18.0`, branch ini sebelum perubahan step 6)
**Tanggal:** 2026-08-26

> Tujuan: pastikan `MIGRATION_SPEC.md` mencakup 100% elemen source module — bukan review
> kualitas kode (itu step 8). Enumerasi semua elemen modul dari `source-codebase`, cocokkan
> satu-satu ke spec.

---

## 0. FINDINGS.md Check (WAJIB, lihat `ai-doc/OVERVIEW.md` §11)

- [x] `doc/FINDINGS.md` dibaca — 1 entry terbuka (MF-01, `groups_id`→`group_ids`), tag `[GAP-MIGRASI]`, sudah tercakup di `03_MIGRATION_SPEC.md` §2 (baris `tests/test_optional_field_save.py`). Tidak ada finding lain yang masih `[PERLU-KEPUTUSAN]` tanpa arah jelas.

## Tabel Cakupan

Enumerasi LENGKAP file/folder di `optional_field_save/` (dari `git ls-tree -r origin/migration/18.0 --name-only -- optional_field_save/`, dikonfirmasi 23 file):

| Elemen source module | Ada di Migration Spec? | Status | Catatan |
|---|---|---|---|
| `__init__.py` (root) | Tidak eksplisit — port apa adanya | ✅ Covered | Cuma `from . import controllers, models`, tidak ada logic, tidak ada perubahan versi terkait |
| `__manifest__.py` | §2 baris 1 | ✅ Covered | Bump version → `19.0.1.0.0` |
| `controllers/__init__.py` | §2b "Controller & Route" | ✅ Covered | Port apa adanya (import dead file) |
| `controllers/controllers.py` | §2b "Controller & Route" | ✅ Covered | Dead file, tidak ada route — dikonfirmasi N/A |
| `models/__init__.py` | Tidak eksplisit — port apa adanya | ✅ Covered | Cuma `from . import res_partner` |
| `models/res_partner.py` | §2 baris `models/res_partner.py`, §2b "Kompatibilitas Data Model" | ✅ Covered | `fields.Json` stabil (DIFF-06) |
| `security/ir.model.access.csv` | §2 baris "dead artifact" | ✅ Covered | Di luar scope (housekeeping), port apa adanya |
| `static/description/assets/doodex_odoo.png` | §2 baris "File lain" | ✅ Covered | Asset statis, tidak disentuh |
| `static/description/assets/optional_field_save.png` | §2 baris "File lain" | ✅ Covered | Asset statis, tidak disentuh |
| `static/description/banner.png` | §2 baris "File lain" | ✅ Covered | Direferensikan manifest `images`, tidak disentuh |
| `static/description/icon.png` | §2 baris "File lain" | ✅ Covered | Asset statis, tidak disentuh |
| `static/description/index.html` | §2 baris "File lain" | ✅ Covered | Halaman deskripsi Apps Store, tidak disentuh |
| `static/src/js/list_renderer.js` | §2 baris `list_renderer.js` | ✅ Covered | DIFF-01, DIFF-02 — stabil |
| `static/src/js/webclient.js` | §2 baris `webclient.js` | ✅ Covered | DIFF-03, DIFF-04 — stabil |
| `static/src/js/user_menu_items.js` | §2 baris `user_menu_items.js` | ✅ Covered | DIFF-05 — stabil |
| `static/tests/tours/optional_field_save_tour.js` | §2 baris tour test | ✅ Covered | DIFF-10 |
| `tests/__init__.py` | Tidak eksplisit — port apa adanya | ✅ Covered | Import biasa |
| `tests/test_optional_field_save.py` | §2 baris test fixture | ✅ Covered | DIFF-09/MF-01 (WAJIB fix), DIFF-06/DIFF-07 (sisanya stabil) |
| `tests/test_optional_field_save_tour.py` | §2 baris (ditambahkan step 3/4) | ✅ Covered | DIFF-11 — `start_tour()` signature stabil |
| `LICENSE` | §2 baris "File lain" | ✅ Covered | Tidak disentuh (larangan ubah copyright/lisensi, `ai-doc/OVERVIEW.md` §Catatan Tambahan) |
| `LISEZMOI.md` | §2 baris "File lain" | ✅ Covered | Tidak disentuh |
| `README.md` | §2 baris "File lain" | ✅ Covered | Tidak disentuh |
| `googleaeed8a7b9ec156e7.html` | §2 baris "File lain" | ✅ Covered | F-05, di luar scope housekeeping |

**Folder `views/`, `data/`, `report/`, `wizard/` — tidak ada sama sekali di modul ini** (dikonfirmasi `01a_MIGRATION_INTAKE.md` §2b), jadi baris template untuk kategori itu N/A total, bukan gap.

## Verdict

- [x] ✅ **Lulus** — semua 23 file/elemen source module tercakup di `03_MIGRATION_SPEC.md` (langsung atau via kategori "port apa adanya"/"file lain"). Tidak ada gap ditemukan. Satu penambahan minor dilakukan di tengah review ini (DIFF-11, `test_optional_field_save_tour.py` — sebelumnya belum eksplisit di tabel §2 step 3, ditambahkan begitu ditemukan saat cross-check, bukan didiamkan sebagai gap).
- Gate ini bersifat audit cakupan objektif (elemen source ada di spec atau tidak) — AI menandai lulus sendiri, dilaporkan eksplisit ke user di sini untuk kesempatan koreksi kalau ada elemen yang terlewat.
