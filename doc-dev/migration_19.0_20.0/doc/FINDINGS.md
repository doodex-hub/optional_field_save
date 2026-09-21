# Findings — optional_field_save (migrasi 19.0 → 20.0)

> **Cross-cutting, direkomendasikan (tidak kondisional)** — dokumen konsolidasi TUNGGAL untuk semua
> gap/bug/ambiguitas yang butuh keputusan manusia selama migrasi, supaya user tidak perlu buka
> `01b_BASELINE_SPEC.md`/`03_MIGRATION_SPEC.md`/`04_SPEC_COMPLETENESS_REVIEW.md`/`08_CODE_REVIEW.md`
> satu per satu untuk tahu apa yang masih terbuka. Hidup di root `doc/` (sejajar `PROMPT_LOG.md`/
> `SYNC_POLICY.md`) — bukan milik satu step tertentu.

**Modul:** optional_field_save
**Migrasi:** 19.0 → 20.0
**Terakhir update:** 2026-09-21

---

## Beda Peran dari Mekanisme Lain (jangan bingung/duplikat)

| Mekanisme | Kapan dipakai | Sifat |
|---|---|---|
| Format `ESCALATION` (`CLAUDE.md`) | Isu **blocking** — butuh keputusan user SEBELUM lanjut ke step/fase berikutnya | Sinkron, muncul di respons AI saat itu juga |
| Tag `[GAP]` di `01b_BASELINE_SPEC.md` | Penyimpangan spec lama vs kode aktual, per-klaim `BSL-NNN` | Inline, granular per klaim |
| Section Gap di `04_SPEC_COMPLETENESS_REVIEW.md` / `08_CODE_REVIEW.md` | Gap spesifik di titik gate itu (spec vs source; kode vs spec/AC) | Inline, per dokumen |
| **`FINDINGS.md` (file ini)** | **Semua finding lintas step (1-11) yang butuh keputusan manusia** — satu tempat, direview batch, bukan tersebar | Living document, append-only, dibaca ulang kapan saja |

**Aturan:** kalau sebuah `[GAP]`/gap/eskalasi genuinely butuh keputusan pemilik modul (bukan cuma
"kode menang, sudah dicatat, tidak perlu tindakan lanjut") — WAJIB didaftarkan JUGA di sini sebagai
`MF-NNN`, mereferensikan ID asalnya (`BSL-NNN`/`DIFF-NNN`/dsb).

**Prefix `MF-` (Migration Finding), bukan `F-`:** modul ini sudah punya `doc-dev/backfill/FINDINGS.md`
(skema `F-NNN`, dari BACKFILL) dan riwayat `MF-NNN` dari migrasi 17→18 dan 18→19 masing-masing. Skema
penomoran `MF-NNN` di file ini **mulai dari 1 lagi khusus project 19→20** (tidak melanjutkan nomor dari
`doc-dev/migration_18.0_19.0/doc/FINDINGS.md`) — kalau merujuk finding dari migrasi sebelumnya, sebutkan
eksplisit sumbernya (mis. "MF-01 migrasi 18→19", bukan cuma "MF-01").

---

## Ringkasan

| ID | Judul | Ditemukan di Step | Tag | Prioritas | Status |
|---|---|---|---|---|---|
| — | *(belum ada finding baru untuk migrasi 19→20 ini)* | | | | |

---

## Cara Pakai

1. **Update SETIAP KALI step manapun (1-11) menemukan gap/bug/ambiguitas yang butuh keputusan
   manusia** — jangan tunggu sampai akhir project.
2. ID `MF-NNN` sequential, tidak pernah dipakai ulang.
3. **Finding yang diwarisi dari bug/quirk source** (harus dipertahankan, BUKAN diperbaiki saat
   migrasi) ditag `[DIWARISI-SOURCE]`. Finding warisan yang relevan dari migrasi sebelumnya (F-10/MF-03,
   F-11/MF-04, dll — lihat `01a_MIGRATION_INTAKE.md` §"Ringkasan untuk Review" poin 6) sudah dicatat di
   `01b_BASELINE_SPEC.md`, tidak perlu didaftarkan ulang di sini kecuali statusnya berubah.
4. **Finding yang genuinely muncul KARENA migrasi** (breaking change 20.0 yang perlu keputusan cara
   penanganan) ditag `[GAP-MIGRASI]`, referensi `DIFF-NNN` dari `02_DIFF_ANALYSIS.md` kalau ada.
5. **Step 4 dan Step 8 WAJIB baca file ini** sebagai bagian checklist gate.
6. **Update status (bukan hapus) begitu keputusan diambil/finding resolved.**
