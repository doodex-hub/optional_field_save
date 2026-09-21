# Migration Intake — optional_field_save

**Step:** 1 — Intake & Scope
**Versi:** 19.0 → 20.0
**Tanggal:** 2026-09-21
**Status:** ✔️ Disetujui user (2026-09-21) — gate lulus

---

## 0. Folder Referensi — Dikonfirmasi Dev

- [x] `native-target` (Community 20.0) — `D:\Kuncoro\doodex\repo\odoo20` (clone resmi `odoo/odoo`, sudah di-connect sebagai working directory sesi ini, dikonfirmasi dev sebagai sibling repo yang sengaja disiapkan untuk migrasi ini).
- [x] `native-target-enterprise` (Enterprise 20.0) — `D:\Kuncoro\doodex\repo\enterprise20` — dikonfirmasi via `ls` folder TERPISAH dari `native-target` (bukan gabungan seperti `enterprise19.0` di migrasi 18→19 — isi `enterprise20` adalah daftar addon Enterprise polos, `odoo20` adalah repo Odoo penuh dengan `odoo/`, `setup.py`, dll). Dikonfirmasi dev sebagai sibling repo yang sama dengan `native-target` di atas.
- [x] `native-source`/`native-source-enterprise` (Community/Enterprise 19.0) — **dikonfirmasi dev TIDAK perlu di-connect terpisah** ("cukup source-codebase + baseline spec (Rekomendasi)", 2026-09-21). Referensi versi asal cukup lewat `source-codebase` (`git show`/`git diff` branch `origin/migration/19.0` di repo yang sama) + `doc-dev/migration_18.0_19.0/doc/01_intake/01b_BASELINE_SPEC.md`, konsisten dengan modul kecil yang sudah terverifikasi byte-identik 18→19 (lihat §0 `01b_BASELINE_SPEC.md`).
- [x] `third-party-source`/`third-party-target` — **dikonfirmasi tidak dipakai** (dev: "kamu cek sendiri", 2026-09-21). Verifikasi AI: `__manifest__.py` `depends: ['base', 'web']` saja, tidak ada import library eksternal apapun di `models/res_partner.py`, `controllers/controllers.py`, maupun 3 file JS (`webclient.js`, `list_renderer.js`, `user_menu_items.js`) — semua `require`/`import` merujuk modul core Odoo (`@web/core/...`, `@web/webclient/...`, `@web/session`, `@web/views/...`) atau `odoo.fields`/`odoo.models`. Tidak ada CDN/library pihak ketiga. Konsisten dengan riwayat dua migrasi sebelumnya.

### 0a. Konfirmasi Branch/Versi `source-codebase` & `target-codebase`

- [x] `source-codebase` (dibaca via git dari repo yang sama, bukan clone terpisah yang di-connect) — branch `origin/migration/19.0`, diverifikasi langsung lewat `git log`/`git diff` (Mode Git aktif). Migrasi 18→19 selesai penuh (11 step, termasuk UAT — lihat `doc-dev/migration_18.0_19.0/doc/`).
- [x] `target-codebase` — folder ini (`D:\Kuncoro\doodex\repo\optional-field-save-migration-20`), branch **`migration/20.0`** (dibuat dari `migration/19.0` lokal via Mode Git, sesi ini, 2026-09-21 — sesuai instruksi eksplisit dev "buat migration/20.0 saja sebagai target", bukan pola `migration/20.0_target` seperti migrasi sebelumnya).
- [x] Dikonfirmasi: `target-codebase` = repo yang SAMA dengan `source-codebase` (bukan clone fisik terpisah seperti pola 18→19 sebelumnya) — cukup branch berbeda di satu working directory. Pada saat branch dibuat, isi kerja identik dengan `migration/19.0` (belum ada perubahan kode).
- [x] Versi Odoo semantik: **19.0 → 20.0** — sesuai instruksi eksplisit dev di prompt awal sesi ini, konsisten dengan `__manifest__.py` modul (`version: "19.0.1.0.0"`).

### 0b. Gate: Path Absolut di `.claude/settings.json`

