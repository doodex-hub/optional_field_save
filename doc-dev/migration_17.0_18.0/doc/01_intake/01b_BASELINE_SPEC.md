# Baseline Spec — optional_field_save

**Step:** 1 — Intake & Scope (pelengkap `01a_MIGRATION_INTAKE.md`)
**Tujuan:** dokumentasikan APA yang modul lakukan (behavior as-is) di 17.0 — bukan bagaimana diimplementasikan.
**Tanggal:** 2026-08-24
**Sumber:** Direkonsiliasi dari `FUNCTIONAL_SPEC.md` lama di `source-codebase/doc-dev/backfill/spec/01A_FUNCTIONAL_SPEC.md` (+ `01B_ACCEPTANCE_CRITERIA.md`, `FINDINGS.md`) + cross-check kode langsung. Spec lama itu sendiri sudah ditulis dari kode berjalan `backfill/17.0` dan sebagian klaim divalidasi via eksekusi test nyata (Step 04 backfill, Mode C Docker) — lihat `source-codebase/doc-dev/backfill/test/04A_DEV_TESTING.md`.

> Ini **sumber kebenaran** untuk `05a_MIGRATION_ACCEPTANCE_CRITERIA.md` dan semua testing (step 9, 10, 11) — BUKAN `03_MIGRATION_SPEC.md`.

**Cross-check dilakukan:** `diff -rq` antara `target-codebase/optional_field_save/` dan `source-codebase/optional_field_save/` (2026-08-24, pasca `git checkout -b migration/18.0 origin/backfill/17.0`) — **kosong, byte-identik**. Semua klaim di bawah adalah `[MATCH]` terhadap spec lama karena kode yang dibaca benar-benar sama persis dengan yang divalidasi backfill.

---

## Ringkasan untuk Review — Perlu Konfirmasi User

Tally provenance (direvisi 2026-08-24): 9 klaim `[MATCH]`, 1 `[GAP]` (BSL-008), 0 `[NO-SPEC]`.

0. **[BSL-008] `[GAP]` — koreksi dokumentasi, bukan temuan migrasi:** spec lama backfill (`01A_FUNCTIONAL_SPEC.md`) salah klaim `application: True` — kode aktual `backfill/17.0` sudah `application: False` SEBELUM spec itu ditulis (salah baca manifest saat sesi backfill, bukan perubahan belakangan). Tidak ada dampak fungsional, tidak butuh keputusan — sudah dikoreksi di §8 di bawah.

1. **[BSL-009] `[MATCH]` (F-10, Tinggi) — bug pre-existing yang HARUS dipertahankan:** user internal biasa tanpa grup "Contact Creation" GAGAL SILENT saat menyimpan preferensi ke DB (fallback localStorage tetap jalan, tidak ada notifikasi UI). Ini prioritas tertinggi untuk tidak "diperbaiki tanpa sadar" saat migrasi — behavior JS yang menangkap `AccessError` di `try/catch` lalu cuma `console.error` harus tetap identik di 18.0.
2. **[BSL-010] `[MATCH]` (F-11, Sedang):** `fields.Json(default={})` tidak pernah menghasilkan `{}` — selalu `False` sampai first-write. Perilaku field Odoo core (bukan bug modul), harus tetap sama di 18.0 (field `Json` core 18.0 diasumsikan berperilaku sama — perlu dikonfirmasi ulang di step 2 diff analysis kalau ada perubahan behavior `fields.Json` 17→18).
3. **[BSL-005] `[MATCH]` (BR-05, F-02) — risiko migrasi TERBESAR:** modul override TOTAL 2 method core `ListRenderer.prototype` (`getOptionalActiveFields`, `saveOptionalActiveFields`) tanpa `super()` — salinan lengkap logic core 17.0. Kalau signature/logic method ini berubah di 18.0 (sangat mungkin, `web` addon sering direfactor tiap major version), migrasi WAJIB menyesuaikan salinan ini secara eksplisit di step 3 — ini bukan `[GAP]` di spec, tapi `[GAP]` yang HARUS dicari sendiri di step 2 diff analysis terhadap `native-target` (odoo18).
4. Semua klaim lain low-risk, straightforward port.

