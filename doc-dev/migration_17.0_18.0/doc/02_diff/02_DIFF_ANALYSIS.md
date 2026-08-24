# Diff & Compatibility Analysis — optional_field_save

**Step:** 2 — Diff & Compatibility Analysis
**Versi:** 17.0 → 18.0
**Tanggal:** 2026-08-24
**Ref:** `01_intake/01a_MIGRATION_INTAKE.md`, `migration-tool/knowledge/`

---

## 0. Knowledge Base Check

| Sumber | Sudah ada entry? | Lokasi |
|---|---|---|
| `version-diffs/17-to-18.md` | Ya | Dicek §1/§1b/§1c — tidak ada entry spesifik soal `ListRenderer.getOptionalActiveFields`/`WebClient`/`user_menuitems` (modul ini yang pertama menyentuh area ini secara mendalam) |
| `dependency-compat/web/...` | Tidak ada | Belum ada entry `web` addon spesifik untuk area list renderer/webclient — temuan baru project ini dicatat ke `migration-records/` (lihat §3) |

Item relevan dari `version-diffs/17-to-18.md` yang dicek dan **TIDAK berlaku** untuk modul ini (dicek eksplisit supaya tidak terlewat, bukan diasumsikan N/A): `<tree>`→`<list>` (modul tidak punya `views/`), `user_has_groups` (tidak dipakai), `_name_search`/`_check_recursion` (tidak di-override), `create()`/`copy_data` multi-record (tidak ada override), `group_operator`→`aggregator` (tidak ada field aggregate), `odoo.define` legacy loader (modul sudah pakai `@odoo-module` + `require()`, bukan `odoo.define`).

## 0b. Gate Community vs Enterprise

- [x] Dicek `01a_MIGRATION_INTAKE.md` §2 — TIDAK ADA baris "Native Enterprise" (`depends: ['base', 'web']` murni Community, dikonfirmasi dev di intake).
- [x] `native-target-enterprise` **tidak diperlukan** untuk project ini — lanjut §1 cukup dengan `native-target` (`D:\Kuncoro\doodex\repo\odoo18`, branch `18.0`) dan `native-source` (`D:\Kuncoro\doodex\repo\odoo17`, branch `17.0`).

## 0c. Gate Transitive Dependency

- [x] Tidak ada dependency yang dihapus dari `depends` (`base`+`web` keduanya tetap ada penuh di 18.0, tidak ada yang di-rename/dihapus) — gate ini **N/A**, tidak ada transitive dependency yang perlu dicek.

---

## Ringkasan untuk Review — Perlu Konfirmasi User

