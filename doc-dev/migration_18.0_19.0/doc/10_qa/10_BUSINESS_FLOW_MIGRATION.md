# Business Flow — Migrasi optional_field_save

**Step:** 10 — QA Testing (gate)
**Ref:** `05_acceptance/05a_MIGRATION_ACCEPTANCE_CRITERIA.md`
**Tanggal:** 2026-08-26

> Port kode saja (belum ada instance produksi, `01a_MIGRATION_INTAKE.md` §3) — jalur upgrade data sungguhan tidak berlaku, install bersih dipakai apa adanya.

Sesuai catatan template: skenario di sini FOKUS pada yang **belum tercakup tour test Step 9** (`09_DEV_TESTING.md`) — cross-browser end-to-end (RPC), negative-case, dan cleanup logout (review kode). Toggle-kolom-dasar sudah reliable via tour otomatis (`[7/7]` "tour succeeded"), tidak diulang di sini.

**Mode eksekusi:** Campuran — **AI-interaktif via RPC langsung** (`curl` + JSON-RPC ke server `docker-env` live, environment sama G1/G2/Step 9) untuk S-02/AC-05; **review kode** (statis, dicross-check ulang ke kode aktual sesi ini) untuk S-01/S-03/S-05, dikombinasikan bukti eksekusi nyata dari tour Step 9. **Catatan environment (baru, sesi ini):** Browser pane sandbox tool TIDAK bisa dipakai interaktif langsung (`computer`/klik tidak ter-composite, `screenshot` timeout "Browser pane is not displayed" — pola limitasi yang SAMA seperti dicatat migrasi 17→18 `FINDINGS.md` MF-02). Diakali dengan JSON-RPC langsung (`/web/session/authenticate` + `/web/dataset/call_kw`) — secara fungsional setara (RPC call PERSIS yang dipanggil `orm.call()` dari JS modul), cuma tidak ada verifikasi visual pixel-level.

---

## Skenario

