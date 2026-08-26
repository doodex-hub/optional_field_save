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
| MF-01 | `res.users.groups_id` di-rename `group_ids` di 19.0 — 2 baris test fixture jadi invalid | Step 2 | `[GAP-MIGRASI]` | Sedang | **✅ RESOLVED (2026-08-26)** — fix diterapkan step 6, G1 konfirmasi 4/4 test Python PASS |
| MF-02 | Kolom "Mobile" DIHAPUS TOTAL dari native Contacts list view di 19.0 — tour test hardcode "Mobile" gagal TIMEOUT | Step 6 (G1, eksekusi nyata) | `[GAP-MIGRASI]` | Sedang | **✅ RESOLVED (2026-08-26)** — tour diubah pakai kolom "Street" (masih ada), G1 rerun dijadwalkan |

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
**Status:** ✅ RESOLVED (2026-08-26) — `groups_id`→`group_ids` diterapkan di `tests/test_optional_field_save.py:71,93` (Fase G1-prasyarat, `06c_IMPLEMENTATION_LOG.md`). G1 percobaan #1 (`docker compose up`, `odoo:19.0`) mengonfirmasi 4/4 test Python `TestOptionalFieldSave` PASS — termasuk `test_plain_internal_user_cannot_write_own_partner_field`/`test_user_with_partner_manager_group_can_write` yang bergantung fixture ini.

### MF-02 — Kolom "Mobile" dihapus total dari native Contacts list view di 19.0 — tour test hardcode "Mobile" TIMEOUT
**Ditemukan di:** Step 6, G1 percobaan #1 (`docker compose up`, eksekusi nyata), 2026-08-26 — BUKAN ditemukan dari review statis step 2 (selector CSS `.o_optional_columns_dropdown_toggle` sudah dicek stabil di DIFF-10, tapi isi KONTEN dropdown — field mana saja yang optional — tidak ikut diperiksa statis)
**Tag:** `[GAP-MIGRASI]` — genuinely perubahan konten view native 19.0, WAJIB adaptasi test infrastructure, BUKAN business logic
**Ref:** `DIFF-10` (`02_diff/02_DIFF_ANALYSIS.md`, selector CSS dropdown — masih valid, cuma isinya yang berubah)
**Lokasi:** `optional_field_save/static/tests/tours/optional_field_save_tour.js` (step "Toggle the Mobile optional column ON", trigger `.dropdown-item:contains("Mobile")`)
**Deskripsi:** Tour test G1 percobaan #1 GAGAL di step [5/7] — `TIMEOUT step failed to complete within 10000 ms`, `Element (.dropdown-item:contains("Mobile")) has not been found`. Investigasi: `enterprise19.0/odoo/addons/base/views/res_partner_views.xml` (list view Contacts) **tidak lagi punya baris `<field name="mobile" .../>` sama sekali** — dikonfirmasi dibandingkan langsung `odoo18/odoo/addons/base/views/res_partner_views.xml:62` (`<field name="mobile" optional="hide"/>`, ADA di 18.0) vs `enterprise19.0` (TIDAK ADA di file yang sama, dicek juga di seluruh `contacts/views/`). Ini bukan cuma disembunyikan (`optional="hide"` → masih bisa di-toggle tampil) — barisnya dihapus total dari view.
**Dampak:** Modul produksi (`list_renderer.js`, `webclient.js`, dst) **TIDAK terpengaruh** — mekanisme "optional column" itu sendiri tetap berfungsi untuk field APAPUN yang memang ada di view (dikonfirmasi 4 test Python tetap PASS). Dampak murni ke test infrastructure yang secara spesifik memilih "Mobile" sebagai contoh field untuk dites — pilihan itu sekarang invalid di 19.0.
**Rekomendasi/Fix:** Ganti field contoh di tour ke field yang MASIH `optional="hide"` di 19.0 Contacts list view — dipilih `street` (dikonfirmasi ada, `optional="hide"`, tidak butuh grup khusus seperti `company_id`/`user_id`). Update 3 titik: trigger dropdown-item, assertion `th[data-name]`, dan assertion isi `sessionStorage` (dulu cek substring `"mobile"`, sekarang `"street"`).
**Verifikasi:** G1 percobaan #2 dijadwalkan setelah fix ini untuk konfirmasi tour lulus penuh (7/7 step) — lihat `06c_IMPLEMENTATION_LOG.md` "Riwayat Percobaan G1".
**Kontribusi knowledge base:** dicatat sebagai kandidat general di `migration-tool/migration-records/optional_field_save_18.0_19.0/SUMMARY.md` (CAND-02) — perubahan ini genuinely general (view native, bukan spesifik modul ini), modul migrasi 18→19 LAIN manapun yang test tour terhadap kolom "Mobile" di Contacts list view (pola umum) akan kena masalah yang sama.

---

## Cara Pakai

1. Update SETIAP KALI step manapun (1-11) menemukan gap/bug/ambiguitas yang butuh keputusan manusia.
2. ID `MF-NNN` sequential.
3. `[DIWARISI-SOURCE]` = bug/quirk yang sudah ada di 18.0, harus dipertahankan identik. `[GAP-MIGRASI]` = genuinely muncul karena perubahan platform 19.0. `[PERLU-KEPUTUSAN]` = umum, belum jelas arahnya.
4. Step 4 dan Step 8 WAJIB baca file ini sebagai bagian checklist gate.
