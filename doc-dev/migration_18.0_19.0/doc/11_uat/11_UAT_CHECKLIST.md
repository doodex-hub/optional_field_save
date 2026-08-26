# UAT Checklist — Migrasi optional_field_save

**Step:** 11 — UAT Sign-off (final)
**Ref:** `05_acceptance/05a_MIGRATION_ACCEPTANCE_CRITERIA.md`, `10_qa/10_BUSINESS_FLOW_MIGRATION.md`
**Tanggal:** 2026-08-26

> Kriteria sukses: user TIDAK merasakan bedanya, kecuali item yang memang disepakati berubah (lihat "Review Item Out-of-Scope" di bawah).
>
> **Dokumen ini adalah draft test script siap pakai untuk dijalankan sendiri oleh pemilik modul** — kolom Actual/Status di bawah SENGAJA dikosongkan, bukan diisi AI. Step 9 (Dev Testing) dan Step 10 (QA Testing) sudah lulus penuh lewat eksekusi otomatis/AI-interaktif (tour test browser nyata + verifikasi RPC langsung) — itu bukti teknis yang kuat, tapi BUKAN pengganti UAT. UAT baru bermakna kalau yang menjalankan adalah orang yang akan pakai sistem sehari-hari.

---

## Persiapan Sebelum UAT (Precondition & Data)

- [ ] Modul `optional_field_save` versi `19.0.1.0.0` sudah terinstall dan bisa diakses di environment yang akan dipakai UAT (staging/salinan, bukan produksi asli).
- [ ] Modul `contacts` (Odoo standar) ikut terinstall.
- [ ] Tersedia (atau siapkan) satu user role terbatas — Internal biasa TANPA grup "Contact Creation" ("Manajemen Kontak" di menu Users > Extra Rights) — untuk skenario T-03.
- [ ] Data Kontak contoh sudah ada (demo data bawaan `contacts`/`base`, atau kontak apa saja).
- [ ] Idealnya dijalankan di 2 browser/profil berbeda (atau 1 browser + 1 mode Incognito) untuk skenario T-01/T-02.

## Skenario Test (Test Script)

### T-01: Preferensi kolom tabel Kontak tersimpan dan otomatis muncul lagi di browser lain

**Data dummy yang perlu dientri:** Tidak perlu entri data baru — cukup pakai akun Anda sendiri dan data Kontak yang sudah ada.

| # | Langkah | Expected | Actual | Status |
|---|---|---|---|---|
| 1 | Login. Buka menu **Kontak**. Pastikan tampilan dalam mode **Daftar** (ikon daftar/list, bukan kartu). | Daftar kontak muncul dengan kolom standar (Nama, Telepon, Email, dst). | | [ ] Pass [ ] Fail |
| 2 | Klik ikon gerigi (⚙) di pojok kanan atas tabel. Centang satu kolom yang belum aktif (mis. **"Jalan"/"Street"**, atau kolom lain yang tersedia di dropdown). | Kolom yang dicentang langsung muncul di tabel. | | [ ] Pass [ ] Fail |
| 3 | Tunggu ±5 detik. Buka browser LAIN (atau mode Incognito/Private), login dengan akun yang SAMA. | Login berhasil normal. | | [ ] Pass [ ] Fail |
| 4 | Di browser baru itu, buka menu **Kontak** lagi. | Kolom yang dicentang di langkah 2 SUDAH muncul otomatis, tidak perlu diaktifkan ulang. | | [ ] Pass [ ] Fail |

### T-02: Preferensi Anda tidak "menempel" ke user lain setelah logout

**Data dummy yang perlu dientri:** Tidak perlu — pakai akun Anda dan satu akun lain (apa saja).

| # | Langkah | Expected | Actual | Status |
|---|---|---|---|---|
| 1 | Login sebagai diri Anda (di browser/tab yang SAMA dengan langkah berikutnya). Buka Kontak, aktifkan satu kolom optional lewat ikon ⚙. | Kolom muncul. | | [ ] Pass [ ] Fail |
| 2 | Klik **Log out**. | Kembali ke halaman login. | | [ ] Pass [ ] Fail |
| 3 | Login sebagai user LAIN di tab/browser yang SAMA persis. Buka menu Kontak. | Kolom yang tadi diaktifkan TIDAK otomatis aktif untuk user lain itu (preferensi Anda tidak bocor). | | [ ] Pass [ ] Fail |

### T-03: User dengan akses terbatas tidak melihat pesan error yang membingungkan

**Data dummy yang perlu dientri:** Tidak perlu — pakai user Internal biasa TANPA grup "Contact Creation" (disiapkan di §Persiapan).

