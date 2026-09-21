# Baseline Spec — optional_field_save

**Step:** 1 — Intake & Scope (pelengkap `01a_MIGRATION_INTAKE.md`)
**Tujuan:** dokumentasikan APA yang modul lakukan (behavior as-is) di 19.0 — bukan bagaimana diimplementasikan.
**Tanggal:** 2026-09-21
**Sumber:** Direkonsiliasi dari `doc-dev/migration_18.0_19.0/doc/01_intake/01b_BASELINE_SPEC.md` (baseline 18.0, sudah lulus migrasi 18→19 penuh 11 step termasuk dev/QA/UAT testing) + `doc-dev/migration_18.0_19.0/doc/FINDINGS.md` + cross-check langsung ke kode aktual `target-codebase` (branch `migration/20.0`, dibuat dari `migration/19.0`) DAN `git diff origin/migration/18.0 migration/19.0 -- optional_field_save/` (lihat §0 di bawah).

> Ini **sumber kebenaran** untuk `05a_MIGRATION_ACCEPTANCE_CRITERIA.md` dan semua testing (step 9, 10, 11) — BUKAN `03_MIGRATION_SPEC.md`.

---

## 0. Verifikasi Byte-Diff 18.0 → 19.0 (dasar confidence baseline ini)

`git diff origin/migration/18.0 migration/19.0 -- optional_field_save/` dijalankan sesi ini (Mode Git, read-only). Hasil — HANYA 3 file berubah, tidak satupun mengubah business logic modul:

1. `__manifest__.py` — `version: "18.0.1.0.0"` → `"19.0.1.0.0"` (version bump murni).
2. `static/tests/tours/optional_field_save_tour.js` — kolom test "Mobile" diganti "Street". **Bukan perubahan modul** — native list view Contacts (`base/views/res_partner_views.xml`) di 19.0 menghapus total `<field name="mobile"/>` dari list view (bukan cuma disembunyikan), jadi tour lama tidak punya elemen untuk di-toggle. Diganti "Street" (masih `optional="hide"` di 19.0). Dicatat di komentar file tour itu sendiri sebagai temuan migrasi 18→19.
3. `tests/test_optional_field_save.py` — `groups_id` → `group_ids` (rename field API `res.users`/relasi grup, breaking change Odoo 18→19, murni penyesuaian test, tidak mengubah assertion/behavior yang diuji).

**File yang TIDAK berubah sama sekali (byte-identik):** `models/res_partner.py`, `static/src/js/webclient.js`, `static/src/js/list_renderer.js`, `static/src/js/user_menu_items.js`, `controllers/controllers.py`, `security/ir.model.access.csv`, `__init__.py` (root & submodule), `LICENSE`, `LISEZMOI.md`, `README.md`.

**Kesimpulan:** seluruh baseline behavior (`BSL-001` s/d `BSL-013`) yang didokumentasikan untuk 18.0 berlaku identik 1:1 untuk 19.0 — bukan asumsi, melainkan diverifikasi langsung dari isi file aktual di branch ini. Baseline ini diwarisi dengan confidence tinggi, hanya penomoran/tanggal/referensi versi yang diperbarui.

---

## Ringkasan untuk Review — Perlu Konfirmasi User

Tally provenance: 14 klaim `[MATCH]` (13 diwarisi baseline 18→19 + 1 klaim baru BSL-014 yang belum pernah didokumentasikan sebelumnya meski sudah ada sejak 17.0/18.0), 0 `[GAP]`, 0 `[NO-SPEC]`.

