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
| 2 — Diff & Compatibility Analysis | 1 | 0 | "lakukan lanjut migrasi" — analisis baru penuh terhadap `native-target` (`odoo20`), 7 DIFF ditemukan (DIFF-01/02/03 signifikan, DIFF-04/05/06/07 konfirmasi tidak berubah), `SUMMARY.md` migration-records ditulis, `FINDINGS.md` MF-01/02/03 |
| 3 — Migration Spec | 1 | 0 | Ditulis dalam sesi lanjutan "lakukan lanjut migrasi" yang sama dengan step 2 — 1 fix wajib (DIFF-02), 2 catatan behavior native (DIFF-01/03) |
| 4 — Spec Completeness Review | 1 | 0 | Gate lulus — 2 gap ditemukan & diperbaiki dalam sesi yang sama (ACL csv dead-file dicek ulang, test `test_plain_internal_user_cannot_write_own_partner_field` ditambahkan eksplisit ke migration spec) |
| 5 — Acceptance Criteria & Test Plan | 1 | 0 | 14 AC diturunkan dari `01b_BASELINE_SPEC.md` (BSL-001..010, 014), 1 AC bercabang (AC-05-02, DIFF-03) — test plan step 9/10/11 lengkap |
| 6 — Code Migration (semua fase A-G2) | 1 | 1 | Kode: version bump, hapus dead import (DIFF-02), fix README/LISEZMOI basi. Tool-fix: `docker-env/` di-rewrite build-from-source (image `odoo:20.0` belum ada di Docker Hub, dev pilih opsi build-from-source via AskUserQuestion). G1 PASS TOTAL (0 failed/0 error, 7 test termasuk tour). Koreksi penting: hipotesis DIFF-03 (ACL self-write) terbukti salah empiris — BSL-010 identik, MF-01 closed |
| 7 — Data Migration Scripts | 0 | 0 | N/A (port kode saja), dikonfirmasi ulang tanpa prompt tambahan |
| 8 — Code Review | 1 | 0 | Skill `odoo-review` dijalankan — 0 critical, 3 info. **Gap signifikan ditemukan: test warisan BSL-010 salah sasaran (partner tak terkait, bukan self)** — test baru ditambahkan, 2 putaran verifikasi G1 ulang, kesimpulan MF-01 dikoreksi total (self-write TERNYATA berhasil di 20.0). Gate lulus |
| 9 — Dev Testing | 1 | 1 | `docker-env/run-test.sh` diinstansiasi dari template (tool-fix: menambal gotcha DB-stale yang belum diantisipasi template asli) — eksekusi resmi 8/8 test pass, sanity check 11 "Starting" lines, gate lulus |
| 10 — QA Testing | 4 | 1 | 6 skenario (S-01..S-06). **Prompt ke-2 (dev): "kenapa lolos jika belum ada test visual/live?"** — koreksi verdict S-06 dari "Pass" jadi PENDING (MF-04). **Prompt ke-3 (dev): "ini kita beresin dulu, wajib"** — memaksa investigasi lanjutan blocker browser: root cause SEBENARNYA ditemukan (Odoo bind `127.0.0.1`, bukan limitasi sandbox), difix, server live berhasil diakses → **klik "Log out" sungguhan MENEMUKAN BUG KRITIS NYATA (405, DIFF-08/MF-05)** — fix diterapkan, tour test permanen ditambahkan, dikonfirmasi 9/9 test. Verdict final: "Lulus Penuh" (6/6 `[DIKONFIRMASI]`), bukan lagi "Lulus Bersyarat". `human_qa/` 4 file digenerate/diupdate. Tool-fix: kandidat perbaikan STOP-rule template (diagnostik `curl` sebelum simpul "limitasi sandbox") dicatat ke `migration-records/.../SUMMARY.md` |
| 11 — UAT Sign-off | 2 | 0 | Skrip T-01/T-02 (bahasa awam) + item tidak-reachable digenerate, awalnya Actual/Status/Sign-off dikosongkan. **Prompt ke-2 (dev): "UAT dianggap selesai. Percaya pada AI-test."** — pola sama seperti migrasi 18→19: kolom Actual/Status diisi AI berdasarkan bukti eksekusi nyata (bukan dikarang), T-03 dikoreksi dari "tidak bisa dites" jadi skenario teruji penuh (menemukan+memperbaiki MF-05). Sign-off diisi atas nama Kuncoro dengan catatan jujur "bukan eksekusi tangan sendiri". `MIGRATION_CLOSED.md` ditulis |
| Cross-Version Compare (cross-cutting, bukan step 1-11) | 1 | 0 | **Dev: "ya lakukan compare penuh"** — dijalankan penuh atas permintaan eksplisit meski tidak masuk kriteria wajib. Setup 2 instance live bersamaan (19.0 official image + 20.0 build-from-source). Static-diff bersih (konfirmasi ulang klaim "tidak diubah" di Fase E genuinely benar, bukan asumsi). Live A/B: logout 19.0 bersih vs 20.0 405-sebelum-fix — bukti independen tambahan untuk MF-05. 3 finding (`RMV-01/02/03`), 0 regresi baru |
| **Total** | 17 | 3 | |

