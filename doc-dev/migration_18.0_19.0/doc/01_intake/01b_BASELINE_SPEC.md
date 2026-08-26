# Baseline Spec — optional_field_save

**Step:** 1 — Intake & Scope (pelengkap `01a_MIGRATION_INTAKE.md`)
**Tujuan:** dokumentasikan APA yang modul lakukan (behavior as-is) di 18.0 — bukan bagaimana diimplementasikan.
**Tanggal:** 2026-08-26
**Sumber:** Direkonsiliasi dari `doc-dev/_archive/migration_17.0_18.0/doc/01_intake/01b_BASELINE_SPEC.md` (baseline 17.0, sudah lulus migrasi 17→18 penuh 11 step termasuk dev/QA/UAT testing) + `doc-dev/_archive/migration_17.0_18.0/doc/FINDINGS.md` (MF-01, MF-02, MF-05 — dua fix disengaja & satu adaptasi wajib yang sekarang jadi bagian permanen kode 18.0) + cross-check langsung ke kode aktual `target-codebase` (branch `migration/19.0_target`, dibuat dari `origin/migration/18.0`).

> Ini **sumber kebenaran** untuk `05a_MIGRATION_ACCEPTANCE_CRITERIA.md` dan semua testing (step 9, 10, 11) — BUKAN `03_MIGRATION_SPEC.md`.

**Cross-check dilakukan:** branch `migration/19.0_target` dibuat langsung `git checkout -b migration/19.0_target origin/migration/18.0` (2026-08-26) — HEAD identik `f7e8926` dengan `source-codebase`. Semua klaim di bawah dibaca dari kode aktual di HEAD ini (bukan salinan/dugaan), jadi otomatis `[MATCH]` terhadap baseline 17→18 kecuali dicatat sebaliknya.

---

## Ringkasan untuk Review — Perlu Konfirmasi User

Tally provenance: 13 klaim `[MATCH]` (diwarisi baseline 17→18 + 2 fix migrasi sudah baked-in), 0 `[GAP]`, 0 `[NO-SPEC]`.

1. **[BSL-005] `[MATCH]`, warisan MF-01 (risiko migrasi terbesar, historis):** modul override total method core `ListRenderer.prototype.computeOptionalActiveFields()` (nama method ini sendiri HASIL migrasi 17→18 — nama lama `getOptionalActiveFields()` dihapus core di 18.0). Metode ini historically tidak stabil antar major version `web` addon — WAJIB dicek ulang diff-nya terhadap `native-target` (`enterprise19.0`) di step 2, jangan diasumsikan stabil hanya karena baru sekali diverifikasi di 17→18.
2. **[BSL-005b] `[MATCH]`, warisan MF-05 (risiko migrasi kedua):** modul pakai `user.partnerId` (service `@web/core/user`, BUKAN `session.partner_id` — sudah dihapus total dari session sejak 18.0) di 2 tempat (`webclient.js`, `list_renderer.js`). Service `@web/core/user` sendiri berpotensi berubah lagi di 19.0 — WAJIB dicek ulang di step 2, bukan diasumsikan API-nya beku.
3. **[BSL-002b] `[MATCH]`, warisan MF-02 (bug pre-existing yang SUDAH diperbaiki, bukan lagi keputusan terbuka):** `webclient.js` sekarang punya `this.orm = useService("orm")` eksplisit di `setup()` — tanpa ini webclient crash total (blank page) setiap login, dikonfirmasi identik di 17.0 ASLI maupun 18.0 sebelum fix. Fix ini WAJIB tetap ada di 19.0 (bukan port-balik ke versi ber-bug), tapi juga WAJIB dicek ulang: apakah pola generik ini (`useService()` di patch top-level Owl component) tetap valid caranya di 19.0.
4. **[BSL-009]/[BSL-010] `[MATCH]` (F-10/F-11, warisan MF-03/MF-04) — dua bug pre-existing yang HARUS dipertahankan apa adanya:** (a) write `res.partner` gagal silent untuk user tanpa grup "Contact Creation" (ACL core, bukan modul), (b) `default={}` selalu `False` bukan `{}` (perilaku field Json core). Keduanya dikonfirmasi identik 17.0↔18.0 — perlu dikonfirmasi ulang 18.0↔19.0 di step 2 (kemungkinan besar tetap sama, tapi WAJIB dicek, bukan diasumsikan).
5. Semua klaim lain low-risk, straightforward port — sama seperti baseline 17→18.

