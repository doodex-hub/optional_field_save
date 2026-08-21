# Functional Spec (Backfill) — optional_field_save

> Ditulis retroaktif dari membaca kode yang berjalan sekarang (`branch backfill/17.0`, basis
> `origin/17.0`). Provenance tag di tiap klaim: `[HASIL-BACA]` default, `[DIKONFIRMASI]` kalau
> pemilik modul sudah konfirmasi, `[PERLU-KEPUTUSAN]` kalau ambigu/bug (juga masuk `FINDINGS.md`).

## 1. Tujuan Modul `[HASIL-BACA]`

Odoo core menyimpan status kolom "optional" (kolom yang bisa di-toggle show/hide lewat menu
"⚙"/kolom di list view) HANYA di `browser.localStorage`, per-browser, key berbasis
`this.keyOptionalFields` (kombinasi model + view + daftar kolom). Konsekuensinya: preferensi kolom
opsional yang dipilih user HILANG kalau user pindah browser/device, mode incognito, atau
localStorage dibersihkan.

`optional_field_save` menambah lapisan PERSISTENSI SERVER-SIDE di atas mekanisme itu: preferensi
kolom opsional per-list-view disimpan juga ke field `res.partner.optional_field_save` (field
`Json`), sehingga bisa dipulihkan lintas browser/device untuk user yang sama (diidentifikasi lewat
`session.partner_id`).

## 2. Cara Kerja End-to-End `[HASIL-BACA]`

### 2.1 Model — `models/res_partner.py`

- `_inherit = "res.partner"`, menambah SATU field baru: `optional_field_save = fields.Json(string="Optional Field Save", default={})`.
- Struktur value: dict Python/JS object, key = `"optional_field.<resModel>"` (potongan kedua dari
  `keyOptionalFields` list view, diprefix `"optional_field."`), value = string daftar nama field
  optional yang sedang AKTIF (dipisah koma), mis. `{"optional_field.res.partner": "email,phone"}`.
- **`default={}` TIDAK PERNAH benar-benar menghasilkan `{}` persisten — dikonfirmasi via eksekusi
  test nyata Step 04 (F-11).** Asumsi awal (sebelum dites) adalah "partner baru dapat `{}`, partner
  lama dapat `False`" — TERBUKTI SALAH: `{}` adalah nilai falsy Python, tersimpan sebagai NULL di
  kolom DB, dibaca balik jadi `False` — SEMUA partner (baru maupun lama) identik `False` sampai
  pertama kali ditulis dict non-kosong. Kode JS (§2.2/§2.3) menangani `False` ini dengan benar di
  semua jalur yang diperiksa (dikonfirmasi tidak crash) — lihat F-11 di `FINDINGS.md` untuk detail
  lengkap dan rekomendasi kosmetik (`default=False` supaya sesuai kenyataan).

### 2.2 `static/src/js/webclient.js` — Load Awal (DB → sessionStorage)

- Patch `WebClient.prototype.setup()`: memanggil `getOptionalActiveFields()` (fire-and-forget, tidak
  di-`await`) begitu webclient mount, SEKALI per page-load penuh (bukan per navigasi SPA).
- `getOptionalActiveFields()`: `orm.call("res.partner", "search_read", ...)` untuk partner user yang
  sedang login (`session.partner_id`), ambil field `optional_field_save`. Untuk tiap
  `{key: "optional_field.<resModel>", value: "field1,field2"}` di dalam JSON itu, tulis ke
  `sessionStorage.setItem(key, "field1,field2")` (setelah dinormalisasi lewat dictionary
  key-existence, efeknya sama — tetap comma-joined string kolom yang aktif).
- **Efek:** begitu webclient selesai load, SEMUA preferensi kolom optional yang pernah disimpan user
  (lintas SEMUA list view yang pernah disentuh) sudah ada di `sessionStorage` browser saat ini,
  siap dibaca list renderer manapun yang di-render setelahnya.

