# Migration Intake — optional_field_save

**Step:** 1 — Intake & Scope
**Versi:** 18.0 → 19.0
**Tanggal:** 2026-08-26
**Status:** ✔️ Disetujui user (2026-08-26) — gate lulus

---

## 0. Folder Referensi — Dikonfirmasi Dev

- [x] `native-target`/`native-target-enterprise` (gabungan, Odoo 19.0 FINAL) — `D:\Kuncoro\doodex\repo\enterprise19.0` (Community core + addons Enterprise digabung di `odoo/addons/`, dikonfirmasi bukan git repo — hasil extract; sudah dipakai project `advanced_sales_analysis` 18→19 sebelumnya lewat tool ini).
- [x] `native-source` (Community, checkout 18.0) — `D:\Kuncoro\doodex\repo\odoo18` (clone resmi `odoo/odoo`, branch `18.0`).
- [x] `native-source-enterprise` (Enterprise 18.0) — `D:\Kuncoro\doodex\repo\enterprise18`. Dev mengonfirmasi kandidat ini benar dipakai; modul ini sendiri tidak depend ke Enterprise (dikonfirmasi ulang §2), folder ini dijaga tersedia untuk verifikasi Gate Community vs Enterprise di step 2.
- [x] `third-party-source`/`third-party-target` — **dikonfirmasi tidak dipakai**, sama seperti migrasi 17→18 (tidak ada indikasi OCA/vendor apapun di manifest maupun kode).

### 0a. Konfirmasi Branch/Versi `source-codebase` & `target-codebase`

- [x] `source-codebase` (dibaca via git dari repo yang sama, bukan clone terpisah yang di-connect) — branch `origin/migration/18.0`, diverifikasi langsung lewat `git log`/`git ls-tree` (Mode Git aktif, izin eksplisit di `.claude/settings.json`) — HEAD `f7e8926` "Step 11: UAT diisi atas instruksi eksplisit pemilik modul", migrasi 17→18 selesai penuh (11 step). Clone fisik yang sama juga ada di disk (`D:\Kuncoro\doodex\repo\optional-field-save-migration-18`, branch `migration/18.0`, dikonfirmasi identik via `git log` — dipakai sebagai referensi dokumentasi, bukan target Edit).
- [x] `target-codebase` — folder ini (`D:\Kuncoro\doodex\repo\optional-field-save-migration-19`), branch **`migration/19.0_target`** (baru dibuat dari `origin/migration/18.0` via Mode Git, sesi ini, 2026-08-26 — sesuai instruksi eksplisit dev "branch target migration/19.0_target, source copy dari migration/18.0").
- [x] Dikonfirmasi: `target-codebase` adalah clone fisik terpisah dari `optional-field-save-migration-18` (bukan folder yang sama/symlink) — dua direktori berbeda di disk, masing-masing clone `git` independen dari repo GitHub yang sama.
- [x] Versi Odoo semantik: **18.0 → 19.0** — sesuai instruksi eksplisit dev di prompt awal sesi ini ("Lakukan migrasi 18 ke 19"), konsisten dengan `__manifest__.py` (`version: "18.0.1.0.0"`) dan `MIGRATION_18_19_STATUS.md` di `migration-tool` (baris `optional_field_save` → folder target `optional-field-save-migration-19`).

### 0b. Gate: Path Absolut di `.claude/settings.json`

- [x] `ABS_PATH_MIGRATION_TOOL` = `D:/Kuncoro/doodex/repo/migration-tool-project/migration-tool` — terisi.
- [x] `ABS_PATH_SOURCE_CODEBASE` (deny-guard) = `D:/Kuncoro/doodex/repo/optional-field-save-migration-18` — terisi (clone fisik read-only, walau pembacaan utama sesi ini lewat `git show origin/migration/18.0:<path>` di repo ini sendiri).
- [x] `ABS_PATH_NATIVE_TARGET`/`ABS_PATH_NATIVE_TARGET_ENTERPRISE` = `D:/Kuncoro/doodex/repo/enterprise19.0` (folder gabungan, path sama untuk kedua peran).
- [x] `ABS_PATH_NATIVE_SOURCE` = `D:/Kuncoro/doodex/repo/odoo18`, `ABS_PATH_NATIVE_SOURCE_ENTERPRISE` = `D:/Kuncoro/doodex/repo/enterprise18` — keduanya terisi (dipakai untuk verifikasi step 2 walau modul tidak depend Enterprise).
- [x] Baris `ABS_PATH_THIRD_PARTY_*` — dihapus dari `settings.json` (tidak dipakai, dikonfirmasi §0).
- [x] `settings.json` ditulis langsung lewat tool Edit/Write sesi ini (bukan diserahkan ke dev untuk paste manual) — sudah aktif di disk, tidak perlu restart CLI.

---

## Ringkasan untuk Review — Perlu Konfirmasi User