---

## 1. Tujuan Modul

Odoo core menyimpan status kolom "optional" (kolom yang bisa di-toggle show/hide lewat menu "⚙" di list view) HANYA di `browser.localStorage`, per-browser, dengan key berbasis `keyOptionalFields`. Konsekuensinya: preferensi kolom opsional yang dipilih user hilang kalau user pindah browser/device, mode incognito, atau localStorage dibersihkan.

`optional_field_save` menambah lapisan persistensi SERVER-SIDE di atas mekanisme itu: preferensi kolom opsional per-list-view disimpan juga ke field `res.partner.optional_field_save` (tipe `Json`), sehingga bisa dipulihkan lintas browser/device untuk user yang sama (diidentifikasi lewat `user.partnerId`, service `@web/core/user`). Modul ini murni background-enhancer — tidak ada UI/menu/wizard tersendiri (lihat [BSL-008]).

## 2. Model & Tanggung Jawab

| Model | Tanggung Jawab |
|---|---|
| `res.partner` (`_inherit`) | Menyimpan satu field tambahan `optional_field_save` (Json) — dict preferensi kolom optional per resModel, keyed per user via relasi 1 partner = 1 login user (`user.partnerId`) |

## 3. Field dengan Makna Bisnis

### res.partner
- **Field baru:** `optional_field_save` — `fields.Json(string="Optional Field Save", default={})`. TIDAK ada UI form/tree yang menampilkan field ini (murni dibaca/ditulis via JS `orm.call`, tidak pernah lewat view).
- **Struktur value:** dict, key = `"optional_field.<resModel>"` (prefix `"optional_field."` + model teknis, mis. `res.partner`), value = string daftar nama field optional yang aktif, dipisah koma (mis. `{"optional_field.res.partner": "email,phone"}`).

## 4. Business Workflow / State Transition

### Load & Restore Preferensi
- `[BSL-001]` `[MATCH]` Saat webclient mount (patch `WebClient.prototype.setup()` di `webclient.js`), `this.orm = useService("orm")` diinisialisasi eksplisit (warisan fix MF-02) SEBELUM `super.setup()`, lalu `this.getOptionalActiveFields()` dipanggil fire-and-forget (tidak di-`await`) — SEKALI per page-load penuh, bukan per navigasi SPA.
- `[BSL-002]` `[MATCH]` `getOptionalActiveFields()` (webclient.js): ambil `partnerId = user.partnerId` (warisan fix MF-05, service `@web/core/user`, BUKAN `session.partner_id`), `orm.call("res.partner", "search_read", ...)` untuk partner user login, ambil `optional_field_save`. Tiap key JSON ditulis ke `sessionStorage.setItem(key, value)`. Guard `datapartnerId.length > 0 ? ... : {}` — kalau `partnerId` ternyata `undefined`/tidak ketemu, method ini gagal SENYAP (dapat objek kosong, tidak throw) — lihat catatan historis MF-05 soal ini.
- `[BSL-003]` `[MATCH]` `ListRenderer` (list_renderer.js) baca preferensi SAAT RENDER via `computeOptionalActiveFields()` (nama method HASIL migrasi 17→18, warisan fix MF-01 — nama lama `getOptionalActiveFields()` sudah dihapus core sejak 18.0): `sessionStorage.getItem("optional_field.<resModel>")` dulu, fallback ke `super.computeOptionalActiveFields()` (delegasi ke core — localStorage/default "show") kalau sessionStorage kosong. Pure function (return dict), dipanggil tiap `onWillRender` oleh core — BUKAN dipanggil sekali di `setup()` seperti pola 17.0 lama.

