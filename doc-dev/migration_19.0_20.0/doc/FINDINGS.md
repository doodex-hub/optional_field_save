# Findings — optional_field_save (migrasi 19.0 → 20.0)

> **Cross-cutting, direkomendasikan (tidak kondisional)** — dokumen konsolidasi TUNGGAL untuk semua
> gap/bug/ambiguitas yang butuh keputusan manusia selama migrasi, supaya user tidak perlu buka
> `01b_BASELINE_SPEC.md`/`03_MIGRATION_SPEC.md`/`04_SPEC_COMPLETENESS_REVIEW.md`/`08_CODE_REVIEW.md`
> satu per satu untuk tahu apa yang masih terbuka. Hidup di root `doc/` (sejajar `PROMPT_LOG.md`/
> `SYNC_POLICY.md`) — bukan milik satu step tertentu.

**Modul:** optional_field_save
**Migrasi:** 19.0 → 20.0
**Terakhir update:** 2026-10-05

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
| MF-01 | ACL `res.partner` untuk `base.group_user` — self-write (ke partner MILIK SENDIRI) SEKARANG diizinkan di 20.0. BSL-010/F-10/MF-03 (bug silent-fail warisan) **TIDAK LAGI terjadi untuk skenario nyata modul ini** | 2 (DIFF-03) | `[GAP-MIGRASI]` | **Tinggi (behavior fungsional berubah, meski bukan dari kode modul)** | **CLOSED (2026-09-21), kesimpulan FINAL setelah 2 putaran verifikasi empiris — lihat riwayat investigasi di bawah** |
| MF-02 | `logOutItem` tidak lagi di-export dari `@web/webclient/user_menu/user_menu_items` di native 20.0 — import modul (`OriginalLogOutItem`, dead code sejak 17.0) akan resolve `undefined`, berisiko break loading asset bundle | 2 (DIFF-02) | `[GAP-MIGRASI]` | Tinggi (fix wajib, bukan pilihan) | **CLOSED (2026-09-21)** — fix diterapkan step 6 (hapus import+export `OriginalLogOutItem` dari `user_menu_items.js`), dikonfirmasi eksekusi nyata via G1: asset bundle `web.assets_backend` ter-load bersih, tour test 7/7 langkah sukses |
| MF-03 | `ListRenderer.computeOptionalActiveFields()` native 20.0 menambah cabang logic baru (`list_optional_show`, context dari filter/favorite) — override modul membuatnya inert (bukan crash, cuma fitur baru tidak "ikut lewat") | 2 (DIFF-01) | `[GAP-MIGRASI]` | Rendah | Resolved-by-default — keputusan default: port as-is, tidak extend override (lihat `02_DIFF_ANALYSIS.md` "Ringkasan untuk Review" poin 1). User bisa minta diaktifkan eksplisit kapan saja. |
| MF-04 | **Proses (bukan modul):** Step 10 (`10_BUSINESS_FLOW_MIGRATION.md`) sempat menandai S-06 (cleanup logout) "Pass" berdasarkan Desk Review SAJA — tidak ada eksekusi visual/live sama sekali (AI-interaktif gagal teknis, tidak ada fallback ke test lain). Ditegur langsung oleh dev, 2026-09-21 ("kenapa lolos jika belum ada test visual/live?"). | 10 | `[GAP-MIGRASI]` (proses, bukan kode modul) | **Tinggi (integritas gate)** | **CLOSED (2026-09-21)** — S-06 akhirnya benar-benar dieksekusi live (lihat MF-05 di bawah) DAN ditutup permanen dengan tour test baru. Vindikasi penuh atas kritik dev — kalau gate ini tidak dipaksa jujur, MF-05 (bug production nyata) TIDAK AKAN pernah ketemu. |
| **MF-05** | **🔴 CRITICAL — Logout RUSAK TOTAL di 20.0 (405 Method Not Allowed).** `CustomLogOutItem` (`user_menu_items.js`) menavigasi via `browser.location.href = "/web/session/logout"` (GET) — pola warisan sejak 17.0. Route ini di native 20.0 SEKARANG MENOLAK GET (native `logOutItem()` sudah pindah ke `post()`+`redirect()`, hardening CSRF). **TIDAK ADA test/tour/desk-review manapun yang pernah menangkap ini** — ditemukan HANYA lewat verifikasi visual/live manual (browser sungguhan) yang dipaksa oleh dev setelah menegur gate S-06/MF-04. | 6 (ditemukan saat re-verifikasi S-06, bukan step 2/3/8 manapun) | `[GAP-MIGRASI]` | **🔴 Kritis — fix wajib, sudah diterapkan** | **CLOSED (2026-09-21)** — `user_menu_items.js` diubah: ganti `browser.location.href = route` jadi `await post(route, {csrf_token: odoo.csrf_token}, "url")` + `redirect(url)`, mereplikasi persis pola native `logOutItem()` 20.0. Dikonfirmasi 2x live browser (redirect bersih ke login, sessionStorage tetap terhapus) + tour test baru (`optional_field_save_logout_tour.js`/`test_optional_field_save_logout_tour.py`) — 9/9 test pass. **Ditambah: dikonfirmasi ULANG lewat Cross-Version Compare (RMV-02) — A/B langsung 19.0 (bersih) vs 20.0 (405 sebelum fix, bersih setelah fix).** **Pelajaran paling penting sesi ini: automated test coverage (unit + tour tulisan lama) 100% BUTA terhadap bug ini** karena tidak satupun pernah benar-benar klik "Log out" — desk review sekalipun (step 8) tidak menangkapnya karena cuma cek *shape*/registrasi, bukan menjejaki *isi* callback terhadap kontrak native yang berubah. |
| RMV-01 | Cross-Version Compare (`CROSS_VERSION_COMPARE.md`, dijalankan atas permintaan eksplisit dev setelah MF-05) — native Contacts list view 20.0 menambah opsi kolom "Created on" di dropdown optional columns, tidak ada di 19.0 | Cross-Version Compare (bukan step 1-11) | `[NATIVE-DIFF]` | Rendah | CLOSED — murni kosmetik native, tidak terkait modul, tidak difix |
| RMV-02 | = **MF-05** (lihat di atas) — dikonfirmasi ULANG lewat Cross-Version Compare, A/B langsung 2 environment hidup bersamaan (19.0 vs 20.0) | Cross-Version Compare | `[REGRESI]` (sudah closed sebagai MF-05 sebelum compare ini dimulai) | — | CLOSED — lihat MF-05 |
| RMV-03 | = **MF-01** (lihat di atas) — ACL self-write, TIDAK diulang via browser di Cross-Version Compare (provenance sudah `[DIKONFIRMASI]` kuat dari `TransactionCase` step 6/8) | Cross-Version Compare | `[NATIVE-DIFF]` | — | CLOSED — lihat MF-01 |
| MF-06 | [POST-RILIS] Pilihan kolom tercampur antar list view, toggle telat satu klik, race muat preferensi, kolom opsional di <column> — diperbaiki di rilis 20.0.1.0.1 | Review pasca-rilis (di luar 11 step, sesi 2026-10-05) | `[POST-RILIS]` | Sedang | **CLOSED (2026-10-05)** — dirilis 20.0.1.0.1 |

