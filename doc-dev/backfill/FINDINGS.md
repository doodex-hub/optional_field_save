# Findings — optional_field_save

> Satu file konsolidasi — pemilik modul cukup baca file ini untuk tahu semua hal yang butuh
> keputusan manusia, tanpa perlu baca ulang seluruh `doc-dev/backfill/`. Diisi terus sepanjang proses
> (bukan cuma di satu step), bukan bagian dari template SOP normal — ini spesifik BACKFILL.
>
> **Prinsip:** begitu ditemukan spot ambigu/bug, catat di sini dan LANJUT — jangan berhenti
> menunggu resolusi satu per satu. Pemilik modul me-review batch ini setelah draft
> `doc-dev/backfill/` lengkap tersedia.
>
> **Dokumen hidup, bukan laporan sekali-jadi:** pemilik modul boleh memperbaiki kode bisnis SENDIRI
> (di luar BACKFILL) kapan saja berdasarkan finding di sini. Kalau itu terjadi, update entry finding
> terkait jadi `✅ RESOLVED`/`✅ CONFIRMED` + tanggal + bukti test (bukan dihapus).

---

## Ringkasan

| ID | Judul | Tag | Prioritas |
|---|---|---|---|
| F-01 | `ir.model.access.csv` dead — tidak terdaftar di `data`, DAN mengacu model yang tidak ada | `[PERLU-KEPUTUSAN]` | Sedang |
| F-02 | Patch `ListRenderer` override total 2 method core tanpa `super()` | `[PERLU-KEPUTUSAN]` | Sedang |
| F-03 | `application: True` tanpa `views/`/menu — tidak ada entry point | `[PERLU-KEPUTUSAN]` | Rendah |
| F-04 | `controllers/controllers.py` kosong total (dead file) | `[HASIL-BACA]` | Rendah |
| F-05 | `googleaeed8a7b9ec156e7.html` (Google site-verification) ikut ter-bundle di dalam addon | `[HASIL-BACA]` | Rendah |
| F-06 | Custom logout menu item tidak delegasi ke `OriginalLogOutItem`, duplikasi struktur manual | `[PERLU-KEPUTUSAN]` | Rendah |
| F-07 | Dead code: import tak terpakai (`useBus`, `useService`, variabel `key`) | `[HASIL-BACA]` | Rendah |
| F-08 | Modul belum punya `tests/` sama sekali sebelum backfill | `[HASIL-BACA]` | — |
| F-09 | README mengklaim "interface for managing saved options" — tidak ada di kode | `[PERLU-KEPUTUSAN]` | Rendah |
| F-10 | User `base.group_user` biasa TIDAK BISA write `res.partner` sendiri — fitur gagal silent | `[PERLU-KEPUTUSAN]` | **Tinggi** |
| F-11 | `fields.Json(default={})` TIDAK PERNAH menghasilkan `{}` persisten — selalu `False` sampai ditulis nilai non-kosong | `[PERLU-KEPUTUSAN]` | Sedang |

---

## Detail

### F-01 — `ir.model.access.csv` dead (tidak terdaftar di `data`), DAN isinya mengacu model yang tidak ada
**Tag:** `[PERLU-KEPUTUSAN]`
**Lokasi:** `security/ir.model.access.csv:2`, `__manifest__.py` (key `data` tidak ada sama sekali)
**Ref:** BR-06, AC-01-01
**Deskripsi:** Dua masalah independen bertumpuk di sini:
1. `__manifest__.py` **TIDAK PUNYA key `data` sama sekali** (diverifikasi langsung baca isi file,
   bukan dugaan) — artinya `security/ir.model.access.csv` **tidak pernah di-load Odoo dalam kondisi
   apapun**. File ini murni dead artifact, bukan bagian dari instalasi modul.
2. Terlepas dari poin 1, ISI file itu SENDIRI juga cacat: baris
   `access_optional_field_save_optional_field_save` mengacu `model_id:id =
   model_optional_field_save_optional_field_save`, yang secara konvensi Odoo berarti model
   `optional_field_save.optional_field_save` — model ini TIDAK PERNAH didefinisikan di manapun
   dalam kode modul (`grep -rn "_name\s*=" optional_field_save/` nihil). Satu-satunya perubahan
   model di modul ini adalah `_inherit = "res.partner"` menambah SATU field baru, bukan model baru.
