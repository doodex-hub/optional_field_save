# Findings — optional_field_save (migrasi 18.0 → 19.0)

**Modul:** optional_field_save
**Migrasi:** 18.0 → 19.0
**Terakhir update:** 2026-08-26

---

## Beda Peran dari Mekanisme Lain (jangan bingung/duplikat)

| Mekanisme | Kapan dipakai | Sifat |
|---|---|---|
| Format `ESCALATION` (`CLAUDE.md`) | Isu **blocking** — butuh keputusan user SEBELUM lanjut ke step/fase berikutnya | Sinkron, muncul di respons AI saat itu juga |
| Tag `[GAP]` di `01b_BASELINE_SPEC.md` | Penyimpangan spec lama vs kode aktual, per-klaim `BSL-NNN` | Inline, granular per klaim |
| Section Gap di `04_SPEC_COMPLETENESS_REVIEW.md` / `08_CODE_REVIEW.md` | Gap spesifik di titik gate itu | Inline, per dokumen |
| **`FINDINGS.md` (file ini)** | **Semua finding lintas step (1-11) yang butuh keputusan manusia** | Living document, append-only |

Warisan penting dari migrasi 17→18 (`doc-dev/_archive/migration_17.0_18.0/doc/FINDINGS.md`, MF-01 s/d MF-05) SUDAH baked-in ke kode 18.0 saat ini — tidak diulang di sini sebagai finding baru, cukup dirujuk dari `01b_BASELINE_SPEC.md` §Ringkasan poin 1-3. File ini mulai dari `MF-01` fresh, khusus untuk temuan BARU migrasi 18→19.

---

## Ringkasan

| ID | Judul | Ditemukan di Step | Tag | Prioritas | Status |
|---|---|---|---|---|---|
| — | *(belum ada temuan — diisi mulai step 2)* | | | | |

---

## Cara Pakai

1. Update SETIAP KALI step manapun (1-11) menemukan gap/bug/ambiguitas yang butuh keputusan manusia.
2. ID `MF-NNN` sequential.
3. `[DIWARISI-SOURCE]` = bug/quirk yang sudah ada di 18.0, harus dipertahankan identik. `[GAP-MIGRASI]` = genuinely muncul karena perubahan platform 19.0. `[PERLU-KEPUTUSAN]` = umum, belum jelas arahnya.
4. Step 4 dan Step 8 WAJIB baca file ini sebagai bagian checklist gate.