1. **[DIFF-01] RISIKO TERTINGGI, dikonfirmasi langsung dari source `native-target`:** core `ListRenderer.getOptionalActiveFields()` **DIHAPUS TOTAL** di 18.0 — diganti `computeOptionalActiveFields()` (pure function, return value, dipanggil tiap `onWillRender` via `Object.assign(this.optionalActiveFields, this.computeOptionalActiveFields())`), bukan lagi dipanggil sekali di `setup()`. Patch modul saat ini men-target method yang **sudah tidak ada** — kalau di-port apa adanya (nama method tidak diubah), patch jadi **dead code, tidak pernah terpanggil**, dan fitur inti (baca preferensi dari sessionStorage saat render) **diam-diam tidak berfungsi** di 18.0 (fallback ke localStorage bawaan Odoo tetap jalan, jadi tidak ada error — tapi persistensi lintas-browser gagal total secara silent, mirip pola F-10). **WAJIB direncanakan di `03_MIGRATION_SPEC.md`**: rewrite override supaya men-target `computeOptionalActiveFields()` dengan kontrak baru (return dict, bukan mutasi + callback).
2. **[DIFF-02] Temuan baru, BUKAN version-diff — kemungkinan bug pre-existing di 17.0 juga:** `webclient.js` patch memanggil `this.orm.call(...)` tapi **tidak pernah menginisialisasi `this.orm`** (tidak ada `useService("orm")` di patch ini, dan native `WebClient.setup()` di 17.0 MAUPUN 18.0 juga tidak pernah men-set `this.orm`). Kalau benar `this.orm` selalu `undefined`, `getOptionalActiveFields()` di `webclient.js` (load preferensi saat webclient mount, BSL-001/002) **melempar `TypeError` setiap page-load**, tertangkap browser sebagai unhandled promise rejection (fire-and-forget, tidak ada try/catch) — TIDAK PERNAH divalidasi lewat eksekusi browser nyata di backfill (`04A_DEV_TESTING.md` cuma test Python/ORM level, bukan Owl/JS). **Ini bukan diff 17→18** (kondisi sama-sama tidak ada `this.orm` di kedua versi native) — kemungkinan bug yang sudah ada sejak 17.0 produksi, cuma belum pernah ketahuan karena gagalnya silent (fallback localStorage `list_renderer.js` tetap membuat kolom "kelihatan" tersimpan). **WAJIB diverifikasi via eksekusi browser nyata di Step 9** sebelum diasumsikan sebagai bug beneran — kalau terkonfirmasi, ini masuk `FINDINGS.md` sebagai temuan BARU (bukan di-"perbaiki" diam-diam, sesuai source-of-truth rule — walau ini kasus unik karena BUG-nya sendiri yang belum pernah terverifikasi ada di source).
3. `saveOptionalActiveFields()` di core **stabil** (signature/logic sama persis, cuma kosmetik) — override modul untuk method ini bisa di-port dengan perubahan minimal.
4. `user_menuitems` registry API (`.add("log_out", ...)`) **stabil** — tidak ada perubahan yang mempengaruhi modul.
5. `createKeyOptionalFields()`→`createViewKey()` (rename) — **format string akhir `keyOptionalFields` TIDAK berubah** (`"optional_fields,<model>,list,<viewId>,...fields"` sama persis di kedua versi, cuma logic penggabungan prefix dipindah). Ekstraksi model via `.split(",")[1]` di modul tetap valid, tidak perlu diubah.
6. `patch()` API (`@web/core/utils/patch`) dan `useService` (`@web/core/utils/hooks`) — signature/path **tidak berubah**.
7. Gaya `require()` mentah (bukan `import`) di 2 file JS modul — **tetap didukung penuh** di 18.0 (mekanisme module loader `factory.fn(require)` identik di kedua versi, `import` cuma gula sintaksis yang di-transpile ke pola yang sama). **Tidak perlu diubah**, ini bukan compatibility issue.
8. `fields.Json.convert_to_record()` (`False if value is None else deepcopy(value)`) dan ACL `access_res_partner_group_user` (`perm_write=0` untuk `base.group_user`) — **byte-identik** 17.0↔18.0. F-09/F-10/F-11 dipastikan akan berperilaku sama persis di 18.0 tanpa perubahan kode.
9. **[DIFF-03] Informational, tidak perlu tindakan:** `logOutItem` native 18.0 menambah logic PWA-aware redirect (`env.services.pwa.isScopedApp`) yang tidak ada di 17.0. Modul TIDAK perlu mengadopsi ini (fitur baru 18.0, di luar scope port-kode) — override modul tetap konsisten dengan perilaku 17.0 aslinya.

---

## 1. Perubahan Native (Core/Enterprise)

