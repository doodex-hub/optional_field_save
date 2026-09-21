# Migration Acceptance Criteria — optional_field_save

**Step:** 5 — Acceptance Criteria & Test Plan
**Ref:** `01_intake/01b_BASELINE_SPEC.md` dan kode 19.0 yang berjalan — **bukan** `03_spec/03_MIGRATION_SPEC.md`
**Tanggal:** 2026-09-21

> Format Given/When/Then, diturunkan dari `01b_BASELINE_SPEC.md`. `03_MIGRATION_SPEC.md` dipakai
> sebagai referensi area berisiko (DIFF-01/02/03), tapi kesetaraan diukur terhadap 19.0, bukan
> terhadap rencana migrasi.

---

## AC-01 — Load & Restore Preferensi Saat Mount

**AC-01-01** (verifies `BSL-001`)
Given webclient baru mount (page-load penuh, bukan navigasi SPA)
When `WebClient.prototype.setup()` (patch) dijalankan
Then `this.orm = useService("orm")` harus terinisialisasi SEBELUM `super.setup()`, dan `this.getOptionalActiveFields()` dipanggil fire-and-forget (tidak di-`await`) — identik dengan 19.0, TIDAK dipanggil ulang per navigasi SPA.

**AC-01-02** (verifies `BSL-002`)
Given user login dengan partner yang punya `optional_field_save` tersimpan di DB
When `getOptionalActiveFields()` jalan
Then `partnerId = user.partnerId` diambil, `orm.call("res.partner", "search_read", ...)` dipanggil, tiap key JSON hasil ditulis ke `sessionStorage`. Kalau `partnerId` undefined/tidak ketemu — gagal senyap (dapat objek kosong, TIDAK throw) — identik 19.0.