---

## 1. Tujuan Modul

Odoo core menyimpan status kolom "optional" (kolom yang bisa di-toggle show/hide lewat menu "⚙" di list view) HANYA di `browser.localStorage`, per-browser, dengan key berbasis `keyOptionalFields`. Konsekuensinya: preferensi kolom opsional yang dipilih user hilang kalau user pindah browser/device, mode incognito, atau localStorage dibersihkan.

`optional_field_save` menambah lapisan persistensi SERVER-SIDE di atas mekanisme itu: preferensi kolom opsional per-list-view disimpan juga ke field `res.partner.optional_field_save` (tipe `Json`), sehingga bisa dipulihkan lintas browser/device untuk user yang sama (diidentifikasi lewat `session.partner_id`). Modul ini murni background-enhancer — tidak ada UI/menu/wizard tersendiri (lihat [BSL-008]).

## 2. Model & Tanggung Jawab

| Model | Tanggung Jawab |
|---|---|
| `res.partner` (`_inherit`) | Menyimpan satu field tambahan `optional_field_save` (Json) — dict preferensi kolom optional per resModel, keyed per user via relasi 1 partner = 1 login user (`session.partner_id`) |

## 3. Field dengan Makna Bisnis

### res.partner
- **Field baru:** `optional_field_save` — `fields.Json(string="Optional Field Save", default={})`. TIDAK ada UI form/tree yang menampilkan field ini (murni dibaca/ditulis via JS `orm.call`, tidak pernah lewat view).
- **Struktur value:** dict, key = `"optional_field.<resModel>"` (prefix `"optional_field."` + model teknis, mis. `res.partner`), value = string daftar nama field optional yang aktif, dipisah koma (mis. `{"optional_field.res.partner": "email,phone"}`).

## 4. Business Workflow / State Transition

### Load & Restore Preferensi
- `[BSL-001]` `[MATCH]` (ref: BR-02, AC-02-02) Saat webclient mount (patch `WebClient.prototype.setup()` di `webclient.js`), `getOptionalActiveFields()` dipanggil fire-and-forget (tidak di-`await`) — SEKALI per page-load penuh, bukan per navigasi SPA.
- `[BSL-002]` `[MATCH]` (ref: BR-02) `getOptionalActiveFields()` (webclient.js): `orm.call("res.partner", "search_read", ...)` untuk partner user login (`session.partner_id`), ambil `optional_field_save`. Tiap key JSON ditulis ke `sessionStorage.setItem(key, value)`.
- `[BSL-003]` `[MATCH]` (ref: BR-03, AC-02-02) `ListRenderer` (list_renderer.js) baca preferensi SAAT RENDER: `sessionStorage.getItem("optional_field.<resModel>")` dulu, fallback ke `browser.localStorage.getItem(keyOptionalFields)` (perilaku asli Odoo core) kalau sessionStorage kosong.

### Toggle & Simpan Preferensi
- `[BSL-004]` `[MATCH]` (ref: BR-04, AC-02-01) Saat user toggle checkbox kolom optional di dropdown "⚙" list view, `saveOptionalActiveFields()` (dipatch) dipanggil core, menulis ke DUA tempat: (a) `browser.localStorage` (perilaku asli, tetap dipertahankan untuk kompatibilitas bagian core lain), (b) `setDatabase(...)` — persist ke `res.partner.optional_field_save` DAN `sessionStorage`.
- `[BSL-005]` `[MATCH]` (ref: BR-05, AC-03-01, F-02) **[RISIKO MIGRASI TERBESAR]** Patch `getOptionalActiveFields()`/`saveOptionalActiveFields()` adalah override TOTAL (bukan extend) — salinan LENGKAP logic core `odoo:17.0` (`web/static/src/views/list/list_renderer.js` baris 1093-1111 & 1817-1823 versi 17.0), ditambah lapisan sessionStorage/DB. TIDAK PERNAH memanggil `super()`. Konsekuensi: kalau core 18.0 mengubah isi/signature kedua method ini, modul tidak otomatis ikut — WAJIB dicek diff eksplisit di step 2 terhadap `native-target` (odoo18) sebelum implementasi step 6.
- `[BSL-006]` `[MATCH]` (ref: BR-04) `setDatabase(value1, value2)`: `search_read` ULANG partner (round-trip baru ke server tiap toggle, tidak reuse hasil `webclient.js`) untuk dapat `old_value` JSON existing, gabungkan key baru ke dict lama, `orm.call("res.partner", "write", ...)` untuk persist, lalu sinkronkan `sessionStorage` untuk key itu.

