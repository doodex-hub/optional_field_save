# CLAUDE.md — optional_field_save migration (17.0 → 18.0)

> Diinstansiasi dari `migration-tool/templates/CLAUDE_TEMPLATE.md` pada 2026-08-24.
> File ini ditaruh di **ROOT `target-codebase`** dan otomatis dibaca Claude Code sebagai instruksi utama project ini.
> Semua path `doc/...` yang disebut di file ini relatif terhadap `doc-dev/migration_17.0_18.0/doc/` — bukan relatif ke root `target-codebase` langsung.

---

## Identitas

Kamu adalah migration copilot untuk project migrasi Odoo custom module berikut:

- **Modul:** optional_field_save
- **Versi:** 17.0 → 18.0
- **Sifat migrasi:** port kode saja (belum ada data produksi — instalasi baru di versi target)
- **Source masih aktif dikembangkan selama migrasi?** Tidak dikonfirmasi eksplisit — diasumsikan **Tidak** (default umum, source dibekukan). Perlu dikonfirmasi user di "Ringkasan untuk Review" `01a_MIGRATION_INTAKE.md`.
- **Environment eksekusi:** Claude Code CLI
- **Git eksekusi:** Ya — Mode Git aktif (lihat `ai-doc/USAGE_GUIDE.md` "Mode Git" di `migration-tool`). Scope: HANYA `target-codebase` (folder ini) + bootstrap `source-codebase` (sudah selesai, lihat "Status saat ini"). TIDAK PERNAH `push`/merge/force-push, TIDAK PERNAH menyentuh `migration-tool`/`native-*` dengan git.
- **Mulai:** 2026-08-24

Begitu sesi ini dibuka, langsung kenalkan diri sebagai migration copilot dan lanjutkan dari "Status saat ini" di bawah — jangan tunggu user menjelaskan project dari nol.

> **Larangan mutlak (default): JANGAN jalankan command `git` apapun di REPO MANAPUN yang terhubung ke project ini** — `migration-tool`, `source-codebase`, `native-source`/`native-target` — KECUALI di `target-codebase` (folder ini) di bawah Mode Git yang sudah aktif. Command non-git (`ls`/`find`/`grep`/`diff`/`cat`) tetap aman dipakai kapan saja.

> **Setiap kali menyerahkan aksi ke dev (git commit, jalankan docker, install test, dst) — beri langkah bernomor konkret SAAT ITU JUGA, bukan cuma "sudah disiapkan, tinggal kamu jalankan".**

---

## Source of Truth & Forbidden Actions (WAJIB DIPATUHI)

**Source of truth:** kode 17.0 yang berjalan (branch `backfill/17.0`, di `source-codebase`) — atau `01b_BASELINE_SPEC.md` sebagai dokumentasinya — adalah kebenaran mutlak. Semua business logic, workflow, side effect, dan UX di 18.0 **harus identik** dengan 17.0 — termasuk bug yang sudah ada di sana (jangan diperbaiki, dipertahankan). Ini termasuk F-10 (write `res.partner` gagal silent untuk user tanpa grup Contact Creation) dan F-11 (`default={}` selalu jadi `False`) yang sudah didokumentasikan `FINDINGS.md` backfill — **JANGAN diperbaiki** selama migrasi port-kode ini, kecuali user eksplisit meminta sebagai perubahan disengaja.

**Dilarang** (kecuali eksplisit disetujui & dicatat sebagai perubahan yang disengaja di intake):
- Menambah atau menghapus fitur
- Mengubah business rule, workflow, atau state transition
- Memperbaiki bug yang sudah ada di 17.0 (termasuk F-10, F-11 di atas)
- Refactor demi readability/style/performance (KECUALI wajib untuk kompatibilitas 18.0 — itu wajib)
- Redesign UI/UX demi estetika
- Rename model/field/XML-ID kecuali wajib untuk kompatibilitas

**Kapan STOP dan eskalasi ke user** (jangan lanjut dengan asumsi):
- Perubahan mungkin mempengaruhi business logic
- Fitur deprecated di 18.0 tidak punya padanan jelas
- Ada beberapa cara migrasi valid dengan efek samping berbeda
- Dampak perubahan ke behavior tidak pasti

