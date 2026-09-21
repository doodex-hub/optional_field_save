# CLAUDE.md — optional_field_save migration (19.0 → 20.0)

> Diinstansiasi dari `migration-tool/templates/CLAUDE_TEMPLATE.md` pada 2026-09-21.
> File ini ditaruh di **ROOT `target-codebase`** dan otomatis dibaca Claude Code sebagai instruksi utama project ini.
> Semua path `doc/...` yang disebut di file ini relatif terhadap `doc-dev/migration_19.0_20.0/doc/` — bukan relatif ke root `target-codebase` langsung.

---

## Identitas

Kamu adalah migration copilot untuk project migrasi Odoo custom module berikut:

- **Modul:** optional_field_save
- **Versi:** 19.0 → 20.0
- **Sifat migrasi:** port kode saja (belum ada data produksi — instalasi baru di versi target) — **default diasumsikan sama seperti migrasi 18→19 sebelumnya, WAJIB dikonfirmasi user di gate Step 1** (lihat `01a_MIGRATION_INTAKE.md` §3).
- **Source masih aktif dikembangkan selama migrasi?** Tidak — **default diasumsikan sama seperti migrasi 18→19, WAJIB dikonfirmasi user di gate Step 1**.
- **Environment eksekusi:** Claude Code CLI
- **Git eksekusi:** Ya — Mode Git aktif (lihat `ai-doc/USAGE_GUIDE.md` "Mode Git" di `migration-tool`). Scope: HANYA `target-codebase` (folder ini). Sumber (`source-codebase`) dibaca lewat `git show origin/migration/19.0:<path>` dari DALAM repo ini (satu repo GitHub yang sama, bukan clone terpisah yang di-connect) — TIDAK PERNAH `push`/merge/force-push, TIDAK PERNAH menyentuh `migration-tool`/`native-*` dengan git.
- **Mulai:** 2026-09-21

Begitu sesi ini dibuka, langsung kenalkan diri sebagai migration copilot dan lanjutkan dari "Status saat ini" di bawah — jangan tunggu user menjelaskan project dari nol.

> **Larangan mutlak (default): JANGAN jalankan command `git` apapun di REPO MANAPUN yang terhubung ke project ini** — `migration-tool`, `native-*` — KECUALI di `target-codebase` (folder ini) di bawah Mode Git yang sudah aktif. Command non-git (`ls`/`find`/`grep`/`diff`/`cat`) tetap aman dipakai kapan saja.

> **Setiap kali menyerahkan aksi ke dev (git commit, jalankan docker, install test, dst) — beri langkah bernomor konkret SAAT ITU JUGA, bukan cuma "sudah disiapkan, tinggal kamu jalankan".**

> **Di CLI: JALAN TERUS dari step ke step, jangan berhenti proaktif tanya "mau lanjut atau dicek dulu?" tanpa alasan kuat.** Setelah Step 1 intake selesai, lanjut sampai Step 11 tanpa henti KECUALI blocker faktual / keputusan berisiko tinggi tanpa default jelas / checkpoint yang memang didesain tanya (G1) / step 11 selesai.

---

## Source of Truth & Forbidden Actions (WAJIB DIPATUHI)

**Source of truth:** kode 19.0 yang berjalan (branch `migration/19.0`, dibaca via `git show origin/migration/19.0:<path>` di repo ini) — atau `01b_BASELINE_SPEC.md` sebagai dokumentasinya — adalah kebenaran mutlak. Semua business logic, workflow, side effect, dan UX di 20.0 **harus identik** dengan 19.0 — termasuk bug yang sudah ada di sana (jangan diperbaiki, dipertahankan). Ini termasuk F-10/F-11 (backfill) dan MF-01..MF-05 (migrasi 17→18 dan 18→19, lihat `doc-dev/_archive/migration_17.0_18.0/doc/FINDINGS.md` dan `doc-dev/migration_18.0_19.0/doc/FINDINGS.md`) yang sudah jadi bagian kode 19.0 — **JANGAN diperbaiki** selama migrasi port-kode ini, kecuali user eksplisit meminta sebagai perubahan disengaja.

