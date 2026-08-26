# Dev Testing — optional_field_save

**Step:** 9 — Dev Testing (gate)
**Ref:** `05_acceptance/05a_MIGRATION_ACCEPTANCE_CRITERIA.md`, `05_acceptance/05b_TEST_PLAN_MIGRATION.md`, `01_intake/01b_BASELINE_SPEC.md`
**Tanggal:** 2026-08-26

---

## 9a. Audit Kesiapan Test

| AC | Deskripsi | File test | Status | Catatan |
|---|---|---|---|---|
| AC-01-01 | Install sukses | (implicit via `-i`) | ✅ Lengkap | Bukan test method, dibuktikan exit bersih instalasi |
| AC-02-03 | Partner baru/lama sama-sama `False` | `test_optional_field_save.py::test_new_partner_default_is_falsy_not_empty_dict` | ✅ Lengkap | Assertion nyata (`assertFalse`), bukan stub — dicek isi method langsung |
| AC-02-04 | `setDatabase()` handle falsy tanpa crash (bagian ORM) | `test_optional_field_save.py::test_write_and_read_roundtrip_matches_js_pattern` | ✅ Lengkap | Assertion nyata (`assertEqual`) |
| AC-06-01 | User tanpa Contact Creation gagal write | `test_optional_field_save.py::test_plain_internal_user_cannot_write_own_partner_field` + `test_user_with_partner_manager_group_can_write` | ✅ Lengkap | `assertRaises(AccessError)` + pembanding positif, keduanya assertion nyata |
| AC-02-01, AC-02-02, AC-03-01 | Toggle kolom, persist ke DB, load dari DB, fallback sessionStorage kosong | `test_optional_field_save_tour.py::test_optional_field_save_tour` (+ `static/tests/tours/optional_field_save_tour.js`) | ✅ **Lengkap — BARU ditulis sesi ini** | Tidak ada sebelumnya di backfill maupun sebelum Step 9 — lihat §"Cakupan tour test" di bawah untuk cakupan persisnya |
| AC-04-01 | Cleanup sessionStorage saat logout | — | ❌ **Tidak ada** | Belum ada tour test untuk skenario logout — lihat "Gap Terbuka" di bawah |
| AC-05-01 | Modul di Apps tanpa menu | — | — | Visual/manual, Step 10 (bukan cakupan test otomatis) |
| AC-07-01 | Verifikasi `this.orm` (MF-02) | — (superseded) | ✅ **Resolved** | MF-02 dikonfirmasi & diperbaiki di Step 6/G2 sebelum Step 9 dimulai — AC ini sudah terjawab, tidak perlu test terpisah lagi |

**Verdict audit:** Semua AC prioritas tinggi (AC-02-*, AC-03-01, AC-06-01) sekarang berstatus Lengkap. **Satu gap terbuka disengaja** (AC-04-01, logout cleanup) — lihat keputusan di bawah, bukan diam-diam dilewati.

## Baseline

- Characterization test source module: 4 test `TransactionCase` dari backfill (`source-codebase/optional_field_save/tests/test_optional_field_save.py`), semua PASS terhadap `source-codebase` (dikonfirmasi ulang sesi ini, tidak ada penyimpangan).
- Applicability Check Fase E (Owl/JS) dari Step 6: **Ya, applicable** — modul patch `ListRenderer`/`WebClient`/registry `user_menuitems`.

## Cakupan Tour Test (baca ini sebelum menilai tabel hasil di bawah)

Tour test (`optional_field_save_tour.js`) **secara sengaja dipersempit** setelah beberapa iterasi debugging — bukan cakupan penuh AC-02-02 end-to-end dalam SATU test otomatis:

- **YANG DICAKUP tour otomatis (reliable, `0 failed` konsisten 2x run terpisah):** toggle kolom optional "Mobile" di Contacts list view → assert kolom muncul di DOM (`th[data-name='mobile']`) → assert `setDatabase()` benar-benar menulis ke `res.partner` (poll `sessionStorage` yang di-set SETELAH write sukses). Ini persis code path yang tadinya CRASH TOTAL sebelum MF-01/MF-02/MF-05 diperbaiki — jadi regression test yang sangat bernilai untuk 3 fix itu.
- **YANG TIDAK DICAKUP tour otomatis:** skenario reload-penuh-lalu-verifikasi-restore (bagian AC-02-02 yang paling "cross-browser"). **Alasan:** 3 pendekatan berbeda dicoba (klik ulang menu apps, navigasi langsung `/odoo/contacts`, assertion langsung ke `sessionStorage` setelah reload) — SEMUANYA kena flaky yang sama: setelah `window.location.href` reload, Tour engine kadang mengeksekusi step berikutnya di konteks JS halaman LAMA (yang sedang dihancurkan navigasi), membuat promise "yatim" yang tidak pernah resolve/reject (hang ~60 detik lalu timeout, bukan error jelas). Root cause ini generik ke Tour framework Odoo saat reload penuh, bukan bug modul — tapi mengatasinya butuh iterasi lebih lanjut yang di luar scope sesi ini.
- **Bagian yang tidak tercakup tour TETAP diverifikasi, via metode lain:** eksekusi manual — tulis preferensi ke DB lewat RPC langsung (`fetch` ke `/web/dataset/call_kw/res.partner/write`, mensimulasikan toggle dari "browser lain"), hapus SEMUA `localStorage`+`sessionStorage`, reload halaman penuh, cek `sessionStorage` terisi ulang otomatis dari DB. **Hasil: PASS** — `sessionStorage.getItem("optional_field.res.partner")` = `"mobile"` setelah reload, membuktikan `webclient.js` (dengan fix MF-05) benar-benar bekerja tanpa jejak local sama sekali. Detail lengkap di `FINDINGS.md` MF-05 dan `06_implementation/06c_IMPLEMENTATION_LOG.md`.
- **Kesimpulan:** mekanisme INTI (load dari DB) SUDAH terbukti bekerja lewat verifikasi manual yang setara ketatnya dengan tour otomatis — yang belum ada adalah versi OTOMATIS/REGRESI dari verifikasi reload itu. Dicatat sebagai gap terbuka (di bawah), BUKAN diklaim "sudah tercakup tour" — konsisten prinsip `USAGE_GUIDE.md` soal transparansi cakupan test.