**AC-01-03** (verifies `BSL-003`)
Given list view di-render (`onWillRender`)
When `computeOptionalActiveFields()` (override) dipanggil
Then baca `sessionStorage.getItem("optional_field.<resModel>")` dulu; kalau ADA, return dict langsung dari situ (TIDAK memanggil `super()`, TIDAK memproses context `list_optional_show` — lihat catatan DIFF-01 di bawah); kalau TIDAK ADA, fallback ke `super.computeOptionalActiveFields()` (delegasi penuh ke core, termasuk logic `list_optional_show` versi 20.0 kalau berlaku).
**Catatan DIFF-01 (`03_MIGRATION_SPEC.md` §2b Risiko Integrasi #1):** kalau user PERNAH toggle kolom optional sebelumnya (sessionStorage terisi), fitur native BARU 20.0 "kolom optional ikut tersimpan per filter/favorite" (`list_optional_show`) TIDAK akan aktif untuk user modul ini — ini diterima sebagai batasan yang disengaja (port as-is), BUKAN kegagalan AC.

## AC-02 — Toggle & Simpan Preferensi

**AC-02-01** (verifies `BSL-004`)
Given user toggle checkbox kolom optional di dropdown "⚙" list view
When core memanggil `saveOptionalActiveFields()` (patch)
Then ditulis ke DUA tempat: `browser.localStorage` (perilaku asli core, tetap ada) DAN `setDatabase(...)` (persist ke `res.partner.optional_field_save` + `sessionStorage`).

**AC-02-02** (verifies `BSL-005`, `BSL-005b`)
Given override `computeOptionalActiveFields()`/`saveOptionalActiveFields()` mendelegasikan ke `super()`
When dijalankan di 20.0
Then kontrak method core (`ListRenderer.prototype.computeOptionalActiveFields`/`saveOptionalActiveFields`, service `@web/core/user` `user.partnerId`) harus tetap kompatibel — **dikonfirmasi TIDAK breaking di step 2 (DIFF-01, DIFF-05)**, jadi AC ini terverifikasi lewat review statis DAN wajib dikonfirmasi ulang lewat eksekusi nyata di step 9 (tour test).

**AC-02-03** (verifies `BSL-006`)
Given user toggle kolom (memicu `setDatabase(value1, value2)`)
When dijalankan
Then: ambil `partnerId = user.partnerId`, `search_read` ULANG partner (round-trip baru, tidak reuse hasil webclient.js) untuk `old_value` JSON existing, gabungkan key baru, `orm.call("res.partner", "write", ...)` untuk persist, sinkronkan `sessionStorage`. Dibungkus `try/catch` — kegagalan (`AccessError` atau lainnya) HANYA `console.error`, TIDAK ADA notifikasi UI — **lihat AC-05-02 di bawah untuk status AccessError ini di 20.0 (DIFF-03)**.

## AC-03 — Cleanup saat Logout

**AC-03-01** (verifies `BSL-007`)
Given user klik menu "Log out" (custom item registry `user_menuitems` key `log_out`)
When callback custom dijalankan
Then SEMUA key `sessionStorage` yang mengandung substring `"optional_field"` dihapus SEBELUM redirect ke `/web/session/logout`. `localStorage` TIDAK dibersihkan (scope sengaja terbatas). Import `session` dari `@web/session` tetap ada tapi tidak pernah dipakai (dead import, dipertahankan apa adanya).

**AC-03-02** (verifies `BSL-014`)
Given file `user_menu_items.js` di 20.0
When dibaca
Then import `useBus, useService` dari `@web/core/utils/hooks` tetap ada TAPI tidak pernah dipakai — dead import kedua, dipertahankan apa adanya (bukan dibersihkan).

**Prasyarat WAJIB untuk AC-03-01/AC-03-02 lolos sama sekali:** `import { logOutItem as OriginalLogOutItem } from "@web/webclient/user_menu/user_menu_items"` HARUS sudah dihapus dari kode 20.0 (fix DIFF-02, `03_MIGRATION_SPEC.md` §2) — kalau tidak, seluruh file (termasuk `CustomLogOutItem`) berisiko gagal load karena import resolve `undefined`, membuat AC-03-01/02 tidak bisa diuji sama sekali (bukan gagal fungsional, tapi gagal load).

## AC-04 — Entry Point / Instalasi

**AC-04-01** (verifies `BSL-008`)
Given modul terinstal di 20.0
When dicek Apps grid
Then modul TIDAK muncul sebagai "Application" (`application: False`, tidak ada key `price`/`currency`). `version` di manifest = `"20.0.1.0.0"` (bukan lagi `19.0.1.0.0` — version bump wajib, bukan perubahan behavior).

## AC-05 — Server-Side Logic dengan Side Effect

**AC-05-01** (verifies `BSL-009`)
Given partner baru dibuat (create, belum pernah ditulis field ini)
When `optional_field_save` dibaca
Then nilainya `False` (BUKAN `{}`) — `default={}` tidak pernah persisten karena `{}` falsy di Python, dikonfirmasi TIDAK berubah di 20.0 (DIFF-06, `odoo/orm/fields_misc.py` `class Json`). Bug kosmetik F-11/MF-04, dipertahankan apa adanya.

**AC-05-02** (verifies `BSL-010`) — **RESOLVED — self-write SEKARANG BERHASIL (lihat DIFF-03, MF-01 CLOSED, 2 putaran verifikasi)**
Given user `base.group_user` BIASA (tanpa `base.group_partner_manager`/"Contact Creation") mencoba `orm.call("res.partner", "write", ...)` ke partner MILIKNYA SENDIRI (via `setDatabase()`)
When dijalankan di 20.0
Then **`write` BERHASIL, TIDAK ADA `AccessError`** — bug silent-fail warisan (F-10/MF-03) TIDAK LAGI terjadi untuk skenario nyata ini, akibat ACL native `base` yang berubah (baris baru `res_partner_rule_write_self`), BUKAN karena kode modul diubah. **Dikonfirmasi EMPIRIS 2 putaran:**
  - **Putaran 1 (step 6, G1 pertama):** test warisan `test_plain_internal_user_cannot_write_own_partner_field` PASS (AccessError tetap terjadi) — SEMPAT disimpulkan keliru sebagai "hipotesis DIFF-03 salah, BSL-010 tidak berubah". Ketahuan salah di step 8: test itu menulis ke partner LAIN (bukan partner user sendiri), jadi tidak pernah menguji domain `id = user.partner_id.id` yang relevan.
  - **Putaran 2 (step 8, code review menemukan gap ini):** test BARU `tests/test_optional_field_save.py::test_plain_internal_user_can_write_own_partner_record` ditambahkan, menulis ke `test_user.partner_id` sendiri (mereplikasi persis pola `setDatabase()`) — **PASS, write berhasil, dikonfirmasi 2x termasuk fresh-DB run.**
  Test warisan `test_plain_internal_user_cannot_write_own_partner_field` **TIDAK diedit** (masih relevan — menguji "write ke partner TAK TERKAIT tetap ditolak", yang tetap benar). Lihat `FINDINGS.md` MF-01 untuk riwayat investigasi lengkap.

**AC-05-03** (verifies `BSL-010`, companion)
Given user DENGAN `base.group_partner_manager` ("Contact Creation") menulis field ini ke partnernya sendiri
When `orm.call("res.partner", "write", ...)` dijalankan
Then BERHASIL (tidak ada `AccessError`) — TIDAK terpengaruh DIFF-03 sama sekali (grup ini sudah punya akses penuh sejak 19.0, tidak berubah). `tests/test_optional_field_save.py::test_user_with_partner_manager_group_can_write` diharapkan tetap PASS tanpa perubahan.

## AC-06 — Quirk/Behavior Non-Obvious (informational, tidak butuh AC fungsional terpisah)

`BSL-011`, `BSL-012`, `BSL-013` (dead ACL csv modul, dead controller, file Google verification nyasar)
— seluruhnya artefak statis/dead code, TIDAK ADA behavior yang bisa diuji (tidak pernah dieksekusi
Odoo). **Tidak ada AC-06-NN** — cukup dikonfirmasi apa adanya (file-file ini tetap ada, tidak dihapus,
tidak dimuat) lewat review kode step 8, bukan test eksekusi step 9/10.

---

**Ringkasan traceability:** 14 AC (AC-01-01 s/d AC-05-03) memetakan ke `BSL-001` s/d `BSL-010` +
`BSL-014` (13 dari 14 klaim `01b_BASELINE_SPEC.md` yang punya behavior teruji; `BSL-011/012/013`
sengaja tanpa AC fungsional, lihat AC-06). Tidak ada AC yang "mengarang" perilaku baru — semua
diturunkan langsung dari baseline 19.0.