| # | Langkah | Expected | Actual | Status |
|---|---|---|---|---|
| 1 | Login sebagai user akses-terbatas itu. Buka Kontak, aktifkan satu kolom optional apapun lewat ikon ⚙. | Kolom tetap terlihat aktif di layar SAAT ITU — tidak ada popup/notifikasi merah error yang muncul. | | [ ] Pass [ ] Fail |
| 2 | Logout, login lagi sebagai user yang sama di browser BARU/lain. Buka Kontak. | **Ini perilaku lama yang sengaja dipertahankan** (bukan bug baru dari migrasi): kolom yang diaktifkan di langkah 1 kemungkinan TIDAK ikut muncul di browser baru, karena user ini tidak punya izin penuh menyimpan preferensi ke server. | | [ ] Pass [ ] Fail |

### T-XX: Item yang TIDAK Bisa Dites Lewat Tampilan Biasa (Informasi, Bukan Kegagalan)

- **Menu/layar "Optional Field Save" sendiri** — modul ini TIDAK punya menu atau layar sendiri untuk dibuka (murni penyempurna latar belakang untuk fitur kolom optional bawaan Odoo, `application: False`). Kalau dicari di menu Apps, modul TIDAK akan muncul terdaftar sebagai aplikasi terinstall — ini sesuai desain aslinya (`BSL-008`), bukan sesuatu yang error.

## Sign-off per Kelompok Fitur

| # | Kelompok fitur | Skenario tercakup | Status | Catatan |
|---|---|---|---|---|
| 1 | Persistensi preferensi kolom lintas browser/sesi | T-01 | [ ] Pass [ ] Fail | |
| 2 | Kebersihan data antar user (logout) | T-02 | [ ] Pass [ ] Fail | |
| 3 | Perilaku user akses terbatas (harus tetap gagal-silent, bukan diperbaiki) | T-03 | [ ] Pass [ ] Fail | |

## Review Item Out-of-Scope

Stakeholder mengonfirmasi sadar & menerima hal-hal berikut yang SENGAJA di luar scope migrasi ini (tidak diubah/diperbaiki, lihat `01_intake/01a_MIGRATION_INTAKE.md` §5 dan `doc-dev/backfill/FINDINGS.md`):

- [ ] **F-10/MF-03 (Tinggi):** User internal tanpa grup "Contact Creation" GAGAL SILENT menyimpan preferensi ke server (localStorage tetap jalan di browser yang sama, tidak ada notifikasi error). Bug ini sudah ada sejak versi 17.0, dipertahankan sesuai aslinya di versi 19.0.
- [ ] **F-11/MF-04 (Sedang):** Field `optional_field_save` untuk kontak yang belum pernah diisi akan bernilai `False` (bukan kosong `{}`) — kosmetik, tidak ada dampak fungsional.
- [ ] **F-01, F-04, F-05:** Beberapa file/kode mati (dead artifact) di dalam modul (file akses-kontrol yang tidak pernah dipakai, file controller kosong, satu file verifikasi Google yang nyasar) — dibiarkan apa adanya, housekeeping terpisah dari migrasi versi.
- [ ] **Perubahan native Odoo 19.0 di luar kendali modul ini:** kolom "Mobile" yang dulu bisa diaktifkan di tabel Kontak (versi 18.0) SUDAH TIDAK ADA LAGI di versi 19.0 (dihapus Odoo sendiri dari tampilan standar Kontak, bukan oleh modul ini) — kalau sebelumnya terbiasa mengaktifkan kolom itu, sekarang perlu pilih kolom lain yang tersedia di dropdown ⚙ (mis. "Jalan"/"Street", "Kota"/"City", dst).

**Tidak ada perubahan business logic yang sengaja dibuat di migrasi 18→19 ini** (beda dari migrasi 17→18 sebelumnya yang punya 2 perubahan disengaja, MF-02/MF-05) — seluruh mekanisme inti modul dikonfirmasi stabil, cuma 2 penyesuaian teknis murni (versi manifest, dan kompatibilitas nama field internal Odoo `res.users.groups_id`→`group_ids` di test — tidak terlihat user).

## Prasyarat Sebelum Go-Live Produksi

- [x] **Rehearsal upgrade data produksi TIDAK BERLAKU untuk migrasi ini** — sifatnya port kode saja (instalasi baru di versi target, belum ada instance produksi existing yang perlu di-upgrade datanya), dikonfirmasi `01a_MIGRATION_INTAKE.md` §3.
- [ ] **Backup database sebelum instalasi modul versi 19.0 di instance produksi/staging sungguhan** — BELUM dilakukan (di luar scope sesi ini, environment yang dipakai sesi ini murni Docker sekali-pakai) — WAJIB dilakukan pemilik modul sendiri sebelum instalasi nyata di instance manapun yang datanya berharga.

## Sign-off

| Role | Nama | Tanggal | Tanda tangan |
|---|---|---|---|
| PM | | | |
| FA | | | |
| User / Pemilik modul | | | |

> Kosongkan sampai stakeholder benar-benar menjalankan skenario T-01 s/d T-03 dengan tangan sendiri dan menyetujui.