### 2.3 `static/src/js/list_renderer.js` — Baca saat Render, Tulis saat Toggle

- Patch `ListRenderer.prototype`, override total (lihat F-02 — TIDAK memanggil `super()`) untuk dua
  method core: `getOptionalActiveFields()` dan `saveOptionalActiveFields()`.
- `getOptionalActiveFields()` (dipatch): baca dari `sessionStorage.getItem("optional_field.<resModel>")`
  dulu, fallback ke `browser.localStorage.getItem(this.keyOptionalFields)` (perilaku asli Odoo core)
  kalau sessionStorage kosong. Set `this.optionalActiveFields` sesuai kolom optional yang aktif.
- `saveOptionalActiveFields()` (dipatch): dipanggil core setiap user toggle checkbox kolom optional
  di dropdown "⚙" list view. Menulis DUA tempat: (a) `browser.localStorage` (perilaku asli, key =
  `this.keyOptionalFields`) — TETAP jalan supaya kompatibel dengan bagian core lain yang masih baca
  localStorage langsung; (b) `setDatabase(...)` — persist ke `res.partner.optional_field_save` DAN
  `sessionStorage` (key `"optional_field.<resModel>"`).
- `setDatabase(value1, value2)`: `search_read` ulang partner (untuk dapat `old_value` JSON existing
  — TIDAK memakai versi yang sudah di-load `webclient.js`, selalu round-trip baru ke server tiap
  toggle), gabungkan key baru ke dict lama, `orm.call("res.partner", "write", ...)` untuk persist,
  lalu sinkronkan `sessionStorage` untuk key itu.
- **`orm.call("res.partner", "write", ...)` di atas memakai hak akses user LOGIN APA ADANYA** —
  tidak ada controller/method Python yang bisa `sudo()`, semua langsung dari ORM JS. DIKONFIRMASI
  via eksekusi test (F-10, Tinggi): user `base.group_user` biasa TANPA `group_partner_manager`
  ("Contact Creation") HANYA `perm_read` pada `res.partner` — `write` di sini akan melempar
  `AccessError`, ditangkap `try/catch` dan cuma `console.error` (silent, tidak ada notifikasi UI).

### 2.4 `static/src/js/user_menu_items.js` — Cleanup saat Logout

- Replace total item menu "Log out" (`registry.category("user_menuitems")`, key `"log_out"`) dengan
  versi custom yang, SEBELUM redirect ke `/web/session/logout`, menghapus SEMUA key `sessionStorage`
  yang mengandung substring `"optional_field"`.
- **Tujuan:** mencegah sessionStorage user A "bocor" terbaca oleh user B yang login berikutnya di
  browser/tab yang sama (sessionStorage bertahan sepanjang tab session, tidak otomatis reset saat
  ganti user login).
- Import `OriginalLogOutItem` dari core TAPI tidak pernah dipanggil — struktur item (`href`,
  `description`, `sequence`) ditulis ulang manual, bukan delegasi ke original + augment callback
  (lihat F-06).

### 2.5 `controllers/controllers.py`

- File kosong (cuma komentar `# from odoo import http`) — TIDAK ADA controller/route HTTP apapun
  yang didefinisikan modul ini, meski folder `controllers/` ada dan di-`__init__.py`-import.
  `[HASIL-BACA]` — kemungkinan sisa boilerplate scaffold Odoo (`odoo-bin scaffold`) yang tidak
  dibersihkan, bukan fitur yang sengaja dihilangkan (tidak ada bukti sebaliknya di kode/README).

### 2.6 `security/ir.model.access.csv`

- **File ini tidak pernah di-load Odoo** — `__manifest__.py` tidak punya key `data` sama sekali
  (diverifikasi langsung dari isi manifest). Isinya SENDIRI juga cacat (mengacu model
  `optional_field_save.optional_field_save` yang tidak pernah didefinisikan modul manapun) — tapi
  karena tidak pernah di-load, ini tidak memblokir instalasi, murni dead artifact. Lihat F-01
  (Sedang).

