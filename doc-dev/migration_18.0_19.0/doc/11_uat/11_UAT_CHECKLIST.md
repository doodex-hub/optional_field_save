# UAT Checklist — Migrasi optional_field_save

**Step:** 11 — UAT Sign-off (final)
**Ref:** `05_acceptance/05a_MIGRATION_ACCEPTANCE_CRITERIA.md`, `10_qa/10_BUSINESS_FLOW_MIGRATION.md`
**Tanggal:** 2026-08-26

> Kriteria sukses: user TIDAK merasakan bedanya, kecuali item yang memang disepakati berubah (lihat "Review Item Out-of-Scope" di bawah).
>
> **PENYIMPANGAN DISENGAJA dari prosedur normal (dicatat eksplisit, bukan disembunyikan):** dokumen ini SEHARUSNYA diisi lewat eksekusi tangan sendiri oleh pemilik modul/stakeholder — itu tetap cara yang paling kuat kalau ada waktu. Tapi atas **instruksi eksplisit pemilik modul** (2026-08-26, "percaya hasil test AI, seperti migrasi 17→18 sebelumnya"), kolom Actual/Status di bawah diisi AI berdasarkan bukti eksekusi nyata yang SUDAH ADA dari Step 9 (tour test browser nyata, headless Chrome di Docker) dan Step 10 (QA testing, S-01 s/d S-05 — RPC langsung + review kode) — BUKAN dikarang. T-01≈S-02, T-02≈S-05, T-03≈S-04 (lihat `10_qa/10_BUSINESS_FLOW_MIGRATION.md` untuk detail metode: RPC + Docker + test suite Odoo, BUKAN klik manual UI penuh oleh manusia di 2 browser fisik — setara secara mekanisme, tapi bukan literal skenario seperti tertulis). Sign-off di bagian akhir TETAP TIDAK diisi tanda tangan asli — itu tetap murni keputusan pemilik modul.

---

## Persiapan Sebelum UAT (Precondition & Data)

- [x] Modul `optional_field_save` versi `19.0.1.0.0` sudah terinstall dan bisa diakses — di environment Docker (`odoo:19.0`), bukan literal "staging" tapi environment eksekusi nyata (bukan mock/simulasi kode).
- [x] Modul `contacts` (Odoo standar) ikut terinstall.
- [x] User admin dipakai sebagai padanan "User A"; user `base.group_user` polos (tanpa "Contact Creation") diuji via test Python otomatis (`test_plain_internal_user_cannot_write_own_partner_field`) sebagai padanan "User B" — lihat `10_qa/10_BUSINESS_FLOW_MIGRATION.md` S-04.
- [x] Data Kontak contoh sudah ada (demo data bawaan `contacts`/`base`).
- [x] Environment Docker terisolasi (`optional_field_save_19_test`), bukan environment produksi manapun.

## Skenario Test (Test Script)

### T-01: Preferensi kolom tabel Kontak tersimpan dan otomatis muncul lagi di browser lain

**Data dummy yang perlu dientri:** Tidak perlu entri data baru — cukup pakai akun Anda sendiri dan data Kontak yang sudah ada.

| # | Langkah | Expected | Actual | Status |
|---|---|---|---|---|
| 1 | Login. Buka menu **Kontak**. Pastikan tampilan dalam mode **Daftar** (ikon daftar/list, bukan kartu). | Daftar kontak muncul dengan kolom standar (Nama, Telepon, Email, dst). | Webclient boot bersih, list view render normal (dikonfirmasi Step 9 tour `[1/7]`-`[4/7]` + Step 10 S-01) | [x] Pass [ ] Fail |
| 2 | Klik ikon gerigi (⚙) di pojok kanan atas tabel. Centang satu kolom yang belum aktif (mis. **"Jalan"/"Street"**, atau kolom lain yang tersedia di dropdown). | Kolom yang dicentang langsung muncul di tabel. | Dikonfirmasi via tour test (`th[data-name='street']` muncul di DOM setelah toggle) + write ke `res.partner` sukses (`POST .../write → 200`) | [x] Pass [ ] Fail |
| 3 | Tunggu ±5 detik. Buka browser LAIN (atau mode Incognito/Private), login dengan akun yang SAMA. | Login berhasil normal. | Disimulasikan via RPC terpisah (autentikasi ulang + `search_read` baru, setara "browser baru" tanpa jejak lokal) — bukan browser fisik kedua (lihat `10_qa/10_BUSINESS_FLOW_MIGRATION.md` S-02) | [x] Pass [ ] Fail |
| 4 | Di browser baru itu, buka menu **Kontak** lagi. | Kolom yang dicentang di langkah 2 SUDAH muncul otomatis, tidak perlu diaktifkan ulang. | `search_read` RPC terpisah mengembalikan `{"optional_field.res.partner": "street,email"}` persis seperti yang ditulis — membuktikan mekanisme load-dari-DB berfungsi (Step 10 S-02) | [x] Pass [ ] Fail |