1. **[BSL-005] `[MATCH]`, risiko migrasi terbesar (historis):** modul override total method core `ListRenderer.prototype.computeOptionalActiveFields()`. Method ini SUDAH pernah berubah breaking sekali (17→18, rename dari `getOptionalActiveFields()`), TAPI stabil/byte-identik 18→19 (lihat §0). Tetap WAJIB dicek ulang kontraknya terhadap `native-target` (`odoo20`) di step 2 — jangan diasumsikan stabil selamanya hanya karena satu siklus terakhir tidak berubah.
2. **[BSL-005b] `[MATCH]`, risiko migrasi kedua:** modul pakai `user.partnerId` (service `@web/core/user`). Service ini juga byte-identik pemakaiannya 18→19 (lihat §0) — tetap WAJIB dicek ulang stabilitas API-nya di step 2 untuk 20.0.
3. **[BSL-002b] `[MATCH]`, fix pre-existing yang harus tetap ada:** `webclient.js` punya `this.orm = useService("orm")` eksplisit di `setup()` (warisan fix MF-02, migrasi 17→18) — tanpa ini webclient crash total (blank page) setiap login. Byte-identik 18→19. WAJIB tetap ada di 20.0, dan pola `useService()` di patch top-level Owl component WAJIB dicek ulang tetap valid caranya di 20.0 (step 2).
4. **[BSL-009] `[MATCH]` (F-11, warisan MF-04) — bug pre-existing yang HARUS dipertahankan apa adanya:** `default={}` selalu `False` bukan `{}` (perilaku field Json core) — dikonfirmasi identik 17.0↔18.0↔19.0↔20.0 (step 2/6). **[BSL-010] — ⚠️ TIDAK LAGI identik di 20.0, dikonfirmasi step 6+8 (2 putaran verifikasi empiris, lihat catatan `[GAP DI 20.0]` inline di §5 dan `FINDINGS.md` MF-01):** write `res.partner` gagal silent untuk user tanpa grup "Contact Creation" — ini TETAP identik 17.0↔18.0↔19.0, TAPI **berubah di 20.0**: ACL native `base` (`ir.access.csv`, baris baru `res_partner_rule_write_self`) sekarang mengizinkan user tanpa grup ini menulis `res.partner` MILIKNYA SENDIRI — persis skenario yang dieksekusi `setDatabase()` modul ini. Bug silent-fail warisan HILANG untuk skenario nyata, bukan karena modul diperbaiki.
5. **[BSL-014] `[MATCH]`, klaim baru — dead import belum pernah didokumentasikan:** `user_menu_items.js` mengimpor `useBus, useService` dari `@web/core/utils/hooks` (baris 8) tapi TIDAK PERNAH memakai keduanya di file ini — dead import, sudah ada sejak versi 17.0 (dikonfirmasi via §0, byte-identik 18↔19, dan tidak disebut sebagai perubahan di catatan migrasi 17→18 manapun). Baseline 18→19 sebelumnya cuma mendokumentasikan dead import `session` (`[BSL-007]`), melewatkan yang satu ini. Risiko drift rendah, kosmetik murni, tidak mengubah behavior — dicatat di sini untuk kelengkapan, bukan temuan baru akibat migrasi.
6. Semua klaim lain low-risk, straightforward port — sama seperti baseline 17→18/18→19.

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
- `[BSL-002]` `[MATCH]` `getOptionalActiveFields()` (webclient.js): ambil `partnerId = user.partnerId` (warisan fix MF-05, service `@web/core/user`), `orm.call("res.partner", "search_read", ...)` untuk partner user login, ambil `optional_field_save`. Tiap key JSON ditulis ke `sessionStorage.setItem(key, value)`. Guard `datapartnerId.length > 0 ? ... : {}` — kalau `partnerId` ternyata `undefined`/tidak ketemu, method ini gagal SENYAP (dapat objek kosong, tidak throw).
- `[BSL-003]` `[MATCH]` `ListRenderer` (list_renderer.js) baca preferensi SAAT RENDER via `computeOptionalActiveFields()` (warisan fix MF-01): `sessionStorage.getItem("optional_field.<resModel>")` dulu, fallback ke `super.computeOptionalActiveFields()` (delegasi ke core — localStorage/default "show") kalau sessionStorage kosong. Pure function (return dict), dipanggil tiap `onWillRender` oleh core.

### Toggle & Simpan Preferensi
- `[BSL-004]` `[MATCH]` Saat user toggle checkbox kolom optional di dropdown "⚙" list view, core memanggil `saveOptionalActiveFields()` (dipatch), menulis ke DUA tempat: (a) `browser.localStorage` (perilaku asli, tetap dipertahankan untuk kompatibilitas bagian core lain), (b) `setDatabase(...)` — persist ke `res.partner.optional_field_save` DAN `sessionStorage`.
- `[BSL-005]` `[MATCH]` **[RISIKO MIGRASI TERBESAR — lihat "Ringkasan untuk Review" poin 1]** Patch `computeOptionalActiveFields()`/`saveOptionalActiveFields()` men-DELEGASIKAN sebagian ke `super()`. Method core ini di addon `web` WAJIB dicek ulang kontraknya terhadap 20.0 sebelum implementasi step 6.
- `[BSL-006]` `[MATCH]` `setDatabase(value1, value2)`: ambil `partnerId = user.partnerId` (warisan fix MF-05), `search_read` ULANG partner (round-trip baru ke server tiap toggle, tidak reuse hasil `webclient.js`) untuk dapat `old_value` JSON existing, gabungkan key baru ke dict lama, `orm.call("res.partner", "write", ...)` untuk persist, lalu sinkronkan `sessionStorage` untuk key itu. Dibungkus `try/catch` — kegagalan (mis. `AccessError`, lihat [BSL-010]) cuma `console.error`, tidak ada notifikasi UI.

