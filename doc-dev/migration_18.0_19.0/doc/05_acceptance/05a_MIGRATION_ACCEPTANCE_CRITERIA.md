# Migration Acceptance Criteria — optional_field_save

**Step:** 5 — Acceptance Criteria & Test Plan
**Ref:** `01_intake/01b_BASELINE_SPEC.md` dan kode 18.0 yang berjalan — **bukan** `03_spec/03_MIGRATION_SPEC.md`
**Tanggal:** 2026-08-26

> Kesetaraan diukur terhadap 18.0 (behavior observable), bukan terhadap implementasi internal 19.0.
> Step 2 sudah mengonfirmasi seluruh API yang dipakai modul stabil 18.0→19.0 — AC di bawah pada
> dasarnya adalah REGRESSION SUITE (memastikan tidak ada yang diam-diam berubah), bukan verifikasi
> rewrite besar seperti migrasi 17→18 sebelumnya.

---

## AC-01 — Instalasi modul

**AC-01-01** (verifies `BSL-008`, ref manifest version bump §2 `03_MIGRATION_SPEC.md`)
Given database Odoo 19.0 kosong/fresh dengan `base`+`web` saja
When modul `optional_field_save` (`version: 19.0.1.0.0`) di-install
Then instalasi SUKSES — sama seperti 18.0, `security/ir.model.access.csv` yang cacat tetap tidak berpengaruh (tidak pernah di-load, F-01 tidak berubah)

## AC-02 — Persistensi preferensi kolom optional (lintas browser)

**AC-02-01** (verifies `BSL-004`, `BSL-006`)
Given user login, buka list view apapun yang punya kolom optional, toggle salah satu kolom jadi aktif
When toggle selesai
Then `res.partner.optional_field_save` milik user ter-update dengan key `"optional_field.<resModel>"` — DAN `localStorage` DAN `sessionStorage` juga ter-update konsisten. **Identik dengan 18.0** — DIFF-01/DIFF-02 mengonfirmasi kontrak `computeOptionalActiveFields`/`saveOptionalActiveFields` tidak berubah.

**AC-02-02** (verifies `BSL-001`, `BSL-002`, `BSL-003`)
Given user sebelumnya sudah menyimpan preferensi kolom optional untuk resModel X (tersimpan di DB)
When user login di BROWSER LAIN (localStorage kosong) dan membuka list view resModel X
Then preferensi kolom optional yang sama muncul (di-load dari DB oleh `webclient.js` ke `sessionStorage` saat mount, dibaca override `computeOptionalActiveFields()` saat render). Mekanisme ini sudah pernah diverifikasi end-to-end di migrasi 17→18 (MF-01/MF-05) — AC ini sekarang REGRESSION check, memastikan `user.partnerId`/`useService("orm")` tetap berfungsi di 19.0 (DIFF-03/DIFF-04).

**AC-02-03** (verifies `BSL-009`)
Given SEMUA partner (baru maupun lama) yang belum pernah ditulis field `optional_field_save`-nya
When dibaca via `search_read`/`read`
Then nilainya `False` (bukan `{}`) — **identik dengan 18.0** (dikonfirmasi `DIFF-06`, `fields.Json` byte-identik)

**AC-02-04** (verifies `BSL-009`)
Given `old_value` bernilai `False`
When user pertama kali toggle kolom optional (`setDatabase()` dipanggil)
Then `setDatabase()` menangani `old_value` falsy dengan benar, tidak crash — **identik dengan 18.0**, `setDatabase()` di-port apa adanya tanpa perubahan

## AC-03 — Fallback ke localStorage saat sessionStorage kosong

**AC-03-01** (verifies `BSL-003`, `BSL-005`)
Given `sessionStorage` untuk key `"optional_field.<resModel>"` KOSONG (mis. webclient baru saja di-load ulang tanpa sempat mount `webclient.js`, atau browser baru tanpa data DB)
When list view resModel itu di-render
Then override `computeOptionalActiveFields()` delegasi ke `super()` — hasilnya SAMA PERSIS dengan behavior core 19.0 (baca dari `localStorage`, atau default `col.optional === "show"` kalau localStorage juga kosong). **Regression check** — DIFF-01 sudah mengonfirmasi `super()` (core `computeOptionalActiveFields()`) tidak berubah kontraknya.

## AC-04 — Cleanup saat logout

**AC-04-01** (verifies `BSL-007`)
Given user login, sudah punya beberapa key `sessionStorage` berprefix `optional_field`
When user klik "Log out"
Then semua key `sessionStorage` yang mengandung `"optional_field"` dihapus sebelum redirect — **identik dengan 18.0** (DIFF-05 dikonfirmasi registry key `"log_out"` tidak berubah)

## AC-05 — Entry point modul di Apps menu

**AC-05-01** (verifies `BSL-008`)
Given `__manifest__.py` `application: False`
When modul terinstall
Then modul TIDAK muncul sebagai aplikasi di Apps grid — murni modul teknis, sama seperti 18.0, tidak ada perubahan yang disengaja

## AC-06 — Akses tulis `res.partner` untuk user internal biasa (F-10, WAJIB tetap gagal — bukan regresi)

**AC-06-01** (verifies `BSL-010`)
Given user Internal (`base.group_user`) TANPA grup `base.group_partner_manager`
When JS modul mencoba `orm.call("res.partner", "write", ...)` untuk partner user itu sendiri
Then Odoo core melempar `AccessError` (dikonfirmasi `DIFF-07`, ACL byte-identik 18.0↔19.0) — `setDatabase()` menangkap di `try/catch`, HANYA `console.error`, TIDAK ADA notifikasi UI. **Test ini HARUS tetap FAIL-secara-desain (behavior dipertahankan, bukan bug baru).**

## AC-07 — Test infrastructure kompatibel dengan 19.0 (MF-01, murni mekanis)

**AC-07-01** (ref `DIFF-09`/`MF-01`)
Given `tests/test_optional_field_save.py` membuat fixture `res.users` untuk AC-06
When field key `groups_id` di-rename `group_ids` (step 6)
Then `create()` sukses tanpa `ValueError`, DAN hasil test AC-06-01/AC-06-02 (positive case) tetap sama seperti sebelum rename — **ini murni fix kompatibilitas test infrastructure, bukan perubahan business logic apapun.**
