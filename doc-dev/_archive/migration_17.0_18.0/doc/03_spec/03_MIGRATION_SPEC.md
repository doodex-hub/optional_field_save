# Migration Spec (Teknis) — optional_field_save

**Step:** 3 — Migration Spec
**Versi:** 17.0 → 18.0
**Ref:** `02_diff/02_DIFF_ANALYSIS.md`
**Tanggal:** 2026-08-24

> Dokumen ini memandu IMPLEMENTASI (step 6). Ini **bukan** dasar testing/acceptance criteria —
> itu datang dari `01b_BASELINE_SPEC.md`. Lihat step 5.

---

## 1. Ringkasan Strategi

Modul ini kecil (1 field, 3 file JS, tanpa views/wizard/data) — sebagian besar port langsung tanpa perubahan. **Satu area butuh rewrite total**: override `getOptionalActiveFields()` di `list_renderer.js` (MF-01) karena method core yang di-target sudah dihapus di 18.0, diganti mekanisme reactive baru (`computeOptionalActiveFields()`). Area lain (`saveOptionalActiveFields()`, `webclient.js`, `user_menu_items.js`, `res_partner.py`, ACL) di-port apa adanya — dikonfirmasi byte-identik atau perubahan yang tidak mempengaruhi pola pakai modul (lihat `02_DIFF_ANALYSIS.md` §1).

**Keputusan desain dikonfirmasi user (2026-08-24):** override baru untuk `computeOptionalActiveFields()` memanggil `super()` untuk logic fallback (bukan copy manual) — lihat §2 poin 2 di bawah.

## 2. Strategi per File/Simbol (ringkasan umum)

