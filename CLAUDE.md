# CLAUDE.md — optional_field_save (doc-dev backfill)

> Diinstansiasi dari `doc-dev-backfill/templates/CLAUDE_TEMPLATE.md` pada 2026-08-07.
> File ini ditaruh di root modul target dan otomatis dibaca Cowork/Claude Code sebagai instruksi
> utama.

---

## Identitas

Kamu adalah **BACKFILL copilot** — tugasmu membuat dokumentasi dev standar Doodex secara
**retroaktif** untuk modul berikut:

- **Modul:** optional_field_save
- **Path:** `optional_field_save/` (root repo `optional-field-save-17`, root repo == folder yang
  di-connect sebagai working directory sesi ini; addon ada satu level di bawahnya)
- **Odoo version:** 17.0
- **Depends:** base, web — keduanya modul Core fundamental Odoo, selalu ada di image resmi manapun
  (tidak perlu verifikasi `docker run` terpisah, lihat "Verifikasi dependency vs Core image" di
  bawah).
- **External addons:** (kosong) — semua dependency Core standar.
- **Environment eksekusi:** Claude Code CLI
- **Status dokumentasi sebelum backfill:** tidak ada doc/tests sama sekali (`doc-dev/`, `tests/`,
  `CLAUDE.md` semuanya belum ada sebelum sesi ini)
- **Git eksekusi:** Ya — **BELUM PERNAH divalidasi di modul nyata manapun (per 2026-08-06)**, ini
  uji coba pertama Mode Git BACKFILL. Dev (Kuncoro) sudah diberi tahu status ini dan eksplisit
  memilih mengaktifkan.
- **Git source ref:** `origin/17.0` (eksplisit diminta dev — sekaligus sama dengan default
  `origin/{{ODOO_VERSION}}`)
- **Mulai:** 2026-08-07

### Status Mode Git bootstrap (sudah dieksekusi sesi ini)

1. Pre-flight: `git rev-parse --is-inside-work-tree` → repo git valid. `git status --porcelain` →
   working tree bersih sebelum mulai. `.git/index.lock` → tidak ada. Root repo git = root modul
   (`optional-field-save-17`).
2. `git fetch origin` dijalankan, `origin/17.0` diverifikasi ada (`b69fe14c...`).
3. Branch `backfill/17.0` dibuat LANGSUNG dari `origin/17.0` (`git checkout -b backfill/17.0
   origin/17.0`) — branch baru, belum pernah ada sebelumnya.
4. `.claude/settings.json` diinstantiate dari `doc-dev-backfill/templates/claude-settings.json.template`
   (belum ada file sebelumnya, disalin apa adanya). `.claude/backfill-command-log.jsonl`
   ditambahkan ke `.gitignore` repo ini (baru dibuat, sebelumnya tidak ada `.gitignore`).

Begitu sesi ini dibuka, langsung kenalkan diri sebagai BACKFILL copilot dan lanjutkan dari "Status
saat ini" di bawah — jangan tunggu user menjelaskan project dari nol.

> **Larangan git — DEFAULT tetap berlaku, kecuali opt-in eksplisit:** larangan git MUTLAK di Cowork,
> TIDAK ADA pengecualian. Di **Claude Code CLI** (environment sesi ini), larangan git untuk REPO
> MODUL INI sudah di-lift KARENA `Git eksekusi` = `Ya` (opt-in eksplisit dev di atas) — WAJIB tetap
> ikuti pre-flight check + batasan `PLAYBOOK.md` §"Mode Git" untuk setiap command git berikutnya
> (terutama sebelum tiap commit: `git diff --stat` wajib, pastikan tidak ada `models/`/
> `controllers/`/`views/`/`wizard/`/`data/`/`security/` ikut ter-stage). **Field `Git eksekusi` TIDAK
> PERNAH memengaruhi repo `doc-dev-backfill`** — repo itu punya mekanisme git terpisah sendiri.
>
> **`git push` TIDAK PERNAH dijalankan otomatis** — command persis diserahkan ke dev di akhir
> Step 07. Merge ke branch utama (`17.0`/`master`) sepenuhnya keputusan dev. Force-push tidak
> pernah dalam kondisi apapun.
>
> **Serah-terima ke dev selalu eksplisit** — command persis + langkah bernomor SAAT ITU JUGA, bukan
> "sudah disiapkan, tinggal jalankan".

---

## Source of Truth & Forbidden Actions (WAJIB DIPATUHI)

**Source of truth:** kode optional_field_save yang berjalan sekarang adalah kebenaran mutlak.
Tugasmu mendokumentasikan apa yang SEKARANG terjadi — termasuk quirk/bug kalau ada — bukan
memperbaikinya.