### Cleanup saat Logout
- `[BSL-007]` `[MATCH]` Custom logout menu item (`user_menu_items.js`, registry `user_menuitems` key `"log_out"`) menghapus SEMUA key `sessionStorage` yang mengandung substring `"optional_field"` SEBELUM redirect ke `/web/session/logout` — mencegah sessionStorage user A bocor terbaca user B di tab/browser yang sama. `localStorage` TIDAK dibersihkan (scope cleanup sengaja terbatas ke sessionStorage, bukan bug). Import `session` dari `@web/session` masih ada di file ini tapi TIDAK PERNAH dipakai (dead import).
- `[BSL-014]` `[MATCH]` (baru didokumentasikan, lihat "Ringkasan untuk Review" poin 5) Import `useBus, useService` dari `@web/core/utils/hooks` di `user_menu_items.js` (baris 8) juga TIDAK PERNAH dipakai — dead import kedua di file yang sama, sudah ada sejak 17.0.

### Entry Point
- `[BSL-008]` `[MATCH]` `application: False`, tidak ada key `price`/`currency` di manifest — modul TIDAK muncul sebagai "Application" terinstal di Apps grid, murni modul teknis biasa. `version: "19.0.1.0.0"`.

## 5. Server-Side Logic dengan Side Effect

### res.partner
- `[BSL-009]` `[MATCH]` (warisan F-11/MF-04) **create:** `default={}` di field definition TIDAK PERNAH menghasilkan `{}` tersimpan — `{}` adalah nilai falsy Python, ORM menyimpannya sebagai `NULL` di DB, dibaca balik jadi `False`. SEMUA partner (baru maupun lama) identik `False` sampai pertama kali ditulis dict non-kosong. JS sudah menangani `False` dengan benar di semua jalur (`Object.keys(false)` → `[]`, tidak crash) — TIDAK ADA dampak fungsional negatif, murni kosmetik-menyesatkan di kode. **Perlu dikonfirmasi ulang di step 2** apakah perilaku `fields.Json` core berubah 19.0→20.0.
- `[BSL-010]` `[MATCH]` (warisan F-10/MF-03) **write (via JS `orm.call`, bukan method Python):** `orm.call("res.partner", "write", ...)` memakai hak akses user LOGIN APA ADANYA — tidak ada `sudo()` di manapun. User `base.group_user` biasa TANPA `base.group_partner_manager` ("Contact Creation") HANYA `perm_read` pada `res.partner` (ACL core Odoo, bukan modul ini) — `write` di `setDatabase()` melempar `AccessError`, ditangkap `try/catch` yang HANYA `console.error(...)`, TIDAK ADA notifikasi UI. **Konsekuensi:** fitur inti (persist lintas browser) GAGAL TOTAL SECARA SILENT untuk populasi user yang tidak punya grup ini. localStorage fallback tetap jalan sehingga tidak ada gejala terlihat di browser yang sama. **WAJIB dipertahankan apa adanya di 20.0** kecuali user eksplisit minta diperbaiki.
  **[GAP DI 20.0 — dikonfirmasi 2026-09-21, step 6+8, 2 putaran verifikasi empiris]** ACL `res.partner`/`base.group_user` di 20.0 BERUBAH — struktur file berubah total (`ir.model.access.csv`+`ir.rule` digabung jadi `ir.access.csv`, lihat DIFF-03) DAN baris baru `res_partner_rule_write_self` (grup `base.group_user`, domain `id = user.partner_id.id`) benar-benar MENGIZINKAN self-write. **Dikonfirmasi lewat test baru `test_plain_internal_user_can_write_own_partner_record`** (mereplikasi persis pola `setDatabase()`: menulis ke `partnerId = user.partnerId`, partner user login sendiri) — write BERHASIL, TIDAK ADA `AccessError`, dikonfirmasi 2x termasuk fresh-DB run. Test warisan `test_plain_internal_user_cannot_write_own_partner_field` (menulis ke partner LAIN, bukan milik sendiri) tetap PASS (AccessError tetap terjadi untuk kasus itu) — dua hasil ini TIDAK kontradiktif, cuma menguji skenario berbeda (self vs unrelated).
  **Kesimpulan: BSL-010/F-10/MF-03 TIDAK LAGI terjadi 20.0 untuk skenario nyata yang dieksekusi modul ini** (self-write) — bug silent-fail warisan HILANG, murni akibat ACL native `base` berubah, BUKAN karena kode modul diubah. Lihat `FINDINGS.md` MF-01 (riwayat investigasi lengkap, termasuk kesimpulan-antara yang sempat salah sebelum ketahuan lewat step 8 code review) dan `02_DIFF_ANALYSIS.md` DIFF-03.