| File/simbol | Ref `DIFF-NNN` | Strategi migrasi | Risiko | Ref `BSL-NNN` |
|---|---|---|---|---|
| `list_renderer.js` — `setup()` | DIFF-03 | Port apa adanya (2 baris tambahan modul + `super.setup()`, tidak bergantung detail internal `setup()` core) | Rendah | — |
| `list_renderer.js` — `getOptionalActiveFields()` → **rename target jadi `computeOptionalActiveFields()`** | DIFF-01, DIFF-04 | **Rewrite total.** Override baru: (1) hitung `sessionKey = "optional_field." + this.keyOptionalFields.split(",")[1]` (logic ekstraksi model TIDAK berubah, lihat "Ringkasan" `02_DIFF_ANALYSIS.md` poin 5); (2) `const sessionValue = sessionStorage.getItem(sessionKey);` (3) **kalau `sessionValue` ADA** — bangun & `return` dict `{[colName]: sessionValue.split(",").includes(colName)}` untuk tiap `optionalColumn` (logic sama persis dengan sebelumnya, hanya jadi `return` bukan mutasi); (4) **kalau `sessionValue` TIDAK ADA** — `return super.computeOptionalActiveFields();` (delegasi ke core, yang membaca `localStorage` — behaviorally IDENTIK dengan fallback lama, tapi otomatis ikut kalau core berubah lagi ke depan). **HAPUS** baris `if (this.props.onOptionalFieldsChanged) {...}` (prop sudah tidak ada di core 18.0, lihat DIFF-04) — TIDAK ada mutasi `this.optionalActiveFields`/`this.props.onOptionalFieldsChanged` lagi, method HARUS `return` dict (kontrak baru core, dipanggil dari `onWillRender` core lewat `Object.assign`). | **Tinggi** (rewrite, bukan port) | BSL-003, BSL-005 |
| `list_renderer.js` — `saveOptionalActiveFields()` | DIFF-02 | Port apa adanya — signature & logic core identik 17.0↔18.0, override modul (tulis ke `setDatabase()` + `localStorage`) tidak perlu berubah | Rendah | BSL-004 |
| `list_renderer.js` — `setDatabase()` (method custom modul, bukan override core) | — | Port apa adanya — murni logic modul sendiri (ORM call ke `res.partner`), tidak bergantung API core yang berubah | Rendah | BSL-006, BSL-009, BSL-010 |
| `webclient.js` — `setup()` + `getOptionalActiveFields()` (method custom modul) | DIFF-05, DIFF-06 | Port struktur apa adanya. **JANGAN** menambahkan `useService("orm")` secara preventif untuk "memperbaiki" MF-02 — itu genuinely bisa jadi behavior asli 17.0 yang harus dipertahankan (source-of-truth), bukan gap migrasi. Tunggu hasil verifikasi eksekusi nyata Step 9 sebelum ada keputusan apapun soal ini. | Tinggi (kondisional, lihat MF-02) | BSL-001, BSL-002 |
| `user_menu_items.js` — replace registry item `log_out` | DIFF-07 | Port apa adanya — API registry stabil, modul tidak perlu mengadopsi fitur PWA baru core | Rendah | BSL-007 |
| `models/res_partner.py` — `fields.Json(default={})` | DIFF-09 | Port apa adanya — byte-identik | Tidak ada | BSL-009 |
| `security/ir.model.access.csv`, `controllers/controllers.py`, `googleaeed8a7b9ec156e7.html` | — (housekeeping, F-01/F-04/F-05 backfill) | Port apa adanya (dead file, tidak mempengaruhi migrasi) — di luar scope, lihat `01a_MIGRATION_INTAKE.md` §5 | Tidak ada | BSL-011, BSL-012, BSL-013 |
| `__manifest__.py` — `version` | — (lihat Critical Blocker #1 di bawah) | `'17.0.1.0.0'` → `'18.0.1.0.0'` | Tinggi (wajib, standar Odoo) | — |

## 2b. Risk Analysis Terstruktur (detail, per kategori)

### Critical Migration Blockers
*(Mencegah instalasi atau operasi inti di 18.0)*

| # | Isu | Lokasi | Rujukan knowledge base |
|---|---|---|---|
| 1 | Manifest version — harus `18.0.x` | `__manifest__.py:17` (`version: "17.0.1.0.0"`) | Standar wajib semua modul Odoo, tidak spesifik ke `knowledge/version-diffs/17-to-18.md` |

**Priority:** HIGH — perbaiki sebelum runtime testing apapun. Modul ini TIDAK punya blocker lain dari daftar umum `knowledge/version-diffs/17-to-18.md` §1 (tidak ada `<tree>`, tidak ada asset registration lama, tidak ada `odoo.define`) — dikonfirmasi di `02_DIFF_ANALYSIS.md` §0.

### OWL Widget yang Butuh Rewrite/Review

| Widget/Patch | File | Risiko | Detail |
|---|---|---|---|
| Override `getOptionalActiveFields` → `computeOptionalActiveFields` | `list_renderer.js` | **Tinggi** | Lihat §2 di atas — rewrite total, bukan port. Ini BUKAN komponen Owl baru (tidak ada `.xml` template modul), jadi urutan wajib "JS dulu baru Template" (Fase E sebelum F) otomatis terpenuhi karena Fase F **N/A** untuk modul ini (tidak ada template custom, dikonfirmasi `01a_MIGRATION_INTAKE.md` §2b). |

### Controller & Route

N/A — `controllers/controllers.py` dead/kosong total (F-04), tidak ada route terdaftar (`01a_MIGRATION_INTAKE.md` §2b).

### Assets & Dependency

| # | Isu | Lokasi | Priority |
|---|---|---|---|
| 1 | Asset registration sudah pakai format modern (`'assets': {'web.assets_backend': [...]}`) — TIDAK perlu diubah | `__manifest__.py:23-29` | — (sudah benar) |
| 2 | `depends: ['base', 'web']` — tidak ada dependency yang dihapus/berubah, tidak perlu penyesuaian | `__manifest__.py:18-21` | — (tidak ada risiko) |

### Kompatibilitas Data Model

N/A — tidak ada perubahan struktur data model (`fields.Json` byte-identik, DIFF-09; ACL byte-identik, DIFF-10). Field `optional_field_save` di `res.partner` tidak perlu migration script data (port kode saja, belum ada instance produksi — `01a_MIGRATION_INTAKE.md` §3).

### Risiko Integrasi

| # | Isu | Lokasi | Priority |
|---|---|---|---|
| 1 | MF-02 — `this.orm` kemungkinan `undefined` di `webclient.js`, kondisi SAMA di 17.0 dan 18.0 (bukan regresi migrasi) | `webclient.js:14-34` | **Tinggi (kondisional)** — verifikasi eksekusi nyata Step 9 WAJIB sebelum keputusan apapun |

### Urutan Prioritas Testing

1. Install & startup — manifest version 18.0, dependency `base`+`web` tetap tersedia
2. Core user flow — toggle kolom optional di list view manapun, cek tersimpan ke `res.partner.optional_field_save` (AC-02-01)
3. Persistensi lintas browser — logout, buka browser lain, cek preferensi ter-restore (AC-02-02) — **termasuk verifikasi MF-02** (buka DevTools console saat webclient mount)
4. Widget backend (Owl) — override `computeOptionalActiveFields()` baru, pastikan behaviorally identik dengan `getOptionalActiveFields()` lama (sessionStorage-first, localStorage-fallback via `super()`)
5. Regression check F-10/F-11 — user tanpa grup Contact Creation (AC-06-01), partner baru dapat `False` bukan `{}` (AC-02-03)

### View List (dulu Tree) Checklist

N/A — tidak ada `views/*.xml` sama sekali di modul ini (`01a_MIGRATION_INTAKE.md` §2b).

### Estimasi Effort

| Area | Effort | Catatan |
|---|---|---|
| `__manifest__.py` version bump | Trivial | 1 baris |
| `list_renderer.js` rewrite `computeOptionalActiveFields` | Sedang | Logic sama, kontrak berbeda — perlu hati-hati soal return value vs mutasi |
| `webclient.js`, `user_menu_items.js`, `res_partner.py` | Trivial | Port apa adanya, tanpa perubahan |
| Verifikasi MF-02 (Step 9) | Sedang | Butuh eksekusi browser nyata, bukan cuma baca kode |

## 3. Data Migration (ringkas — detail di step 7)

N/A — port kode saja, tidak ada instance produksi (`01a_MIGRATION_INTAKE.md` §3). Step 7 di-skip.

## 4. Scope

### Termasuk
- Bump `__manifest__.py` version ke `18.0.1.0.0`
- Rewrite override `getOptionalActiveFields()` → `computeOptionalActiveFields()` di `list_renderer.js` (MF-01)
- Port apa adanya: `saveOptionalActiveFields()`, `setDatabase()`, `webclient.js`, `user_menu_items.js`, `models/res_partner.py`

### Di Luar Scope (sengaja, disetujui di intake)
- Housekeeping F-01 (dead `ir.model.access.csv`), F-04 (dead controller), F-05 (file Google verification nyasar) — keputusan independen pemilik modul, bukan bagian migrasi versi
- Mengadopsi fitur PWA-aware logout redirect (DIFF-07) — fitur baru 18.0, bukan bagian scope port-kode

### Revisi Pasca-Tulis (Step 6/G2, 2026-08-24)
- **Menambahkan `useService("orm")` ke `webclient.js` (MF-02) — SEMULA "Di Luar Scope" di atas, DIREVISI setelah verifikasi eksekusi nyata di G2.** G2 menemukan bug ini bukan cuma "kondisional/silent" seperti dugaan awal, tapi CRASH TOTAL webclient (blank page setiap login), dikonfirmasi identik di 17.0 asli. Dieskalasi ke user, disetujui sebagai perubahan disengaja. Detail lengkap: `FINDINGS.md` MF-02, `06_implementation/06c_IMPLEMENTATION_LOG.md` entri "[G2] Validasi Runtime".
