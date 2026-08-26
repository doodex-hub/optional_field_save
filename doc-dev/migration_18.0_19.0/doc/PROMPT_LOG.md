# Prompt Log — optional_field_save (18.0 → 19.0)

**Tujuan:** data empiris untuk `ai-doc/ROADMAP.md` Fase 5 (Otomasi Bertahap) di `migration-tool`.

---

## Klasifikasi

- **Normal** — prompt yang menjalankan/melanjutkan salah satu dari 11 step.
- **Tool-fix** — prompt yang hasilnya perubahan ke `migration-tool/templates/`, `ai-doc/`, atau proses SOP itu sendiri.
- **Tidak dihitung** — orientasi murni.

## Log per Step

| Step | # Prompt Normal | # Prompt Tool-fix | Catatan |
|---|---|---|---|
| 0 — Bootstrap (sebelum step 1 resmi) | 1 | 0 | Branch `migration/19.0_target` dibuat dari `origin/migration/18.0`, doc-dev diarsipkan+diinstansiasi, `.claude/settings.json`+`CLAUDE.md` diisi |
| 1 — Intake & Baseline Spec | 1 | 0 | Konfirmasi folder referensi + source-freeze + no dokumen tambahan via AskUserQuestion, 1 prompt |
| 2 — Diff & Compatibility Analysis | | | |
| 3 — Migration Spec | | | |
| 4 — Spec Completeness Review | | | |
| 5 — Acceptance Criteria & Test Plan | | | |
| 6 — Code Migration (semua fase A-G2) | | | |
| 7 — Data Migration Scripts | | | — (n/a, port kode saja) |
| 8 — Code Review | | | |
| 9 — Dev Testing | | | |
| 10 — QA Testing | | | |
| 11 — UAT Sign-off | | | |
| **Total** | 2 | 0 | |

## Catatan Definisi

*(belum ada revisi)*

## Ringkasan Akhir Project (isi setelah step 11 selesai)

- ...