### Toggle & Simpan Preferensi
- `[BSL-004]` `[MATCH]` Saat user toggle checkbox kolom optional di dropdown "⚙" list view, core memanggil `saveOptionalActiveFields()` (dipatch), menulis ke DUA tempat: (a) `browser.localStorage` (perilaku asli, tetap dipertahankan untuk kompatibilitas bagian core lain), (b) `setDatabase(...)` — persist ke `res.partner.optional_field_save` DAN `sessionStorage`.
- `[BSL-005]` `[MATCH]` **[RISIKO MIGRASI TERBESAR — lihat "Ringkasan untuk Review" poin 1]** Patch `computeOptionalActiveFields()`/`saveOptionalActiveFields()` adalah override yang men-DELEGASIKAN sebagian ke `super()` (BEDA dari pola 17.0 lama yang override total tanpa `super()` sama sekali — perubahan ini sendiri adalah hasil migrasi 17→18/MF-01). Method core `computeOptionalActiveFields()` di `web/static/src/views/list/list_renderer.js` (18.0) WAJIB dicek ulang kontraknya terhadap 19.0 sebelum implementasi step 6 — riwayat menunjukkan area ini rawan berubah signature/arsitektur antar major version (persis kejadian 17→18).
- `[BSL-006]` `[MATCH]` `setDatabase(value1, value2)`: ambil `partnerId = user.partnerId` (warisan fix MF-05), `search_read` ULANG partner (round-trip baru ke server tiap toggle, tidak reuse hasil `webclient.js`) untuk dapat `old_value` JSON existing, gabungkan key baru ke dict lama, `orm.call("res.partner", "write", ...)` untuk persist, lalu sinkronkan `sessionStorage` untuk key itu. Dibungkus `try/catch` — kegagalan (mis. `AccessError`, lihat [BSL-010]) cuma `console.error`, tidak ada notifikasi UI.

### Cleanup saat Logout
- `[BSL-007]` `[MATCH]` Custom logout menu item (`user_menu_items.js`, registry `user_menuitems` key `"log_out"`) menghapus SEMUA key `sessionStorage` yang mengandung substring `"optional_field"` SEBELUM redirect ke `/web/session/logout` — mencegah sessionStorage user A bocor terbaca user B di tab/browser yang sama. `localStorage` TIDAK dibersihkan (scope cleanup sengaja terbatas ke sessionStorage, bukan bug). Import `session` dari `@web/session` masih ada di file ini tapi TIDAK PERNAH dipakai (dead import, byte-identik dengan versi 17.0/18.0 — bukan regresi baru, dicatat sebagai quirk kalau step 2/8 menganggap perlu dibersihkan).

### Entry Point
- `[BSL-008]` `[MATCH]` `application: False`, tidak ada key `price`/`currency` di manifest — modul TIDAK muncul sebagai "Application" terinstal di Apps grid, murni modul teknis biasa. `version: "18.0.1.0.0"`.

## 5. Server-Side Logic dengan Side Effect

### res.partner
- `[BSL-009]` `[MATCH]` (warisan F-11/MF-04) **create:** `default={}` di field definition TIDAK PERNAH menghasilkan `{}` tersimpan — `{}` adalah nilai falsy Python, ORM menyimpannya sebagai `NULL` di DB, dibaca balik jadi `False`. SEMUA partner (baru maupun lama) identik `False` sampai pertama kali ditulis dict non-kosong. JS sudah menangani `False` dengan benar di semua jalur (`Object.keys(false)` → `[]`, tidak crash) — TIDAK ADA dampak fungsional negatif, murni kosmetik-menyesatkan di kode. **Perlu dikonfirmasi ulang di step 2** apakah perilaku `fields.Json` core berubah 18.0→19.0.
- `[BSL-010]` `[MATCH]` (warisan F-10/MF-03) **write (via JS `orm.call`, bukan method Python):** `orm.call("res.partner", "write", ...)` memakai hak akses user LOGIN APA ADANYA — tidak ada `sudo()` di manapun (tidak ada method Python custom sama sekali, semua langsung dari JS). User `base.group_user` biasa TANPA `base.group_partner_manager` ("Contact Creation") HANYA `perm_read` pada `res.partner` (ACL core Odoo, bukan modul ini) — `write` di `setDatabase()` melempar `AccessError`, ditangkap `try/catch` yang HANYA `console.error(...)`, TIDAK ADA notifikasi UI. **Konsekuensi:** fitur inti (persist lintas browser) GAGAL TOTAL SECARA SILENT untuk populasi user yang tidak punya grup ini. localStorage fallback tetap jalan sehingga tidak ada gejala terlihat di browser yang sama. **WAJIB dipertahankan apa adanya di 19.0** kecuali user eksplisit minta diperbaiki. **Perlu dikonfirmasi ulang di step 2** apakah ACL `base.group_user` pada `res.partner` berubah 18.0→19.0.

