# Business Flow — Migrasi optional_field_save

**Step:** 10 — QA Testing (gate)
**Ref:** `05_acceptance/05a_MIGRATION_ACCEPTANCE_CRITERIA.md`, `08_review/08_CODE_REVIEW.md`, `09_devtest/09_DEV_TESTING.md`
**Tanggal:** 2026-09-21

> Instalasi baru (port kode saja, tidak ada data produksi — intake §3), bukan jalur upgrade data
> nyata. Step 7 N/A, jadi tidak ada spot-check integritas data pasca migrasi.

## Mode Eksekusi — Percobaan AI-Interaktif (Claude Browser MCP internal)

**⚠️ REVISI SETELAH INVESTIGASI LEBIH LANJUT (2026-09-21, dipaksa oleh dev — "ini kita beresin dulu,
wajib"):** percobaan PERTAMA (`preview_start`/`navigate` ke `http://localhost:8091`) gagal konsisten
di 3 variasi URL, dan SEMPAT disimpulkan sebagai "limitasi jaringan sandbox browser, bukan gate
izin" — **kesimpulan ini TIDAK LENGKAP.** Root cause SEBENARNYA ditemukan lewat `curl` dari shell
host (bukan cuma dari browser): server Odoo di dalam container bind ke `127.0.0.1:8069` (default
`--http-interface` Odoo), yang TIDAK BISA dijangkau lewat port-forward Docker dari LUAR container
sama sekali — bukan hanya dari built-in browser, `curl` dari host pun gagal (`HTTP_STATUS:000`,
"empty reply"). **Fix:** tambah `--http-interface=0.0.0.0` ke command Odoo. Setelah fix ini,
**built-in browser BERHASIL** mengakses server dan menjalankan skenario S-06 secara nyata — lihat
hasil di bawah. Pelajaran: sebelum menyimpulkan "limitasi tool/sandbox", verifikasi dulu dari luar
tool itu (di sini: `curl` dari shell) apakah masalahnya genuinely di tool ATAU di infrastruktur
sendiri — kesimpulan pertama saya salah karena tidak melakukan itu.

**Tidak ada mode AI+tool eksternal (Playwright)** — modul sudah punya cakupan tour test native (Fase E
step 6 applicable, dieksekusi step 9) yang mencakup satu-satunya flow UI kritis (toggle kolom optional
+ persist). Tidak ada kebutuhan E2E lintas sistem/browser matrix/load test yang genuinely butuh
tooling eksternal untuk modul sekecil ini.

---

## Skenario

- [x] Skenario dari AC risiko tinggi (`05a_MIGRATION_ACCEPTANCE_CRITERIA.md`) — lihat S-01 s/d S-06 di bawah
- [x] **Cross-Version Compare** — **AWALNYA N/A per kriteria wajib** (bukan multi-addon, tidak ada Enterprise, volume finding rendah saat itu) — **TAPI dijalankan PENUH atas permintaan eksplisit dev** setelah MF-05 (bug logout) lolos dari semua step statis, sebagai audit tambahan (Titik B, independen). Lihat `../CROSS_VERSION_COMPARE.md` — hasil: static-diff bersih, 3 finding (`RMV-01` native-diff kosmetik, `RMV-02`/`RMV-03` cross-link ke MF-05/MF-01 existing), tidak ada regresi baru ditemukan.
- [ ] Spot-check integritas data pasca migrasi — N/A (step 7 N/A, instalasi baru tanpa data produksi)
- [x] **Multi-dialog/wizard dari satu aksi** — **N/A, dikonfirmasi tidak ada kasus multi-dialog** (modul tidak punya wizard/dialog custom sama sekali — murni patch `ListRenderer`/`WebClient`/registry `user_menuitems`, dikonfirmasi intake §2b)

### S-01: Modul terinstal bersih, webclient tidak crash (asset bundle ter-load)
**Level:** Smoke
**Precondition:** Odoo 20.0 fresh install, modul `optional_field_save` di-install.
**Mode eksekusi:** AI+tool (otomatis, via `docker-env/run-test.sh` — bagian dari eksekusi Step 9)
**Steps:** `-i optional_field_save` → buka `/odoo` (webclient) → login admin.
**Expected:** Tidak ada error load asset bundle `web.assets_backend` (memverifikasi fix DIFF-02 —
import `logOutItem` yang sudah tidak di-export native 20.0 tidak lagi membuat bundle gagal load).
**Actual:** Install sukses (`-i` tanpa error), tour test (S-02) berhasil membuka webclient penuh
termasuk navigasi apps menu — membuktikan bundle ter-load bersih.
**Status:** [x] Pass
**Provenance:** `[DIKONFIRMASI]` — dieksekusi live berulang kali (step 6 G1 3x, step 9 run resmi via `run-test.sh`), bukan dugaan.

### S-02: Toggle kolom optional → persist ke DB → sessionStorage ter-set
**Level:** Main Flow
**Precondition:** Login admin, modul terinstal, aplikasi Contacts tersedia.
**Mode eksekusi:** AI+tool (otomatis, tour Odoo native `optional_field_save_tour.js` via `--test-tags`, headless Chrome — bagian dari Step 9)
**Steps:** Buka apps menu → Contacts → switch ke list view → buka dropdown kolom optional → toggle
kolom "Street" ON → tunggu `setDatabase()` selesai persist.
**Expected:** Kolom "Street" muncul di header tabel; `sessionStorage["optional_field.res.partner"]`
berisi "street" setelah write ke `res.partner` sukses.
**Actual:** Tour 7/7 langkah "tour succeeded" (log: `TOUR optional_field_save_tour SUCCEEDED`),
dikonfirmasi 3x (step 6 G1 kedua+ketiga, step 9 run resmi).
**Status:** [x] Pass
**Provenance:** `[DIKONFIRMASI]`

### S-03: User biasa (tanpa "Contact Creation") — self-write preferensi SEKARANG berhasil
**Level:** Main Flow
**Precondition:** User dengan grup `base.group_user` SAJA (tanpa `base.group_partner_manager`).
**Mode eksekusi:** AI+tool (otomatis, `TransactionCase` nyata terhadap Odoo 20.0 hidup — BUKAN
simulasi/mock) — **percobaan AI-interaktif (browser) dicoba TAPI gagal teknis** (lihat catatan Mode
Eksekusi di atas), fallback ke bukti eksekusi otomatis yang SUDAH genuinely live (bukan Desk Review).
**Steps:** User login, toggle kolom optional (setara `setDatabase()`: `orm.call("res.partner","write",
[[user.partnerId], {...}])` ke partner MILIKNYA SENDIRI).
**Expected (SETELAH investigasi DIFF-03/MF-01):** Write BERHASIL — beda dari 19.0 yang gagal silent.
**Actual:** `test_plain_internal_user_can_write_own_partner_record` PASS (dikonfirmasi 3x independen,
termasuk fresh-DB run dan run resmi `run-test.sh`) — write sukses, `assertEqual` isi field cocok
payload, TIDAK ADA `AccessError`.
**Status:** [x] Pass
**Provenance:** `[DIKONFIRMASI]` — TransactionCase dieksekusi live terhadap Odoo 20.0 nyata (bukan mock ACL), setara bobot buktinya dengan eksekusi browser untuk skenario ini (write/read `res.partner` sungguhan, bukan simulasi). Percobaan AI-interaktif untuk KONFIRMASI VISUAL tambahan gagal teknis (lihat catatan Mode Eksekusi) — tidak mengurangi validitas bukti `[DIKONFIRMASI]` yang sudah ada.

### S-04: User dengan "Contact Creation" — self-write tetap berhasil (tidak terpengaruh DIFF-03)
**Level:** Detail
**Precondition:** User dengan grup `base.group_user` + `base.group_partner_manager`.
**Mode eksekusi:** AI+tool (otomatis, `TransactionCase`)
**Steps:** Sama seperti S-03, user beda grup.
**Expected:** Write berhasil (tidak berubah dari 19.0 — grup ini selalu punya akses penuh).
**Actual:** `test_user_with_partner_manager_group_can_write` PASS.
**Status:** [x] Pass
**Provenance:** `[DIKONFIRMASI]`

### S-05: `default={}` tetap `False` untuk partner baru (bug kosmetik warisan, TIDAK diperbaiki)
**Level:** Detail
**Precondition:** Partner baru dibuat, belum pernah ditulis field `optional_field_save`.
**Mode eksekusi:** AI+tool (otomatis, `TransactionCase`)
**Steps:** `create()` partner baru → baca `optional_field_save`.
**Expected:** `False` (bukan `{}`) — perilaku warisan F-11/MF-04, dipertahankan apa adanya.
**Actual:** `test_new_partner_default_is_falsy_not_empty_dict` PASS.
**Status:** [x] Pass
**Provenance:** `[DIKONFIRMASI]`

### S-06: Cleanup sessionStorage saat logout (menghindari kebocoran preferensi antar-user)
**Level:** Negative
**Precondition:** User A login, punya preferensi tersimpan di `sessionStorage` (key mengandung
"optional_field"). User A logout, User B login di tab/browser yang sama.
**Mode eksekusi:** **AI-interaktif — AKHIRNYA BERHASIL** (setelah root-cause blocker sebelumnya
ditemukan & difix — server live sempat tidak reachable karena Odoo bind ke `127.0.0.1` di dalam
container, bukan limitasi sandbox browser seperti diduga sebelumnya; fix: `--http-interface=0.0.0.0`
di `docker-compose.yml`). Dikonfirmasi ganda: eksekusi visual/live manual (built-in browser, 2x) DAN
tour test otomatis permanen baru (`optional_field_save_logout_tour`).
**Steps (dieksekusi NYATA, bukan cuma dibaca):** Login admin → toggle kolom optional (set
`sessionStorage`) → klik avatar → klik "Log out".
**Expected:** Redirect bersih ke halaman login, `sessionStorage` key "optional_field.*" terhapus.
**Actual — 🔴 DITEMUKAN BUG KRITIS PADA PERCOBAAN PERTAMA:** klik "Log out" menghasilkan
**`405 Method Not Allowed`** — BUKAN redirect ke login. Root cause: `/web/session/logout` di native
20.0 SUDAH TIDAK MENERIMA GET (native `logOutItem()` pindah ke `post()`+`redirect()` untuk hardening
CSRF), sementara `CustomLogOutItem` modul ini masih `browser.location.href = route` (GET) — pola
warisan SEJAK 17.0 yang tidak pernah ketahuan rusak karena TIDAK ADA test/review manapun yang
benar-benar mengklik logout sebelum sesi ini. **Fix diterapkan** (`user_menu_items.js` — ganti ke
`post()`+`redirect()`, lihat DIFF-08/FINDINGS.md MF-05) → **dikonfirmasi ulang 2x live: redirect
bersih ke `/web/login`, DAN key `sessionStorage` yang di-set manual sebelum logout TERKONFIRMASI
terhapus** (dicek via `javascript_tool` sebelum & sesudah klik logout) → **ditutup permanen dengan
tour test baru**, 9/9 test pass di `run-test.sh`.
**Status:** [x] Pass (SETELAH fix — sebelum fix: **Fail**, bug nyata, sudah diperbaiki dan
diverifikasi ulang, bukan diam-diam diubah statusnya)
**Provenance:** `[DIKONFIRMASI]` — eksekusi visual/live manual 2x (built-in browser) + tour test
otomatis permanen (`test_optional_field_save_logout_tour`), BUKAN lagi Desk Review. Ini menggantikan
provenance `[HASIL-BACA]` sebelumnya — lihat `FINDINGS.md` MF-04 (proses) dan MF-05 (bug nyata) untuk
kronologi lengkap kenapa butuh 2 koreksi sebelum sampai ke sini.

## Ringkasan per Level

| Level | Skenario | Jumlah |
|---|---|---|
| Smoke | S-01 | 1 |
| Main Flow | S-02, S-03 | 2 |
| Detail | S-04, S-05 | 2 |
| Negative | S-06 | 1 |

## Rekap Provenance

| Provenance | Jumlah | Skenario |
|---|---|---|
| `[DIKONFIRMASI]` | 6 | S-01, S-02, S-03, S-04, S-05, S-06 |
| `[HASIL-BACA]` | 0 | — |
| `[PERLU-KEPUTUSAN]` | 0 | — |

**Riwayat S-06 (Level Negative) — dari "Pass" keliru → PENDING jujur → eksekusi live → BUG NYATA
DITEMUKAN → fix → `[DIKONFIRMASI]` penuh:** kronologi lengkap ini SENGAJA didokumentasikan detail
karena jadi pelajaran paling berharga sesi ini:
1. Draft awal dokumen ini menandai S-06 "Pass" berdasarkan Desk Review saja — **SALAH**, ditegur
   langsung oleh dev ("kenapa lolos jika belum ada test visual/live?").
2. Dikoreksi jadi PENDING (jujur, bukan "Pass" palsu) — dicatat sebagai `FINDINGS.md` MF-04 +
   kandidat perbaikan tool di `migration-records/optional_field_save_19.0_20.0/SUMMARY.md`.
3. Percobaan eksekusi live pertama gagal teknis (browser sandbox tidak reachable ke server) — root
   cause SEBENARNYA ditemukan & difix (Odoo bind `127.0.0.1`, bukan limitasi sandbox).
4. **Eksekusi live yang BENAR-BENAR jalan menemukan BUG NYATA** (405 Method Not Allowed saat logout)
   — persis skenario yang S-06 coba verifikasi, dan Desk Review di langkah 1 TIDAK PERNAH bisa
   menemukan ini (baca kode `browser.location.href = route` "kelihatan benar", kontraknya yang
   berubah di native 20.0 tidak kelihatan dari baca kode modul saja).
5. Fix diterapkan + diverifikasi 2x live + tour test permanen ditambahkan — S-06 SEKARANG genuinely
   `[DIKONFIRMASI]`.
**Kesimpulan:** insistensi dev untuk TIDAK menerima "Pass" tanpa bukti visual/live TERBUKTI BENAR
dan MENEMUKAN BUG PRODUKSI NYATA yang tidak akan pernah ketemu lewat Desk Review atau unit/tour test
manapun yang sudah ada. Lihat `FINDINGS.md` MF-04 (proses) dan MF-05 (bug) untuk detail lengkap.
(lihat `human_qa/04_NEGATIVE.md`), tapi TIDAK mem-block gate step 10 ini (bukan regresi migrasi,
logic tidak berubah dari 19.0).

## Human QA Checklists

Digenerate di `human_qa/` (folder ini) — lihat `human_qa/00_README.md`.

## Loop-back

Tidak ada skenario Fail — tidak ada loop-back ke step 9 yang diperlukan.

## Verdict

- [x] ✅ **Lulus PENUH — 6/6 skenario `[DIKONFIRMASI]` via eksekusi nyata, 0 `[HASIL-BACA]`,
  0 `[PERLU-KEPUTUSAN]`.** Perjalanan menuju verdict ini TIDAK lurus — dicatat lengkap sebagai
  pelajaran, bukan disembunyikan: (1) draft awal keliru menandai S-06 "Pass" dari Desk Review saja,
  (2) ditegur dev, dikoreksi jadi PENDING, (3) percobaan eksekusi live pertama gagal teknis (root
  cause: server tidak reachable, BUKAN limitasi sandbox — sudah difix), (4) eksekusi live yang
  benar-benar jalan MENEMUKAN BUG KRITIS NYATA (logout 405 Method Not Allowed, DIFF-08/MF-05),
  (5) fix diterapkan + diverifikasi 2x live + tour test permanen ditambahkan. Lihat "Riwayat S-06"
  di atas dan `FINDINGS.md` MF-04/MF-05 untuk detail lengkap.
- [ ] ⚠️ Lulus Bersyarat
- [ ] ❌ Ada kegagalan