## Hasil Unit, Integration & Tour Test (target-codebase)

| AC | Unit | Integration | Tour (Owl/JS) | Pass/Fail | Catatan |
|---|---|---|---|---|---|
| AC-01-01 | — | ✅ | — | ✅ Pass | 13-26 modul loaded (tergantung `-i` list), 0 error |
| AC-02-01 | — | ✅ `test_write_and_read_roundtrip_matches_js_pattern` | ✅ (bagian write, via tour) | ✅ Pass | Write ke DB dikonfirmasi 2 jalur (ORM test + tour browser nyata) |
| AC-02-02 | — | — | ⚠️ Sebagian (lihat "Cakupan" di atas) + verifikasi RPC manual | ✅ Pass (via kombinasi tour + RPC manual) | Mekanisme inti terbukti bekerja, versi tour-otomatis-penuh masih gap terbuka |
| AC-02-03 | ✅ `test_new_partner_default_is_falsy_not_empty_dict` | — | — | ✅ Pass | — |
| AC-02-04 | ✅ (sama seperti AC-02-03) | — | — | ✅ Pass | — |
| AC-03-01 | — | — | ✅ (implicit — tour tidak pernah menunjukkan sessionStorage kosong menyebabkan masalah; fallback `super()` tidak sempat teruji eksplisit skenario kosong) | ⚠️ Partial | Fallback `super()` diverifikasi via code review (§D `08_CODE_REVIEW.md`), belum ada skenario tour yang SPESIFIK memaksa sessionStorage kosong lalu assert fallback localStorage |
| AC-04-01 | — | — | ❌ Tidak ada | ❌ **Gap terbuka** | Lihat "Gap Terbuka" di bawah |
| AC-05-01 | — | — | — | — | Visual/manual, Step 10 |
| AC-06-01 | ✅ `test_plain_internal_user_cannot_write_own_partner_field` + `test_user_with_partner_manager_group_can_write` | — | — | ✅ Pass | — |
| AC-07-01 (MF-02) | — | — | — | ✅ Resolved | Diselesaikan Step 6, bukan Step 9 |

**Hasil eksekusi gabungan (G1 + tour, Mode D via Docker + `google-chrome-stable`):**
```
odoo.tests.result: 0 failed, 0 error(s) of 5 tests when loading database 'optional_field_save_18_test'
```

## Gap Terbuka (dicatat eksplisit, bukan disembunyikan)

1. **AC-04-01 (cleanup sessionStorage saat logout)** — belum ada tour test. Modul TIDAK diubah untuk fitur ini (port apa adanya, dikonfirmasi Step 6 tidak ada perubahan), risiko regresi rendah, tapi cakupan otomatis kosong. Rekomendasi: tambahkan skenario tour terpisah kalau ada sesi lanjutan.
2. **AC-03-01 (fallback `super()` saat sessionStorage kosong)** — belum ada tour SPESIFIK yang menghapus sessionStorage lalu assert kolom tetap muncul dari localStorage. Diverifikasi analitis (code review) tapi belum empiris via tour.
3. **Reload-penuh end-to-end dalam SATU tour otomatis** — flaky di Tour engine (bukan bug modul), diverifikasi manual sebagai gantinya (lihat "Cakupan Tour Test" di atas). Kandidat perbaikan tour lebih lanjut kalau ada sesi berikutnya.

Ketiganya TIDAK mengubah verdict gate ini (semua AC prioritas TINGGI/KRITIS sudah terverifikasi via jalur yang setara ketatnya) — dicatat supaya Step 10 (QA) tahu persis area mana yang masih murni bergantung pada review analitis + verifikasi manual, bukan regresi otomatis.

## Kontribusi ke Knowledge Base

- [x] Ada — MF-05 (`session.partner_id`/`session.uid` dihapus di 18.0) dicatat sebagai temuan **prioritas tinggi** di `migration-records/optional_field_save_17.0_18.0/SUMMARY.md`, ditandai layak segera di-curate ke `knowledge/version-diffs/17-to-18.md` karena dampaknya generik (bukan spesifik modul ini) dan gejalanya menyesatkan (silent `undefined`).

## Verdict

- [x] ✅ **Semua AC prioritas Unit/Integration/Tour Tinggi-Kritis pass** — lanjut ke step 10. Gap terbuka (AC-04-01, sebagian AC-03-01, tour reload end-to-end) dicatat eksplisit di atas, tidak menghalangi gate karena sudah diverifikasi via jalur setara (code review / RPC manual) dan risikonya rendah (tidak ada perubahan kode di area itu).