1. **Source dikonfirmasi dibekukan** (Tidak aktif dikembangkan) selama migrasi 18→19 ini berjalan — dikonfirmasi dev 2026-08-26. `SYNC_POLICY.md` tidak diaktifkan.
2. **Tidak ada dokumen pelengkap lain** di luar repo ini — dikonfirmasi dev 2026-08-26.
3. **Deadline & owner tiap step** — belum disebutkan, dianggap belum relevan/tidak urgent untuk saat ini.
4. **Warisan bug pre-existing dari 17.0/18.0 HARUS dipertahankan apa adanya** selama migrasi port-kode 18→19 ini, kecuali user eksplisit minta sebaliknya:
   - **F-10/MF-03 (Tinggi):** user internal biasa (tanpa grup "Contact Creation") gagal silent saat menyimpan preferensi ke DB via `orm.call(..., "write", ...)` — `AccessError` ditangkap `try/catch`, cuma `console.error`, tidak ada notifikasi UI. Berasal dari ACL core Odoo (`base.group_user` tanpa `perm_write` di `res.partner`), bukan dari modul — dipastikan tetap identik di 18.0, WAJIB dicek ulang apakah masih identik di 19.0 (step 2).
   - **F-11/MF-04 (Sedang):** `fields.Json(default={})` tidak pernah menghasilkan `{}` — selalu `False` sampai first-write. Perilaku field Json core, kosmetik, dipertahankan.
   - Detail lengkap: `doc-dev/_archive/migration_17.0_18.0/doc/FINDINGS.md`.
5. **Dua perubahan disengaja dari migrasi 17→18 (MF-02, MF-05) SUDAH jadi bagian kode 18.0 saat ini** — bukan lagi keputusan terbuka, sudah "baked in" ke source of truth 18.0: `this.orm = useService("orm")` di `webclient.js` (MF-02, fix bug blank-page pre-existing), dan pemakaian `user.partnerId` (bukan `session.partner_id`, dihapus total dari session di 18.0) di `webclient.js`+`list_renderer.js` (MF-05). Migrasi 18→19 ini mem-port kode 18.0 APA ADANYA termasuk kedua fix ini — tidak perlu keputusan ulang.
6. **Risiko migrasi terbesar (warisan dari BSL-005 lama, MF-01):** modul override total `ListRenderer.prototype.computeOptionalActiveFields()` (bukan `getOptionalActiveFields()` lagi sejak 18.0) tanpa asumsi stabil — method inti web addon ini historically rawan berubah tiap major version (persis kejadian 17→18). Step 2 WAJIB cek ulang signature/kontrak method ini di `native-target` (`enterprise19.0`).
7. Tidak ada ambiguitas lain yang genuinely butuh keputusan di level intake — modul kecil (1 field, 3 file JS, tanpa views/wizard/data), scope sama seperti migrasi 17→18 sebelumnya.

---

## 1. Modul & Scope

- Modul yang dimigrasi: `optional_field_save` (single module, tidak ada dependency modul custom lain)
- Deskripsi singkat fungsi modul: menambah persistensi server-side (field `res.partner.optional_field_save`, tipe `Json`) di atas mekanisme "optional column" bawaan Odoo list view — preferensi kolom opsional per list-view yang biasanya cuma tersimpan di `browser.localStorage` (hilang kalau ganti browser/device) sekarang juga disimpan ke DB dan dipulihkan lintas browser untuk user yang sama (diidentifikasi via `user.partnerId`, service `@web/core/user` — bukan lagi `session.partner_id` sejak 18.0).
- Apakah modul-modul ini saling depend satu sama lain: N/A (single module)

## 2. Dependency Map (auto-scan)

| Dependency | Tipe (Native Community / Native Enterprise / OCA / Custom) | Versi tersedia di target? | Catatan |
|---|---|---|---|
| `base` | Native Community | Ya (bawaan Odoo 19.0) | Standard |
| `web` | Native Community | Ya (bawaan Odoo 19.0) | **Krusial** — modul patch 3 file JS core dari addon ini (`list_renderer.js`, `webclient.js`, `user_menu_items.js` via `patch()`/registry override). Diff API `ListRenderer.computeOptionalActiveFields`/`saveOptionalActiveFields`, service `@web/core/user`, antara 18.0↔19.0 adalah risiko utama step 2 — riwayat: kedua area ini SUDAH berubah breaking sekali di 17→18 (MF-01, MF-05). |

Dependency opsional yang dicek runtime (mis. `'hr.employee' in self.env`) — tidak selalu terlihat di manifest, perlu dicek manual:

- Tidak ditemukan — modul cuma sentuh `res.partner` (inherit), tidak ada `in self.env` conditional apapun di kode (dikonfirmasi ulang, sama seperti migrasi 17→18).

## 2b. Struktur & Fitur Modul (auto-scan)

