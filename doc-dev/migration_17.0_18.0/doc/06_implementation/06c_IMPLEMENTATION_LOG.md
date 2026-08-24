# Implementation Log — optional_field_save

**Step:** 6 — Code Migration
**Ref:** `03_spec/03_MIGRATION_SPEC.md`, `06a_CODE_MIGRATION_PHASES.md`
**Tanggal:** 2026-08-24

---

## Applicability Check

| Fase | Relevan? | Bukti/alasan (dari `01a` §2b) |
|---|---|---|
| B2 | ☑ Ya | Field `optional_field_save` bertipe `Json` di `res.partner` — tapi single field sederhana, tidak ada relasi berantai/dynamic model creation. Dicek `DIFF-09`: byte-identik 17.0↔18.0, tidak butuh perubahan apapun. |
| C2 | ☐ Tidak | Tidak ada folder `views/` sama sekali |
| D1 | ☐ Tidak | `controllers/controllers.py` dead/kosong total (F-04), tidak ada route |
| D2 | ☐ Tidak | Tidak ada `static/src/css/**`; asset registration sudah format modern (dikonfirmasi `03_MIGRATION_SPEC.md` §2b Assets & Dependency) |
| E | ☑ Ya | 3 file `static/src/js/*.js` mem-patch `ListRenderer`/`WebClient`/registry `user_menuitems` |
| F | ☐ Tidak | Tidak ada template `.xml` custom milik modul (otomatis N/A karena E tidak butuh perubahan template) |

---

## Tabel Ringkas Status Fase

| Fase | Status | Tanggal |
|---|---|---|
| A1 | ✅ Selesai | 2026-08-24 |
| A2 | N/A — tidak ada XML | 2026-08-24 |
| G1 (checkpoint Fase A) | ⏳ Menunggu keputusan mode eksekusi (lihat di bawah) | — |
| A3 | N/A — tidak ada wizard/TransientModel, ACL tidak disentuh (F-01 port apa adanya) | 2026-08-24 |
| A4 | ✅ Selesai (struktur folder sudah konsisten, tidak ada perubahan) | 2026-08-24 |
| A5 | ✅ Selesai (tidak ada override `create()`/API Python yang terpengaruh, `models/res_partner.py` byte-identik) | 2026-08-24 |
| B1 | N/A — tidak ada model risiko-rendah terpisah selain `res_partner.py` (sudah di B2) | 2026-08-24 |
| B2 | ✅ Selesai (port apa adanya, DIFF-09 byte-identik) | 2026-08-24 |
| C1 | N/A — tidak ada view | 2026-08-24 |
| C2 | N/A — dikonfirmasi Applicability Check | 2026-08-24 |
| D1 | N/A — dikonfirmasi Applicability Check | 2026-08-24 |
| D2 | N/A — dikonfirmasi Applicability Check | 2026-08-24 |
| E | ✅ Selesai (rewrite `computeOptionalActiveFields`, lihat entry di bawah) | 2026-08-24 |
| F | N/A — dikonfirmasi Applicability Check | 2026-08-24 |
| G2 (validasi akhir/runtime) | ⏳ Menunggu G1 + environment eksekusi | — |

## Riwayat Percobaan G1 (Install Test)

> **Belum dijalankan** — perlu keputusan mode eksekusi dari dev dulu (lihat `06a_CODE_MIGRATION_PHASES.md` "Checkpoint G1"). Environment sesi ini adalah Claude Code CLI (shell persisten) sehingga **Mode C (AI jalankan langsung via Docker)** tersedia sebagai opsi, selain Mode A (manual dev). Ditanyakan ke dev di chat sesi ini — lihat riwayat percakapan untuk keputusan final.

| # | Dijalankan setelah fase | Mode | Hasil | Error (kalau fail) | Tanggal |
|---|---|---|---|---|---|
| 1 | A1 (tidak ada A2 relevan) | *(belum dijalankan)* | — | — | — |

---

## Entri

## [Fase A1] Manifest Bootstrap

- **Scope:** `__manifest__.py`
- **Item spec (ref):** `03_MIGRATION_SPEC.md` §2b Critical Blocker #1
- **Aksi:**
  - `__manifest__.py`: `"version": "17.0.1.0.0"` → `"version": "18.0.1.0.0"`
- **Secara eksplisit TIDAK dilakukan:**
  - Tidak ada perubahan `depends`, `assets`, `application`, atau key manifest lain — semua sudah sesuai dikonfirmasi Step 2/3 (Community murni, asset format modern, `application: False` sudah benar sesuai `BSL-008` yang direvisi di Step 1)
- **Risiko:** LOW
- **Status:** ✅ Selesai

## [Fase A4] Skeleton & Folder Integrity

- **Scope:** Struktur folder `optional_field_save/`
- **Aksi:** Dicek — struktur folder (`models/`, `controllers/`, `static/`, `security/`, `tests/`) sudah konsisten, `__init__.py` di semua level sudah benar mengimpor submodule-nya. Tidak ada perubahan diperlukan.
- **Secara eksplisit TIDAK dilakukan:** Tidak menghapus `controllers/`/`security/ir.model.access.csv` yang dead (F-04/F-01) — di luar scope migrasi port-kode (`01a_MIGRATION_INTAKE.md` §5)
- **Risiko:** LOW
- **Status:** ✅ Selesai