| ID | File/simbol modul | Simbol native terkait | Status di target | Dampak | Sumber |
|---|---|---|---|---|---|
| DIFF-01 | `list_renderer.js` — override `getOptionalActiveFields()` | `ListRenderer.prototype.getOptionalActiveFields` (`web/static/src/views/list/list_renderer.js:1093`, 17.0) | **Dihapus** — diganti `computeOptionalActiveFields()` (18.0, line 954) dengan kontrak berbeda (pure/return-value, dipanggil per-render via `onWillRender`, bukan sekali di `setup()`) | **Tinggi** — override jadi dead code kalau nama method tidak disesuaikan; fitur load-dari-DB (BSL-003) gagal silent | `native-source` (odoo17) vs `native-target` (odoo18), baca langsung |
| DIFF-02 | `list_renderer.js` — override `saveOptionalActiveFields()` | `ListRenderer.prototype.saveOptionalActiveFields` (17.0 line 1817, 18.0 line 1640) | **Tidak berubah** (signature & body logic identik, hanya format indentasi) | Rendah — override bisa di-port nyaris 1:1 | `native-source` vs `native-target`, baca langsung |
| DIFF-03 | `list_renderer.js` — override `setup()` (bagian yang set `this.orm = useService("orm")`) | `ListRenderer.prototype.setup` (17.0 line 100-111, 18.0 line 89-141) | **Berubah signifikan** (18.0 tambah banyak hook baru: `useSortable`, `onWillRender` untuk optional fields, dll) — TAPI modul cuma menambah 2 baris (`this.session`, `this.orm`) lalu `super.setup()`, tidak bergantung pada detail internal `setup()` selain urutan pemanggilan `super()` yang tetap dipertahankan modul (beda dari `getOptionalActiveFields`/`saveOptionalActiveFields` yang override TOTAL tanpa `super()`) | Rendah — pola modul di `setup()` sudah benar (memanggil `super()`), aman di-port apa adanya | `native-target`, baca langsung |
| DIFF-04 | `list_renderer.js` — `this.props.onOptionalFieldsChanged` (dipanggil balik dari salinan `getOptionalActiveFields` versi 17.0) | `ListRenderer.props.onOptionalFieldsChanged` | **Dihapus total** dari props 18.0 (tidak ada di `ListRenderer.props` maupun dipanggil di manapun pada `computeOptionalActiveFields`/`onWillRender`) | Rendah — modul cuma mewarisi pola lama dari core, bukan logic sendiri; saat rewrite ke `computeOptionalActiveFields()`, baris ini tinggal dihapus mengikuti core baru | `native-target`, baca langsung |
| DIFF-05 | `webclient.js` — override `setup()` + `getOptionalActiveFields()` (custom method modul, BUKAN override core) | `WebClient.prototype.setup` (17.0 line 16-52, 18.0 line 23-63) | Core `setup()` berbeda (18.0 hapus `this.user = useService("user")`, ganti `router`/`useBus` jadi `routerBus`) — TAPI modul cuma menambah `this.session` + panggil `this.getOptionalActiveFields()` sendiri (nama method modul sendiri, bukan override core, tidak bentrok) setelah `super.setup()` | Rendah untuk kompatibilitas API — **tapi lihat DIFF-06** | `native-target`, baca langsung |
| DIFF-06 | `webclient.js` — `this.orm.call(...)` di method `getOptionalActiveFields()` milik modul sendiri | `WebClient` tidak pernah punya `this.orm` bawaan (dikonfirmasi: tidak ada `useService("orm")` di `webclient.js` native manapun, 17.0 maupun 18.0) | **Sama di kedua versi** (bukan version-diff) — kemungkinan bug pre-existing sejak 17.0 | **Tinggi (kalau terkonfirmasi)** — lihat "Ringkasan untuk Review" poin 2, WAJIB verifikasi eksekusi nyata Step 9 | `native-source` + `native-target`, baca langsung; **belum diverifikasi eksekusi** |
| DIFF-07 | `user_menu_items.js` — `registry.category("user_menuitems").remove("log_out").add("log_out", CustomLogOutItem)` | `registry.category("user_menuitems")` + `logOutItem` (17.0 line 107-119, 18.0 line 138-153) | API registry **tidak berubah**. Native `logOutItem` 18.0 **menambah** logic PWA (`env.services.pwa.isScopedApp` → redirect query param) yang tidak ada di 17.0 | Rendah/informational — modul tidak perlu mengadopsi fitur PWA baru (lihat "Ringkasan" poin 9) | `native-source` vs `native-target`, baca langsung |
| DIFF-08 | `list_renderer.js`/`webclient.js` — `const { X } = require("@web/...")` | Mekanisme module loader (`module_loader.js`, `factory.fn(require)`) | **Tidak berubah** — `require` tetap parameter valid yang di-inject loader di kedua versi (native code pakai `import` yang ditranspile ke pola sama, bukan API berbeda) | Tidak ada — tidak perlu diubah ke `import` | `module_loader.js` odoo17 vs odoo18, baca langsung |
| DIFF-09 | `res_partner.py` — `fields.Json(default={})` | `odoo.fields.Json` (`odoo/fields.py`) | **Byte-identik** — `convert_to_record()` sama persis (`False if value is None else deepcopy(value)`) | Tidak ada — F-11 akan berperilaku sama di 18.0 tanpa perubahan | `odoo18/odoo/fields.py:3448-3462`, baca langsung |
| DIFF-10 | ACL `res.partner` untuk `base.group_user` (relevan ke F-10) | `base/security/ir.model.access.csv` baris `access_res_partner_group_user` | **Byte-identik** — `perm_read=1, perm_write=0, perm_create=0, perm_unlink=0` sama persis | Tidak ada — F-10 akan berperilaku sama di 18.0 tanpa perubahan | `odoo18/odoo/addons/base/security/ir.model.access.csv:74`, baca langsung |