| Fitur | Ada di modul? | Lokasi/bukti (kalau ada) | Fase step 6 yang jadi relevan |
|---|---|---|---|
| Controllers (route custom) | ☐ Tidak | `controllers/controllers.py` ada tapi kosong total (dead file, cuma komentar) — tidak ada route terdaftar | D1 → N/A |
| Assets/CSS/JS custom | ☑ Ya | `static/src/js/{list_renderer,webclient,user_menu_items}.js`, terdaftar di `assets.web.assets_backend` manifest; tour test di `assets.web.assets_tests` | D2, E, F |
| Komponen Owl/JavaScript custom | ☑ Ya (patch, bukan komponen baru) | 3 file di atas — semua `patch()`/registry override ke core, tidak ada komponen Owl baru (tidak ada `.xml` template sendiri) | E, F (F kemungkinan besar N/A — tidak ada QWeb template custom) |
| Field JSON, relasi berantai (>2 level), atau dynamic model creation | ☑ Ya (field JSON) | `models/res_partner.py:7` — `fields.Json`, single level, tidak ada relasi berantai/dynamic model | B2 |
| View pakai `attrs=`/`states=`/`domain=`/`context=` dinamis | ☐ Tidak | Tidak ada folder `views/` sama sekali di modul ini | C2 → N/A |

**Kesimpulan Applicability Check awal (detail final di `06a_CODE_MIGRATION_PHASES.md` step 6):** identik dengan migrasi 17→18 — fase C2 dan D1 kemungkinan besar N/A (tidak ada views, tidak ada controller aktif). Fase F (Template/QWeb) kemungkinan N/A (tidak ada `.xml` template custom milik modul ini). Fase E (JavaScript) dan B2 (field JSON) adalah fokus utama migrasi ini.

## 3. Sifat Migrasi

- [x] Port kode saja (belum ada data produksi — instalasi baru di versi target)
- [ ] Upgrade instance (ada data produksi — step 7 Data Migration Scripts wajib jalan)

## 4. Baseline Spec / Characterization Test (gate)

- [x] Cek dulu: apakah modul punya `FUNCTIONAL_SPEC.md` lama di `source-codebase`? **Ya** — `doc-dev/_archive/migration_17.0_18.0/doc/01_intake/01b_BASELINE_SPEC.md`, sudah mendokumentasikan behavior modul 18.0 (hasil migrasi 17→18, lulus 11 step penuh termasuk QA/UAT). Ditambah `doc-dev/backfill/spec/01A_FUNCTIONAL_SPEC.md` (basis asli 17.0).
  - Proses cross-check: dilakukan di `01b_BASELINE_SPEC.md` (dokumen ini) — semua klaim `01b_BASELINE_SPEC.md` migrasi 17→18 di-cross-check ke kode aktual `target-codebase` (branch `migration/19.0_target`, dibuat langsung dari `origin/migration/18.0` — byte-identik pada saat checkout, dikonfirmasi via `git log` HEAD sama `f7e8926`). Tidak ditemukan penyimpangan — semua klaim `[MATCH]`.
- [x] `01b_BASELINE_SPEC.md` sudah diisi — lihat file terpisah di folder yang sama.

### 4a. Dokumen Pelengkap Lain

- [x] Ditanyakan eksplisit ke dev: **dikonfirmasi tidak ada** dokumen pelengkap lain di luar repo ini — 2026-08-26.

## 4b. Source Masih Aktif Dikembangkan?

- [x] Tidak — source module dibekukan selama migrasi berjalan (dikonfirmasi eksplisit dev, 2026-08-26).
- [ ] Ya — wajib ikuti `SYNC_POLICY.md`

## 5. Scope Boundary

- Yang harus tetap identik pasca migrasi: seluruh business rule yang terdokumentasi di `01b_BASELINE_SPEC.md` (BSL-001 s/d BSL-013 dokumen ini) — persistensi DB+sessionStorage+localStorage, load-saat-mount, cleanup-saat-logout — TERMASUK bug/quirk warisan F-10/MF-03 (write gagal silent untuk user tanpa grup Contact Creation) dan F-11/MF-04 (`default={}` selalu `False`).
- Yang sengaja diubah/di-drop selama migrasi: belum ada per intake ini (straightforward port, sama seperti migrasi 17→18 sebelum ditemukan MF-01/02/05 di step 2/6/9). Perubahan wajib murni kompatibilitas API 19.0 (kalau ditemukan) didokumentasikan terpisah di `03_MIGRATION_SPEC.md` dan `FINDINGS.md`, bukan diputuskan di sini.
- Housekeeping items dari `FINDINGS.md` backfill (F-01 dead `ir.model.access.csv`, F-04 dead controller, F-05 file Google verification nyasar, F-07 dead code import) — **di luar scope migrasi port-kode**, tetap tidak disentuh kecuali user eksplisit minta.

## 6. Constraint

- Deadline: belum disebutkan — belum relevan/tidak urgent saat ini.
- Owner tiap step (Dev/QA/PM/FA): belum disebutkan.
