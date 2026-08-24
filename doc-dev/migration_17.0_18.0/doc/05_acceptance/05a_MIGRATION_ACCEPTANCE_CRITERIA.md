# Migration Acceptance Criteria — optional_field_save

**Step:** 5 — Acceptance Criteria & Test Plan
**Ref:** `01_intake/01b_BASELINE_SPEC.md` dan kode 17.0 yang berjalan — **bukan** `03_spec/03_MIGRATION_SPEC.md`
**Tanggal:** 2026-08-24

> Kesetaraan diukur terhadap 17.0 (behavior observable), bukan terhadap implementasi internal 18.0.
> `03_MIGRATION_SPEC.md` (MF-01: rewrite `computeOptionalActiveFields()`) adalah DETAIL IMPLEMENTASI —
> AC di bawah menguji hasil akhirnya (preferensi tersimpan & ter-restore), bukan nama method internal.

---

## AC-01 — Instalasi modul

**AC-01-01** (verifies `BSL-008`, ref manifest version bump §2b `03_MIGRATION_SPEC.md`)
Given database Odoo 18.0 kosong/fresh dengan `base`+`web` saja
When modul `optional_field_save` (`version: 18.0.1.0.0`) di-install
Then instalasi SUKSES — sama seperti 17.0 (AC-01-01 versi backfill), `security/ir.model.access.csv` yang cacat tetap tidak berpengaruh (tidak pernah di-load, F-01 tidak berubah)

## AC-02 — Persistensi preferensi kolom optional (lintas browser)

**AC-02-01** (verifies `BSL-004`, `BSL-006`)
Given user login, buka list view apapun yang punya kolom optional, toggle salah satu kolom jadi aktif
When toggle selesai
Then `res.partner.optional_field_save` milik user ter-update dengan key `"optional_field.<resModel>"` — DAN `localStorage` DAN `sessionStorage` juga ter-update konsisten. **Identik dengan 17.0** — implementasi internal override berubah (MF-01), tapi hasil observable harus sama.

**AC-02-02** (verifies `BSL-001`, `BSL-002`, `BSL-003`)
Given user sebelumnya sudah menyimpan preferensi kolom optional untuk resModel X (tersimpan di DB)
When user login di BROWSER LAIN (localStorage kosong) dan membuka list view resModel X
Then preferensi kolom optional yang sama muncul (di-load dari DB oleh `webclient.js` ke `sessionStorage` saat mount, dibaca override `computeOptionalActiveFields()` baru saat render). **Ini AC yang PALING KRITIS untuk memverifikasi rewrite MF-01 bekerja benar** — kalau override baru salah kontrak (return value/mutasi tertukar), test ini yang akan gagal duluan.

**AC-02-03** (verifies `BSL-009`)
Given SEMUA partner (baru maupun lama) yang belum pernah ditulis field `optional_field_save`-nya
When dibaca via `search_read`/`read`
Then nilainya `False` (bukan `{}`) — **identik dengan 17.0** (dikonfirmasi `DIFF-09`, `fields.Json` byte-identik)

**AC-02-04** (verifies `BSL-009`)
Given `old_value` bernilai `False`
When user pertama kali toggle kolom optional (`setDatabase()` dipanggil)
Then `setDatabase()` menangani `old_value` falsy dengan benar, tidak crash — **identik dengan 17.0**, `setDatabase()` di-port apa adanya tanpa perubahan

## AC-03 — Fallback ke localStorage saat sessionStorage kosong (verifikasi khusus rewrite MF-01)

**AC-03-01** (verifies `BSL-003`, `BSL-005`)
Given `sessionStorage` untuk key `"optional_field.<resModel>"` KOSONG (mis. webclient baru saja di-load ulang tanpa sempat mount `webclient.js`, atau browser baru tanpa data DB)
When list view resModel itu di-render
Then override `computeOptionalActiveFields()` baru delegasi ke `super()` — hasilnya SAMA PERSIS dengan behavior asli 18.0 core (baca dari `localStorage`, atau default `col.optional === "show"` kalau localStorage juga kosong). **Ini verifikasi bahwa keputusan desain "pakai `super()` bukan copy manual" (dikonfirmasi user di Step 3) tidak mengubah behavior fallback.**

## AC-04 — Cleanup saat logout

**AC-04-01** (verifies `BSL-007`)
Given user login, sudah punya beberapa key `sessionStorage` berprefix `optional_field`
When user klik "Log out"
Then semua key `sessionStorage` yang mengandung `"optional_field"` dihapus sebelum redirect — **identik dengan 17.0** (DIFF-07 dikonfirmasi hanya menambah fitur PWA baru yang tidak diadopsi modul, tidak mengubah logic existing)

## AC-05 — Entry point modul di Apps menu

**AC-05-01** (verifies `BSL-008`)
Given `__manifest__.py` `application: True`
When modul terinstall dan user buka menu Apps
Then modul muncul sebagai aplikasi terinstall, tanpa menu/action apapun untuk dibuka — **identik dengan 17.0**, tidak ada perubahan yang disengaja

## AC-06 — Akses tulis `res.partner` untuk user internal biasa (F-10, WAJIB tetap gagal — bukan regresi)

**AC-06-01** (verifies `BSL-010`)
Given user Internal (`base.group_user`) TANPA grup `base.group_partner_manager`
When JS modul mencoba `orm.call("res.partner", "write", ...)` untuk partner user itu sendiri
Then Odoo core melempar `AccessError` (dikonfirmasi `DIFF-10`, ACL byte-identik 17.0↔18.0) — `setDatabase()` menangkap di `try/catch`, HANYA `console.error`, TIDAK ADA notifikasi UI. **Test ini HARUS tetap FAIL-secara-desain (behavior dipertahankan, bukan bug baru)** — kalau ada yang "memperbaiki" ini tanpa approval eksplisit, test ini justru harus dianggap regresi dari scope yang disepakati.

## AC-07 — Verifikasi MF-02 (`this.orm` di `webclient.js`, kondisional — WAJIB dijalankan sebelum AC-02-02 dipercaya penuh)

**AC-07-01** (verifies `BSL-001`, `BSL-002`, ref `MF-02` `FINDINGS.md`)
Given browser DevTools console terbuka, webclient baru saja di-load (fresh page load)
When `WebClient.setup()` (patched) memanggil `this.getOptionalActiveFields()`
Then **HARUS diverifikasi eksekusi nyata**: apakah muncul `TypeError` terkait `this.orm` di console, ATAU apakah `this.orm` genuinely ter-inisialisasi dari sumber lain yang belum ditemukan lewat review statis. **Ini bukan AC pass/fail biasa — hasilnya menentukan apakah MF-02 di `FINDINGS.md` perlu status `✅ CONFIRMED (bug pre-existing)` atau `✅ RESOLVED (ternyata tidak bermasalah)`.** Kalau terkonfirmasi error: AC-02-02 di atas TETAP valid secara DB-level (data tersimpan benar), TAPI jalur "load otomatis saat webclient mount" harus dicatat sebagai tidak berfungsi — user baru benar-benar melihat preferensi ter-restore setelah list view di-render ulang (trigger lain), bukan langsung saat webclient mount seperti yang didokumentasikan BSL-002.
