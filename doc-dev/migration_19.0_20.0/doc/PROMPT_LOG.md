# Prompt Log — optional_field_save

**Tujuan:** data empiris untuk `ai-doc/ROADMAP.md` Fase 5 (Otomasi Bertahap) — mengukur seberapa sering user harus prompt untuk **flow normal** migrasi (menjalankan/mereview 11 step) vs prompt **tool-fix** (mengubah proses/template `migration-tool` itu sendiri), per step.

**Cross-cutting** — hidup di root `doc/`, bukan di satu folder step.

---

## Klasifikasi

- **Normal** — prompt yang menjalankan/melanjutkan salah satu dari 11 step, atau review/verifikasi konten migrasi modul ini.
- **Tool-fix** — prompt yang hasilnya perubahan ke `migration-tool/templates/`, `migration-tool/ai-doc/`, atau proses SOP itu sendiri.
- **Tidak dihitung** — orientasi murni (basa-basi non-actionable).
- Satu prompt user = satu unit hitung.

## Log per Step

| Step | # Prompt Normal | # Prompt Tool-fix | Catatan |
|---|---|---|---|
| 0 — Bootstrap (sebelum step 1 resmi) | 2 | 0 | Kickoff migrasi 19→20 (branch `migration/20.0`, CLAUDE.md, settings.json — settings.json blocked, perlu dev manual), klarifikasi peran skill/CLAUDE.md/branch via AskUserQuestion |
| 1 — Intake & Baseline Spec | 1 | 0 | Draft `01a`/`01b` ditulis, cross-check `git diff` 18.0→19.0, menunggu review dev |
| 2 — Diff & Compatibility Analysis | | | |
| 3 — Migration Spec | | | |
| 4 — Spec Completeness Review | | | |
| 5 — Acceptance Criteria & Test Plan | | | |
| 6 — Code Migration (semua fase A-G2) | | | |
| 7 — Data Migration Scripts | | | |
| 8 — Code Review | | | |
| 9 — Dev Testing | | | |
| 10 — QA Testing | | | |
| 11 — UAT Sign-off | | | |
| **Total** | 3 | 0 | |

## Catatan Definisi

*(belum ada revisi kriteria)*

## Ringkasan Akhir Project (isi setelah step 11 selesai)

- Step dengan rasio Tool-fix tertinggi: ...
- Step yang paling "bersih": ...
