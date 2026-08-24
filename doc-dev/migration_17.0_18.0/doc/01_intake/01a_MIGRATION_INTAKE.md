# Migration Intake — optional_field_save

**Step:** 1 — Intake & Scope
**Versi:** 17.0 → 18.0
**Tanggal:** 2026-08-24
**Status:** Draft — menunggu review user

---

## 0. Folder Referensi — Dikonfirmasi Dev

- [x] `native-target` (Community, checkout 18.0) — `D:\Kuncoro\doodex\repo\odoo18` (branch `18.0`, clone resmi `odoo/odoo`)
- [x] `native-source` (Community, checkout 17.0) — `D:\Kuncoro\doodex\repo\odoo17` (branch `17.0`, clone resmi `odoo/odoo`)
- [x] `native-target-enterprise` — **dikonfirmasi tidak dipakai.** `__manifest__.py` cuma `depends: ['base', 'web']`, dev mengonfirmasi tidak ada dependency Enterprise tersembunyi.
- [x] `third-party-source`/`third-party-target` — **dikonfirmasi tidak dipakai.** Tidak ada indikasi OCA/vendor apapun, dev mengonfirmasi.

### 0a. Konfirmasi Branch/Versi `source-codebase` & `target-codebase`

- [x] Folder `source-codebase` — `D:\Kuncoro\doodex\repo\optional-field-save-migration-18-source`, branch `backfill/17.0` (dikonfirmasi dev sebagai pilihan branch source — sudah berisi backfill lengkap: FUNCTIONAL_SPEC, ACCEPTANCE_CRITERIA, TEST_PLAN, DEV_TESTING, QA_TESTING, FINDINGS).
- [x] Folder `target-codebase` — `D:\Kuncoro\doodex\repo\optional-field-save-migration-18`, branch `migration/18.0` (baru dibuat dari `origin/backfill/17.0` via Mode Git, sesi ini — dev mengonfirmasi nama branch verbatim sebelum eksekusi).
- [x] Dikonfirmasi: dua clone fisik terpisah (bukan folder yang sama/symlink).
- [x] Versi Odoo semantik: **17.0 → 18.0** — dikonfirmasi dev (indikasi awal dari `__manifest__.py` `version: "17.0.1.0.0"` dan nama folder `-migration-18`, dikonfirmasi eksplisit oleh dev bukan cuma disimpulkan).

### 0b. Gate: Path Absolut di `.claude/settings.json`

- [x] `ABS_PATH_SOURCE_CODEBASE` = `D:/Kuncoro/doodex/repo/optional-field-save-migration-18-source`
- [x] `ABS_PATH_MIGRATION_TOOL` = `D:/Kuncoro/doodex/repo/migration-tool-project/migration-tool`
- [x] `ABS_PATH_NATIVE_TARGET_ENTERPRISE`/`ABS_PATH_NATIVE_SOURCE_ENTERPRISE`/`ABS_PATH_THIRD_PARTY_*` — baris deny dihapus (tidak dipakai, dikonfirmasi §0).
- **Catatan operasional:** Write langsung ke `.claude/settings.json` diblokir oleh Claude Code auto-mode classifier (perubahan permission-config dianggap sensitif). Isi lengkap yang seharusnya ditulis sudah diberikan ke dev di chat sesi ini untuk di-paste manual — **perlu dikonfirmasi dev sudah dilakukan** sebelum gate step 1 benar-benar ditutup.

---

## Ringkasan untuk Review — Perlu Konfirmasi User