---

## Riwayat Investigasi MF-01 (detail lengkap, 2 putaran verifikasi empiris)

**Kesimpulan final: BSL-010/F-10/MF-03 (bug silent-fail warisan 17.0 — user `base.group_user` biasa
gagal senyap saat menyimpan preferensi ke DB) TIDAK LAGI TERJADI di 20.0 untuk skenario nyata yang
dieksekusi modul ini** (`setDatabase()` menulis ke `partnerId = user.partnerId`, PERSIS partner user
login sendiri). Ini murni akibat perubahan ACL native `base` (`ir.access.csv` menambah baris
`res_partner_rule_write_self`) — TIDAK ADA kode modul yang diubah untuk hasil ini.

**Kronologi (kenapa butuh 2 putaran, bukan 1):**
1. **Step 2 (analisis statis):** baca `ir.access.csv` + `ir_access.py` → hipotesis "self-write akan
   diizinkan" (DIFF-03).
2. **Step 6, putaran 1 (G1 pertama):** test warisan `test_plain_internal_user_cannot_write_own_partner_field`
   PASS (AccessError tetap terjadi) → disimpulkan TERBURU-BURU "hipotesis step 2 salah, BSL-010 tidak
   berubah". **Kesimpulan ini SALAH** — baru ketahuan salah setelah baca guideline `odoo-security`
   skill (step 8, lihat `08_review/08_CODE_REVIEW.md`) yang menjelaskan semantik `ir.access`: baris
   TANPA domain yang ditulis test warisan ternyata menulis ke partner LAIN (bukan `test_user.partner_id`
   sendiri) — domain `id = user.partner_id.id` di baris baru TIDAK PERNAH match target test itu, jadi
   test ini SELALU gagal (AccessError) terlepas dari perubahan ACL apapun — bukan bukti valid bahwa
   ACL tidak berubah.