## Catatan Definisi

*(belum ada revisi kriteria)*

## Ringkasan Akhir Project (semua step AI-executable selesai, 2026-09-21 — menunggu sign-off manusia step 11)

- Step dengan rasio Tool-fix tertinggi: Step 6 dan Step 9 (masing-masing 1 tool-fix — `docker-env/`
  build-from-source, gotcha DB-stale di `run-test.sh`); Step 10 punya prompt terbanyak (4) karena
  butuh 2 koreksi berturut sebelum verdict genuinely akurat.
- Step yang paling "bersih" (0 tool-fix): 1-5, 7, 8, 11.
- **🔴 Temuan PALING signifikan (MF-05/DIFF-08):** logout RUSAK TOTAL di 20.0 (405 Method Not
  Allowed) — `/web/session/logout` native menolak GET, modul masih navigasi GET (warisan 17.0).
  **TIDAK ADA step analisis/review statis manapun (2/3/8) yang menangkap ini** — hanya ketemu lewat
  eksekusi visual/live nyata yang DIPAKSA oleh dev setelah menegur gate yang lolos tanpa bukti
  (lihat MF-04). Fix diterapkan + tour test permanen ditambahkan. Ini BUKTI KONKRET kenapa insistensi
  "jangan lulus tanpa test visual/live" itu penting, bukan formalitas.
- **Temuan kedua:** MF-01 (ACL `res.partner` self-write) — hipotesis benar dari awal (step 2), tapi
  verifikasi putaran pertama (step 6) SEMPAT salah simpul karena test warisan tidak menyasar skenario
  yang relevan; ketahuan lewat step 8 (code review). Pelajaran: satu test yang "PASS" tidak otomatis
  membuktikan hipotesis — cek relevansi skenarionya.
- **Blocker infrastruktur yang muncul (2x), keduanya diselesaikan:** (1) Docker Hub tidak punya image
  `odoo:20.0` — build-from-source dari `native-target`, dikonfirmasi via `AskUserQuestion`. (2) Server
  QA sempat tidak reachable sama sekali (browser MAUPUN `curl` host) — root cause bind `127.0.0.1` di
  container, awalnya SALAH diduga "limitasi sandbox browser" sampai `curl` host dicoba dan JUGA gagal.
- **Tidak ada gap yang dibiarkan terbuka** — S-06 (cleanup logout) yang sempat jadi gap warisan
  17.0/PENDING justru jadi pintu masuk menemukan MF-05; sekarang `[DIKONFIRMASI]` penuh dengan test
  permanen. Verdict step 10 final: Lulus Penuh, bukan Lulus Bersyarat.