### S-01: Webclient boot bersih di 19.0 (regresi MF-01/MF-02/MF-05 warisan 17→18)
**Level:** Smoke
**Precondition:** Modul + `contacts` terinstall, instance fresh (`optional_field_save_19_test`)
**Mode eksekusi:** Bukti eksekusi nyata — tour test Step 9 (headless Chrome NYATA di dalam Docker, bukan browser pane sandbox), langkah `[1/7]`-`[4/7]` (buka Apps menu → Contacts → list view → dropdown optional columns) mencakup boot webclient penuh
**Steps:** Login sebagai admin, webclient mount, navigasi ke Contacts list view
**Expected:** Tidak ada `TypeError` terkait `this.orm`/`user.partnerId`, webclient mount normal (regresi dari fix MF-02/MF-05 migrasi 17→18)
**Actual:** Tour `[1/7]`-`[4/7]` PASS tanpa error (log `docker-env/logs/odoo.log`, G1 percobaan #3) — webclient boot, load menus, buka Contacts, switch list view, buka dropdown optional columns semua sukses sebelum step toggle dimulai
**Status:** [x] Pass

### S-02: Preferensi kolom optional ter-restore di "browser lain" (AC-02-02, KRITIS)
**Level:** Main Flow
**Precondition:** Server live (`docker compose run` tanpa `--test-enable`/`--stop-after-init`, fresh DB volume, modul terinstall)
**Mode eksekusi:** AI-interaktif via RPC (mensimulasikan toggle sebelumnya + "browser baru" via panggilan RPC terpisah, bukan lewat state browser lokal yang bisa dibagikan)
**Steps:**
1. Autentikasi via `/web/session/authenticate` (admin/admin, db `optional_field_save_19_test`)
2. `POST /web/dataset/call_kw` — `res.partner.write([3], {"optional_field_save": {"optional_field.res.partner": "street,email"}})` (persis method+argumen yang dipanggil `setDatabase()` di `list_renderer.js`)
3. `POST /web/dataset/call_kw` — `res.partner.search_read([["id","=",3]], ["id","name","optional_field_save"])` (persis method+argumen yang dipanggil `getOptionalActiveFields()` di `webclient.js` saat webclient mount)
**Expected:** Nilai yang ditulis step 2 terbaca utuh di step 3 — membuktikan mekanisme "load dari DB saat browser/sesi lain" bekerja di level RPC (jalur yang sama persis dipakai JS modul)
**Actual:** `write` → `{"result": true}`. `search_read` → `{"optional_field_save": {"optional_field.res.partner": "street,email"}}` — cocok persis
**Status:** [x] Pass

### S-03: Fallback ke localStorage saat sessionStorage kosong (AC-03-01)
**Level:** Detail
**Precondition:** sessionStorage DAN localStorage sama-sama kosong untuk key terkait (browser/profil baru)
**Mode eksekusi:** Bukti eksekusi nyata (implicit) — SETIAP run tour Step 9 dimulai dari state sessionStorage kosong sebelum toggle pertama; ditambah review kode `computeOptionalActiveFields()` (delegasi `super()` saat sessionStorage kosong, DIFF-01 dikonfirmasi stabil step 2)
**Steps:** Buka list view Contacts pada instance fresh (belum pernah toggle apapun)
**Expected:** `computeOptionalActiveFields()` delegasikan ke `super()`, kolom default (`optional="show"`) yang muncul, tidak crash
**Actual:** Tour Step 9 percobaan #3 selalu mulai dari state ini (list view render normal di langkah `[3/7]`-`[4/7]` sebelum toggle apapun) — tidak pernah error; kode `super()` dikonfirmasi tidak berubah 18.0→19.0 (DIFF-01)
**Status:** [x] Pass

### S-04: User tanpa grup "Contact Creation" — gagal TOTAL SILENT, tidak ada notifikasi (AC-06-01, F-10 — WAJIB tetap gagal)
**Level:** Negative
**Precondition:** User internal biasa (`base.group_user`) TANPA `base.group_partner_manager`
**Mode eksekusi:** Kombinasi — akses-control dikonfirmasi test Python (`test_plain_internal_user_cannot_write_own_partner_field`, PASS, `09_DEV_TESTING.md`); klaim "tidak ada notifikasi UI" dikonfirmasi review kode aktual sesi ini (`list_renderer.js` — catch block `setDatabase()` HANYA `console.error("Error fetching data:", error)`, tidak ada `notification`/service apapun dipanggil)
**Steps:** (Python) buat user `base.group_user` polos, coba `write` field `optional_field_save` di partner miliknya sendiri
**Expected:** `AccessError` dilempar Odoo core, TIDAK ADA notifikasi UI ke user — behavior yang HARUS dipertahankan, BUKAN bug (`01a_MIGRATION_INTAKE.md` §5)
**Actual:** `AccessError` terlempar sesuai ekspektasi (test PASS, log `Access Denied by ACLs for operation: write, uid: 5, model: res.partner`); kode `setDatabase()` dikonfirmasi tidak berubah dari 18.0 — masih cuma `console.error`
**Status:** [x] Pass

### S-05: Cleanup `sessionStorage` saat logout, key lain tidak tersentuh (AC-04-01)
**Level:** Negative
**Precondition:** N/A — verifikasi statis (browser pane sandbox tidak bisa eksekusi interaktif sesi ini, lihat catatan Mode eksekusi di atas)
**Mode eksekusi:** Review kode (`user_menu_items.js`, dibaca ulang sesi ini) — DIFF-05 (step 2) sudah mengonfirmasi registry key `"log_out"` tidak berubah 18.0→19.0, jadi logic callback yang SAMA yang sudah tervalidasi eksekusi nyata di migrasi 17→18 (`doc-dev/_archive/migration_17.0_18.0/doc/10_qa/10_BUSINESS_FLOW_MIGRATION.md` S-05) tetap berlaku identik — TIDAK ADA baris kode yang berubah di file ini sama sekali (dikonfirmasi `git diff origin/migration/18.0 HEAD -- optional_field_save/static/src/js/user_menu_items.js` kosong)
**Steps (dibaca dari kode, bukan dieksekusi ulang):** `CustomLogOutItem.callback()` — `Object.keys(sessionStorage).filter(key => key.includes('optional_field'))`, `forEach` → `sessionStorage.removeItem(key)`, baru `browser.location.href = route`
**Expected:** Key manapun yang mengandung substring `"optional_field"` terhapus, key lain TIDAK tersentuh (filter eksplisit by substring, tidak ada `sessionStorage.clear()`)
**Actual:** Kode byte-identik dengan versi yang SUDAH dieksekusi nyata & PASS di migrasi 17→18 (S-05 arsip) — tidak ada perubahan yang bisa mengubah hasil itu. Diterima sebagai bukti valid tanpa re-eksekusi (risiko regresi nihil karena file tidak tersentuh sama sekali di migrasi ini)
**Status:** [x] Pass (diverifikasi statis, bukan re-eksekusi — dicatat eksplisit sebagai perbedaan dari precedent 17→18 yang re-eksekusi langsung)

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