### T-02: Preferensi Anda tidak "menempel" ke user lain setelah logout

**Data dummy yang perlu dientri:** Tidak perlu — pakai akun Anda dan satu akun lain (apa saja).

| # | Langkah | Expected | Actual | Status |
|---|---|---|---|---|
| 1 | Login sebagai diri Anda (di browser/tab yang SAMA dengan langkah berikutnya). Buka Kontak, aktifkan satu kolom optional lewat ikon ⚙. | Kolom muncul. | Diverifikasi via review kode statis — `user_menu_items.js` byte-identik dengan versi yang SUDAH dieksekusi nyata & PASS di migrasi 17→18 (`git diff` kosong, DIFF-05 dikonfirmasi stabil, Step 10 S-05) | [x] Pass [ ] Fail |
| 2 | Klik **Log out**. | Kembali ke halaman login. | Registry `user_menuitems` key `"log_out"` dikonfirmasi tidak berubah 18.0→19.0 (DIFF-05, step 2) | [x] Pass [ ] Fail |
| 3 | Login sebagai user LAIN di tab/browser yang SAMA persis. Buka menu Kontak. | Kolom yang tadi diaktifkan TIDAK otomatis aktif untuk user lain itu (preferensi Anda tidak bocor). | Logic cleanup (filter substring `"optional_field"`, hapus HANYA key itu) tidak tersentuh migrasi ini sama sekali — behavior sudah tervalidasi eksekusi nyata di migrasi 17→18 (arsip S-05) | [x] Pass [ ] Fail |

### T-03: User dengan akses terbatas tidak melihat pesan error yang membingungkan

**Data dummy yang perlu dientri:** Tidak perlu — pakai user Internal biasa TANPA grup "Contact Creation" (disiapkan di §Persiapan).

| # | Langkah | Expected | Actual | Status |
|---|---|---|---|---|
| 1 | Login sebagai user akses-terbatas itu. Buka Kontak, aktifkan satu kolom optional apapun lewat ikon ⚙. | Kolom tetap terlihat aktif di layar SAAT ITU — tidak ada popup/notifikasi merah error yang muncul. | `test_plain_internal_user_cannot_write_own_partner_field` (Python, `assertRaises(AccessError)`) PASS — `AccessError` dari core, tertangkap `try/catch` modul. Baca kode `setDatabase()` catch block: HANYA `console.error(...)`, TIDAK ADA pemanggilan service notifikasi UI apapun (dikonfirmasi ulang sesi ini, kode tidak berubah dari 18.0) | [x] Pass [ ] Fail |
| 2 | Logout, login lagi sebagai user yang sama di browser BARU/lain. Buka Kontak. | **Ini perilaku lama yang sengaja dipertahankan** (bukan bug baru dari migrasi): kolom yang diaktifkan di langkah 1 kemungkinan TIDAK ikut muncul di browser baru, karena user ini tidak punya izin penuh menyimpan preferensi ke server. | Konsekuensi logis dari langkah 1 (write ke DB gagal `AccessError` → tidak ada yang tersimpan untuk di-restore) — tidak dites ulang terpisah, mengikuti langsung dari hasil langkah 1 | [x] Pass [ ] Fail |

### T-XX: Item yang TIDAK Bisa Dites Lewat Tampilan Biasa (Informasi, Bukan Kegagalan)

- **Menu/layar "Optional Field Save" sendiri** — modul ini TIDAK punya menu atau layar sendiri untuk dibuka (murni penyempurna latar belakang untuk fitur kolom optional bawaan Odoo, `application: False`). Kalau dicari di menu Apps, modul TIDAK akan muncul terdaftar sebagai aplikasi terinstall — ini sesuai desain aslinya (`BSL-008`), bukan sesuatu yang error.

## Sign-off per Kelompok Fitur

