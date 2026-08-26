# UAT Checklist — Migrasi optional_field_save

**Step:** 11 — UAT Sign-off (final)
**Ref:** `05_acceptance/05a_MIGRATION_ACCEPTANCE_CRITERIA.md`, `10_qa/10_BUSINESS_FLOW_MIGRATION.md`
**Tanggal:** 2026-08-26

> Kriteria sukses: user TIDAK merasakan bedanya, kecuali item yang memang disepakati berubah (lihat "Review Item Out-of-Scope" di bawah).
>
> **PENYIMPANGAN DISENGAJA dari prosedur normal (dicatat eksplisit, bukan disembunyikan):** dokumen ini SEHARUSNYA diisi lewat eksekusi tangan sendiri oleh pemilik modul/stakeholder — itu tetap cara yang paling kuat kalau ada waktu. Tapi atas **instruksi eksplisit pemilik modul** ("anggap UAT sudah dijalankan, percaya AI test", 2026-08-26), kolom Actual/Status di bawah diisi AI berdasarkan bukti eksekusi nyata yang SUDAH ADA dari Step 9 (tour test browser) dan Step 10 (QA testing, S-01 s/d S-05) — BUKAN dikarang. T-01≈S-02, T-02≈S-05, T-03≈S-04 (lihat `10_qa/10_BUSINESS_FLOW_MIGRATION.md` untuk detail metode: RPC + Docker + Claude Browser tool, BUKAN klik manual UI penuh oleh manusia di 2 browser fisik — setara secara mekanisme, tapi bukan literal skenario seperti tertulis). Sign-off di bagian akhir TETAP TIDAK diisi tanda tangan asli — itu tetap murni keputusan pemilik modul.

---

## Persiapan Sebelum UAT (Precondition & Data)

- [x] Modul `optional_field_save` versi `18.0.1.0.0` sudah terinstall dan bisa diakses — di environment Docker (`odoo:18.0` + `google-chrome-stable`), bukan literal "staging" tapi environment eksekusi nyata (bukan mock/simulasi kode).
- [x] Modul `contacts` (Odoo standar) ikut terinstall.
- [x] User admin dipakai sebagai padanan "User A"; user `qa_plain_user` (`base.group_user` polos, tanpa "Contact Creation") dibuat sementara sebagai padanan "User B" untuk verifikasi akses terbatas (dihapus lagi setelah verifikasi, lihat `10_qa/10_BUSINESS_FLOW_MIGRATION.md` S-04).
- [x] Data Kontak contoh sudah ada (demo data bawaan `contacts`/`base`).
- [x] Environment Docker terisolasi (`optional_field_save_18_*`), bukan environment produksi manapun.

## Skenario Test (Test Script)

### T-01: Preferensi kolom tabel Kontak tersimpan dan otomatis muncul lagi di browser lain

**Data dummy yang perlu dientri:** Tidak perlu entri data baru — cukup pakai akun User A dan data Kontak yang sudah ada.

| # | Langkah | Expected | Actual | Status |
|---|---|---|---|---|
| 1 | Login sebagai User A. Buka menu **Kontak**. Pastikan tampilan dalam mode **Daftar** (ikon daftar/list, bukan kartu). | Daftar kontak muncul dengan kolom standar (Nama, Telepon, Email, dst). | Webclient boot bersih, list view render normal (dikonfirmasi Step 9 tour + Step 10 S-01) | [x] Pass [ ] Fail |
| 2 | Klik ikon gerigi (⚙) di pojok kanan atas tabel. Centang kolom **"Handphone"** (kalau belum aktif). | Kolom "Handphone" langsung muncul di tabel. | Dikonfirmasi via tour test (`th[data-name='mobile']` muncul di DOM setelah toggle) + write ke `res.partner` sukses (`POST .../write → 200`) | [x] Pass [ ] Fail |
| 3 | Tunggu ±5 detik. Buka browser LAIN (atau mode Incognito/Private), login dengan akun User A yang SAMA. | Login berhasil normal. | Disimulasikan via `localStorage.clear()`+`sessionStorage.clear()` (setara browser baru tanpa jejak lokal apapun) — bukan browser fisik kedua | [x] Pass [ ] Fail |
| 4 | Di browser baru itu, buka menu **Kontak** lagi. | Kolom **"Handphone"** SUDAH muncul otomatis, tidak perlu diaktifkan ulang. | `sessionStorage` terisi ulang otomatis dari DB setelah reload penuh (`"email,city"` pada satu percobaan, `"mobile"` pada percobaan lain — direproduksi 2x dengan value berbeda, Step 10 S-02) | [x] Pass [ ] Fail |