## 6. Client-Side Behavior (Views, JS, Owl)

### Backend
- `static/src/js/webclient.js` — patch `WebClient.prototype.setup()`, termasuk `this.orm = useService("orm")` (fix MF-02) dan `user.partnerId` (fix MF-05). Tidak ada komponen Owl baru, tidak ada template `.xml` custom.
- `static/src/js/list_renderer.js` — patch `ListRenderer.prototype` (`computeOptionalActiveFields`, `saveOptionalActiveFields`, `setDatabase` — lihat [BSL-005]). `this.session = session` dan `this.orm = useService("orm")` diinisialisasi di `setup()` sebelum `super.setup()`. Tidak ada komponen Owl baru.
- `static/src/js/user_menu_items.js` — replace total registry item `user_menuitems` key `"log_out"`. Import `OriginalLogOutItem` dari core tapi TIDAK PERNAH dipanggil, dan dua dead import (`session`, `useBus`/`useService` — lihat [BSL-007]/[BSL-014]) — risiko drift rendah, bukan blocker migrasi tapi dicatat.
- Semua 3 file terdaftar di `assets.web.assets_backend` — tidak ada asset publik/frontend. Tour test (`optional_field_save_tour.js`) terdaftar terpisah di `assets.web.assets_tests` — **isi tour berbeda dari baseline 18.0** (kolom "Mobile"→"Street", murni penyesuaian ke perubahan native view 19.0, lihat §0 poin 2 — bukan perubahan behavior modul).
- Tidak ada RPC/route custom (`controllers/controllers.py` dead/kosong total — cuma komentar `# from odoo import http`).

### Public/Frontend
- Tidak ada — modul murni backend-only.

## 7. Dependency Eksternal

### Eksplisit (manifest)
- `depends: ['base', 'web']` — murni Native Community, tidak ada Enterprise/OCA (dikonfirmasi konsisten dua migrasi sebelumnya).

### Implisit/Inferred
- Tidak ada modul lain yang dipakai tapi tidak dideklarasikan.
- Tidak ada library pihak ketiga (CDN, dst).
- Bergantung pada struktur internal `ListRenderer`/`WebClient`/registry `user_menuitems`/service `@web/core/user` milik addon `web` — ini BUKAN public API resmi Odoo, jadi rawan berubah antar versi (ini sebabnya [BSL-005]/[BSL-005b] jadi risiko migrasi terbesar, riwayat: sudah pernah berubah breaking sekali di 17→18, stabil di 18→19 — pola tidak bisa diasumsikan berulang atau berhenti).

## 8. Quirk / Behavior Non-Obvious

- `[BSL-011]` `[MATCH]` (ref: F-01) `security/ir.model.access.csv` ada di modul TAPI **tidak pernah di-load Odoo** — `__manifest__.py` tidak punya key `data` sama sekali. Isi filenya sendiri juga cacat (mengacu model `optional_field_save.optional_field_save` yang tidak pernah didefinisikan). Dead artifact murni, TIDAK memblokir instalasi. Di luar scope migrasi port-kode untuk dibersihkan.
- `[BSL-012]` `[MATCH]` (ref: F-04) `controllers/controllers.py` kosong total (cuma komentar) — folder tetap ada, di-import dari `__init__.py`, tidak ada dampak fungsional.
- `[BSL-013]` `[MATCH]` (ref: F-05) `googleaeed8a7b9ec156e7.html` (Google site-verification) ikut ter-bundle di root folder addon — file statis, tidak disentuh manifest/assets manapun. Default: dibawa apa adanya, port-kode murni tidak menghapus file, kecuali user minta dibersihkan.

---

## Cara Pakai

ID `BSL-001` s/d `BSL-014` sudah dipakai di dokumen ini — lanjutkan penomoran dari `BSL-015` kalau step manapun (2, 3, 8, 9) menemukan klaim behavior baru yang belum tercatat di sini.
