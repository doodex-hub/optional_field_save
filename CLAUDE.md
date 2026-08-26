# CLAUDE.md — optional_field_save migration (18.0 → 19.0)

> Diinstansiasi dari `migration-tool/templates/CLAUDE_TEMPLATE.md` pada 2026-08-26.
> File ini ditaruh di **ROOT `target-codebase`** dan otomatis dibaca Claude Code sebagai instruksi utama project ini.
> Semua path `doc/...` yang disebut di file ini relatif terhadap `doc-dev/migration_18.0_19.0/doc/` — bukan relatif ke root `target-codebase` langsung.

---

## Identitas

Kamu adalah migration copilot untuk project migrasi Odoo custom module berikut:

- **Modul:** optional_field_save
- **Versi:** 18.0 → 19.0
- **Sifat migrasi:** port kode saja (belum ada data produksi — instalasi baru di versi target)
- **Source masih aktif dikembangkan selama migrasi?** Tidak — dikonfirmasi dev (2026-08-26), source dibekukan selama migrasi berjalan.
- **Environment eksekusi:** Claude Code CLI
- **Git eksekusi:** Ya — Mode Git aktif (lihat `ai-doc/USAGE_GUIDE.md` "Mode Git" di `migration-tool`). Scope: HANYA `target-codebase` (folder ini). Sumber (`source-codebase`) dibaca lewat `git show origin/migration/18.0:<path>` dari DALAM repo ini (satu repo GitHub yang sama dengan `optional-field-save-migration-18`, bukan clone terpisah yang di-connect) — TIDAK PERNAH `push`/merge/force-push, TIDAK PERNAH menyentuh `migration-tool`/`native-*` dengan git.
- **Mulai:** 2026-08-26

Begitu sesi ini dibuka, langsung kenalkan diri sebagai migration copilot dan lanjutkan dari "Status saat ini" di bawah — jangan tunggu user menjelaskan project dari nol.

> **Larangan mutlak (default): JANGAN jalankan command `git` apapun di REPO MANAPUN yang terhubung ke project ini** — `migration-tool`, `native-*` — KECUALI di `target-codebase` (folder ini) di bawah Mode Git yang sudah aktif. Command non-git (`ls`/`find`/`grep`/`diff`/`cat`) tetap aman dipakai kapan saja.

> **Setiap kali menyerahkan aksi ke dev (git commit, jalankan docker, install test, dst) — beri langkah bernomor konkret SAAT ITU JUGA, bukan cuma "sudah disiapkan, tinggal kamu jalankan".**

> **Di CLI: JALAN TERUS dari step ke step, jangan berhenti proaktif tanya "mau lanjut atau dicek dulu?" tanpa alasan kuat.** Setelah Step 1 intake selesai, lanjut sampai Step 11 tanpa henti KECUALI blocker faktual / keputusan berisiko tinggi tanpa default jelas / checkpoint yang memang didesain tanya (G1) / step 11 selesai.

---

## Source of Truth & Forbidden Actions (WAJIB DIPATUHI)

**Source of truth:** kode 18.0 yang berjalan (branch `migration/18.0`, dibaca via `git show origin/migration/18.0:<path>` di repo ini) — atau `01b_BASELINE_SPEC.md` sebagai dokumentasinya — adalah kebenaran mutlak. Semua business logic, workflow, side effect, dan UX di 19.0 **harus identik** dengan 18.0 — termasuk bug yang sudah ada di sana (jangan diperbaiki, dipertahankan). Ini termasuk F-10/F-11 (backfill) dan MF-01/MF-02/MF-05 (migrasi 17→18, lihat `doc-dev/_archive/migration_17.0_18.0/doc/FINDINGS.md`) yang sudah jadi bagian kode 18.0 — **JANGAN diperbaiki** selama migrasi port-kode ini, kecuali user eksplisit meminta sebagai perubahan disengaja.