- [ ] **BELUM selesai** — `.claude/settings.json` di repo ini masih berisi placeholder (`{{ABS_PATH_MIGRATION_TOOL}}`, dst) dan path basi dari migrasi 18→19 (`enterprise18`, `enterprise19.0`, `odoo18`, `optional-field-save-migration-18`). Percobaan Edit oleh AI **ditolak classifier permission ("Self-Modification")** — file ini harus diupdate manual oleh dev. Isi yang seharusnya (siap paste):
  - `allow`: hapus baris `Edit(//{{ABS_PATH_MIGRATION_TOOL}}/migration-records/**)` (placeholder tidak terisi), cukup sisakan `Edit(//D:/Kuncoro/doodex/repo/migration-tool-project/migration-tool/migration-records/**)`.
  - `deny`: ganti 4 baris path lama dengan:
    - `Edit(//D:/Kuncoro/doodex/repo/migration-tool-project/migration-tool/knowledge/**)`
    - `Edit(//D:/Kuncoro/doodex/repo/migration-tool-project/migration-tool/templates/**)`
    - `Edit(//D:/Kuncoro/doodex/repo/odoo20/**)`
    - `Edit(//D:/Kuncoro/doodex/repo/enterprise20/**)`
  - Lihat "Langkah untuk Dev" di ringkasan chat sesi ini untuk instruksi PowerShell konkret.

---

## Ringkasan untuk Review — Dikonfirmasi User (2026-09-21)

1. **Sifat migrasi = port kode saja** (belum ada data produksi, instalasi baru di versi target) — dikonfirmasi dev. Step 7 (Data Migration Scripts) tetap N/A.
2. **Source dibekukan** (tidak aktif dikembangkan) selama migrasi 19→20 ini berjalan — dikonfirmasi dev. `SYNC_POLICY.md` tidak diaktifkan.
3. **`native-source`/`native-source-enterprise` (19.0) tidak perlu di-connect terpisah** — dikonfirmasi dev, cukup `source-codebase` + baseline spec (lihat §0).
4. **`third-party-source`/`third-party-target` dikonfirmasi tidak dipakai** — diverifikasi AI dari kode (lihat §0), disetujui dev.
5. **Kode modul dikonfirmasi BYTE-IDENTIK antara `migration/18.0` dan `migration/19.0`** kecuali: (a) version bump manifest `18.0.1.0.0`→`19.0.1.0.0`, (b) tour test `optional_field_save_tour.js` — kolom "Mobile" diganti "Street" (native view `res_partner_views.xml` 19.0 menghapus field `mobile` dari list view Contacts sepenuhnya, bukan cuma disembunyikan), (c) `tests/test_optional_field_save.py` — `groups_id`→`group_ids` (rename API Odoo 18→19 di `res.users`/`res.groups`). **Implikasi untuk 19→20:** baseline behavior modul (`01b_BASELINE_SPEC.md`) bisa diwarisi 1:1 dari dokumentasi 18→19 dengan confidence tinggi — perbedaan riil kemungkinan besar baru muncul di step 2 (diff API `web`/`base` 19.0→20.0), bukan di kode modul itu sendiri.
6. **Warisan bug pre-existing dari 17.0/18.0/19.0 HARUS dipertahankan apa adanya** selama migrasi port-kode 19→20 ini, kecuali user eksplisit minta sebaliknya:
   - **F-10/MF-03 (Tinggi):** user internal biasa (tanpa grup "Contact Creation") gagal silent saat menyimpan preferensi ke DB via `orm.call(..., "write", ...)` — `AccessError` ditangkap `try/catch`, cuma `console.error`, tidak ada notifikasi UI. Berasal dari ACL core Odoo (`base.group_user` tanpa `perm_write` di `res.partner`), bukan dari modul — dipastikan tetap identik 17.0→18.0→19.0, WAJIB dicek ulang apakah masih identik di 20.0 (step 2).
   - **F-11/MF-04 (Sedang):** `fields.Json(default={})` tidak pernah menghasilkan `{}` — selalu `False` sampai first-write. Perilaku field Json core, kosmetik, dipertahankan.
   - Detail lengkap: `doc-dev/_archive/migration_17.0_18.0/doc/FINDINGS.md`, `doc-dev/migration_18.0_19.0/doc/FINDINGS.md`.