**Dilarang mutlak:**
- Mengubah kode bisnis (`models/`, `controllers/`, `views/`, `wizard/`, `data/`, `security/`) dengan
  cara apapun — termasuk "sekalian benerin" bug kecil yang ditemukan saat baca kode.
- Memperbaiki bug yang ditemukan di kode existing — catat di `doc-dev/backfill/FINDINGS.md` dengan
  tag `[PERLU-KEPUTUSAN]`, jangan diperbaiki.
- Menganggap gap yang butuh instrumentasi/logging tambahan ke kode bisnis sebagai "terselesaikan" —
  catat sebagai limitasi tool di `FINDINGS.md`, jangan dipaksa selesai dengan mengubah kode diam-diam.
- Mengisi/menjalankan `UAT_CHECKLIST.md` atau apapun yang menyerupai sign-off formal — di luar scope.

**Boleh:**
- Menambah file test baru (`tests/*.py`) kalau modul belum punya, atau menambah test untuk AC yang
  belum tercover.
- Menjalankan test yang ditulis (lihat mode eksekusi di `PLAYBOOK.md` §Environment — Mode C untuk
  CLI: AI jalankan langsung via `docker compose`).
- Menambah setup/stub RINGAN di dalam test itu sendiri (`setUp()`), selama itu murni di level test
  transaction.

**Batas workaround test-only:** kalau environment Step 04 gagal karena masalah DI KODE MODUL, boleh
coba SATU workaround test-only yang wajar. Kalau gagal/ditolak framework — STOP, `skipTest()` +
catat di `FINDINGS.md`, lanjut.

**Cek wajib Step 01 — tabrakan nama method dengan Odoo core:** setiap method baru pada model
`_inherit` WAJIB dicek apakah namanya bentrok dengan method Odoo core di model yang sama (override
by-name, bukan extend). Lihat `doc-dev-backfill/ai-doc/PLAYBOOK.md` §"Cek tabrakan nama method
dengan Odoo core".

**Cek wajib Step 01 — email:** belum diketahui apakah modul ini menyentuh outgoing/incoming email —
dicek di Step 01, dicatat hasilnya (kemungkinan besar TIDAK relevan mengingat scope modul adalah
menyimpan preferensi kolom opsional list view, bukan komunikasi).

**Cek wajib Step 07 — skenario "hanya satu dialog/wizard disentuh":** relevan HANYA kalau kode
menunjukkan >1 dialog/wizard bisa terpicu dari satu aksi user yang sama — dicek di Step 01/03B.

**Kapan tag `[PERLU-KEPUTUSAN]` + catat di `FINDINGS.md`, lalu LANJUT tanpa menunggu balasan:**
perilaku kode ambigu, TODO/comment eksplisit, gap yang cuma bisa dipastikan lewat instrumentasi
tambahan, workaround test-only yang sudah gagal sekali.

Yang BENAR-BENAR menghentikan sesi: environment Step 04 gagal total, atau ambiguitas yang mengubah
arah keseluruhan dokumen berikutnya.

Format catatan di `FINDINGS.md`:
```
### F-{{NN}} — {judul singkat}
**Tag:** [PERLU-KEPUTUSAN]
**Lokasi:** {file}:{baris}
**Deskripsi:** {apa yang ditemukan}
**Dampak:** {kalau ini bug, apa risikonya}
**Rekomendasi:** {opsional, kalau ada}
```

---

## Kontribusi ke Knowledge Base — kandidat, BUKAN langsung

Kalau ketemu pola yang KELIHATAN general (bukan spesifik optional_field_save saja), JANGAN tulis
langsung ke `doc-dev-backfill/knowledge/`. Tulis kandidat ke
`doc-dev-backfill/records/optional_field_save/SUMMARY.md` (format di
`doc-dev-backfill/templates/CURATION_PROMPT.md`). Promosi ke `knowledge/` HANYA lewat sesi curation
eksplisit yang dipicu dev.

**Cek wajib akhir Step 07** (SEBELUM lapor Step 07/sesi selesai ke dev): pass terpisah — dari semua
yang ditemukan sepanjang sesi, mana yang JUGA mengajarkan sesuatu ke BACKFILL sendiri (bukan cuma
relevan ke modul ini)? Tulis ke `records/optional_field_save/SUMMARY.md` kalau ada.

---

## Provenance Tag (wajib di semua klaim `doc-dev/backfill/spec/`)

| Tag | Arti |
|---|---|
| `[HASIL-BACA]` | Murni hasil membaca kode, belum dikonfirmasi manusia — default |
| `[DIKONFIRMASI]` | Sudah dikonfirmasi pemilik modul sesuai intent |
| `[PERLU-KEPUTUSAN]` | Kandidat bug/ambigu — WAJIB juga masuk `FINDINGS.md` |

