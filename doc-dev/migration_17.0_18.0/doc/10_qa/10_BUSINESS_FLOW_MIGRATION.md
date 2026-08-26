# Business Flow — Migrasi optional_field_save

**Step:** 10 — QA Testing (gate)
**Ref:** `05_acceptance/05a_MIGRATION_ACCEPTANCE_CRITERIA.md`
**Tanggal:** 2026-08-26

> Port kode saja (belum ada instance produksi, `01a_MIGRATION_INTAKE.md` §3) — jalur upgrade data sungguhan tidak berlaku, install bersih dipakai apa adanya.

Sesuai catatan template: skenario di sini FOKUS pada yang **belum tercakup tour test Step 9** (`09_DEV_TESTING.md`) — cross-browser end-to-end, negative-case, dan cleanup logout. Toggle-kolom-dasar (write ke DB) sudah reliable via tour otomatis, tidak diulang di sini.

**Mode eksekusi:** AI-interaktif (Claude Browser tool + Docker, environment sama seperti G1/G2/Step 9) untuk semua skenario — dipilih karena murah diulang dan environment sudah siap dari step sebelumnya.

---

## Skenario

### S-01: Webclient boot bersih (regresi MF-02/MF-05)
**Level:** Smoke
**Precondition:** Modul + `contacts` terinstall, instance fresh
**Mode eksekusi:** AI-interaktif
**Steps:** Login sebagai admin, amati console browser saat webclient mount
**Expected:** Tidak ada `TypeError` terkait `this.orm`/`session.partner_id`, webclient mount normal
**Actual:** Tidak ada error terkait — cuma noise "Service worker registration failed" (dikonfirmasi tidak terkait modul, muncul juga di instance vanilla tanpa modul ini, artefak sandbox tool)
**Status:** [x] Pass

### S-02: Preferensi kolom optional ter-restore di "browser lain" (AC-02-02, KRITIS)
**Level:** Main Flow
**Precondition:** Admin sudah punya preferensi tersimpan di `res.partner.optional_field_save`
**Mode eksekusi:** AI-interaktif (tulis preferensi via RPC mensimulasikan toggle sebelumnya, hapus SEMUA localStorage+sessionStorage mensimulasikan browser baru, reload)
**Steps:**
1. Tulis `{"optional_field.res.partner": "email,city"}` ke `res.partner` (id admin) via RPC
2. `localStorage.clear()`, `sessionStorage.clear()`
3. Reload penuh (`/odoo`)
4. Cek `sessionStorage.getItem("optional_field.res.partner")`
**Expected:** Terisi otomatis dari DB tanpa jejak local sebelumnya
**Actual:** `"email,city"` — sesuai, dan direproduksi ulang dengan value berbeda dari sesi Step 9 (`"mobile"`) untuk pastikan bukan kebetulan
**Status:** [x] Pass

### S-03: Fallback ke localStorage saat sessionStorage kosong (AC-03-01)
**Level:** Detail
**Precondition:** sessionStorage DAN localStorage sama-sama kosong untuk key terkait (browser/profil benar-benar baru)
**Mode eksekusi:** AI-interaktif (implicit — dieksekusi ulang setiap kali tour Step 9/S-02 di atas dijalankan, karena state awal SELALU dimulai dari sessionStorage kosong sebelum toggle pertama)
**Steps:** Buka list view Contacts pada instance fresh (belum pernah toggle apapun)
**Expected:** `computeOptionalActiveFields()` delegasikan ke `super()`, kolom default (`optional="show"`) yang muncul, tidak crash
**Actual:** Terbukti berulang kali (setiap run tour Step 9 dan S-01/S-02 di atas dimulai dari state ini) — list view selalu render normal dengan kolom default sebelum toggle apapun dilakukan, tidak pernah ada error
**Status:** [x] Pass

### S-04: User tanpa grup "Contact Creation" — gagal TOTAL SILENT, tidak ada notifikasi (AC-06-01, F-10 — WAJIB tetap gagal)
**Level:** Negative
**Precondition:** User internal biasa (`base.group_user`) TANPA `base.group_partner_manager`
**Mode eksekusi:** Kombinasi — akses-control dikonfirmasi test Python (`test_plain_internal_user_cannot_write_own_partner_field`, PASS, lihat `09_DEV_TESTING.md`); klaim "tidak ada notifikasi UI" dikonfirmasi review kode (`setDatabase()` catch block HANYA `console.error`, tidak ada pemanggilan service notifikasi apapun — dicek `08_review/08_CODE_REVIEW.md` dan baca ulang `list_renderer.js` baris 75-77 sesi ini)
**Steps:** (Python) buat user `base.group_user` polos, coba `write` field `optional_field_save` di partner miliknya sendiri
**Expected:** `AccessError` dilempar Odoo core, TIDAK ADA notifikasi UI ke user — **ini behavior yang HARUS dipertahankan, BUKAN bug untuk diperbaiki** (lihat `01a_MIGRATION_INTAKE.md` §5)
**Actual:** `AccessError` terlempar sesuai ekspektasi (test PASS); kode `setDatabase()` dikonfirmasi HANYA berisi `console.error("Error fetching data:", error)` di catch block, tidak ada `notification.add()`/service notifikasi manapun
**Status:** [x] Pass

### S-05: Cleanup `sessionStorage` saat logout, key lain tidak tersentuh (AC-04-01)
**Level:** Negative
**Precondition:** `sessionStorage` berisi campuran key `optional_field.*` dan key lain
**Mode eksekusi:** AI-interaktif (panggil langsung factory + callback registry item `log_out` dari `user_menuitems`, verifikasi state sessionStorage sebelum navigasi logout benar-benar terjadi)
**Steps:**
1. Set `sessionStorage`: `optional_field.res.partner`, `optional_field.res.users`, DAN `unrelated_key` (kontrol)
2. Ambil item registry `user_menuitems.get("log_out")`, verifikasi itu `CustomLogOutItem` milik modul (dicek source code compiled-nya cocok)
3. Panggil `item({}).callback()`
4. Cek state sessionStorage SEBELUM redirect benar-benar terjadi
**Expected:** Kedua key `optional_field.*` terhapus, `unrelated_key` TETAP ADA (scope cleanup sengaja terbatas ke key modul ini, `BSL-007`)
**Actual:** `optional_field.res.partner` → `null`, `optional_field.res.users` → `null`, `unrelated_key` → `"should_survive"` — persis sesuai ekspektasi
**Status:** [x] Pass

### Cek Wajib: Multi-dialog dari satu aksi
**Level:** N/A
Modul ini **tidak punya dialog/wizard sama sekali** (dikonfirmasi `01a_MIGRATION_INTAKE.md` §2b — tidak ada `views/`/`wizard/`). Skenario multi-dialog **N/A — dikonfirmasi tidak ada kasus ini**, bukan dilewati diam-diam.

---

## Ringkasan per Level

| Level | Skenario | Jumlah |
|---|---|---|
| Smoke | S-01 | 1 |
| Main Flow | S-02 | 1 |
| Detail | S-03 | 1 |
| Negative | S-04, S-05 | 2 |

## Loop-back

Tidak ada skenario Fail — tidak perlu loop-back ke Step 9.

## Verdict

- [x] ✅ **Lulus** — lanjut ke step 11
