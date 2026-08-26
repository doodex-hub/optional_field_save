# Spec Completeness Review — optional_field_save

**Step:** 4 — Spec Completeness Review (gate)
**Ref:** `03_spec/03_MIGRATION_SPEC.md`, source module asli (`source-codebase/optional_field_save/`)
**Tanggal:** 2026-08-24

> Tujuan: pastikan `MIGRATION_SPEC.md` mencakup 100% elemen source module — bukan review
> kualitas kode (itu step 8). Enumerasi semua elemen modul dari `source-codebase`, cocokkan
> satu-satu ke spec.

---

## Tabel Cakupan

Enumerasi lengkap dari struktur file `source-codebase/optional_field_save/` (dikonfirmasi `find`, tidak ada file yang terlewat):

| Elemen source module | Ada di Migration Spec? | Status | Catatan |
|---|---|---|---|
| `__init__.py` (root) | Tidak eksplisit disebut | ✅ Covered | Boilerplate import murni (`from . import controllers, models`), tidak ada logic — tidak butuh strategi migrasi terpisah |
| `__manifest__.py` | Ya — §2 tabel baris terakhir, §2b Critical Blocker #1, §2b Assets & Dependency | ✅ Covered | Version bump `17.0.1.0.0`→`18.0.1.0.0`, assets format & depends dikonfirmasi tidak berubah |
| `controllers/__init__.py`, `controllers/controllers.py` | Ya — §2 tabel, §2b Controller & Route | ✅ Covered | Dead file (F-04), port apa adanya, N/A untuk migrasi aktif |
| `models/__init__.py`, `models/res_partner.py` | Ya — §2 tabel (`fields.Json(default={})`) | ✅ Covered | DIFF-09, byte-identik, port apa adanya |
| `security/ir.model.access.csv` | Ya — §2 tabel | ✅ Covered | Dead artifact (F-01), port apa adanya, N/A untuk migrasi aktif |
| `views/` | N/A — tidak ada folder ini di modul | ✅ Covered (N/A eksplisit) | Dikonfirmasi §2b "View List Checklist" = N/A, konsisten `01a_MIGRATION_INTAKE.md` §2b |
| `data/`, `report/`, `wizard/` | N/A — tidak ada folder ini di modul | ✅ Covered (N/A eksplisit) | §2b "Kompatibilitas Data Model" = N/A |
| `static/src/js/list_renderer.js` | Ya — §2 tabel (3 baris: `setup()`, `getOptionalActiveFields()`→rewrite, `saveOptionalActiveFields()`), §2b OWL Widget | ✅ Covered | Rewrite total untuk MF-01, sisanya port apa adanya |
| `static/src/js/webclient.js` | Ya — §2 tabel, §2b Risiko Integrasi | ✅ Covered | Port apa adanya, MF-02 ditunda ke Step 9 |
| `static/src/js/user_menu_items.js` | Ya — §2 tabel | ✅ Covered | Port apa adanya, DIFF-07 informational |
| `static/description/*` (banner.png, icon.png, index.html, assets/) | Tidak disebut | ✅ Covered (N/A eksplisit, ditambahkan sesi ini) | Aset marketing/listing Apps Store murni — tidak ada logic Odoo, tidak dimuat manifest sebagai kode. Port apa adanya (copy file, tidak ada transformasi) |
| `googleaeed8a7b9ec156e7.html` | Ya — §2 tabel | ✅ Covered | File nyasar (F-05), port apa adanya, N/A untuk migrasi aktif |
| `README.md`, `LICENSE`, `LISEZMOI.md` | Tidak disebut | ✅ Covered (N/A eksplisit, ditambahkan sesi ini) | Dokumentasi murni, tidak ada logic Odoo — tidak butuh strategi migrasi |

**Catatan gate:** dua kategori ("static/description", dokumentasi README/LICENSE) belum eksplisit disebut di `03_MIGRATION_SPEC.md` — ditinjau di sini dan dikonfirmasi tidak ada gap fungsional (murni aset statis/dokumentasi, tidak ada logic Odoo yang perlu strategi migrasi). Tidak perlu revisi `03_MIGRATION_SPEC.md` untuk ini karena bukan risiko/keputusan yang butuh dicatat di sana — cukup dicatat sebagai konfirmasi cakupan di gate ini.

## Verdict

- [x] ✅ **Lulus** — semua elemen source module tercakup (baik dengan strategi migrasi eksplisit, maupun N/A yang dikonfirmasi beralasan). Tidak ada gap. Lanjut ke Step 5 (Acceptance Criteria & Test Plan).