7. **Risiko migrasi terbesar (historis, dua kali berturut-turut jadi titik breaking change):** modul override total `ListRenderer.prototype.computeOptionalActiveFields()`/`saveOptionalActiveFields()` dan pakai service `@web/core/user` (`user.partnerId`) — kedua API ini bukan API publik resmi Odoo, rawan berubah tiap major version. Sudah berubah breaking sekali (17→18: rename method total). Tetap stabil di 18→19 (byte-identik, dikonfirmasi §5). Step 2 WAJIB cek ulang signature/kontrak kedua API ini di `native-target` (`odoo20`) untuk 20.0.
8. Tidak ada ambiguitas lain yang genuinely butuh keputusan di level intake — modul kecil (1 field, 3 file JS, tanpa views/wizard/data), scope sama seperti dua migrasi sebelumnya.

---

## 1. Modul & Scope

- Modul yang dimigrasi: `optional_field_save` (single module, tidak ada dependency modul custom lain)
- Deskripsi singkat fungsi modul: menambah persistensi server-side (field `res.partner.optional_field_save`, tipe `Json`) di atas mekanisme "optional column" bawaan Odoo list view — preferensi kolom opsional per list-view yang biasanya cuma tersimpan di `browser.localStorage` (hilang kalau ganti browser/device) sekarang juga disimpan ke DB dan dipulihkan lintas browser untuk user yang sama (diidentifikasi via `user.partnerId`, service `@web/core/user`).
- Apakah modul-modul ini saling depend satu sama lain: N/A (single module)

## 2. Dependency Map (auto-scan)

| Dependency | Tipe (Native Community / Native Enterprise / OCA / Custom) | Versi tersedia di target? | Catatan |
|---|---|---|---|
| `base` | Native Community | Ya (bawaan Odoo 20.0) | Standard |
| `web` | Native Community | Ya (bawaan Odoo 20.0) | **Krusial** — modul patch 3 file JS core dari addon ini (`list_renderer.js`, `webclient.js`, `user_menu_items.js` via `patch()`/registry override). Diff API `ListRenderer.computeOptionalActiveFields`/`saveOptionalActiveFields`, service `@web/core/user`, antara 19.0↔20.0 adalah risiko utama step 2 — riwayat: area ini sudah berubah breaking sekali di 17→18 (MF-01/MF-05), stabil di 18→19. |

Dependency opsional yang dicek runtime (mis. `'hr.employee' in self.env`) — tidak selalu terlihat di manifest, perlu dicek manual:

- Tidak ditemukan — modul cuma sentuh `res.partner` (inherit), tidak ada `in self.env` conditional apapun di kode (dikonfirmasi ulang, sama seperti migrasi-migrasi sebelumnya).

## 2b. Struktur & Fitur Modul (auto-scan)

| Fitur | Ada di modul? | Lokasi/bukti (kalau ada) | Fase step 6 yang jadi relevan |
|---|---|---|---|
| Controllers (route custom) | ☐ Tidak | `controllers/controllers.py` ada tapi kosong total (dead file, cuma komentar) — tidak ada route terdaftar | D1 → N/A |
| Assets/CSS/JS custom | ☑ Ya | `static/src/js/{list_renderer,webclient,user_menu_items}.js`, terdaftar di `assets.web.assets_backend` manifest; tour test di `assets.web.assets_tests` | D2, E, F |
| Komponen Owl/JavaScript custom | ☑ Ya (patch, bukan komponen baru) | 3 file di atas — semua `patch()`/registry override ke core, tidak ada komponen Owl baru (tidak ada `.xml` template sendiri) | E, F (F kemungkinan besar N/A — tidak ada QWeb template custom) |
| Field JSON, relasi berantai (>2 level), atau dynamic model creation | ☑ Ya (field JSON) | `models/res_partner.py:7` — `fields.Json`, single level, tidak ada relasi berantai/dynamic model | B2 |
| View pakai `attrs=`/`states=`/`domain=`/`context=` dinamis | ☐ Tidak | Tidak ada folder `views/` sama sekali di modul ini | C2 → N/A |