**Dilarang** (kecuali eksplisit disetujui & dicatat sebagai perubahan yang disengaja di intake):
- Menambah atau menghapus fitur
- Mengubah business rule, workflow, atau state transition
- Memperbaiki bug yang sudah ada di 18.0
- Refactor demi readability/style/performance (KECUALI wajib untuk kompatibilitas 19.0 — itu wajib)
- Redesign UI/UX demi estetika
- Rename model/field/XML-ID kecuali wajib untuk kompatibilitas

**Kapan STOP dan eskalasi ke user** (jangan lanjut dengan asumsi):
- Perubahan mungkin mempengaruhi business logic
- Fitur deprecated di 19.0 tidak punya padanan jelas
- Ada beberapa cara migrasi valid dengan efek samping berbeda
- Dampak perubahan ke behavior tidak pasti

Format eskalasi:
```
ESCALATION — Migrasi 19.0
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
2. `migration-tool/knowledge/version-diffs/18-to-19.md` — constraint teknis umum
3. `01_intake/01b_BASELINE_SPEC.md` — apa yang modul lakukan (dari `migration/18.0`)
4. `FINDINGS.md` (root `doc/`, kalau sudah ada) — daftar gap/bug/ambiguitas yang masih terbuka
5. `03_spec/03_MIGRATION_SPEC.md` (kalau sudah ada) — risiko spesifik modul ini
6. Step/fase yang sedang berjalan + prompt fase terkait di `migration-tool/templates/06b_PROMPTS_BY_PHASE.md`

**Referensi krusial modul ini:** `doc-dev/_archive/migration_17.0_18.0/doc/` sudah berisi migrasi 17→18 lengkap (intake, baseline spec, diff analysis, migration spec, code review, dev/QA testing, FINDINGS MF-01/MF-02/MF-05) — basis awal `01b_BASELINE_SPEC.md` 18→19 ini, jangan tulis ulang dari nol, cross-check ke kode 18.0 aktual. `migration-tool/migration-records/optional_field_save_17.0_18.0/SUMMARY.md` juga berisi temuan dependency-specific dari migrasi sebelumnya.

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

🏁 **MIGRASI SELESAI (dengan catatan).** Step 11 diisi ATAS INSTRUKSI EKSPLISIT pemilik modul ("percaya hasil test AI, seperti migrasi 17→18 sebelumnya", 2026-08-26) — menyimpang dari default tool (biasanya WAJIB eksekusi tangan sendiri stakeholder). Actual/Status T-01/T-02/T-03 diisi berdasarkan bukti nyata Step 9/10 (BUKAN dikarang), penyimpangan dicatat eksplisit di `11_UAT_CHECKLIST.md` (banner + catatan Sign-off) untuk jejak audit. Tanda tangan formal TETAP tidak diisi/dipalsukan. **Rekomendasi tetap berlaku:** eksekusi tangan sendiri T-01/T-02/T-03 di Odoo sungguhan sebelum go-live produksi beneran, terutama backup database (belum dilakukan, lihat "Prasyarat Sebelum Go-Live" di `11_UAT_CHECKLIST.md`).

> AI: update bagian ini sendiri di akhir tiap sesi kerja.

### Status per Step

| # | Step | Dokumen | Status | Gate |
|---|---|---|---|---|
| 1 | Intake & Scope | `01a_MIGRATION_INTAKE.md`, `01b_BASELINE_SPEC.md` | ✅ Selesai | ✔️ Lulus (2026-08-26) |
| 2 | Diff & Compatibility Analysis | `02_DIFF_ANALYSIS.md` | ✅ Selesai | Tidak ada gate formal — 1 finding baru (MF-01) di `FINDINGS.md` |
| 3 | Migration Spec (teknis) | `03_MIGRATION_SPEC.md` | ✅ Selesai | — |
| 4 | Spec Completeness Review | `04_SPEC_COMPLETENESS_REVIEW.md` | ✅ Selesai | ✔️ Lulus (2026-08-26, self-verified) |
| 5 | Acceptance Criteria & Test Plan | `05a_MIGRATION_ACCEPTANCE_CRITERIA.md`, `05b_TEST_PLAN_MIGRATION.md` | ✅ Selesai | — |
| 6 | Code Migration | kode `target-codebase` + `06c_IMPLEMENTATION_LOG.md` | ✅ Selesai (kode+G1+G2, termasuk fix MF-02) | — |
| 7 | Data Migration Scripts | — | — (n/a, port kode saja) | — |
| 8 | Code Review | `08_CODE_REVIEW.md` | ✅ Selesai | ✔️ Lulus (2026-08-26) |
| 9 | Dev Testing | `09_DEV_TESTING.md` | ✅ Selesai | ✔️ Lulus (2026-08-26) |
| 10 | QA Testing | `10_BUSINESS_FLOW_MIGRATION.md` | ✅ Selesai | ✔️ Lulus (2026-08-26) |
| 11 | UAT Sign-off | `11_UAT_CHECKLIST.md` | ✅ Selesai (diisi AI atas instruksi eksplisit, lihat catatan) | ✔️ Disetujui pemilik modul (2026-08-26, bukan eksekusi tangan sendiri — dicatat eksplisit) |

Legenda status: ⬜ Belum mulai · 🔄 Sedang dikerjakan · ✅ Draft/selesai ditulis · ✔️ Disetujui/lulus gate.

---

## Folder yang di-connect

| Folder | Path | Peran | Read-only? |
|---|---|---|---|
| `target-codebase` (folder UTAMA) | `D:\Kuncoro\doodex\repo\optional-field-save-migration-19` | CLAUDE.md+doc/ di sini, tempat kode migrasi ditulis (branch `migration/19.0_target`) | Tidak |
| `source-codebase` (referensi, dibaca via git) | branch `origin/migration/18.0` (repo GitHub sama), clone fisik: `D:\Kuncoro\doodex\repo\optional-field-save-migration-18` | Kode modul 18.0 (hasil migrasi 17→18) + `doc-dev/backfill/` + `doc-dev/migration_17.0_18.0/` | Ya |
| `migration-tool` | `D:\Kuncoro\doodex\repo\migration-tool-project\migration-tool` | Template + `ai-doc/OVERVIEW.md` + knowledge base | Tulis di `migration-records/` saja |
| `native-target` / `native-target-enterprise` (gabungan, 19.0 FINAL) | `D:\Kuncoro\doodex\repo\enterprise19.0` | Diff API core 19.0 untuk step 2 — bukan git repo (hasil extract) | Ya |
| `native-source` (Community 18.0) | `D:\Kuncoro\doodex\repo\odoo18` | Cross-check versi asal | Ya |
| `native-source-enterprise` (Enterprise 18.0) | `D:\Kuncoro\doodex\repo\enterprise18` | Cross-check — dikonfirmasi tidak dipakai modul ini, tetap tersedia untuk verifikasi step 2 | Ya |

**Enterprise/OCA:** dikonfirmasi tidak dipakai (manifest hanya `depends: ['base', 'web']`) — tetap wajib verifikasi ulang di step 2 apakah status ini berubah di 19.0 (lihat `ai-doc/OVERVIEW.md` §12).

---

## Knowledge base

Sebelum step 2 mulai analisis, cek `migration-tool/knowledge/INDEX.md` — sudah ada entry `18-to-19.md` (termasuk §1a dari project `advanced_sales_analysis`, migrasi 18→19 pertama lewat tool ini) dan `dependency-compat/sale_report/18-to-19.md`. Juga cek `knowledge/version-diffs/17-to-18.md` baris `ListRenderer.getOptionalActiveFields()`/`session.partner_id` — module ini SUDAH kena breaking change itu di migrasi sebelumnya (MF-01/MF-05), wajib dicek apakah API `computeOptionalActiveFields()`/`@web/core/user` berubah lagi di 19.0.

Temuan baru (general Odoo 18→19, atau dependency-specific) ditulis ke `migration-tool/migration-records/optional_field_save_18.0_19.0/SUMMARY.md` — BUKAN langsung ke `knowledge/`.

---

## Referensi

- Rujukan lengkap semua keputusan desain: `migration-tool/ai-doc/OVERVIEW.md`
- Migrasi 17→18 lengkap modul ini (basis `01b_BASELINE_SPEC.md`): `doc-dev/_archive/migration_17.0_18.0/doc/`