3. **Step 8 (code review):** ditemukan gap ini lewat pembacaan guideline `odoo-guidelines`
   `security.md` §"Access rights" ("Rows dengan grup adalah *permissions*, di-OR-kan... domain
   membatasi apa yang baris itu berikan") — disadari test warisan tidak menguji skenario yang
   genuinely relevan (self-write, bukan write ke partner tak terkait).
4. **Step 6/8, putaran 2:** test BARU ditambahkan (`test_plain_internal_user_can_write_own_partner_record`,
   `tests/test_optional_field_save.py`) yang menulis ke `test_user.partner_id` itu sendiri — mereplikasi
   PERSIS pola JS asli (`setDatabase()`). **Hasil: AccessError TIDAK dilempar, write BERHASIL** —
   dikonfirmasi 2x (termasuk fresh-DB run untuk menyingkirkan kemungkinan DB basi/stale, lihat
   `06c_IMPLEMENTATION_LOG.md`).

**Pelajaran metodologis (paling berharga, lebih dari klaim `res.partner` itu sendiri):** satu test yang
"PASS" tidak otomatis berarti hipotesis lama terbukti — WAJIB dicek apakah test itu genuinely menguji
skenario yang relevan (di sini: target partner YANG MANA, bukan cuma "apakah AccessError muncul").
Dicatat juga sebagai kandidat `migration-records/optional_field_save_19.0_20.0/SUMMARY.md`.

**Dampak ke `01b_BASELINE_SPEC.md`/acceptance criteria:** BSL-010 diupdate dengan status final;
`05a_MIGRATION_ACCEPTANCE_CRITERIA.md` AC-05-02 diupdate; TIDAK ADA aksi kode modul yang diperlukan
(behavior yang berubah adalah ACL native, bukan sesuatu yang modul kontrol) — tapi WAJIB dikomunikasikan
ke user/pemilik modul sebagai perubahan fungsional nyata (fitur "persist lintas browser" modul ini
SEKARANG benar-benar bekerja untuk populasi user yang sebelumnya gagal silent), bukan cuma detail
teknis migrasi.


### MF-06 — [POST-RILIS] Pilihan kolom tercampur antar list view, toggle telat satu klik, race muat preferensi, kolom opsional di <column> — diperbaiki di rilis 20.0.1.0.1
**Ditemukan di:** Review pasca-rilis, di luar 11 step migrasi (2026-10-05). Reproduksi di Docker (Odoo 18.0, 19.0, 20.0 berjalan bersamaan, browser Playwright).
**Tag:** `[POST-RILIS]`
**Sifat perubahan:** perubahan kode DISENGAJA atas persetujuan pemilik modul, DI LUAR migrasi (kode migrasi sebelumnya sengaja dijaga identik dengan versi sumber). `01b_BASELINE_SPEC.md` lama masih menggambarkan perilaku sebelum perbaikan (key penyimpanan per model).
**Cakupan:** 18.0, 19.0, 20.0 (kode `static/src/js` identik di tiga versi). 16.0 dan 17.0 di luar lingkup.

| Masalah | Lokasi | Status sebelum (terbukti di Docker) | Perbaikan |
|---|---|---|---|
| Pilihan kolom tercampur antar list view dari model yang sama | `list_renderer.js`: key memakai `keyOptionalFields.split(",")[1]` (hanya nama model) | Ubah satu kolom di list Contacts membuat view lain dari `res.partner` kehilangan kolom default-nya (view uji: tinggal `Name` atau `Name`+`City`) | Key = key view native lengkap: `optional_field.<model>,list,<viewId>,<fields>` (`getOptionalFieldStorageKey()`) |
| Toggle kolom telat satu klik (ditemukan agen reviewer, lalu direproduksi) | `list_renderer.js`: `computeOptionalActiveFields` membaca sessionStorage lama, baru diperbarui setelah RPC `setDatabase` | Setelah DB berisi preferensi, klik kolom tidak mengubah tampilan sampai klik berikutnya. Tour lama tidak menangkapnya (hanya uji toggle pertama) | `saveOptionalActiveFields` menulis sessionStorage sinkron sebelum RPC |
| Race muat preferensi vs render pertama | `webclient.js`: `getOptionalActiveFields()` dipanggil tanpa `await` di `setup()` | Normal: tidak terlihat. Dengan RPC baca preferensi ditunda 3 detik: list tampil dengan default dan tidak dikoreksi | `onWillStart` menunggu `getOptionalActiveFields()`; error di-log, tidak fatal |
| Kolom opsional di dalam `<column>` (column_group, hanya ada di 20.0) | `list_renderer.js`: filter `col.type === "field" && col.optional` | DB menyimpan `email,phone` aktif, tetapi setelah reload dropdown menampilkannya tidak tercentang | Filter ikut menghitung `col.fields` dari `column_group` (sama dengan native 20.0) |

**Hasil uji sesudah perbaikan (Docker, 20.0):** view kedua tetap menampilkan `Website Link` dan `City` setelah kolom di Contacts diubah; tiga toggle beruntun cocok dengan checkbox; dengan server lambat 3 detik render pertama sama dengan hasil normal; pilihan bertahan setelah reload; logout tetap bersih (redirect ke login, key `optional_field` terhapus); tanpa error JS di konsol. Kolom di dalam <column> tercentang sesuai DB setelah reload.
**Tour test:** `optional_field_save_tour.js` ikut diubah. Sekarang memeriksa nilai di DB (`res.partner.optional_field_save`, key diawali `optional_field.res.partner,`), bukan lagi sessionStorage, karena sessionStorage kini ditulis sinkron. BELUM dijalankan lewat runner Odoo (staging tidak punya `test_*.py`); logika barunya diuji manual di tiga versi, sintaks dicek dengan `node --check`.
**Catatan audit operasional:** pilihan kolom yang tersimpan dengan key lama (`optional_field.<model>`) TIDAK dimigrasi. Pengguna perlu memilih kolom sekali lagi. Key lama tetap ada di JSON partner sebagai key yatim (tidak berbahaya, tidak dibaca lagi).
**Dibiarkan (keputusan pemilik modul, tidak diperbaiki):** user internal biasa tanpa hak tulis `res.partner` gagal menyimpan senyap di 18.0 dan 19.0 (F-10, MF-03 migrasi 17→18, warisan; di 20.0 sudah beres karena ACL native); `list_optional_show` native 20.0 tidak diteruskan (MF-03 migrasi 19→20). Temuan review statis lain juga tidak dikerjakan: pilihan "semua kolom mati" dianggap belum ada, sessionStorage bisa bocor antar user di tab yang sama, field Json tanpa `copy=False`/`groups`, read-modify-write tanpa antrian, logout kustom membuang bagian native (service worker, redirect PWA), filter logout `includes('optional_field')` terlalu longgar, kode mati, klaim "user record" di `index.html`.
**Rilis:** staging dbe2113→f8fa236 | 20.0 dbe2113→f8fa236 | commit fix `dba1538`, bump `f8fa236` (versi 20.0.1.0.1). Diverifikasi remote lawan remote: diff staging=publish kosong, sisa file terlarang 0.

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