1. **Source aktif dikembangkan selama migrasi? Belum dikonfirmasi eksplisit** — diasumsikan **Tidak** (dibekukan) karena tidak ada indikasi sebaliknya. Kalau ternyata source masih menerima perubahan, `SYNC_POLICY.md` wajib diaktifkan — tolong konfirmasi.
2. **Deadline & owner tiap step** — belum disebutkan, dianggap belum relevan/tidak urgent untuk saat ini. Sebutkan kalau ada target waktu.
3. **`.claude/settings.json` belum ter-update di disk** (lihat §0b) — tolong konfirmasi sudah paste konten yang diberikan di chat, supaya permission CLI (checkout/commit, edit `source-codebase` read-only guard) benar-benar aktif.
4. **Dua finding `[PERLU-KEPUTUSAN]` prioritas Tinggi/Sedang dari backfill HARUS dipertahankan apa adanya** (bukan diperbaiki) selama migrasi port-kode ini, kecuali user eksplisit minta sebaliknya:
   - **F-10 (Tinggi):** user internal biasa (tanpa grup "Contact Creation") gagal silent saat fitur ini mencoba menyimpan preferensi ke DB — fallback localStorage tetap jalan, tidak ada notifikasi. Ini bug pre-existing 17.0, TIDAK diperbaiki di migrasi ini kecuali diminta.
   - **F-11 (Sedang):** `default={}` di field `optional_field_save` tidak pernah menghasilkan `{}` — selalu `False` sampai first-write. Kosmetik, tidak ada dampak fungsional, dipertahankan apa adanya.
   - Detail lengkap semua 11 finding: `source-codebase/doc-dev/backfill/FINDINGS.md`.
5. **Branch `migration/18.0` di-set tracking ke `origin/backfill/17.0`** (efek samping `git checkout -b <target> origin/<source>`) — ini BUKAN remote yang benar untuk push nantinya. Dev perlu `git branch --unset-upstream` atau set tracking yang benar sebelum push pertama kali (di luar scope AI, Mode Git tidak pernah push).
6. Tidak ada ambiguitas lain yang genuinely butuh keputusan di level intake — modul ini kecil (1 field, 3 file JS, tanpa views/wizard/data).

---

## 1. Modul & Scope

- Modul yang dimigrasi: `optional_field_save` (single module, tidak ada dependency modul custom lain)
- Deskripsi singkat fungsi modul: menambah persistensi server-side (field `res.partner.optional_field_save`, tipe `Json`) di atas mekanisme "optional column" bawaan Odoo list view — preferensi kolom opsional per list-view yang biasanya cuma tersimpan di `browser.localStorage` (hilang kalau ganti browser/device) sekarang juga disimpan ke DB dan dipulihkan lintas browser untuk user yang sama.
- Apakah modul-modul ini saling depend satu sama lain: N/A (single module)

## 2. Dependency Map (auto-scan)

| Dependency | Tipe (Native Community / Native Enterprise / OCA / Custom) | Versi tersedia di target? | Catatan |
|---|---|---|---|
| `base` | Native Community | Ya (bawaan Odoo 18.0) | Standard |
| `web` | Native Community | Ya (bawaan Odoo 18.0) | **Krusial** — modul patch 3 file JS core dari addon ini (`list_renderer.js`, `webclient.js`, `user_menu_items.js` via `patch()`/registry override). Diff API `ListRenderer.getOptionalActiveFields`/`saveOptionalActiveFields` antara 17.0↔18.0 adalah risiko utama step 2. |

Dependency opsional yang dicek runtime (mis. `'hr.employee' in self.env`) — tidak selalu terlihat di manifest, perlu dicek manual:

- Tidak ditemukan — modul cuma sentuh `res.partner` (inherit) dan `session.partner_id` (bawaan semua user login), tidak ada `in self.env` conditional apapun di kode.

## 2b. Struktur & Fitur Modul (auto-scan)

| Fitur | Ada di modul? | Lokasi/bukti (kalau ada) | Fase step 6 yang jadi relevan |
|---|---|---|---|
| Controllers (route custom) | ☐ Tidak | `controllers/controllers.py` ada tapi kosong total (dead file, cuma komentar) — tidak ada route terdaftar | D1 → N/A |
| Assets/CSS/JS custom | ☑ Ya | `static/src/js/{list_renderer,webclient,user_menu_items}.js`, terdaftar di `assets.web.assets_backend` manifest | D2, E, F |
| Komponen Owl/JavaScript custom | ☑ Ya (patch, bukan komponen baru) | 3 file di atas — semua `patch()`/registry override ke core, tidak ada komponen Owl baru (tidak ada `.xml` template sendiri) | E, F (F kemungkinan besar N/A — tidak ada QWeb template custom) |
| Field JSON, relasi berantai (>2 level), atau dynamic model creation | ☑ Ya (field JSON) | `models/res_partner.py:7` — `fields.Json`, single level, tidak ada relasi berantai/dynamic model | B2 |
| View pakai `attrs=`/`states=`/`domain=`/`context=` dinamis | ☐ Tidak | Tidak ada folder `views/` sama sekali di modul ini | C2 → N/A |