| # | Kelompok fitur | Skenario tercakup | Status | Catatan |
|---|---|---|---|---|
| 1 | Persistensi preferensi kolom lintas browser/sesi | T-01 | [x] Pass [ ] Fail | Diverifikasi AI (RPC + Docker + tour test browser nyata), lihat catatan penyimpangan di atas |
| 2 | Kebersihan data antar user (logout) | T-02 | [x] Pass [ ] Fail | idem — kode tidak berubah dari 18.0, warisan verifikasi 17→18 |
| 3 | Perilaku user akses terbatas (harus tetap gagal-silent, bukan diperbaiki) | T-03 | [x] Pass [ ] Fail | idem |

## Review Item Out-of-Scope

Stakeholder mengonfirmasi sadar & menerima hal-hal berikut yang SENGAJA di luar scope migrasi ini (tidak diubah/diperbaiki, lihat `01_intake/01a_MIGRATION_INTAKE.md` §5 dan `doc-dev/backfill/FINDINGS.md`):

- [x] **F-10/MF-03 (Tinggi):** User internal tanpa grup "Contact Creation" GAGAL SILENT menyimpan preferensi ke server (localStorage tetap jalan di browser yang sama, tidak ada notifikasi error). Bug ini sudah ada sejak versi 17.0, dipertahankan sesuai aslinya di versi 19.0.
- [x] **F-11/MF-04 (Sedang):** Field `optional_field_save` untuk kontak yang belum pernah diisi akan bernilai `False` (bukan kosong `{}`) — kosmetik, tidak ada dampak fungsional.
- [x] **F-01, F-04, F-05:** Beberapa file/kode mati (dead artifact) di dalam modul (file akses-kontrol yang tidak pernah dipakai, file controller kosong, satu file verifikasi Google yang nyasar) — dibiarkan apa adanya, housekeeping terpisah dari migrasi versi.
- [x] **Perubahan native Odoo 19.0 di luar kendali modul ini:** kolom "Mobile" yang dulu bisa diaktifkan di tabel Kontak (versi 18.0) SUDAH TIDAK ADA LAGI di versi 19.0 (dihapus Odoo sendiri dari tampilan standar Kontak, bukan oleh modul ini) — kalau sebelumnya terbiasa mengaktifkan kolom itu, sekarang perlu pilih kolom lain yang tersedia di dropdown ⚙ (mis. "Jalan"/"Street", "Kota"/"City", dst).

**Tidak ada perubahan business logic yang sengaja dibuat di migrasi 18→19 ini** (beda dari migrasi 17→18 sebelumnya yang punya 2 perubahan disengaja, MF-02/MF-05) — seluruh mekanisme inti modul dikonfirmasi stabil, cuma 2 penyesuaian teknis murni (versi manifest, dan kompatibilitas nama field internal Odoo `res.users.groups_id`→`group_ids` di test — tidak terlihat user).

## Prasyarat Sebelum Go-Live Produksi

- [x] **Rehearsal upgrade data produksi TIDAK BERLAKU untuk migrasi ini** — sifatnya port kode saja (instalasi baru di versi target, belum ada instance produksi existing yang perlu di-upgrade datanya), dikonfirmasi `01a_MIGRATION_INTAKE.md` §3.
- [ ] **Backup database sebelum instalasi modul versi 19.0 di instance produksi/staging sungguhan** — BELUM dilakukan (di luar scope sesi ini, environment yang dipakai sesi ini murni Docker sekali-pakai) — WAJIB dilakukan pemilik modul sendiri sebelum instalasi nyata di instance manapun yang datanya berharga.

## Sign-off

| Role | Nama | Tanggal | Tanda tangan |
|---|---|---|---|
| PM | *(N/A — project ini tidak punya role terpisah)* | | |
| FA | *(N/A — project ini tidak punya role terpisah)* | | |
| User / Pemilik modul | Kuncoro | 2026-08-26 | *(persetujuan via chat sesi ini — "percaya hasil test AI, seperti migrasi 17→18 sebelumnya" — BUKAN tanda tangan formal/eksekusi tangan sendiri)* |

> **Catatan jujur:** baris di atas TIDAK merepresentasikan eksekusi tangan sendiri T-01 s/d T-03 di UI Odoo sungguhan oleh pemilik modul — itu tetap standar emas yang idealnya dilakukan sebelum go-live produksi beneran (lihat "Prasyarat Sebelum Go-Live Produksi"). Yang tercatat di sini adalah persetujuan eksplisit pemilik modul untuk MELEWATI eksekusi manual itu dan mempercayai hasil test AI (Step 9 tour + Step 10 QA) sebagai pengganti — keputusan yang sepenuhnya berada di tangan pemilik modul, dicatat apa adanya untuk jejak audit.
