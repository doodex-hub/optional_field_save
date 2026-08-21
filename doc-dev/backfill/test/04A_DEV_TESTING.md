# Dev Testing (Backfill) — optional_field_save

**Ref:** `03B_TEST_PLAN.md`
**Environment eksekusi:** Claude Code CLI, Mode C (AI jalankan langsung via `docker compose`,
lihat `doc-dev-backfill/ai-doc/PLAYBOOK.md` §"Mode C secara konkret")
**Tanggal eksekusi:** 2026-08-07

---

## 1. Setup

- `docker-env/docker-compose.yml` diinstantiate dari
  `doc-dev-backfill/templates/docker-compose.yml.template`, disederhanakan (tanpa Mailpit/GreenMail
  — modul tidak menyentuh email, lihat §3 `01A_FUNCTIONAL_SPEC.md`). `name:
  optional_field_save_backfill` — namespace Compose sendiri (hindari tabrakan lintas modul, lesson
  `user_roles`).
- Image `odoo:17.0` resmi dipakai apa adanya (`image:`, bukan `build:`) — semua dependency
  (`base`, `web`) Core standar, tidak perlu Dockerfile custom (tidak butuh Mode E/Chrome headless
  untuk test yang ditulis sesi ini, lihat §5 di bawah untuk alasan cakupan).
- `tests/__init__.py` + `tests/test_optional_field_save.py` ditulis BARU (modul belum punya
  `tests/` sama sekali sebelumnya, lihat F-08).
- Command: `odoo -d optional_field_save_test -i optional_field_save --test-enable
  --test-tags=/optional_field_save --stop-after-init --logfile=/var/log/odoo/odoo.log`

## 2. Hasil Run #1 (test AWAL, sebelum dikoreksi)

**Hasil:** `1 failed, 1 error(s) of 4 tests when loading database 'optional_field_save_test'`

- Instalasi modul SUKSES (12 modul loaded, tidak ada Traceback sebelum `Modules loaded.`) —
  langsung membuktikan AC-01-01 (F-01): `security/ir.model.access.csv` yang cacat TIDAK
  menghalangi instalasi (karena memang tidak pernah di-load, `__manifest__.py` tidak punya key
  `data`).
- `test_new_partner_default_is_empty_dict` **FAILED**: `AssertionError: False != {}`. Asumsi awal
  test (dan spec) SALAH — lihat F-11.
- `test_non_admin_user_can_write_field_via_base_acl` **ERROR**: `AccessError: You are not allowed
  to modify 'Contact' (res.partner) records ... allowed for ... Extra Rights/Contact Creation`.
  Asumsi awal test (dan spec) SALAH — lihat F-10.
- 2 test lain (`test_pre_existing_partner_is_falsy_not_empty_dict`,
  `test_write_and_read_roundtrip_matches_js_pattern`) PASS.

**Tindak lanjut:** dua test yang gagal BUKAN bug di test runner/environment — keduanya
mengungkap kesalahan ASUMSI di `01A_FUNCTIONAL_SPEC.md`/`01B_ACCEPTANCE_CRITERIA.md` yang ditulis
sebelum eksekusi nyata (murni `[HASIL-BACA]` waktu itu). Spec/AC/FINDINGS.md diperbarui (F-10, F-11
ditambahkan, BR-01/AC-02-03 direvisi) SESUAI hasil nyata, test ditulis ulang supaya
assertion-nya sesuai perilaku SEBENARNYA (`assertFalse`/`assertRaises` alih-alih asumsi yang
terbukti salah) — bukan "dipaksa lulus" dengan mengubah harapan tanpa mencatat kenapa.

## 3. Hasil Run #2 (setelah test dikoreksi sesuai temuan nyata)

**Hasil:** `0 failed, 0 error(s) of 4 tests when loading database 'optional_field_save_test'`

Database di-reset penuh (`docker compose down -v`) sebelum run #2 supaya instalasi bersih dari nol,
bukan reuse state run #1.