### Cleanup saat Logout
- `[BSL-007]` `[MATCH]` (ref: BR-07, AC-04-01) Custom logout menu item (`user_menu_items.js`, registry `user_menuitems` key `"log_out"`) menghapus SEMUA key `sessionStorage` yang mengandung substring `"optional_field"` SEBELUM redirect ke `/web/session/logout` — mencegah sessionStorage user A bocor terbaca user B di tab/browser yang sama. `localStorage` TIDAK dibersihkan (scope cleanup sengaja terbatas ke sessionStorage, bukan bug).

### Entry Point
- `[BSL-008]` `[GAP]` (ref: BR-08, AC-05-01, F-03) **Spec lama (`01A_FUNCTIONAL_SPEC.md`):** `application: True`, diklaim untuk visibilitas listing Apps Store (`price: 10 USD`). **Kode aktual (dikonfirmasi `git log -p` pada `backfill/17.0`, 2026-08-24):** `application: False`, dan key `price`/`currency` sudah tidak ada sama sekali — keduanya diubah bersamaan di commit `bbf6a87` ("remove price", 2024-08-12), **SEBELUM** sesi backfill menulis `01A_FUNCTIONAL_SPEC.md` (commit `97e652e`, jauh setelahnya). Spec lama salah baca state manifest saat ditulis — bukan perubahan yang terjadi setelahnya. **Konsekuensi:** modul TIDAK muncul sebagai "Application" terinstal di Apps grid (beda dari klaim spec lama), murni modul teknis biasa — tidak ada perubahan behavior fungsional lain. `target-codebase` (checkout dari `backfill/17.0`) sudah otomatis `application: False`, TIDAK perlu diubah apapun saat migrasi (kode menang, port apa adanya).

## 5. Server-Side Logic dengan Side Effect

### res.partner
- `[BSL-009]` `[MATCH]` (ref: BR-01, AC-02-03/AC-02-04, F-11, `[DIKONFIRMASI]` via eksekusi test) **create:** `default={}` di field definition TIDAK PERNAH menghasilkan `{}` tersimpan — `{}` adalah nilai falsy Python, ORM menyimpannya sebagai `NULL` di DB, dibaca balik jadi `False`. SEMUA partner (baru maupun lama) identik `False` sampai pertama kali ditulis dict non-kosong — tidak ada beda "partner baru vs lama". Dikonfirmasi test `test_new_partner_default_is_falsy_not_empty_dict`. JS sudah menangani `False` dengan benar di semua jalur (`Object.keys(false)` → `[]`, tidak crash) — TIDAK ADA dampak fungsional negatif, murni kosmetik-menyesatkan di kode.
- `[BSL-010]` `[MATCH]` (ref: BR-09/AC-06-01, F-10, `[DIKONFIRMASI]` via eksekusi test) **write (via JS `orm.call`, bukan method Python):** `orm.call("res.partner", "write", ...)` memakai hak akses user LOGIN APA ADANYA — tidak ada `sudo()` di manapun (tidak ada method Python custom sama sekali, semua langsung dari JS). User `base.group_user` biasa TANPA `base.group_partner_manager` ("Contact Creation") HANYA `perm_read` pada `res.partner` (ACL core Odoo, bukan modul ini) — `write` di `setDatabase()` melempar `AccessError`, ditangkap `try/catch` yang HANYA `console.error(...)`, TIDAK ADA notifikasi UI. **Konsekuensi:** fitur inti (persist lintas browser) GAGAL TOTAL SECARA SILENT untuk populasi user yang tidak punya grup ini (umum di instalasi Odoo nyata — banyak role operasional/gudang/akunting-only). localStorage fallback tetap jalan sehingga tidak ada gejala terlihat di browser yang sama. Dikonfirmasi test `test_plain_internal_user_cannot_write_own_partner_field` (vs `test_user_with_partner_manager_group_can_write` sebagai pembanding). **WAJIB dipertahankan apa adanya di 18.0** kecuali user eksplisit minta diperbaiki (lihat "Ringkasan untuk Review" `01a_MIGRATION_INTAKE.md` poin 4).