## 3. Ringkasan Business Rules (untuk traceability ke `01B_ACCEPTANCE_CRITERIA.md`)

| BR | Deskripsi singkat | Tag | Lokasi |
|---|---|---|---|
| BR-01 | Field `res.partner.optional_field_save` (Json) menyimpan preferensi kolom optional per resModel | `[HASIL-BACA]` | `models/res_partner.py:7` |
| BR-02 | Saat webclient mount, semua preferensi tersimpan di-load dari DB ke `sessionStorage` | `[HASIL-BACA]` | `static/src/js/webclient.js:14-34` |
| BR-03 | List renderer baca preferensi optional-column dari `sessionStorage` dulu, fallback `localStorage` | `[HASIL-BACA]` | `static/src/js/list_renderer.js:17-37` |
| BR-04 | Toggle kolom optional menulis ke `localStorage` (perilaku asli) DAN ke DB+`sessionStorage` (baru) | `[HASIL-BACA]` | `static/src/js/list_renderer.js:39-77` |
| BR-05 | Patch `getOptionalActiveFields`/`saveOptionalActiveFields` TIDAK memanggil `super()` — override total method core `ListRenderer`, bukan extend | `[PERLU-KEPUTUSAN]` (F-02) | `static/src/js/list_renderer.js:10-78` |
| BR-06 | `ir.model.access.csv` tidak terdaftar di `data` manifest (dead) DAN isinya mengacu model yang tidak ada | `[PERLU-KEPUTUSAN]` (F-01) | `security/ir.model.access.csv:2`, `__manifest__.py` |
| BR-07 | Logout menu item diganti total, menghapus seluruh key `sessionStorage` yang mengandung `"optional_field"` | `[HASIL-BACA]` | `static/src/js/user_menu_items.js:10-30` |
| BR-08 | `application: True` tanpa `views/`/menu apapun — tidak ada entry point terlihat di Apps | `[PERLU-KEPUTUSAN]` (F-03) | `__manifest__.py:22` |
| BR-09 | User `base.group_user` biasa HANYA `perm_read` pada `res.partner` (core ACL) — write ke partner sendiri via `setDatabase()` GAGAL untuk user tanpa `group_partner_manager` | `[PERLU-KEPUTUSAN]` (F-10, Tinggi) — `[DIKONFIRMASI]` eksekusi | `static/src/js/list_renderer.js:44-77` |
| BR-10 | `fields.Json(default={})` tidak pernah menghasilkan `{}` persisten — `{}` falsy, tersimpan NULL, dibaca balik `False` untuk SEMUA partner (baru/lama sama saja) | `[PERLU-KEPUTUSAN]` (F-11, Sedang) — `[DIKONFIRMASI]` eksekusi | `models/res_partner.py:7` |

---

## 4. Yang TIDAK Dilakukan Modul Ini (klarifikasi scope, `[HASIL-BACA]`)

- Tidak ada UI/wizard untuk "mengelola" (lihat/hapus manual) preferensi tersimpan — bertentangan
  dengan klaim README "Saved Options Management ... interface for managing saved options" (lihat
  F-09, `[PERLU-KEPUTUSAN]` Rendah — kemungkinan overclaim marketing copy, bukan gap kode).
  Persistensi sepenuhnya otomatis/silent, terikat ke toggle kolom optional standar Odoo.
- Tidak menyentuh email (outgoing/incoming) — cek wajib Step 01 email: TIDAK RELEVAN, tidak ada
  `mail.thread`/`mail.compose.message`/`fetchmail.server` disentuh modul ini.
- Tidak ada lebih dari satu dialog/wizard yang bisa terpicu bersamaan dari satu aksi (tidak ada
  wizard/dialog sama sekali) — cek wajib Step 07 skenario "satu dialog": TIDAK RELEVAN.
- Tidak ada `views/`, `wizard/`, `data/` sama sekali di modul ini.
