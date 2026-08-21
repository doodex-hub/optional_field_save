# Test Plan (Backfill) — optional_field_save

**Ref:** `spec/01A_FUNCTIONAL_SPEC.md`, `spec/01B_ACCEPTANCE_CRITERIA.md`
**Vocab:** test bawaan Odoo intrinsik (`TransactionCase`/`HttpCase`/`Tour`) — `cicd/test_design/`
tidak dijadikan prasyarat (opsional, lihat `PLAYBOOK.md` §0).

---

## Peta AC → Tipe Test

| AC | Tipe test | Alasan |
|---|---|---|
| AC-01-01 (F-01, instalasi) | Implisit — `--test-enable` HANYA jalan kalau instalasi modul sukses duluan | Instalasi sukses/gagal terlihat langsung dari log `docker-env/logs/odoo.log`, tidak butuh test method terpisah |
| AC-02-01, AC-02-03 (persist field via ORM) | `TransactionCase` | Murni logic ORM (`write`/`read` ke `res.partner.optional_field_save`) — tidak butuh browser, meniru apa yang dilakukan `setDatabase()` di level Python |
| AC-02-02 (load lintas browser — JS `webclient.js`+`sessionStorage`) | **Tour (Mode E)** — butuh browser sungguhan untuk `sessionStorage`/DOM | Logic ada di JS, tidak bisa diverifikasi murni `TransactionCase`/`HttpCase` (yang bypass JS) |
| AC-03-01 (F-02, patch tanpa `super()`) | Sudah diverifikasi **statis** (baca source `odoo:17.0` langsung, lihat `FINDINGS.md` F-02) — TIDAK perlu test runtime tambahan, ini fakta struktural kode, bukan perilaku yang berubah-ubah | — |
| AC-04-01 (F-06, cleanup logout) | **Tour (Mode E)**, kondisional | Perlu render UI + trigger klik menu "Log out" + cek `sessionStorage` sesudahnya |
| AC-05-01 (F-03, tidak ada entry point) | Sudah diverifikasi **statis** (tidak ada `views/` sama sekali di source) | — |

## Skenario Test yang Ditulis (Step 04)

### T-01 — Instalasi modul sukses (implisit via Mode C)
Bukan method test terpisah — bukti langsung dari `docker-env/logs/odoo.log` baris
`Modules loaded.` tanpa `Traceback` sebelum itu, DAN baris hasil test
`X failed, Y error(s) of Z tests` dengan `Z > 0`.

### T-02 — `TransactionCase`: field `optional_field_save` — default utk partner BARU
Given partner baru dibuat via `self.env['res.partner'].create({...})` TANPA menyebut
`optional_field_save`
When dibaca ulang
Then nilainya `{}` (default field, AC turunan §2.1 `01A_FUNCTIONAL_SPEC.md`).

### T-03 — `TransactionCase`: field `optional_field_save` — partner LAMA (simulasi pre-existing)
Given partner dibuat lalu field di-set eksplisit ke `False` (simulasi kondisi partner yang sudah ada
sebelum modul diinstall — kolom baru di tabel existing tidak otomatis dapat default Python-level)
When dibaca ulang
Then nilainya `False` (BUKAN `{}`) — membuktikan asumsi BR-01/AC-02-03 di spec bahwa partner lama
tidak otomatis dapat `{}`.

### T-04 — `TransactionCase`: write dict ke field, baca balik (meniru `setDatabase()` level Python)
Given partner dengan `optional_field_save = {}`
When ditulis `{"optional_field.res.partner": "email,phone"}` (pola persis yang dihasilkan JS)
Then `read()` mengembalikan dict yang sama persis (round-trip JSON field bekerja sesuai ekspektasi
AC-02-01).

### T-05 — `TransactionCase`: akses field lewat user `base.group_user` biasa (bukan admin)
Given user non-admin (group `base.group_user` saja, group minimum yang disebut relevan di
`security/ir.model.access.csv` — walau file itu sendiri terbukti dead, lihat F-01)
When user itu coba `write()` field `optional_field_save` pada partner-nya sendiri
Then operasi SUKSES — dibuktikan akses yang berfungsi datang dari ACL bawaan `res.partner`
(`base`/`mail`), BUKAN dari `security/ir.model.access.csv` modul ini (yang terbukti dead di F-01) —
ini bukti definitif bahwa modul TETAP fungsional walau file security-nya tidak pernah ter-load.

### T-06 (kondisional, Mode E — dieksekusi HANYA kalau waktu Step 04 memungkinkan Chrome headless)
Tour: login admin → buka list view Contacts → toggle satu kolom optional → assert
`res.partner.optional_field_save` milik admin ter-update (dicek balik lewat `TransactionCase`
terpisah setelah Tour, BUKAN dalam Tour itu sendiri — pola umum Odoo Tour test, lihat
`tour_example_test.py.template`).

**Keputusan cakupan Mode E (dicatat eksplisit, bukan disembunyikan):** modul ini kecil dan
core value proposition-nya (persist kolom optional ke DB) SUDAH tercover level ORM murni (T-02 s.d.
T-05) yang membuktikan lapisan Python-nya benar. Yang TIDAK tercover test otomatis manapun: apakah
JS (`list_renderer.js`/`webclient.js`) benar-benar MEMANGGIL alur itu dengan trigger yang tepat
(user toggle kolom di UI sungguhan). T-06 mengisi celah ini KALAU sempat dieksekusi; kalau tidak,
dicatat eksplisit sebagai limitasi di `04A_DEV_TESTING.md`/`07_QA_TESTING.md` — TIDAK disamarkan
sebagai "sudah dites penuh".

## Cek Wajib yang SUDAH Dilakukan di Step 01 (tidak diulang di sini)

- Tabrakan nama method vs Odoo core — F-02, sudah diverifikasi via `docker run` baca source
  langsung (bukan tebakan).
- Modul menyentuh email — TIDAK relevan (dikonfirmasi §3 `01A_FUNCTIONAL_SPEC.md`).
- Skenario "hanya satu dialog disentuh" — TIDAK relevan, tidak ada wizard/dialog di modul ini.