**Kesimpulan Applicability Check awal (detail final di `06a_CODE_MIGRATION_PHASES.md` step 6):** identik dengan dua migrasi sebelumnya — fase C2 dan D1 kemungkinan besar N/A (tidak ada views, tidak ada controller aktif). Fase F (Template/QWeb) kemungkinan N/A (tidak ada `.xml` template custom milik modul ini). Fase E (JavaScript) dan B2 (field JSON) adalah fokus utama migrasi ini.

## 3. Sifat Migrasi

- [x] Port kode saja (belum ada data produksi — instalasi baru di versi target) — dikonfirmasi dev 2026-09-21
- [ ] Upgrade instance (ada data produksi — step 7 Data Migration Scripts wajib jalan)

## 4. Baseline Spec / Characterization Test (gate)

- [x] Cek dulu: apakah modul punya `FUNCTIONAL_SPEC.md` lama di `source-codebase`? **Ya** — `doc-dev/migration_18.0_19.0/doc/01_intake/01b_BASELINE_SPEC.md`, sudah mendokumentasikan behavior modul 19.0 (hasil migrasi 18→19, lulus 11 step penuh termasuk QA/UAT).
  - Proses cross-check: dilakukan di `01b_BASELINE_SPEC.md` (dokumen ini) — semua klaim `01b_BASELINE_SPEC.md` migrasi 18→19 di-cross-check ke kode aktual `target-codebase` (branch `migration/20.0`, dibuat dari `migration/19.0` lokal — identik pada saat checkout). Tidak ditemukan penyimpangan kode modul — semua klaim `[MATCH]` (lihat §5 di `01b_BASELINE_SPEC.md` untuk hasil `git diff` lengkap).
- [x] `01b_BASELINE_SPEC.md` sudah diisi — lihat file terpisah di folder yang sama.

### 4a. Dokumen Pelengkap Lain

- [x] Tidak ada dokumen pelengkap lain di luar repo ini — konsisten dua migrasi sebelumnya, tidak dibantah dev saat gate Step 1 (2026-09-21).

## 4b. Source Masih Aktif Dikembangkan?

- [x] Tidak — dikonfirmasi dev 2026-09-21.
- [ ] Ya — wajib ikuti `SYNC_POLICY.md`

## 5. Scope Boundary

- Yang harus tetap identik pasca migrasi: seluruh business rule yang terdokumentasi di `01b_BASELINE_SPEC.md` (BSL-001 s/d BSL-014 dokumen ini) — persistensi DB+sessionStorage+localStorage, load-saat-mount, cleanup-saat-logout — TERMASUK bug/quirk warisan F-10/MF-03 (write gagal silent untuk user tanpa grup Contact Creation) dan F-11/MF-04 (`default={}` selalu `False`).
- Yang sengaja diubah/di-drop selama migrasi: belum ada per intake ini (straightforward port sejauh yang terlihat di kode modul — kode modul byte-identik 18.0↔19.0, kemungkinan besar pola sama akan berulang 19.0→20.0, tapi TIDAK diasumsikan tanpa verifikasi step 2 terhadap `native-target` 20.0). Perubahan wajib murni kompatibilitas API 20.0 (kalau ditemukan) didokumentasikan terpisah di `03_MIGRATION_SPEC.md` dan `FINDINGS.md`, bukan diputuskan di sini.
- Housekeeping items dari `FINDINGS.md` backfill (F-01 dead `ir.model.access.csv`, F-04 dead controller, F-05 file Google verification nyasar, F-07 dead code import, ditambah dead import `useBus`/`useService` di `user_menu_items.js` — baru didokumentasikan sebagai BSL-014 di migrasi ini, sudah ada sejak 17.0/18.0/19.0 tanpa perubahan) — **di luar scope migrasi port-kode**, tetap tidak disentuh kecuali user eksplisit minta.

## 6. Constraint

- Deadline: belum disebutkan — belum relevan/tidak urgent saat ini.
- Owner tiap step (Dev/QA/PM/FA): belum disebutkan.
