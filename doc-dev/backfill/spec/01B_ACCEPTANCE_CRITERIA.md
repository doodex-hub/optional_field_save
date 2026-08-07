# Acceptance Criteria — optional_field_save

**Module:** `optional_field_save`
**Ref:** `01A_FUNCTIONAL_SPEC.md`
**Last Updated:** 2026-08-07
**Status:** Backfill retroaktif

> Format Given/When/Then, diturunkan dari Business Rules (BR-*) di `01A_FUNCTIONAL_SPEC.md`.

---

## AC-01 — Instalasi modul

**AC-01-01** — ref `BR-06` `[PERLU-KEPUTUSAN]` (F-01, Sedang) — `[DIKONFIRMASI]` via eksekusi nyata
Given database Odoo 17.0 kosong/fresh dengan `base`+`web` saja
When modul `optional_field_save` di-install (`-i optional_field_save`)
Then instalasi SUKSES — dikonfirmasi empiris di Step 04 (`docker compose up`, Mode C): 12 modul
loaded tanpa Traceback, `security/ir.model.access.csv` (yang isinya cacat, mengacu model yang tidak
ada) terbukti tidak berpengaruh karena memang tidak pernah di-load Odoo (`__manifest__.py` tidak
punya key `data`). Lihat `test/04A_DEV_TESTING.md`.

## AC-02 — Persistensi preferensi kolom optional (lintas browser)

**AC-02-01** — ref `BR-01`, `BR-04` `[HASIL-BACA]`
Given user login, buka list view apapun yang punya kolom optional, toggle salah satu kolom jadi aktif
When toggle selesai (`saveOptionalActiveFields` core terpanggil)
Then `res.partner.optional_field_save` milik user (`session.partner_id`) ter-update, key
`"optional_field.<resModel>"` berisi daftar nama field optional yang aktif (comma-joined) —
DAN `browser.localStorage` (key `keyOptionalFields`) DAN `sessionStorage` (key sama seperti DB) juga
ter-update konsisten.

**AC-02-02** — ref `BR-02`, `BR-03` `[HASIL-BACA]`
Given user sebelumnya sudah menyimpan preferensi kolom optional untuk resModel X (tersimpan di DB)
When user login di BROWSER LAIN (localStorage kosong) dan membuka list view resModel X
Then preferensi kolom optional yang sama muncul (di-load dari DB oleh `webclient.js` ke
`sessionStorage` saat webclient mount, dibaca `list_renderer.js` saat render).

**AC-02-03** — ref `BR-01` `[DIKONFIRMASI]` via eksekusi nyata (direvisi, lihat F-11)
Given SEMUA partner (baru MAUPUN lama — TERBUKTI tidak ada bedanya, lihat F-11) yang belum pernah
ditulis field `optional_field_save`-nya
When dibaca via `search_read`/`read`
Then nilainya `False` (BUKAN `{}` seperti dugaan awal `default={}` di field definition — `{}` itu
falsy, tidak pernah tersimpan sebagai literal, selalu jadi NULL/`False`). Dites langsung di Step 04
(`test_new_partner_default_is_falsy_not_empty_dict`) — hasil: `False` utk partner baru sekalipun.

**AC-02-04** — ref `BR-01` `[DIKONFIRMASI]` via eksekusi nyata
Given `old_value` (`optional_field_save` partner) bernilai `False` (kasus AC-02-03)
When user pertama kali toggle kolom optional (`setDatabase()` dipanggil)
Then `setDatabase()` menangani `old_value` yang falsy dengan benar (`if (!old_value)` di
`list_renderer.js:62`) — TIDAK crash, langsung membuat dict baru `{[key]: value}`. Dikonfirmasi
tidak crash karena `old_value` sumbernya `search_read` yang untuk Json field mengembalikan
`false` (bukan `null`/`undefined`) — `Object.keys(false)` → `[]` (valid, tidak throw), beda dari
`Object.keys(null)`/`Object.keys(undefined)` yang akan `TypeError` (jalur itu TIDAK tercapai dalam
alur normal). Perilaku SUDAH BENAR.

## AC-03 — Override method core `ListRenderer` (JS)

**AC-03-01** — ref `BR-05` `[PERLU-KEPUTUSAN]` (F-02, Sedang)
Given `list_renderer.js` mem-patch `getOptionalActiveFields`/`saveOptionalActiveFields` TANPA
memanggil `super()`
When Odoo core (versi patch 17.0.x berikutnya) mengubah isi kedua method itu, ATAU addon lain
mem-patch method yang sama lebih dulu di chain
Then perubahan/patch itu TIDAK PERNAH ikut berjalan — modul ini selalu memakai salinan logic per
tanggal backfill (dikonfirmasi identik dengan `odoo:17.0` image resmi saat ini, lihat
`FINDINGS.md` F-02). Perlu keputusan pemilik modul: terima risiko drift ini, atau refactor supaya
memanggil `super()` untuk bagian yang tidak diubah.

## AC-04 — Cleanup saat logout

**AC-04-01** — ref `BR-07` `[HASIL-BACA]`
Given user login di suatu browser, sudah punya beberapa key `sessionStorage` berprefix
`optional_field`/`optional_field.<resModel>`
When user klik "Log out"
Then SEMUA key `sessionStorage` yang mengandung substring `"optional_field"` dihapus SEBELUM redirect
ke `/web/session/logout` — mencegah user login berikutnya di tab/browser yang sama membaca sisa
preferensi user sebelumnya dari `sessionStorage` (catatan: `localStorage`, kalau ada, TIDAK
dibersihkan oleh logout ini — tetap bertahan lintas user di browser yang sama; bukan bug, cuma scope
cleanup yang sengaja terbatas ke sessionStorage).

## AC-05 — Entry point modul di Apps menu

**AC-05-01** — ref `BR-08` `[PERLU-KEPUTUSAN]` (F-03, Rendah)
Given `__manifest__.py` `application: True`
When modul terinstall dan user buka menu Apps
Then modul MUNCUL sebagai aplikasi terinstall, TAPI tidak ada menu/action APAPUN untuk dibuka (tidak
ada `views/` sama sekali) — modul murni background-enhancer, `application: True` kemungkinan cuma
untuk visibilitas di Apps store/listing (harga `10 USD` di manifest), bukan indikasi ada UI
tersendiri. Perlu konfirmasi pemilik modul apakah ini disengaja.

## AC-06 — Akses tulis `res.partner` untuk user internal biasa

**AC-06-01** — `[DIKONFIRMASI]` via eksekusi nyata (F-10, **Tinggi**)
Given user Internal (`base.group_user`) TANPA grup `base.group_partner_manager` ("Contact
Creation") — kombinasi yang UMUM di instalasi Odoo nyata (banyak role operasional tidak diberi hak
ini)
When JS modul mencoba `orm.call("res.partner", "write", [[session.partner_id], {optional_field_save: ...}])`
untuk partner user itu SENDIRI
Then Odoo core melempar `AccessError` (`perm_write=0` untuk `base.group_user` pada `res.partner` —
`access_res_partner_group_user` di `base/security/ir.model.access.csv`). `setDatabase()` menangkap
error ini di `try/catch` dan HANYA `console.error(...)` — TIDAK ADA notifikasi UI ke user. Fitur
persistensi lintas-browser GAGAL TOTAL secara silent untuk kelas user ini (fallback
`localStorage` tetap jalan, jadi tidak ada gejala terlihat di browser yang sama). Dites langsung
di Step 04 (`test_plain_internal_user_cannot_write_own_partner_field`,
`test_user_with_partner_manager_group_can_write` sebagai pembanding).