## 6. Client-Side Behavior (Views, JS, Owl)

### Backend
- `static/src/js/webclient.js` — patch `WebClient.prototype.setup()`. Tidak ada komponen Owl baru, tidak ada template `.xml` custom.
- `static/src/js/list_renderer.js` — patch `ListRenderer.prototype` (2 method, lihat [BSL-005]). Tidak ada komponen Owl baru.
- `static/src/js/user_menu_items.js` — replace total registry item `user_menuitems` key `"log_out"`. Import `OriginalLogOutItem` dari core tapi TIDAK PERNAH dipanggil (struktur ditulis ulang manual) — risiko drift rendah (F-06), bukan blocker migrasi tapi dicatat.
- Semua 3 file terdaftar di `assets.web.assets_backend` — tidak ada asset publik/frontend.
- Tidak ada RPC/route custom (`controllers/controllers.py` dead/kosong total, lihat F-04).

### Public/Frontend
- Tidak ada — modul murni backend-only.

## 7. Dependency Eksternal

### Eksplisit (manifest)
- `depends: ['base', 'web']` — murni Native Community, tidak ada Enterprise/OCA (dikonfirmasi dev di intake §0).

### Implisit/Inferred
- Tidak ada modul lain yang dipakai tapi tidak dideklarasikan.
- Tidak ada library pihak ketiga (CDN, dst).
- Bergantung pada struktur internal `ListRenderer`/`WebClient`/registry `user_menuitems` milik addon `web` — ini BUKAN public API resmi Odoo, jadi rawan berubah antar versi (ini sebabnya [BSL-005] jadi risiko migrasi terbesar).

## 8. Quirk / Behavior Non-Obvious

- `[BSL-011]` `[MATCH]` (ref: F-01) `security/ir.model.access.csv` ada di modul TAPI **tidak pernah di-load Odoo** — `__manifest__.py` tidak punya key `data` sama sekali. Isi filenya sendiri juga cacat (mengacu model `optional_field_save.optional_field_save` yang tidak pernah didefinisikan). Dead artifact murni, TIDAK memblokir instalasi (dikonfirmasi empiris — instalasi modul sukses). Di luar scope migrasi port-kode untuk dibersihkan (keputusan independen pemilik modul, lihat `01a_MIGRATION_INTAKE.md` §5).
- `[BSL-012]` `[MATCH]` (ref: F-04) `controllers/controllers.py` kosong total (cuma komentar) — folder tetap ada, di-import dari `__init__.py`, tidak ada dampak fungsional.
- `[BSL-013]` `[MATCH]` (ref: F-05) `googleaeed8a7b9ec156e7.html` (Google site-verification) ikut ter-bundle di root folder addon — file statis, tidak disentuh manifest/assets manapun, kemungkinan tercopy tidak sengaja. Tidak berdampak fungsional Odoo, tapi perlu diputuskan saat migrasi apakah ikut dibawa ke `target-codebase` (default: dibawa apa adanya, port-kode murni tidak menghapus file, kecuali user minta dibersihkan).

---

## Cara Pakai

ID `BSL-001` s/d `BSL-013` sudah dipakai di dokumen ini — lanjutkan penomoran dari `BSL-014` kalau step manapun (2, 3, 8, 9) menemukan klaim behavior baru yang belum tercatat di sini.