**Dampak:** KARENA poin 1 (tidak terdaftar di `data`), **instalasi modul TIDAK terblokir oleh file
ini** — revisi turun dari asumsi awal `[HASIL-BACA]` sebelum manifest dibaca ulang secara teliti
(prioritas diturunkan dari Tinggi ke Sedang). Dampak nyatanya: (a) tidak ada access control eksplisit
apapun yang didaftarkan modul ini (field baru di `res.partner` otomatis ikut security `res.partner`
yang sudah ada — ini SEBENARNYA cukup dan aman untuk kasus field tambahan biasa, jadi bukan gap
fungsional), (b) file ini murni sampah/vestigial yang membingungkan siapapun yang baca kode
mengira ada access control tersendiri padahal tidak — DAN kalaupun suatu saat modul di-update untuk
mendaftarkan file ini ke `data`, instalasi akan langsung gagal karena masalah poin 2.
**Status verifikasi:** Poin 1 (manifest tidak punya `data`) dikonfirmasi 100% dari baca source,
tidak perlu eksekusi. Poin 2 (kalaupun didaftarkan, akan gagal) akan tetap dicoba diverifikasi
empiris di Step 04 sebagai bukti tambahan (opsional, karena efek riil poin 1 sudah pasti "tidak
memblokir install").
**Rekomendasi:** pemilik modul perlu memutuskan: (a) hapus `security/ir.model.access.csv` +
folder `security/` seluruhnya kalau memang tidak ada rencana access control terpisah, atau (b) kalau
memang ada rencana model/access terpisah di masa depan, perbaiki isi CSV-nya DAN daftarkan ke
`data` di manifest.
**Keputusan pemilik modul:** *(kosong — diisi manusia)*

### F-02 — Patch `ListRenderer` override total 2 method core tanpa `super()`
**Tag:** `[PERLU-KEPUTUSAN]`
**Lokasi:** `static/src/js/list_renderer.js:10-78`
**Ref:** BR-05, AC-03-01
**Deskripsi:** `patch(ListRenderer.prototype, {...})` mendefinisikan ulang `getOptionalActiveFields()`
dan `saveOptionalActiveFields()` sebagai salinan LENGKAP logic core (dibandingkan langsung dengan
source `odoo:17.0` image resmi,
`/usr/lib/python3/dist-packages/odoo/addons/web/static/src/views/list/list_renderer.js` baris
1093-1111 dan 1817-1823 — isi IDENTIK persis ke logic asli, ditambah lapisan sessionStorage/DB di
atasnya) TANPA pernah memanggil `super.getOptionalActiveFields()`/`super.saveOptionalActiveFields()`.
Ini pola yang levelnya sama dengan "tabrakan nama method Odoo core" yang wajib dicek Step 01 untuk
Python `_inherit` — bedanya di sini mekanismenya `patch()` JS Odoo web framework, bukan Python MRO,
tapi konsekuensinya serupa: method yang di-patch MENGGANTIKAN TOTAL, tidak meng-extend.
**Dampak:** (1) kalau `odoo:17.0` mendapat point-release yang mengubah isi kedua method ini (bug fix
kolom optional, dst), modul ini TIDAK PERNAH ikut mendapat perbaikan itu — selalu memakai salinan
per tanggal backfill (2026-08-07); (2) kalau ADA addon lain yang juga mem-patch
`ListRenderer.prototype.getOptionalActiveFields`/`saveOptionalActiveFields` (chain patch JS
tergantung urutan load module web asset), patch addon lain itu bisa ter-skip tergantung urutan;
belum ditemukan addon lain yang melakukan ini di scope backfill ini (base+web saja).
**Rekomendasi:** refactor supaya kedua method memanggil `super()` untuk bagian yang identik dengan
core, hanya menambah logic sessionStorage/DB di titik yang benar-benar baru — mengurangi risiko
drift ke depan. Ini perubahan kode bisnis, DI LUAR SCOPE eksekusi BACKFILL (BACKFILL tidak mengubah
kode) — dicatat sebagai rekomendasi untuk pemilik modul.
**Keputusan pemilik modul:** *(kosong — diisi manusia)*

### F-03 — `application: True` tanpa `views/`/menu — tidak ada entry point
**Tag:** `[PERLU-KEPUTUSAN]`
**Lokasi:** `__manifest__.py:22`
**Ref:** BR-08, AC-05-01
**Deskripsi:** Manifest set `application: True` (modul akan muncul sebagai "Application", bukan
cuma "Module", di Apps grid) tapi tidak ada folder `views/` sama sekali — tidak ada action/menu yang
didaftarkan. `'price': 10, 'currency': 'USD', 'images': [...]` mengindikasikan manifest ini disiapkan
untuk listing di Odoo Apps Store, di mana `application: True` mungkin cuma soal kategori
listing/marketing, bukan indikasi ada UI tersendiri.
**Dampak:** Tidak ada risiko fungsional — modul bekerja sepenuhnya silent di background. Kalau user
company mencari modul ini di menu Apps setelah install, tidak ada apapun untuk diklik/dibuka — bisa
membingungkan end-user yang tidak familiar bahwa modul ini murni enhancement pasif.
**Rekomendasi:** konfirmasi ke pemilik modul apakah ini disengaja (listing purpose) — kalau ya,
tidak perlu tindakan, cukup didokumentasikan di sini.
**Keputusan pemilik modul:** *(kosong — diisi manusia)*

### F-04 — `controllers/controllers.py` kosong total (dead file)
**Tag:** `[HASIL-BACA]`
**Lokasi:** `controllers/controllers.py:1-2`
**Deskripsi:** File cuma berisi komentar `# from odoo import http`, tidak ada class/route apapun.
Folder `controllers/` + `__init__.py` tetap ada dan di-import dari `__init__.py` root modul.
**Dampak:** Tidak ada dampak fungsional (file kosong, import no-op) — housekeeping saja.
**Rekomendasi:** hapus `controllers/` seluruhnya kalau memang tidak akan dipakai — di luar scope
BACKFILL untuk mengeksekusi ini sendiri.
**Keputusan pemilik modul:** *(kosong — diisi manusia)*

### F-05 — `googleaeed8a7b9ec156e7.html` ikut ter-bundle di dalam addon
**Tag:** `[HASIL-BACA]`
**Lokasi:** `optional_field_save/googleaeed8a7b9ec156e7.html`
**Deskripsi:** File Google Search Console site-verification (biasa ditaruh di root website, bukan
di dalam source code addon Odoo) ikut ter-commit di root folder addon.
**Dampak:** Tidak ada dampak fungsional ke Odoo (file HTML statis tidak disentuh manifest/assets
manapun) — kemungkinan besar tercopy tidak sengaja saat menyiapkan folder modul untuk publish ke
Apps Store/GitHub.
**Rekomendasi:** hapus dari repo addon — housekeeping, di luar scope BACKFILL untuk dieksekusi.
**Keputusan pemilik modul:** *(kosong — diisi manusia)*

### F-06 — Custom logout menu item tidak delegasi ke `OriginalLogOutItem`
**Tag:** `[PERLU-KEPUTUSAN]`
**Lokasi:** `static/src/js/user_menu_items.js:6-32`
**Ref:** BR-07
**Deskripsi:** `CustomLogOutItem` mengimpor `OriginalLogOutItem` dari core TAPI tidak pernah
memanggilnya — seluruh struktur item menu (`href`, `description`, `sequence`) ditulis ulang manual,
identik dengan yang core hasilkan untuk versi 17.0 saat ini, hanya `callback` yang ditambah logic
cleanup `sessionStorage`.
**Dampak:** Sama pola drift-risk dengan F-02 tapi levelnya registry item, bukan prototype method —
kalau Odoo core mengubah struktur `logOutItem` (property baru, `href` dinamis, dst) di versi 17.0.x
berikutnya, versi custom ini tidak otomatis ikut berubah.
**Rekomendasi:** panggil `OriginalLogOutItem(env)` lalu spread hasilnya + override `callback` saja,
alih-alih menulis ulang seluruh objek secara manual.
**Keputusan pemilik modul:** *(kosong — diisi manusia)*

### F-07 — Dead code: import/variabel tak terpakai
**Tag:** `[HASIL-BACA]`
**Lokasi:** `static/src/js/user_menu_items.js:8` (`useBus, useService` diimpor, tidak dipakai),
`static/src/js/list_renderer.js:19` (`let key = this.keyOptionalFields;` dideklarasikan, tidak
pernah dibaca)
**Deskripsi:** Housekeeping kosmetik, tidak berdampak fungsional.
**Keputusan pemilik modul:** *(kosong — diisi manusia)*

### F-08 — Modul belum punya `tests/` sama sekali sebelum backfill
**Tag:** `[HASIL-BACA]`
**Lokasi:** (tidak ada folder `tests/`)
**Deskripsi:** Konsisten dengan "Status dokumentasi sebelum backfill: tidak ada doc/tests sama
sekali" di `CLAUDE.md`. Test baru ditulis di Step 04 sebagai bagian scope BACKFILL ("boleh menambah
test baru").
**Keputusan pemilik modul:** N/A — bukan finding yang butuh keputusan, catatan konteks saja.

### F-09 — README mengklaim "interface for managing saved options" — tidak ada di kode
**Tag:** `[PERLU-KEPUTUSAN]`
**Lokasi:** `README.md:49-50` vs seluruh kode modul (tidak ada `views/`/wizard apapun)
**Deskripsi:** README poin "Saved Options Management" mengklaim modul "provides an interface for
managing saved options, including updates, deletions, and additions" — tapi tidak ada UI/wizard
manapun untuk itu. Update/delete preferensi HANYA terjadi otomatis lewat toggle kolom optional
standar list view (§2.3 `01A_FUNCTIONAL_SPEC.md`), tidak ada layar terpisah untuk mengelola data
tersimpan secara langsung.
**Dampak:** Kemungkinan overclaim marketing copy (dokumen README ditulis untuk listing Apps
Store/blog), bukan gap kode — tidak ada bukti fitur ini pernah ada lalu dihapus.
**Rekomendasi:** klarifikasi ke pemilik modul apakah README perlu diperbarui supaya tidak
overclaim, atau fitur "management interface" ini memang di-plan tapi belum diimplementasi.
**Keputusan pemilik modul:** *(kosong — diisi manusia)*

### F-10 — User `base.group_user` biasa TIDAK BISA write `res.partner` sendiri — fitur gagal silent
**Tag:** `[PERLU-KEPUTUSAN]`
**Lokasi:** `static/src/js/list_renderer.js:44-77` (`setDatabase`), diverifikasi lewat
`tests/test_optional_field_save.py::test_plain_internal_user_cannot_write_own_partner_field`
**Ref:** AC turunan §2.3/§2.6 `01A_FUNCTIONAL_SPEC.md`
**Deskripsi:** DITEMUKAN LEWAT EKSEKUSI TEST NYATA (Step 04, Mode C), bukan dari baca kode saja.
Modul mengasumsikan field baru di `res.partner` "otomatis ikut ACL `res.partner` yang sudah ada" —
TERBUKTI ini tidak cukup: ACL bawaan Odoo core (`base/security/ir.model.access.csv` baris
`access_res_partner_group_user`) memberi `base.group_user` (Internal User biasa) HANYA
`perm_read=1` pada `res.partner` — `perm_write=0`. Full read/write/create/unlink HANYA untuk
`base.group_partner_manager` ("Contact Creation", grup terpisah yang TIDAK otomatis dimiliki semua
Internal User — banyak role operasional/gudang/akunting-only di perusahaan nyata TIDAK punya grup
ini). Dibuktikan langsung: `partner.with_user(plain_internal_user).write({...})` melempar
`AccessError: You are not allowed to modify 'Contact' (res.partner) records ... allowed for ...
Extra Rights/Contact Creation` — pesan error asli dari Odoo core, bukan simulasi.
**Dampak:** `setDatabase()` di `list_renderer.js` membungkus `orm.call(...)` dalam `try/catch` yang
HANYA `console.error("Error fetching data:", error)` — TIDAK ADA notifikasi apapun ke user di UI.
Konsekuensi nyata: untuk SEMUA user internal yang tidak punya grup "Contact Creation" (kemungkinan
populasi besar di banyak instalasi Odoo — grup ini biasanya cuma dipegang sales/admin/full-access
role), fitur INTI modul ini (persist kolom optional lintas browser) GAGAL TOTAL secara silent —
localStorage-nya sendiri tetap jalan (fallback lama Odoo core, ditulis di baris kode yang sama
tapi terpisah dari `setDatabase()`), jadi TIDAK ADA gejala terlihat sama sekali bagi user (kolom
optional tetap "kelihatan tersimpan" di browser yang sama), sampai user ganti browser/device dan
sadar preferensinya tidak ikut — pada titik itu tidak ada log/error yang bisa dirunut user awam.
**Kemungkinan keterkaitan dengan F-01:** `security/ir.model.access.csv` yang dead+cacat di F-01
KEMUNGKINAN BESAR awalnya dimaksudkan untuk menyelesaikan MASALAH INI (memberi akses tambahan) —
tapi gagal di DUA lapis sekaligus: (a) tidak pernah terdaftar di `data` manifest, (b) isinya
mengacu model yang salah/tidak ada. Kalau memang itu niatnya, perbaikan yang benar butuh access
record untuk model `res.partner` (bukan model fiktif `optional_field_save.optional_field_save`),
didaftarkan ke `data`.
**Rekomendasi:** pemilik modul perlu memutuskan salah satu: (a) tambahkan `ir.model.access.csv`
YANG BENAR (model `res.partner`, group `base.group_user`, perm_write=1 — meski ini melonggarkan
akses write Contact utk SEMUA internal user, dampak keamanan lebih luas dari field ini saja, perlu
dipikirkan matang), (b) pindahkan penyimpanan ke model lain yang memang privat per-user dan semua
internal user boleh tulis (mis. `res.users.settings`, kalau tersedia di versi target, atau model
baru khusus modul ini dengan ACL benar), atau (c) tambahkan `sudo()` di method Python kalau ada
(saat ini TIDAK ADA — semua write langsung dari `orm.call` JS memakai hak akses user login apa
adanya, tidak lewat controller/method Python yang bisa `sudo()`), (d) minimal tambahkan
notifikasi visible ke user kalau `setDatabase()` gagal, supaya gagal-nya tidak silent.
**Keputusan pemilik modul:** *(kosong — diisi manusia)*

### F-11 — `fields.Json(default={})` tidak pernah menghasilkan `{}` persisten
**Tag:** `[PERLU-KEPUTUSAN]`
**Lokasi:** `models/res_partner.py:7`, diverifikasi lewat
`tests/test_optional_field_save.py::test_new_partner_default_is_falsy_not_empty_dict`
**Ref:** Merevisi BR-01/AC-02-03 di `01A_FUNCTIONAL_SPEC.md`/`01B_ACCEPTANCE_CRITERIA.md`
**Deskripsi:** DITEMUKAN LEWAT EKSEKUSI TEST NYATA — asumsi awal `[HASIL-BACA]` "partner BARU
(dibuat setelah modul terinstall) dapat default `{}`" TERBUKTI SALAH. `{}` adalah nilai falsy di
Python; layer ORM/kolom `Json` menyimpan nilai falsy sebagai `NULL` di DB (pola sama seperti
`Char`/`Text` — bukan bug spesifik modul ini, ini perilaku field Odoo core), dan saat dibaca balik
mengembalikan `False`, BUKAN `{}`. Dites langsung: `self.env['res.partner'].create({'name': ...})`
TANPA menyebut `optional_field_save`, dibaca balik = `False`. **Konsekuensi: TIDAK ADA partner
(baru MAUPUN lama) yang pernah benar-benar punya `{}` dari `default={}` itu sendiri** — SEMUA
partner mulai dari `False` sampai pertama kali ditulis dict non-kosong. Ini menggeser pemahaman
BR-01/AC-02-03 di spec: bedanya "partner baru vs lama" yang tadinya dianggap relevan TERNYATA
TIDAK ADA — keduanya identik (`False`) sampai first-write.
**Dampak:** TIDAK ADA dampak fungsional negatif nyata yang ditemukan — kode JS (`setDatabase()`
di `list_renderer.js`, `getOptionalActiveFields()` di `webclient.js`) SUDAH menangani `False`
dengan benar di semua jalur yang diperiksa (`Object.keys(false)` → `[]`, `if (!old_value)` →
tertangkap). Dicatat sebagai `[PERLU-KEPUTUSAN]` bukan karena ada bug tereksekusi, tapi karena
`default={}` di kode SEKARANG menyesatkan pembaca (termasuk sesi backfill ini sebelum dites nyata)
untuk mengira ada jaminan `{}` yang sebenarnya tidak pernah terwujud — kandidat perbaikan kosmetik
(`default=False` eksplisit, atau dokumentasi inline) supaya niat kode sesuai kenyataan.
**Rekomendasi:** ganti `default={}` jadi `default=False` (mencerminkan perilaku sebenarnya, tidak
ada perubahan fungsional) ATAU tambah komentar inline menjelaskan gotcha ini supaya developer
berikutnya tidak salah asumsi seperti sesi backfill ini di awal.
**Keputusan pemilik modul:** *(kosong — diisi manusia)*

---

## Limitasi Tool (kalau ada)

*(kosong — semua verifikasi yang direncanakan berhasil dieksekusi nyata di Step 04, lihat
`test/04A_DEV_TESTING.md`. F-01 dikonfirmasi empiris: instalasi modul SUKSES, tidak terblokir.)*
