# Migration Spec (Teknis) — optional_field_save

**Step:** 3 — Migration Spec
**Versi:** 18.0 → 19.0
**Ref:** `02_diff/02_DIFF_ANALYSIS.md`
**Tanggal:** 2026-08-26

> Dokumen ini memandu IMPLEMENTASI (step 6). Ini **bukan** dasar testing/acceptance criteria —
> itu datang dari `01b_BASELINE_SPEC.md` (step 1). Lihat step 5.

---

## 1. Ringkasan Strategi

Migrasi ini **sangat sempit lingkupnya**: step 2 mengonfirmasi seluruh API `web` addon yang dipakai modul ini (`computeOptionalActiveFields`, `saveOptionalActiveFields`, service `@web/core/user`, pola `useService("orm")`) **byte-stable** 18.0→19.0 — tidak ada satu baris pun kode produksi (`models/`, `static/src/js/`) yang perlu berubah. Ini kontras dengan migrasi 17→18 sebelumnya yang butuh 3 fix substansial (MF-01/02/05). Hanya DUA perubahan mekanis diperlukan: (1) bump nomor versi manifest, (2) rename `groups_id`→`group_ids` di 2 baris test fixture (DIFF-09/MF-01, murni test infrastructure, bukan business logic).

## 2. Strategi per File/Simbol (ringkasan umum)