## [Fase A5] Python API Compatibility (Models Only)

- **Scope:** `models/res_partner.py`
- **Aksi:** Dicek terhadap `knowledge/version-diffs/17-to-18.md` §1b (Python `create()`/`onchange`/`@api.depends` gotcha) — TIDAK ADA yang berlaku (modul cuma `_inherit` + 1 field baru, tidak ada override method Python apapun). Tidak ada perubahan kode.
- **Secara eksplisit TIDAK dilakukan:** Tidak mengubah `default={}` jadi `default=False` (F-11 kosmetik) — di luar scope, dipertahankan apa adanya sesuai `01a_MIGRATION_INTAKE.md` §5
- **Risiko:** LOW
- **Status:** ✅ Selesai

## [Fase B2] Model Kompleks (Field JSON)

- **Scope:** `models/res_partner.py` — field `optional_field_save`
- **Item spec (ref):** `03_MIGRATION_SPEC.md` §2, baris `models/res_partner.py`; `DIFF-09`
- **Aksi:** Tidak ada perubahan kode — `fields.Json.convert_to_record()` dikonfirmasi byte-identik 17.0↔18.0 di Step 2 (`native-target`/`native-source`, baca langsung `odoo/fields.py`). Field tetap `fields.Json(string="Optional Field Save", default={})`.
- **Secara eksplisit TIDAK dilakukan:** Tidak ada perubahan default value, tidak ada penambahan `sudo()`/ACL baru (F-10 dipertahankan)
- **Risiko:** LOW
- **Status:** ✅ Selesai

## [Fase E] JavaScript (Owl) — Rewrite `computeOptionalActiveFields`

- **Scope:** `static/src/js/list_renderer.js`
- **Item spec (ref):** `03_MIGRATION_SPEC.md` §2 baris `getOptionalActiveFields() → computeOptionalActiveFields()`; `MF-01`/`DIFF-01`
- **Aksi:**
  - `list_renderer.js`: rename target override dari `getOptionalActiveFields()` (dihapus core 18.0) ke `computeOptionalActiveFields()`. Logic sessionStorage-check dipertahankan 1:1 (ekstraksi model via `.split(",")[1]`, prefix `"optional_field."`, dikonfirmasi format `keyOptionalFields` tidak berubah — `DIFF-05`/"Ringkasan" `02_DIFF_ANALYSIS.md` poin 5). Kalau sessionStorage kosong, `return super.computeOptionalActiveFields()` (keputusan dikonfirmasi user di Step 3, bukan copy manual). Method sekarang `return` dict, tidak lagi mutasi `this.optionalActiveFields` langsung. Baris `if (this.props.onOptionalFieldsChanged) {...}` DIHAPUS (prop sudah tidak ada di core 18.0, `DIFF-04`).
  - `list_renderer.js`: `setup()`, `saveOptionalActiveFields()`, `setDatabase()` — **TIDAK diubah sama sekali** (dikonfirmasi `DIFF-02`/`DIFF-03`, core stabil untuk bagian ini).
  - `webclient.js`, `user_menu_items.js` — **TIDAK diubah sama sekali** (port apa adanya, dikonfirmasi `DIFF-05`/`DIFF-06`/`DIFF-07`; MF-02 sengaja tidak "diperbaiki" preventif, ditunda verifikasi Step 9).
- **Secara eksplisit TIDAK dilakukan:**
  - Tidak menambahkan `useService("orm")` ke `webclient.js` (MF-02) — bukan bagian scope Step 6, butuh verifikasi eksekusi dulu
  - Tidak mengubah `saveOptionalActiveFields()` untuk ikut memanggil `super()` — core-nya sendiri tidak berubah, jadi tidak "wajib untuk kompatibilitas" (beda dari `computeOptionalActiveFields()` yang genuinely dipaksa berubah karena method lama dihapus)
  - Tidak menyentuh `user_menu_items.js` untuk mengadopsi fitur PWA baru core (`DIFF-07`) — di luar scope port-kode
  - Tidak membersihkan dead import (`registry` di `list_renderer.js` tidak pernah dipakai di body) — bukan perubahan wajib kompatibilitas, di luar scope
- **Risiko:** MEDIUM (rewrite logic inti, tapi scope sempit — 1 method, sudah melalui review desain eksplisit di Step 3)
- **Status:** ✅ Selesai (kode) — ⚠️ **Perlu verifikasi eksekusi nyata** (G1 install test, lalu tour test Step 9 untuk AC-02-02/AC-03-01)

---

## Temuan di Luar Spec (kalau ada)

- [x] Tidak ada — semua yang dikerjakan sudah tercakup `03_MIGRATION_SPEC.md`

## Kontribusi ke Knowledge Base

- [x] Tidak ada temuan baru selain yang sudah dicatat di Step 2 (`migration-records/optional_field_save_17.0_18.0/SUMMARY.md`)