## 2. Kompatibilitas Dependency (OCA/Third-Party)

N/A — tidak ada dependency OCA/third-party (dikonfirmasi dev di intake §0, manifest cuma `base`+`web`).

## 3. Temuan Baru — Kandidat untuk Migration Records

- [ ] **[DIFF-01] General version-diff, kategori `version-diff`** → dicatat ke `migration-tool/migration-records/optional_field_save_17.0_18.0/SUMMARY.md`: "`ListRenderer.getOptionalActiveFields()` dihapus total di 18.0, diganti `computeOptionalActiveFields()` — perubahan arsitektur dari imperative (dipanggil sekali di setup, mutate+callback) jadi reactive (pure function, dipanggil tiap onWillRender, hasil di-merge via `Object.assign`). Berlaku untuk SEMUA modul yang patch method ini, bukan cuma `optional_field_save`."
- [ ] **[DIFF-06] Kandidat, kategori `dependency-compat/web`** → dicatat sebagai catatan (bukan version-diff, tapi pola umum): "Modul yang patch `WebClient.prototype` dan memanggil `this.orm`/service lain TANPA `useService()` eksplisit di patch itu sendiri berisiko `undefined` — `WebClient` native tidak menyediakan `this.orm` secara default di 17.0 maupun 18.0."
- [ ] **[DIFF-07] Informational, kategori `dependency-compat/web`** → dicatat: "`user_menuitems` `logOutItem` 18.0 menambah PWA-aware redirect (`env.services.pwa.isScopedApp`) — modul yang meng-override total tanpa delegasi ke `OriginalLogOutItem` (pola F-06 `crm_probability_from_stage`-style) akan otomatis kehilangan fitur ini, biasanya bukan masalah untuk migrasi port-kode murni."
- [ ] Promosi ke `knowledge/` HANYA lewat sesi curation terpisah — tidak dilakukan di step ini.

## 4. Ringkasan Risiko

| Item | Level risiko | Catatan |
|---|---|---|
| DIFF-01 — `getOptionalActiveFields()` dihapus, ganti `computeOptionalActiveFields()` | **Tinggi** | Wajib rewrite di Step 3/6, bukan port langsung |
| DIFF-06 — `this.orm` mungkin `undefined` di `webclient.js` | **Tinggi (kondisional)** | Perlu verifikasi eksekusi Step 9 dulu sebelum tahu ini bug nyata atau bukan |
| DIFF-02, DIFF-03, DIFF-05, DIFF-08, DIFF-09, DIFF-10 | Rendah | Byte-identik atau perubahan yang tidak mempengaruhi pola pakai modul |
| DIFF-04, DIFF-07 | Rendah/Informational | Modul tidak perlu ikut mengadopsi perubahan/fitur baru core |