| Test | Hasil | Membuktikan |
|---|---|---|
| `test_new_partner_default_is_falsy_not_empty_dict` | PASS | F-11 — `{}` falsy tidak pernah persisten, semua partner `False` sampai first-write |
| `test_write_and_read_roundtrip_matches_js_pattern` | PASS | AC-02-01 — round-trip dict non-kosong bekerja normal |
| `test_plain_internal_user_cannot_write_own_partner_field` | PASS (`assertRaises`) | F-10 — `base.group_user` biasa TIDAK BISA write `res.partner` sendiri |
| `test_user_with_partner_manager_group_can_write` | PASS | Batas atas F-10 — user DENGAN `group_partner_manager` bisa write normal |

Log lengkap run #2 (baris hasil final):
```
2026-08-07 07:00:29,897 1 INFO optional_field_save_test odoo.tests.result: 0 failed, 0 error(s) of 4 tests when loading database 'optional_field_save_test'
2026-08-07 07:00:29,899 1 INFO optional_field_save_test odoo.service.server: Initiating shutdown
```

## 4. Cek Silang Odoo Core (statis, `docker run` sekali-pakai)

- **F-02** (tabrakan method `ListRenderer.getOptionalActiveFields`/`saveOptionalActiveFields`):
  dikonfirmasi dengan membaca LANGSUNG source `odoo:17.0`
  (`/usr/lib/python3/dist-packages/odoo/addons/web/static/src/views/list/list_renderer.js` baris
  1093-1111 dan 1817-1823) — logic modul ini IDENTIK persis dengan core, hanya ditambah lapisan
  sessionStorage/DB, TANPA memanggil `super()`.
- **F-10** (ACL `res.partner`): dikonfirmasi dengan membaca LANGSUNG
  `base/security/ir.model.access.csv` di image yang sama — baris `access_res_partner_group_user`
  membuktikan `perm_write=0` untuk `group_user`, `access_res_partner_group_partner_manager`
  membuktikan hanya grup itu yang dapat full akses.

## 5. Cakupan yang TIDAK Dites (keterbatasan sesi ini, dicatat eksplisit — lihat `03B_TEST_PLAN.md`)

**T-06 (Tour headless, Mode E) TIDAK dieksekusi sesi ini.** Keputusan cakupan: empat test
`TransactionCase` di atas SUDAH membuktikan seluruh lapisan Python/ORM (termasuk DUA finding
paling berdampak, F-10 dan F-11, yang JUSTRU baru ketahuan lewat eksekusi ini, bukan Tour). Yang
TIDAK tercover test otomatis manapun di sesi ini:
- Apakah `list_renderer.js` benar-benar terpanggil dengan trigger UI yang tepat saat user toggle
  kolom optional sungguhan di browser (JS patch-nya SENDIRI sudah diverifikasi identik source
  lewat pembacaan statis di §4, tapi belum ada bukti EKSEKUSI JS live).
- Perilaku `webclient.js` (load awal DB → sessionStorage) saat webclient benar-benar mount di
  browser.
- Cleanup `sessionStorage` saat klik "Log out" (`user_menu_items.js`).

**Alasan tidak dilanjutkan ke Mode E dalam sesi ini:** dua finding Tinggi/Sedang (F-10, F-11) yang
ditemukan lewat test ORM murni sudah menjawab pertanyaan paling berdampak ("apakah fitur ini
BEKERJA untuk populasi user yang realistis?" — jawabannya TIDAK untuk user tanpa Contact Creation).
Menambah Tour headless (build image Chrome, tulis skenario, debug selector — proses yang di modul
lain `purchase_product_optional` makan beberapa iterasi debug signifikan) akan menambah waktu
signifikan untuk cakupan tambahan yang levelnya lebih rendah (membuktikan "JS terpanggil dengan
benar" untuk logic yang sudah dibaca identik dengan core secara statis). Dicatat di sini sebagai
GAP TERBUKA, BUKAN diklaim "sudah dites penuh" — kalau pemilik modul ingin cakupan Tour
ditambahkan, itu bisa jadi sesi BACKFILL lanjutan yang fokus ke situ.

## Gate Step 04

**✔️ LULUS** — hasil test REAL (`docker compose`, Mode C), bukan desk-review: `0 failed, 0
error(s) of 4 tests`, instalasi modul terbukti sukses, DUA finding berdampak signifikan (F-10
Tinggi, F-11 Sedang) ditemukan lewat eksekusi nyata dan sudah dikonsolidasikan ke `FINDINGS.md`.
Gap Tour/Mode E dicatat eksplisit di §5, bukan disembunyikan.
