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
| MF-01 | `res.users.groups_id` di-rename `group_ids` di 19.0 — 2 baris test fixture jadi invalid | Step 2 | `[GAP-MIGRASI]` | Sedang | Terbuka — jadi input wajib `03_MIGRATION_SPEC.md`/step 6 |

---

## Detail

### MF-01 — `res.users.groups_id` di-rename `group_ids` di 19.0 — 2 baris test fixture jadi invalid
**Ditemukan di:** Step 2 (2026-08-26)
**Tag:** `[GAP-MIGRASI]` — genuinely perubahan API 19.0, WAJIB adaptasi kompatibilitas
**Ref:** `DIFF-09` (`02_diff/02_DIFF_ANALYSIS.md`)
**Lokasi:** `optional_field_save/tests/test_optional_field_save.py:71` dan `:93` — `res.users.create({"groups_id": [(6, 0, [...])], ...})`
**Deskripsi:** Field `res.users.groups_id` (Many2many ke `res.groups`) di-rename total jadi `group_ids` di Odoo 19.0 (dikonfirmasi langsung `enterprise19.0/odoo/addons/base/models/res_users.py:257` vs `odoo18/odoo/addons/base/models/res_users.py:382`). Dua test di modul ini membuat `res.users` fixture pakai key `groups_id` lama untuk menguji ACL (`test_plain_internal_user_cannot_write_own_partner_field`, `test_user_with_partner_manager_group_can_write`, warisan F-10/BSL-010).
**Dampak:** `create()` dengan field name yang tidak dikenal ORM melempar `ValueError` — kedua test akan ERROR (bukan silent, bukan assertion failure) sebelum sempat menguji logic ACL yang jadi tujuan test. Tidak berdampak ke kode modul produksi (`models/`, `static/src/js/`) — murni test infrastructure.
**Rekomendasi:** Rename `"groups_id"` → `"group_ids"` di kedua lokasi (step 6, Fase B/G — Python test file). Tidak ada perubahan business logic, tidak perlu keputusan judgment — analog MF-01 migrasi 17→18 (genuine API rename, port apa adanya ke nama baru).
**Keputusan pemilik modul:** *(kosong — diisi manusia, atau dikonfirmasi di gate Step 4)*

---

## Cara Pakai

1. Update SETIAP KALI step manapun (1-11) menemukan gap/bug/ambiguitas yang butuh keputusan manusia.
2. ID `MF-NNN` sequential.
3. `[DIWARISI-SOURCE]` = bug/quirk yang sudah ada di 18.0, harus dipertahankan identik. `[GAP-MIGRASI]` = genuinely muncul karena perubahan platform 19.0. `[PERLU-KEPUTUSAN]` = umum, belum jelas arahnya.
4. Step 4 dan Step 8 WAJIB baca file ini sebagai bagian checklist gate.