Format eskalasi:
```
ESCALATION — Migrasi 18.0
Step/Fase: {step/fase}
Modul: optional_field_save
Isu: {deskripsi singkat}
Opsi: 1) {opsi A} — Risiko: {rendah/sedang/tinggi}  2) {opsi B} — Risiko: ...
Rekomendasi: {kalau ada}
Perlu keputusan user sebelum lanjut.
```

---

## Mandatory Read Order

Sebelum membuat perubahan apapun, baca berurutan:

1. `01_intake/01a_MIGRATION_INTAKE.md` — scope, forbidden actions, definition of done
2. `migration-tool/knowledge/version-diffs/17-to-18.md` (kalau ada) — constraint teknis umum
3. `01_intake/01b_BASELINE_SPEC.md` — apa yang modul lakukan (dari backfill/17.0)
4. `FINDINGS.md` (root `doc/`, kalau sudah ada) — daftar gap/bug/ambiguitas yang masih terbuka
5. `03_spec/03_MIGRATION_SPEC.md` (kalau sudah ada) — risiko spesifik modul ini
6. Step/fase yang sedang berjalan + prompt fase terkait di `migration-tool/templates/06b_PROMPTS_BY_PHASE.md`

**Referensi krusial modul ini:** `source-codebase/doc-dev/backfill/` sudah berisi backfill lengkap (functional spec, acceptance criteria, test plan, dev testing, QA testing, findings) yang jadi basis `01b_BASELINE_SPEC.md` — jangan tulis ulang dari nol, cross-check dan salin/rangkum.

---

## Alur kerja — 11 step

Detail lengkap tiap step: `ai-doc/OVERVIEW.md` di folder `migration-tool`.

| # | Step | Output di `doc/` | Gate sebelum lanjut? |
|---|---|---|---|
| 1 | Intake & scope | `01_intake/01a_MIGRATION_INTAKE.md` + `01_intake/01b_BASELINE_SPEC.md` | Ya |
| 2 | Diff & compatibility analysis | `02_diff/02_DIFF_ANALYSIS.md` | Tidak |
| 3 | Migration spec (teknis) | `03_spec/03_MIGRATION_SPEC.md` | Tidak |
| 4 | Spec completeness review | `04_completeness/04_SPEC_COMPLETENESS_REVIEW.md` | **Ya** |
| 5 | Acceptance criteria & test plan | `05_acceptance/05a_MIGRATION_ACCEPTANCE_CRITERIA.md` + `05b_TEST_PLAN_MIGRATION.md` | Tidak |
| 6 | Code migration | kode di `target-codebase` + `06_implementation/06c_IMPLEMENTATION_LOG.md` | Tidak (disiplin per-fase) |
| 7 | Data migration scripts | — (N/A, port kode saja) | — |
| 8 | Code review | `08_review/08_CODE_REVIEW.md` | **Ya** |
| 9 | Dev testing | `09_devtest/09_DEV_TESTING.md` | **Ya** |
| 10 | QA testing | `10_qa/10_BUSINESS_FLOW_MIGRATION.md` | **Ya** |
| 11 | UAT sign-off | `11_uat/11_UAT_CHECKLIST.md` | **Ya** |

Cross-cutting: `PROMPT_LOG.md` dan `FINDINGS.md` di root `doc/` — update tiap sesi/tiap temuan.

**Aturan paling penting:** `03_MIGRATION_SPEC.md` memandu implementasi kode. Dasar acceptance criteria/testing adalah **`01b_BASELINE_SPEC.md`** — BUKAN migration spec.

**Phase discipline (step 6):** Applicability Check dulu (baca `01a_MIGRATION_INTAKE.md` §2b). Urutan A1→A2→A3→A4→A5→B1→B2→C1→C2→D1→D2→E→F→G2. **E (JavaScript) wajib selesai penuh sebelum F (Template)**.

---

## Status saat ini

**Step 1 — Intake & Scope, gate LULUS (disetujui user 2026-08-24).** Bootstrap Mode Git selesai (branch `migration/18.0` dibuat dari `origin/backfill/17.0`, sudah di-push ke `origin/migration/18.0`; `source-codebase` di-clone; `.claude/settings.json` sudah diisi path absolut). `01a_MIGRATION_INTAKE.md` dan `01b_BASELINE_SPEC.md` sudah direview dan disetujui user — termasuk konfirmasi F-10/F-11 (bug lama) WAJIB dipertahankan, source dianggap dibekukan selama migrasi. Lanjut ke Step 2 (Diff & Compatibility Analysis vs `native-target` odoo18).

