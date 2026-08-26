# UAT Checklist — Migrasi optional_field_save

**Step:** 11 — UAT Sign-off (final)
**Ref:** `05_acceptance/05a_MIGRATION_ACCEPTANCE_CRITERIA.md`, `10_qa/10_BUSINESS_FLOW_MIGRATION.md`
**Tanggal:** 2026-08-26

> Kriteria sukses: user TIDAK merasakan bedanya, kecuali item yang memang disepakati berubah (lihat "Review Item Out-of-Scope" di bawah).
>
> **Dokumen ini adalah skrip test siap-jalan untuk dijalankan sendiri oleh pemilik modul/stakeholder** — bukan laporan hasil dari AI. Kolom Actual/Status di bawah SENGAJA dikosongkan.

---

## Persiapan Sebelum UAT (Precondition & Data)

- [ ] Modul `optional_field_save` versi `18.0.1.0.0` sudah terinstall dan bisa diakses di environment staging/UAT (bukan production).
- [ ] Modul `contacts` (Odoo standar) ikut terinstall — dipakai sebagai contoh layar untuk uji coba, karena modul ini sendiri tidak punya layar/menu sendiri.
- [ ] Minimal **2 akun user berbeda** tersedia:
  - User A: akun apapun yang biasa dipakai sehari-hari.
  - User B: akun **standar/operasional** yang BUKAN Administrator dan tidak punya akses "Contact Creation" penuh (Settings > Users > cek grup "Extra Rights") — untuk skenario T-03.
- [ ] Minimal beberapa data Kontak contoh sudah ada di database (boleh data dummy).
- [ ] Database yang dipakai UAT sebaiknya salinan/staging.

## Skenario Test (Test Script)

### T-01: Preferensi kolom tabel Kontak tersimpan dan otomatis muncul lagi di browser lain

**Data dummy yang perlu dientri:** Tidak perlu entri data baru — cukup pakai akun User A dan data Kontak yang sudah ada.

| # | Langkah | Expected | Actual | Status |
|---|---|---|---|---|
| 1 | Login sebagai User A. Buka menu **Kontak**. Pastikan tampilan dalam mode **Daftar** (ikon daftar/list, bukan kartu). | Daftar kontak muncul dengan kolom standar (Nama, Telepon, Email, dst). | | [ ] Pass [ ] Fail |
| 2 | Klik ikon gerigi (⚙) di pojok kanan atas tabel. Centang kolom **"Handphone"** (kalau belum aktif). | Kolom "Handphone" langsung muncul di tabel. | | [ ] Pass [ ] Fail |
| 3 | Tunggu ±5 detik. Buka browser LAIN (atau mode Incognito/Private), login dengan akun User A yang SAMA. | Login berhasil normal. | | [ ] Pass [ ] Fail |
| 4 | Di browser baru itu, buka menu **Kontak** lagi. | Kolom **"Handphone"** SUDAH muncul otomatis, tidak perlu diaktifkan ulang. | | [ ] Pass [ ] Fail |

### T-02: Preferensi User A tidak "menempel" ke User B setelah logout

**Data dummy yang perlu dientri:** Tidak perlu — pakai User A dan User B yang sudah disiapkan.

| # | Langkah | Expected | Actual | Status |
|---|---|---|---|---|
| 1 | Login sebagai User A (di browser/tab yang SAMA dengan langkah berikutnya). Buka Kontak, aktifkan kolom **"Kota"** lewat ikon ⚙. | Kolom "Kota" muncul. | | [ ] Pass [ ] Fail |
| 2 | Klik **Log out**. | Kembali ke halaman login. | | [ ] Pass [ ] Fail |
| 3 | Login sebagai User B di tab/browser yang SAMA persis. Buka menu Kontak. | Kolom **"Kota"** TIDAK otomatis aktif untuk User B (preferensi User A tidak bocor). | | [ ] Pass [ ] Fail |

### T-03: User dengan akses terbatas tidak melihat pesan error yang membingungkan

**Data dummy yang perlu dientri:** Tidak perlu — pakai User B (akses terbatas).