## 6. Client-Side Behavior (Views, JS, Owl)

### Backend
- `static/src/js/webclient.js` — patch `WebClient.prototype.setup()`, termasuk `this.orm = useService("orm")` (fix MF-02) dan `user.partnerId` (fix MF-05). Tidak ada komponen Owl baru, tidak ada template `.xml` custom.
- `static/src/js/list_renderer.js` — patch `ListRenderer.prototype` (`computeOptionalActiveFields`, `saveOptionalActiveFields`, `setDatabase` — lihat [BSL-005]). `this.session = session` dan `this.orm = useService("orm")` diinisialisasi di `setup()` sebelum `super.setup()`. Tidak ada komponen Owl baru.
- `static/src/js/user_menu_items.js` — replace total registry item `user_menuitems` key `"log_out"`. Import `OriginalLogOutItem` dari core tapi TIDAK PERNAH dipanggil (struktur ditulis ulang manual), dan import `session` yang tidak pernah dipakai (lihat [BSL-007]) — risiko drift rendah, bukan blocker migrasi tapi dicatat.
- Semua 3 file terdaftar di `assets.web.assets_backend` — tidak ada asset publik/frontend. Tour test (`optional_field_save_tour.js`) terdaftar terpisah di `assets.web.assets_tests`.
- Tidak ada RPC/route custom (`controllers/controllers.py` dead/kosong total — cuma komentar `# from odoo import http`).

### Public/Frontend
- Tidak ada — modul murni backend-only.

## 7. Dependency Eksternal

### Eksplisit (manifest)
- `depends: ['base', 'web']` — murni Native Community, tidak ada Enterprise/OCA (dikonfirmasi dev di intake §0, konsisten dengan migrasi 17→18).

### Implisit/Inferred
- Tidak ada modul lain yang dipakai tapi tidak dideklarasikan.
- Tidak ada library pihak ketiga (CDN, dst).
- Bergantung pada struktur internal `ListRenderer`/`WebClient`/registry `user_menuitems`/service `@web/core/user` milik addon `web` — ini BUKAN public API resmi Odoo, jadi rawan berubah antar versi (ini sebabnya [BSL-005]/[BSL-005b] jadi risiko migrasi terbesar, riwayat nyata: KEDUANYA sudah pernah berubah breaking sekali di 17→18).

## 8. Quirk / Behavior Non-Obvious

- `[BSL-011]` `[MATCH]` (ref: F-01) `security/ir.model.access.csv` ada di modul TAPI **tidak pernah di-load Odoo** — `__manifest__.py` tidak punya key `data` sama sekali. Isi filenya sendiri juga cacat (mengacu model `optional_field_save.optional_field_save` yang tidak pernah didefinisikan). Dead artifact murni, TIDAK memblokir instalasi. Di luar scope migrasi port-kode untuk dibersihkan.
- `[BSL-012]` `[MATCH]` (ref: F-04) `controllers/controllers.py` kosong total (cuma komentar) — folder tetap ada, di-import dari `__init__.py`, tidak ada dampak fungsional.
- `[BSL-013]` `[MATCH]` (ref: F-05) `googleaeed8a7b9ec156e7.html` (Google site-verification) ikut ter-bundle di root folder addon — file statis, tidak disentuh manifest/assets manapun. Default: dibawa apa adanya, port-kode murni tidak menghapus file, kecuali user minta dibersihkan.

---

## Cara Pakai

ID `BSL-001` s/d `BSL-013` (plus `BSL-005b`/`BSL-002b` sebagai catatan silang risiko) sudah dipakai di dokumen ini — lanjutkan penomoran dari `BSL-014` kalau step manapun (2, 3, 8, 9) menemukan klaim behavior baru yang belum tercatat di sini.