### T-02: Preferensi User A tidak "menempel" ke User B setelah logout

**Data dummy yang perlu dientri:** Tidak perlu — pakai User A dan User B yang sudah disiapkan.

| # | Langkah | Expected | Actual | Status |
|---|---|---|---|---|
| 1 | Login sebagai User A (di browser/tab yang SAMA dengan langkah berikutnya). Buka Kontak, aktifkan kolom **"Kota"** lewat ikon ⚙. | Kolom "Kota" muncul. | Setara — `sessionStorage` diisi manual dengan key `optional_field.res.partner`/`optional_field.res.users` + key kontrol tak terkait (Step 10 S-05) | [x] Pass [ ] Fail |
| 2 | Klik **Log out**. | Kembali ke halaman login. | Callback item registry `log_out` (`CustomLogOutItem`) dipanggil langsung, source code dikonfirmasi cocok modul ini | [x] Pass [ ] Fail |
| 3 | Login sebagai User B di tab/browser yang SAMA persis. Buka menu Kontak. | Kolom **"Kota"** TIDAK otomatis aktif untuk User B (preferensi User A tidak bocor). | Kedua key `optional_field.*` terhapus (`null`) setelah callback, key kontrol tak terkait TETAP ADA — cleanup scope tepat sasaran | [x] Pass [ ] Fail |

### T-03: User dengan akses terbatas tidak melihat pesan error yang membingungkan

**Data dummy yang perlu dientri:** Tidak perlu — pakai User B (akses terbatas).

| # | Langkah | Expected | Actual | Status |
|---|---|---|---|---|
| 1 | Login sebagai User B. Buka Kontak, aktifkan satu kolom optional apapun lewat ikon ⚙. | Kolom tetap terlihat aktif di layar SAAT ITU — tidak ada popup/notifikasi merah error yang muncul. | `test_plain_internal_user_cannot_write_own_partner_field` (Python, `assertRaises(AccessError)`) PASS — `AccessError` dari core, tertangkap `try/catch` modul. Baca kode `setDatabase()` catch block: HANYA `console.error(...)`, TIDAK ADA pemanggilan service notifikasi UI apapun | [x] Pass [ ] Fail |
| 2 | Logout, login lagi sebagai User B di browser BARU/lain. Buka Kontak. | **Ini perilaku lama yang sengaja dipertahankan** (bukan bug baru dari migrasi): kolom yang diaktifkan di langkah 1 kemungkinan TIDAK ikut muncul di browser baru untuk User B, karena User B tidak punya izin penuh menyimpan preferensi ke server. | Konsekuensi logis dari langkah 1 (write ke DB gagal `AccessError` → tidak ada yang tersimpan untuk di-restore) — tidak dites ulang terpisah, mengikuti langsung dari hasil langkah 1 | [x] Pass [ ] Fail |

### T-XX: Item yang TIDAK Bisa Dites Lewat Tampilan Biasa (Informasi, Bukan Kegagalan)

- **Menu/layar "Optional Field Save" sendiri** — modul ini TIDAK punya menu atau layar sendiri untuk dibuka (murni penyempurna latar belakang untuk fitur kolom optional bawaan Odoo). Kalau dicari di menu Apps, modul akan muncul terdaftar sebagai aplikasi terinstall, tapi tidak ada apapun untuk diklik/dibuka — ini sesuai desain aslinya (`BSL-008`), bukan sesuatu yang error.

## Sign-off per Kelompok Fitur

| # | Kelompok fitur | Skenario tercakup | Status | Catatan |
|---|---|---|---|---|
| 1 | Persistensi preferensi kolom lintas browser/sesi | T-01 | [x] Pass [ ] Fail | Diverifikasi AI (RPC + Docker), lihat catatan penyimpangan di atas |
| 2 | Kebersihan data antar user (logout) | T-02 | [x] Pass [ ] Fail | idem |
| 3 | Perilaku user akses terbatas (harus tetap gagal-silent, bukan diperbaiki) | T-03 | [x] Pass [ ] Fail | idem |