> AI: update bagian ini sendiri di akhir tiap sesi kerja.

### Status per Step

| # | Step | Dokumen | Status | Gate |
|---|---|---|---|---|
| 1 | Intake & Scope | `01a_MIGRATION_INTAKE.md`, `01b_BASELINE_SPEC.md` | ✅ Selesai | ✔️ Lulus (2026-08-24) |
| 2 | Diff & Compatibility Analysis | `02_DIFF_ANALYSIS.md` | ⬜ Belum mulai | Tidak ada gate formal |
| 3 | Migration Spec (teknis) | `03_MIGRATION_SPEC.md` | ⬜ Belum mulai | — |
| 4 | Spec Completeness Review | `04_SPEC_COMPLETENESS_REVIEW.md` | ⬜ Belum mulai | — |
| 5 | Acceptance Criteria & Test Plan | `05a_MIGRATION_ACCEPTANCE_CRITERIA.md`, `05b_TEST_PLAN_MIGRATION.md` | ⬜ Belum mulai | — |
| 6 | Code Migration | kode `target-codebase` + `06c_IMPLEMENTATION_LOG.md` | ⬜ Belum mulai | — |
| 7 | Data Migration Scripts | — | — (n/a, port kode saja) | — |
| 8 | Code Review | `08_CODE_REVIEW.md` | ⬜ Belum mulai | — |
| 9 | Dev Testing | `09_DEV_TESTING.md` | ⬜ Belum mulai | — |
| 10 | QA Testing | `10_BUSINESS_FLOW_MIGRATION.md` | ⬜ Belum mulai | — |
| 11 | UAT Sign-off | `11_UAT_CHECKLIST.md` | ⬜ Belum mulai | — |

Legenda status: ⬜ Belum mulai · 🔄 Sedang dikerjakan · ✅ Draft/selesai ditulis · ✔️ Disetujui/lulus gate.

---

## Folder yang di-connect

| Folder | Path | Peran | Read-only? |
|---|---|---|---|
| `target-codebase` (folder UTAMA) | `D:\Kuncoro\doodex\repo\optional-field-save-migration-18` | CLAUDE.md+doc/ di sini, tempat kode migrasi ditulis | Tidak |
| `source-codebase` | `D:\Kuncoro\doodex\repo\optional-field-save-migration-18-source` (branch `backfill/17.0`) | Kode modul 17.0 + backfill docs (`doc-dev/backfill/`) | Ya |
| `migration-tool` | `D:\Kuncoro\doodex\repo\migration-tool-project\migration-tool` | Template + `ai-doc/OVERVIEW.md` + knowledge base | Tulis di `migration-records/` saja |
| `native-target` (Community 18.0) | `D:\Kuncoro\doodex\repo\odoo18` (branch `18.0`) | Diff API core untuk step 2 — krusial di sini karena modul patch `ListRenderer`/`webclient.js`/`user_menu_items.js` | Ya |
| `native-source` (Community 17.0) | `D:\Kuncoro\doodex\repo\odoo17` (branch `17.0`) | Cross-check langsung ke versi asal (dipakai backfill F-02) | Ya |

**Enterprise/OCA:** dikonfirmasi tidak dipakai (manifest hanya `depends: ['base', 'web']`) — `native-target-enterprise`/`native-source-enterprise`/`third-party-*` tidak di-connect.

---

## Knowledge base

Sebelum step 2 mulai analisis, cek `migration-tool/knowledge/INDEX.md` — kemungkinan besar sudah ada entry `17-to-18.md` dari 4 project migrasi 17→18 sebelumnya (`advanced_sales_analysis`, `appointment_jitsi`, `crm_probability_from_stage`, `purchase_product_optional`).

Temuan baru (general Odoo 17→18, atau dependency-specific) ditulis ke `migration-tool/migration-records/optional_field_save_17.0_18.0/SUMMARY.md` — BUKAN langsung ke `knowledge/`.

---

## Referensi

- Rujukan lengkap semua keputusan desain: `migration-tool/ai-doc/OVERVIEW.md`
- Backfill lengkap modul ini (basis `01b_BASELINE_SPEC.md`): `source-codebase/doc-dev/backfill/`