**Kesimpulan Applicability Check awal (detail final di `06a_CODE_MIGRATION_PHASES.md` step 6):** fase C2 dan D1 kemungkinan besar N/A (tidak ada views, tidak ada controller aktif). Fase F (Template/QWeb) kemungkinan N/A (tidak ada `.xml` template custom milik modul ini). Fase E (JavaScript) dan B2 (field JSON) adalah fokus utama migrasi ini — konsisten dengan risiko diff `web` addon di §2.

## 3. Sifat Migrasi

- [x] Port kode saja (belum ada data produksi — instalasi baru di versi target)
- [ ] Upgrade instance (ada data produksi — step 7 Data Migration Scripts wajib jalan)

## 4. Baseline Spec / Characterization Test (gate)

- [x] Cek dulu: apakah modul punya `FUNCTIONAL_SPEC.md` lama di `source-codebase`? **Ya** — `source-codebase/doc-dev/backfill/spec/01A_FUNCTIONAL_SPEC.md` + `01B_ACCEPTANCE_CRITERIA.md`, ditulis retroaktif dari kode `backfill/17.0` (basis `origin/17.0`) DAN divalidasi lewat eksekusi test nyata (Step 04 backfill, Mode C — Docker). Bukan cuma baca kode statis, dua finding (F-10, F-11) bahkan ditemukan lewat eksekusi test, bukan dugaan.
  - Proses cross-check: dilakukan di `01b_BASELINE_SPEC.md` — semua klaim `01A_FUNCTIONAL_SPEC.md` di-cross-check ke kode aktual `target-codebase` (yang identik byte-per-byte dengan `source-codebase`, dikonfirmasi `diff -rq` kosong pasca-checkout `migration/18.0` dari `origin/backfill/17.0`). Tidak ditemukan penyimpangan — semua klaim `[MATCH]`.
- [x] `01b_BASELINE_SPEC.md` sudah diisi — lihat file terpisah di folder yang sama.

### 4a. Dokumen Pelengkap Lain

- [x] Ditanyakan eksplisit ke dev: **dikonfirmasi tidak ada** dokumen pelengkap lain (manual guide/PRD/spec vendor) di luar backfill docs — 2026-08-24.

## 4b. Source Masih Aktif Dikembangkan?

- [ ] Tidak — source module dibekukan selama migrasi berjalan (**asumsi default, belum dikonfirmasi eksplisit — lihat "Ringkasan untuk Review" poin 1**)
- [ ] Ya — wajib ikuti `SYNC_POLICY.md`

## 5. Scope Boundary

- Yang harus tetap identik pasca migrasi: seluruh business rule BR-01 s/d BR-10 di `01A_FUNCTIONAL_SPEC.md` (persistensi DB+sessionStorage+localStorage, load-saat-mount, cleanup-saat-logout), TERMASUK bug/quirk F-10 (write gagal silent untuk user tanpa grup Contact Creation) dan F-11 (`default={}` selalu `False`) — lihat "Ringkasan untuk Review" poin 4.
- Yang sengaja diubah/di-drop selama migrasi: **tidak ada** perubahan business logic yang disengaja pada tahap intake ini. Perubahan yang WAJIB murni untuk kompatibilitas API 18.0 (kalau ada, misal signature `getOptionalActiveFields`/`saveOptionalActiveFields` berubah) akan didokumentasikan di `03_MIGRATION_SPEC.md` step 3, bukan dianggap scope creep.
- Housekeeping items dari `FINDINGS.md` backfill (F-01 dead `ir.model.access.csv`, F-04 dead controller, F-05 file Google verification nyasar, F-07 dead code import) — **di luar scope migrasi port-kode**, ini keputusan pemilik modul yang independen dari migrasi versi. Tidak disentuh kecuali user eksplisit minta.

## 6. Constraint

- Deadline: belum disebutkan — belum relevan/tidak urgent saat ini.
- Owner tiap step (Dev/QA/PM/FA): belum disebutkan.