| # | Langkah | Expected | Actual | Status |
|---|---|---|---|---|
| 1 | Login sebagai User B. Buka Kontak, aktifkan satu kolom optional apapun lewat ikon ⚙. | Kolom tetap terlihat aktif di layar SAAT ITU — tidak ada popup/notifikasi merah error yang muncul. | | [ ] Pass [ ] Fail |
| 2 | Logout, login lagi sebagai User B di browser BARU/lain. Buka Kontak. | **Ini perilaku lama yang sengaja dipertahankan** (bukan bug baru dari migrasi): kolom yang diaktifkan di langkah 1 kemungkinan TIDAK ikut muncul di browser baru untuk User B (berbeda dari User A di T-01), karena User B tidak punya izin penuh menyimpan preferensi ke server. Ini SEHARUSNYA terjadi, bukan kegagalan. | | [ ] Pass [ ] Fail |

### T-XX: Item yang TIDAK Bisa Dites Lewat Tampilan Biasa (Informasi, Bukan Kegagalan)

- **Menu/layar "Optional Field Save" sendiri** — modul ini TIDAK punya menu atau layar sendiri untuk dibuka (murni penyempurna latar belakang untuk fitur kolom optional bawaan Odoo). Kalau dicari di menu Apps, modul akan muncul terdaftar sebagai aplikasi terinstall, tapi tidak ada apapun untuk diklik/dibuka — ini sesuai desain aslinya (`BSL-008`), bukan sesuatu yang error.

## Sign-off per Kelompok Fitur

| # | Kelompok fitur | Skenario tercakup | Status | Catatan |
|---|---|---|---|---|
| 1 | Persistensi preferensi kolom lintas browser/sesi | T-01 | [ ] Pass [ ] Fail | |
| 2 | Kebersihan data antar user (logout) | T-02 | [ ] Pass [ ] Fail | |
| 3 | Perilaku user akses terbatas (harus tetap gagal-silent, bukan diperbaiki) | T-03 | [ ] Pass [ ] Fail | |

## Review Item Out-of-Scope

Stakeholder mengonfirmasi sadar & menerima hal-hal berikut yang SENGAJA di luar scope migrasi ini (tidak diubah/diperbaiki, lihat `01_intake/01a_MIGRATION_INTAKE.md` §5 dan `source-codebase/doc-dev/backfill/FINDINGS.md`):

- [ ] **F-10 (Tinggi):** User internal tanpa grup "Contact Creation" GAGAL SILENT menyimpan preferensi ke server (localStorage tetap jalan di browser yang sama, tidak ada notifikasi error). Bug ini sudah ada sejak versi 17.0, dipertahankan sesuai aslinya di versi 18.0.
- [ ] **F-11 (Sedang):** Field `optional_field_save` untuk kontak yang belum pernah diisi akan bernilai `False` (bukan kosong `{}`) — kosmetik, tidak ada dampak fungsional.
- [ ] **F-01, F-04, F-05:** Beberapa file/kode mati (dead artifact) di dalam modul (file akses-kontrol yang tidak pernah dipakai, file controller kosong, satu file verifikasi Google yang nyasar) — dibiarkan apa adanya, housekeeping terpisah dari migrasi versi.
- [ ] **Fitur PWA baru Odoo 18** (redirect logout untuk aplikasi yang di-install sebagai PWA) — modul ini TIDAK ikut mengadopsi fitur baru ini, tetap berperilaku seperti versi 17.0.

**Dua perubahan yang SENGAJA DIBUAT** (bukan port-apa-adanya, disetujui eksplisit selama migrasi — lihat `FINDINGS.md` MF-02 dan MF-05):
- [ ] Perbaikan bug kritis: webclient sebelumnya blank total setiap login (di 17.0 MAUPUN 18.0) karena kesalahan kode internal modul — sekarang sudah diperbaiki, konfirmasi stakeholder menyadari ini PERBAIKAN BUG, bukan perubahan fitur.
- [ ] Adaptasi kompatibilitas Odoo 18 (`session.partner_id` dipindah Odoo ke mekanisme baru) — transparan bagi user, tidak ada perubahan yang terlihat.

## Prasyarat Sebelum Go-Live Produksi

- [ ] **Rehearsal upgrade data produksi TIDAK BERLAKU untuk migrasi ini** — sifatnya port kode saja (instalasi baru di versi target, belum ada instance produksi existing yang perlu di-upgrade datanya), dikonfirmasi `01a_MIGRATION_INTAKE.md` §3.
- [ ] Backup database sebelum instalasi modul versi 18.0 di environment manapun (praktik baik standar, terlepas dari migrasi ini).

## Sign-off

| Role | Nama | Tanggal | Tanda tangan |
|---|---|---|---|
| PM | | | |
| FA | | | |
| User | | | |

> Kosongkan sampai stakeholder benar-benar menjalankan skenario T-01 s/d T-03 dengan tangan sendiri dan menyetujui.