| File/simbol | Ref `DIFF-NNN` (02_DIFF_ANALYSIS §1) | Strategi migrasi | Risiko | Ref `BSL-NNN` |
|---|---|---|---|---|
| `__manifest__.py` — `version` | — (tidak ada DIFF, konvensi wajib tiap migrasi) | Bump `"18.0.1.0.0"` → `"19.0.1.0.0"` | Tidak ada | `BSL-008` |
| `static/src/js/list_renderer.js` — `computeOptionalActiveFields`/`saveOptionalActiveFields`/`setDatabase` | `DIFF-01`, `DIFF-02` | **Port apa adanya, tanpa perubahan** — kontrak API stabil, verifikasi langsung `enterprise19.0` | Rendah | `BSL-003`, `BSL-004`, `BSL-005`, `BSL-006` |
| `static/src/js/webclient.js` — `getOptionalActiveFields`/`useService("orm")`/`user.partnerId` | `DIFF-03`, `DIFF-04` | **Port apa adanya** | Rendah | `BSL-001`, `BSL-002` |
| `static/src/js/user_menu_items.js` — registry `user_menuitems`/`"log_out"` | `DIFF-05` | **Port apa adanya** | Rendah | `BSL-007` |
| `models/res_partner.py` — `fields.Json(default={})` | `DIFF-06` | **Port apa adanya** — F-11/BSL-009 dipertahankan | Rendah | `BSL-009` |
| `security/ir.model.access.csv` (dead artifact, F-01) | — | **Port apa adanya**, tidak dibersihkan (di luar scope, lihat intake §5) | Tidak ada | `BSL-011` |
| **`tests/test_optional_field_save.py`** — `res.users.create({"groups_id": ...})` (baris 71, 93) | **`DIFF-09`** | **WAJIB diubah:** `"groups_id"` → `"group_ids"` (2 lokasi) — murni rename key dict, logic test tidak berubah | Sedang (breaking pasti, tapi fix mekanis, tidak ambigu) | `BSL-010` |
| `static/tests/tours/optional_field_save_tour.js` | `DIFF-10` | **Port apa adanya** — selector DOM dikonfirmasi stabil; verifikasi eksekusi nyata (`test: true` tour-runner) ditunda ke step 9 | Rendah-Sedang (belum tuntas verifikasi statis) | — |
| `tests/test_optional_field_save_tour.py` — `HttpCase.start_tour("/web", "optional_field_save_tour", login="admin")` | `DIFF-11` *(baru)* | **Port apa adanya** — signature `start_tour(self, url_path, tour_name, step_delay=None, **kwargs)` dikonfirmasi tidak berubah (`enterprise19.0/odoo/tests/common.py:2555` vs pola pemanggilan modul, `login` diteruskan via `**kwargs`) | Rendah | — |
| `tests/test_optional_field_save.py` (selain rename `groups_id`) | `DIFF-06`/`DIFF-07` (fields.Json, ACL) | **Port apa adanya** — `TransactionCase`, `tagged`, `AccessError`, `self.env.ref(...)` semua API testing stabil, tidak ada demo-data dependency (`base.group_user`/`base.group_partner_manager` adalah data core, bukan demo — catatan umum "demo data tidak auto-install di test 19.0" TIDAK relevan di sini) | Rendah | `BSL-009`, `BSL-010` |
| File lain (README, LICENSE, static/description/*, controllers dead file, google html) | — | **Port apa adanya, tidak disentuh** | Tidak ada | `BSL-012`, `BSL-013` |

## 2b. Risk Analysis Terstruktur (detail, per kategori)

### Critical Migration Blockers
*(Mencegah instalasi atau operasi inti di 19.0)*

| # | Isu | Lokasi | Rujukan knowledge base |
|---|---|---|---|
| 1 | Manifest version — harus `19.0.x` | `__manifest__.py` | `knowledge/version-diffs/18-to-19.md` |

**Tidak ada blocker lain** — dikonfirmasi step 2, semua API yang dipakai modul stabil.

**Priority:** HIGH — perbaiki sebelum runtime testing apapun (satu-satunya item di kategori ini).

### OWL Widget yang Butuh Rewrite/Review

| Widget | File | Risiko | Detail |
|---|---|---|---|
| — | — | — | Tidak ada — modul tidak punya komponen Owl baru, hanya patch method (`ListRenderer`, `WebClient` prototype) yang sudah dikonfirmasi stabil (DIFF-01 s/d DIFF-04) |

**Urutan wajib (tetap dicatat untuk konsistensi walau N/A di migrasi ini):** migrasi SEMUA JavaScript dulu, baru upgrade template ke syntax Owl baru terakhir. Modul ini tidak punya template `.xml` custom (Fase F N/A, lihat `01a_MIGRATION_INTAKE.md` §2b), jadi urutan ini tidak relevan secara praktis.

### Controller & Route

| # | Isu | Lokasi | Priority |
|---|---|---|---|
| — | Tidak ada — `controllers/controllers.py` dead file total (cuma komentar), tidak ada route terdaftar | `controllers/controllers.py` | — |

### Assets & Dependency

| # | Isu | Lokasi | Priority |
|---|---|---|---|
| — | Tidak ada — kunci `web.assets_backend`/`web.assets_tests` dikonfirmasi stabil (DIFF-08), `depends: ['base', 'web']` tidak berubah | `__manifest__.py` | — |

### Kompatibilitas Data Model

| # | Isu | Lokasi | Priority | Ref `BSL-NNN` |
|---|---|---|---|---|
| — | Tidak ada — `fields.Json` behavior byte-identik (DIFF-06), field `optional_field_save` tidak berubah struktur | `models/res_partner.py` | — | `BSL-009` |

### Risiko Integrasi

| # | Isu | Lokasi | Priority |
|---|---|---|---|
| 1 | `res.users.groups_id`→`group_ids` (DIFF-09) — WAJIB fix sebelum test bisa jalan di 19.0 | `tests/test_optional_field_save.py:71,93` | SEDANG |
| 2 | Tour test `test: true` mechanism — belum diverifikasi statis penuh terhadap tour-runner 19.0 | `static/tests/tours/optional_field_save_tour.js` | RENDAH (verifikasi step 9) |

### Urutan Prioritas Testing

1. Install & startup — manifest version bump, `create()` field `optional_field_save`
2. Core user flow — toggle kolom optional di list view → persist DB → reload browser lain → restore
3. Persistensi data — round-trip `res.partner.optional_field_save` (Json)
4. Widget backend (Owl) — N/A, tidak ada komponen Owl baru; cukup verifikasi patch `ListRenderer`/`WebClient` tetap terpanggil (regresi generik, bukan spesifik 19.0)
5. ACL negative test — user tanpa "Contact Creation" gagal silent (F-10, WAJIB tetap gagal, bukan regresi)

### View List (dulu Tree) Checklist

| # | Apa | Di mana | Perubahan |
|---|---|---|---|
| — | N/A — modul tidak punya `views/*.xml` sama sekali (dikonfirmasi intake §2b) | — | — |

### Estimasi Effort (opsional)

| Area | Effort | Catatan |
|---|---|---|
| Manifest version bump | Trivial (~1 menit) | 1 baris |
| Test fixture `groups_id`→`group_ids` | Trivial (~5 menit) | 2 baris, mekanis |
| Verifikasi G1 (install test) + G2 (browser nyata) + tour | Sedang (~30-60 menit) | Docker up, eksekusi test, cross-check hasil |
| **Total** | **Kecil** | Migrasi ini jauh lebih ringan dari 17→18 (yang butuh 3 fix substansial JS) |

## 3. Data Migration (ringkas — detail di step 7)

N/A — port kode saja, tidak ada instalasi produksi dengan data lama yang perlu ditransformasi (`01a_MIGRATION_INTAKE.md` §3).

## 4. Scope

### Termasuk
- Bump `__manifest__.py` version ke `19.0.1.0.0`.
- Rename `groups_id`→`group_ids` di `tests/test_optional_field_save.py` (2 lokasi).
- Verifikasi eksekusi nyata (G1 install test, G2 browser, tour test) untuk memastikan tidak ada regresi tersembunyi yang lolos dari analisis statis step 2 (riwayat migrasi 17→18: MF-02/MF-05 KEDUANYA baru ketahuan lewat eksekusi nyata, bukan review statis — disiplin yang sama tetap dijaga di sini walau analisis statis 18→19 jauh lebih bersih).

### Di Luar Scope (sengaja, disetujui di intake)
- Housekeeping (F-01 dead ACL, F-04 dead controller, F-05 file Google verification, F-07 dead import) — `01a_MIGRATION_INTAKE.md` §5.
- Perbaikan bug pre-existing F-10/F-11 (write gagal silent, `default={}` jadi `False`) — WAJIB dipertahankan, bukan diperbaiki.
- Rewrite tour test scope (narrowed scope dari step 9 migrasi 17→18 — full-page-reload assertion) — tidak diperluas kecuali ditemukan kebutuhan baru saat step 9.