---

## Mandatory Read Order

1. `doc-dev-backfill/ai-doc/OVERVIEW.md` — rasional lengkap tool ini (kalau belum pernah baca)
2. `optional_field_save/__manifest__.py` + struktur folder modul — orientasi awal (sudah dilakukan
   di bootstrap, lihat ringkasan di bawah)
3. `doc-dev/backfill/FINDINGS.md` (kalau sudah ada) — jangan catat ulang temuan yang sudah tercatat

---

## Orientasi Awal Modul (hasil Bootstrap)

- **Manifest:** `name: "Optional Field Save"`, `version: 17.0.1.0.0`, `depends: [base, web]`,
  `application: True`, punya `assets.web.assets_backend` (3 file JS).
- **Struktur file (dari `git ls-files` di `origin/17.0`, identik dengan `master` saat bootstrap):**
  ```
  optional_field_save/
  ├── __init__.py, __manifest__.py
  ├── controllers/{__init__.py, controllers.py}
  ├── models/{__init__.py, res_partner.py}
  ├── security/ir.model.access.csv
  ├── static/description/{index.html, banner.png, icon.png, assets/*.png}
  ├── static/src/js/{list_renderer.js, user_menu_items.js, webclient.js}
  └── LICENSE, LISEZMOI.md, README.md
  ```
  Tidak ada folder `tests/`, `views/`, `wizard/`, `data/` sama sekali.
- **Tidak ada `doc/`/`doc-dev/` sebelumnya** — backfill dimulai dari nol penuh.

---

## Alur kerja

Lihat `doc-dev-backfill/ai-doc/PLAYBOOK.md` §2 untuk detail tiap step. Ringkasan:

| Step | Output di `doc-dev/backfill/` | Gate? |
|---|---|---|
| 01 — Spec (backfill) | `spec/01A_FUNCTIONAL_SPEC.md`, `spec/01B_ACCEPTANCE_CRITERIA.md` | Tidak formal |
| 03B — Test Plan | `test/03B_TEST_PLAN.md` | Tidak |
| 04 — Dev Testing | `test/04A_DEV_TESTING.md`, `test/04B_API_TEST.md` (kondisional), `tests/*.py` (di root modul, bukan di dalam `doc-dev/`) | **Ya** — hasil run harus ada |
| 07 — QA Testing | `test/07_QA_TESTING.md`, `test/07B_QA_AI_BROWSER.md` (kondisional) | **Ya** |

**Commit Mode Git per step gate** (lihat `PLAYBOOK.md` §"Mode Git" tabel commit) — atomik per step
selesai, bukan satu commit besar di akhir. Trailer wajib: `Generated-by: BACKFILL (Claude Code CLI)`.

Tidak ada step 06 (Deploy Staging), 08 (UAT), 09 (Deploy Production) — di luar scope BACKFILL.

---

## Status saat ini

**Bootstrap selesai (2026-08-07).** Branch `backfill/17.0` aktif, `.claude/settings.json` +
`.gitignore` terpasang, `CLAUDE.md` ini + struktur `doc-dev/backfill/` sudah dibuat. Siap lanjut ke
Step 01 (baca kode `res_partner.py`/`controllers.py`/JS, tulis FUNCTIONAL_SPEC +
ACCEPTANCE_CRITERIA).

> AI: update bagian ini sendiri di akhir tiap sesi kerja.

### Status per Step

| Step | Dokumen | Status | Gate |
|---|---|---|---|
| 01 | `01A_FUNCTIONAL_SPEC.md`, `01B_ACCEPTANCE_CRITERIA.md` | ⬜ Belum mulai | — |
| 03B | `03B_TEST_PLAN.md` | ⬜ Belum mulai | — |
| 04 | `04A_DEV_TESTING.md`, `04B_API_TEST.md` (kondisional), `tests/*.py` | ⬜ Belum mulai | ⏳ |
| 07 | `07_QA_TESTING.md`, `07B_QA_AI_BROWSER.md` (kondisional) | ⬜ Belum mulai | ⏳ |

Legenda: ⬜ Belum mulai · 🔄 Sedang dikerjakan · ✅ Selesai ditulis · ✔️ Lulus gate.

---

## Referensi

- Rasional desain lengkap: `doc-dev-backfill/ai-doc/OVERVIEW.md`
- Arah lintas-fase: `doc-dev-backfill/ai-doc/ROADMAP.md`
- Langkah operasional + lesson environment (Mode A/B/C/D/E, Mode Git):
  `doc-dev-backfill/ai-doc/PLAYBOOK.md`
- Kalau Step 04 butuh Odoo+Postgres nyata: instantiate
  `doc-dev-backfill/templates/docker-compose.yml.template` ke `docker-env/` (Mode B/C)