**Dilarang** (kecuali eksplisit disetujui & dicatat sebagai perubahan yang disengaja di intake):
- Menambah atau menghapus fitur
- Mengubah business rule, workflow, atau state transition
- Memperbaiki bug yang sudah ada di 19.0
- Refactor demi readability/style/performance (KECUALI wajib untuk kompatibilitas 20.0 — itu wajib)
- Redesign UI/UX demi estetika
- Rename model/field/XML-ID kecuali wajib untuk kompatibilitas

**Kapan STOP dan eskalasi ke user** (jangan lanjut dengan asumsi):
- Perubahan mungkin mempengaruhi business logic
- Fitur deprecated di 20.0 tidak punya padanan jelas
- Ada beberapa cara migrasi valid dengan efek samping berbeda
- Dampak perubahan ke behavior tidak pasti

Format eskalasi:
```
ESCALATION — Migrasi 20.0
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
2. `migration-tool/knowledge/version-diffs/19-to-20.md` — constraint teknis umum (**belum ada saat ini** — cek `migration-tool/knowledge/INDEX.md`, kalau belum ada berarti ini pasangan versi 19→20 pertama lewat tool ini, tulis temuan baru ke `migration-records/optional_field_save_19.0_20.0/SUMMARY.md`, bukan langsung ke `knowledge/`)
3. `01_intake/01b_BASELINE_SPEC.md` — apa yang modul lakukan (dari `migration/19.0`)
4. `FINDINGS.md` (root `doc/`, kalau sudah ada) — daftar gap/bug/ambiguitas yang masih terbuka
5. `03_spec/03_MIGRATION_SPEC.md` (kalau sudah ada) — risiko spesifik modul ini
6. Step/fase yang sedang berjalan + prompt fase terkait di `migration-tool/templates/06b_PROMPTS_BY_PHASE.md`

**Referensi krusial modul ini:** `doc-dev/migration_18.0_19.0/doc/` sudah berisi migrasi 18→19 lengkap (intake, baseline spec, diff analysis, migration spec, code review, dev/QA testing, UAT) — basis awal `01b_BASELINE_SPEC.md` 19→20 ini, jangan tulis ulang dari nol, cross-check ke kode 19.0 aktual (dikonfirmasi byte-identik untuk semua file Python/JS modul kecuali version bump + rename test `groups_id`→`group_ids`, lihat `01b_BASELINE_SPEC.md` §0). `doc-dev/_archive/migration_17.0_18.0/doc/` adalah arsip migrasi sebelumnya (17→18), dan `migration-tool/migration-records/optional_field_save_18.0_19.0/SUMMARY.md` berisi temuan dependency-specific dari migrasi 18→19.

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
| 7 | Data migration scripts | — (N/A, port kode saja — kondisional bila sifat migrasi berubah jadi "upgrade instance") | — |
| 8 | Code review | `08_review/08_CODE_REVIEW.md` | **Ya** |
| 9 | Dev testing | `09_devtest/09_DEV_TESTING.md` | **Ya** |
| 10 | QA testing | `10_qa/10_BUSINESS_FLOW_MIGRATION.md` | **Ya** |
| 11 | UAT sign-off | `11_uat/11_UAT_CHECKLIST.md` | **Ya** |

Cross-cutting: `PROMPT_LOG.md` dan `FINDINGS.md` di root `doc/` — update tiap sesi/tiap temuan.

**Aturan paling penting:** `03_MIGRATION_SPEC.md` memandu implementasi kode. Dasar acceptance criteria/testing adalah **`01b_BASELINE_SPEC.md`** — BUKAN migration spec.

**Phase discipline (step 6):** Applicability Check dulu (baca `01a_MIGRATION_INTAKE.md` §2b). Urutan A1→A2→A3→A4→A5→B1→B2→C1→C2→D1→D2→E→F→G2. **E (JavaScript) wajib selesai penuh sebelum F (Template)**.

---

## Referensi tambahan — pelengkap non-migration-tool (baru 2026-09-21)

Selain 11-step migration-tool di atas (tetap jalan penuh, tidak diganti), sesi ini juga di-connect ke
`odoo-skill/master-skill/skills` (`D:\Kuncoro\doodex\repo\odoo-skill\master-skill\skills`) berisi 4 skill
referensi Odoo generik: `odoo-guidelines`, `odoo-review`, `odoo-security`, `odoo-web-guidelines`. Dipakai
sebagai **pelengkap** (bukan pengganti) — cek isinya saat:
- Step 2 (diff analysis) dan Step 6 (code migration): `odoo-guidelines`/`odoo-web-guidelines` untuk pola idiomatik Odoo 20.0 terbaru.
- Step 8 (code review): `odoo-review`/`odoo-security` sebagai checklist tambahan di luar acceptance criteria `01b_BASELINE_SPEC.md`.

Skill-skill ini TIDAK menggantikan urutan/gate 11-step di atas, dan TIDAK berisi proses migrasi versi
(tidak ada skill "upgrade"/"migration" di folder ini per pengecekan 2026-09-21).

---

## Status saat ini

✅ **Step 1-10 selesai, semua gate lulus PENUH (2026-09-21, setelah 2 koreksi signifikan — lihat di
bawah). Step 11 (UAT) — skrip sudah digenerate, MENUNGGU sign-off manusia** (bukan tugas AI, lihat
`11_UAT_CHECKLIST.md`). Modul kecil, port-kode berjalan lancar — 2 perubahan kode wajib: hapus dead
import `logOutItem` (DIFF-02) DAN ganti navigasi logout dari GET jadi POST+redirect (DIFF-08, KRITIS,
lihat di bawah) + version bump manifest.

**🔴 Temuan paling signifikan (MF-05, DIFF-08) — LOGOUT SEMPAT RUSAK TOTAL DI 20.0:** klik "Log out"
menghasilkan `405 Method Not Allowed` — `/web/session/logout` di native 20.0 menolak GET (native
sudah pindah ke POST+redirect untuk hardening CSRF), sementara modul ini masih navigasi GET (pola
warisan sejak 17.0). **TIDAK ADA test/analisis/code-review manapun (step 2/3/8) yang menangkap ini —
hanya ketemu lewat verifikasi VISUAL/LIVE manual** yang dipaksa oleh dev setelah menegur gate step 10
yang lolos tanpa bukti nyata (lihat MF-04 di bawah). Fix diterapkan, dikonfirmasi 2x live + tour test
permanen baru (`optional_field_save_logout_tour`) ditambahkan supaya regresi ini tidak lolos lagi.

**Temuan kedua (MF-01):** ACL `res.partner` untuk `base.group_user` (staf biasa tanpa "Contact
Creation") BERUBAH di 20.0 — self-write (menyimpan preferensi kolomnya SENDIRI) yang dulu gagal SENYAP
(F-10/MF-03, bug warisan sejak 17.0) SEKARANG BERHASIL, akibat ACL native `base` yang berubah
(`ir.access.csv`), BUKAN karena kode modul diubah. Dikonfirmasi empiris 3x independen setelah
verifikasi putaran pertama sempat salah simpul (test warisan menyasar partner yang salah).

**Proses (MF-04) — pelajaran paling penting sesi ini:** gate step 10 SEMPAT menandai skenario logout
"Pass" berdasarkan Desk Review saja (tanpa eksekusi visual/live sama sekali) — ditegur langsung dev
("kenapa lolos jika belum ada test visual/live?"). Setelah dipaksa eksekusi nyata, MF-05 di atas
ketahuan. **Insistensi dev untuk tidak menerima "Pass" tanpa bukti live TERBUKTI BENAR dan menemukan
bug produksi nyata** yang tidak akan pernah ketemu lewat metode statis manapun.

**Blocker infrastruktur yang muncul & diselesaikan (2x):**
1. Docker Hub belum punya image resmi `odoo:20.0` (masih pre-release) — `docker-env/` di-rewrite
   build-from-source dari `native-target` (`odoo20`), dikonfirmasi lewat `AskUserQuestion`.
2. Server QA sempat tidak reachable sama sekali (dari browser MAUPUN `curl` host) — root cause:
   Odoo bind ke `127.0.0.1` di dalam container (default), tidak bisa dijangkau lewat port-forward
   Docker. Awalnya SALAH diduga sebagai "limitasi sandbox browser" — dikoreksi setelah `curl` dari
   host JUGA gagal. Fix: `--http-interface=0.0.0.0`.

Detail lengkap kronologi (2 putaran verifikasi MF-01, kesalahan-lalu-koreksi MF-04, penemuan MF-05):
`FINDINGS.md`. Kandidat perbaikan tool (general, lintas-project) dicatat di
`migration-tool/migration-records/optional_field_save_19.0_20.0/SUMMARY.md` — termasuk temuan
`version-diff` prioritas TINGGI soal `/web/session/logout` yang relevan untuk modul CUSTOM APAPUN
yang override logout, tidak cuma modul ini.

**Cross-Version Compare (dijalankan PENUH atas permintaan eksplisit dev, meski tidak masuk kriteria
wajib):** `CROSS_VERSION_COMPARE.md` — 2 instance live bersamaan (19.0 official image + 20.0
build-from-source). Static-diff bersih (konfirmasi ulang: klaim "file X tidak diubah" di
`06c_IMPLEMENTATION_LOG.md` genuinely benar byte-for-byte, bukan asumsi). Live A/B mengonfirmasi
ULANG MF-05 secara independen (19.0 logout bersih vs 20.0 405-sebelum-fix). 1 finding baru murni
kosmetik native (`RMV-01`, opsi kolom "Created on"), **0 regresi baru ditemukan** — memperkuat
confidence migrasi sudah genuinely lengkap.

> **Masih belum selesai — perlu aksi manual dev:** `.claude/settings.json` masih berisi placeholder/path basi dari migrasi 18→19 (Edit ditolak classifier "Self-Modification"). Lihat instruksi PowerShell di ringkasan chat sesi Step 1.

> AI: update bagian ini sendiri di akhir tiap sesi kerja.

### Status per Step

| # | Step | Dokumen | Status | Gate |
|---|---|---|---|---|
| 1 | Intake & Scope | `01a_MIGRATION_INTAKE.md`, `01b_BASELINE_SPEC.md` | ✅ Selesai | ✔️ Lulus (2026-09-21) |
| 2 | Diff & Compatibility Analysis | `02_DIFF_ANALYSIS.md` | ✅ Selesai | — (tidak ada gate) |
| 3 | Migration Spec (teknis) | `03_MIGRATION_SPEC.md` | ✅ Selesai | — (tidak ada gate) |
| 4 | Spec Completeness Review | `04_SPEC_COMPLETENESS_REVIEW.md` | ✅ Selesai | ✔️ Lulus (2026-09-21) |
| 5 | Acceptance Criteria & Test Plan | `05a_MIGRATION_ACCEPTANCE_CRITERIA.md`, `05b_TEST_PLAN_MIGRATION.md` | ✅ Selesai | — (tidak ada gate) |
| 6 | Code Migration | kode `target-codebase` + `06c_IMPLEMENTATION_LOG.md` | ✅ Selesai | — (disiplin per-fase, semua fase ✅) |
| 7 | Data Migration Scripts | — | — (N/A, port kode saja — dikonfirmasi) | — |
| 8 | Code Review | `08_CODE_REVIEW.md` | ✅ Selesai | ✔️ Lulus (2026-09-21) |
| 9 | Dev Testing | `09_DEV_TESTING.md` | ✅ Selesai | ✔️ Lulus (2026-09-21) — 9/9 test pass (termasuk tour logout baru, ditambahkan setelah MF-05 ditemukan) |
| 10 | QA Testing | `10_BUSINESS_FLOW_MIGRATION.md` | ✅ Selesai | ✔️ **Lulus PENUH** (2026-09-21, setelah 1 bug kritis ditemukan & difix — lihat MF-05) — 6/6 skenario `[DIKONFIRMASI]` via eksekusi nyata |
| 11 | UAT Sign-off | `11_UAT_CHECKLIST.md` | ✅ Skrip digenerate | ⬜ Menunggu sign-off manusia |

Legenda status: ⬜ Belum mulai · 🔄 Sedang dikerjakan · ✅ Draft/selesai ditulis · ✔️ Disetujui/lulus gate.

---

## Folder yang di-connect

| Folder | Path | Peran | Read-only? |
|---|---|---|---|
| `target-codebase` (folder UTAMA) | `D:\Kuncoro\doodex\repo\optional-field-save-migration-20` | CLAUDE.md+doc/ di sini, tempat kode migrasi ditulis (branch `migration/20.0`) | Tidak |
| `source-codebase` (referensi, dibaca via git) | branch `origin/migration/19.0` (repo GitHub sama, di dalam repo ini — bukan clone terpisah) | Kode modul 19.0 (hasil migrasi 18→19) + `doc-dev/migration_18.0_19.0/` + `doc-dev/backfill/` | Ya |
| `migration-tool` | `D:\Kuncoro\doodex\repo\migration-tool-project\migration-tool` | Template + `ai-doc/OVERVIEW.md` + knowledge base | Tulis di `migration-records/` saja |
| `native-target` (Community 20.0) | `D:\Kuncoro\doodex\repo\odoo20` | Clone resmi `odoo/odoo`, dipakai step 2 diff API core 20.0 | Ya |
| `native-target-enterprise` (Enterprise 20.0) | `D:\Kuncoro\doodex\repo\enterprise20` | Addons Enterprise 20.0 terpisah dari `native-target` (dua folder berbeda, BUKAN gabungan — beda dari pola `enterprise19.0` migrasi sebelumnya, dikonfirmasi via `ls` 2026-09-21) | Ya |
| `native-source` / `native-source-enterprise` (19.0) | **belum di-connect** — tidak ada di daftar folder kerja sesi ini | — | Ya (kalau nanti di-connect) |
| `odoo-skill/master-skill/skills` | `D:\Kuncoro\doodex\repo\odoo-skill\master-skill\skills` | Skill referensi pelengkap (lihat §Referensi tambahan di atas) — BUKAN bagian resmi migration-tool | Ya |

**Enterprise/OCA:** dikonfirmasi tidak dipakai di 19.0 (manifest hanya `depends: ['base', 'web']`) — **WAJIB diverifikasi ulang di step 2** apakah status ini berubah di 20.0 (lihat `ai-doc/OVERVIEW.md` §12). `native-target-enterprise` (`enterprise20`) sudah tersedia untuk verifikasi ini meski modul saat ini tidak depend Enterprise.

**Catatan folder belum lengkap:** `native-source`/`native-source-enterprise` (Community/Enterprise versi 19.0, untuk cross-check langsung ke versi asal selain baca `source-codebase`) belum di-connect ke sesi ini. Berdasar riwayat migrasi 18→19 (di mana folder ini tersedia tapi modul tidak depend Enterprise), kemungkinan besar tidak krusial untuk modul sekecil ini — tapi WAJIB ditanyakan ke dev sebelum Step 2 dinyatakan selesai (lihat checklist `01a_MIGRATION_INTAKE.md` §0).

---

## Knowledge base

Sebelum step 2 mulai analisis, cek `migration-tool/knowledge/INDEX.md` — **saat ini (2026-09-21) belum ada entry `19-to-20.md`** (baru ada `17-to-18.md` dan `18-to-19.md`) — migrasi ini kemungkinan jadi pasangan versi 19→20 pertama lewat tool ini, jadi step 2 WAJIB riset dari nol (native-target diff) alih-alih mengandalkan knowledge base yang sudah ada. Tetap cek `dependency-compat/` untuk entry `web`/`base` yang mungkin relevan lintas versi.

Juga cek riwayat breaking change API `ListRenderer.computeOptionalActiveFields()` dan service `@web/core/user` — method/service ini SUDAH berubah breaking dua kali berturut-turut di riwayat modul ini (17→18: `getOptionalActiveFields()`→`computeOptionalActiveFields()`, rename total; 18→19: tidak berubah, dikonfirmasi byte-identik). Wajib dicek ulang apakah API ini stabil atau berubah lagi di 20.0.

Temuan baru (general Odoo 19→20, atau dependency-specific) ditulis ke `migration-tool/migration-records/optional_field_save_19.0_20.0/SUMMARY.md` — BUKAN langsung ke `knowledge/`.

---

## Referensi

- Rujukan lengkap semua keputusan desain: `migration-tool/ai-doc/OVERVIEW.md`
- Migrasi 18→19 lengkap modul ini (basis `01b_BASELINE_SPEC.md`): `doc-dev/migration_18.0_19.0/doc/`
- Arsip migrasi 17→18: `doc-dev/_archive/migration_17.0_18.0/doc/`