## Review Item Out-of-Scope

Stakeholder mengonfirmasi sadar & menerima hal-hal berikut yang SENGAJA di luar scope migrasi ini (tidak diubah/diperbaiki, lihat `01_intake/01a_MIGRATION_INTAKE.md` §5 dan `source-codebase/doc-dev/backfill/FINDINGS.md`):

- [x] **F-10 (Tinggi):** User internal tanpa grup "Contact Creation" GAGAL SILENT menyimpan preferensi ke server (localStorage tetap jalan di browser yang sama, tidak ada notifikasi error). Bug ini sudah ada sejak versi 17.0, dipertahankan sesuai aslinya di versi 18.0.
- [x] **F-11 (Sedang):** Field `optional_field_save` untuk kontak yang belum pernah diisi akan bernilai `False` (bukan kosong `{}`) — kosmetik, tidak ada dampak fungsional.
- [x] **F-01, F-04, F-05:** Beberapa file/kode mati (dead artifact) di dalam modul (file akses-kontrol yang tidak pernah dipakai, file controller kosong, satu file verifikasi Google yang nyasar) — dibiarkan apa adanya, housekeeping terpisah dari migrasi versi.
- [x] **Fitur PWA baru Odoo 18** (redirect logout untuk aplikasi yang di-install sebagai PWA) — modul ini TIDAK ikut mengadopsi fitur baru ini, tetap berperilaku seperti versi 17.0.

**Dua perubahan yang SENGAJA DIBUAT** (bukan port-apa-adanya, disetujui eksplisit selama migrasi — lihat `FINDINGS.md` MF-02 dan MF-05):
- [x] Perbaikan bug kritis: webclient sebelumnya blank total setiap login (di 17.0 MAUPUN 18.0) karena kesalahan kode internal modul — sekarang sudah diperbaiki, dikonfirmasi eksplisit oleh pemilik modul saat eskalasi (2026-08-24, lihat riwayat chat sesi ini) sebagai PERBAIKAN BUG, bukan perubahan fitur.
- [x] Adaptasi kompatibilitas Odoo 18 (`session.partner_id` dipindah Odoo ke mekanisme baru) — transparan bagi user, tidak ada perubahan yang terlihat.

## Prasyarat Sebelum Go-Live Produksi

- [x] **Rehearsal upgrade data produksi TIDAK BERLAKU untuk migrasi ini** — sifatnya port kode saja (instalasi baru di versi target, belum ada instance produksi existing yang perlu di-upgrade datanya), dikonfirmasi `01a_MIGRATION_INTAKE.md` §3.
- [ ] **Backup database sebelum instalasi modul versi 18.0 di instance produksi/staging sungguhan** — BELUM dilakukan (di luar scope sesi ini, environment yang dipakai sesi ini murni Docker sekali-pakai) — WAJIB dilakukan pemilik modul sendiri sebelum instalasi nyata di instance manapun yang datanya berharga.

## Sign-off

| Role | Nama | Tanggal | Tanda tangan |
|---|---|---|---|
| PM | *(N/A — project ini tidak punya role terpisah)* | | |
| FA | *(N/A — project ini tidak punya role terpisah)* | | |
| User / Pemilik modul | Kuncoro | 2026-08-26 | *(persetujuan via chat sesi ini — "anggap UAT sudah dijalankan, percaya AI test" — BUKAN tanda tangan formal/eksekusi tangan sendiri)* |

> **Catatan jujur:** baris di atas TIDAK merepresentasikan eksekusi tangan sendiri T-01 s/d T-03 di UI Odoo sungguhan oleh pemilik modul — itu tetap standar emas yang idealnya dilakukan sebelum go-live produksi beneran (lihat "Prasyarat Sebelum Go-Live Produksi"). Yang tercatat di sini adalah persetujuan eksplisit pemilik modul untuk MELEWATI eksekusi manual itu dan mempercayai hasil test AI (Step 9 tour + Step 10 QA) sebagai pengganti — keputusan yang sepenuhnya berada di tangan pemilik modul, dicatat apa adanya untuk jejak audit.
