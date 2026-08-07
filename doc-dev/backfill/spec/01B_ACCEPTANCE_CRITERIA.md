# Acceptance Criteria — optional_field_save

**Module:** `optional_field_save`
**Ref:** `01A_FUNCTIONAL_SPEC.md`
**Last Updated:** 2026-08-07
**Status:** Backfill retroaktif

> Format Given/When/Then, diturunkan dari Business Rules (BR-*) di `01A_FUNCTIONAL_SPEC.md`.

---

## AC-01 — Instalasi modul

**AC-01-01** — ref `BR-06` `[PERLU-KEPUTUSAN]` (F-01, Sedang)
Given database Odoo 17.0 kosong/fresh dengan `base`+`web` saja
When modul `optional_field_save` di-install (`-i optional_field_save`)
Then instalasi SUKSES — `__manifest__.py` tidak punya key `data` sama sekali, jadi
`security/ir.model.access.csv` (yang isinya cacat, mengacu model yang tidak ada) tidak pernah
di-load Odoo, tidak berpengaruh ke instalasi. Diverifikasi empiris di Step 04 sebagai bukti
tambahan (`test/04A_DEV_TESTING.md`) — hasil DIHARAPKAN sukses (bukan lagi "diduga gagal" seperti
asumsi awal sebelum manifest dibaca teliti).

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

**AC-02-03** — ref `BR-01` `[HASIL-BACA]`
Given partner user SUDAH ADA di database SEBELUM modul ini diinstall (field `optional_field_save`
belum pernah di-write, nilai kolom `False`/NULL di DB, BUKAN `{}`)
When user pertama kali toggle kolom optional setelah modul terinstall
Then `setDatabase()` menangani `old_value` yang falsy dengan benar (`if (!old_value)` di
`list_renderer.js:62`) — tidak crash, langsung membuat dict baru `{[key]: value}`. Perilaku SUDAH
BENAR, dicatat di sini sebagai AC eksplisit (bukan asumsi) karena kombinasi
`Object.keys(false)`/`Object.keys(null)` gampang disalahsangka error tanpa dites nyata (`Object.keys(false)`
→ `[]`, valid; `Object.keys(null)`/`Object.keys(undefined)` → `TypeError` — TAPI `old_value` di
sini sumbernya `search_read` yang untuk Json field mengembalikan `false`, bukan `null`/`undefined`,
jadi jalur throw itu TIDAK tercapai dalam alur normal).

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
