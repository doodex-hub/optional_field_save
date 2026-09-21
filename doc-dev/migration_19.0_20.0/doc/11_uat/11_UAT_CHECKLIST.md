# UAT Checklist — Migrasi optional_field_save

**Step:** 11 — UAT Sign-off (final)
**Ref:** `05_acceptance/05a_MIGRATION_ACCEPTANCE_CRITERIA.md`, `10_qa/10_BUSINESS_FLOW_MIGRATION.md`
**Tanggal:** 2026-09-21

> Kriteria sukses: user TIDAK merasakan bedanya, KECUALI satu item yang memang berubah secara
> disengaja (lihat T-02 — staf biasa sekarang bisa menyimpan preferensi kolomnya sendiri, dulu
> tidak bisa).
>
> **Dokumen ini adalah draft skrip test siap pakai untuk dijalankan SENDIRI oleh business
> user/stakeholder** — bukan laporan hasil test AI. Kolom Actual dan Status di bawah **SENGAJA
> dikosongkan**, belum diisi AI.

---

## Persiapan Sebelum UAT (Precondition & Data)

- [ ] Modul "Optional Field Save" versi 20.0 sudah terinstall di environment yang akan dipakai UAT.
- [ ] Tersedia minimal 2 akun user untuk login: (a) satu akun ADMIN, (b) satu akun STAF BIASA yang
  **TIDAK** punya izin "Contact Creation" (cek: Pengaturan → Users → klik user tersebut → tab
  "Access Rights" → grup "Contacts" harus kosong/tidak dicentang).
- [ ] Ada minimal 2 browser berbeda TERSEDIA untuk login sebagai user yang sama secara bersamaan
  (mis. Chrome + Firefox, atau Chrome normal + Chrome mode Incognito) — dibutuhkan untuk T-01.
- [ ] Sebaiknya database yang dipakai UAT adalah **salinan/staging**, bukan database produksi asli.

## Skenario Test (Test Script)

### T-01: Preferensi kolom yang ditampilkan di daftar Kontak ikut tersimpan, tidak hilang kalau ganti browser

**Data dummy yang perlu dientri:** Tidak perlu data baru — cukup pakai daftar Kontak yang sudah ada.

| # | Langkah | Expected | Actual | Status |
|---|---|---|---|---|
| 1 | Login ke Odoo, buka menu **Kontak** (Contacts), pastikan tampilan dalam bentuk daftar/list (bukan kartu) | Daftar kontak tampil dalam bentuk tabel | | [ ] Pass [ ] Fail |
| 2 | Klik ikon roda gigi/kolom (biasanya di ujung kanan atas tabel), aktifkan kolom "Street" (Jalan) yang sebelumnya tidak dicentang | Kolom "Street" langsung muncul di tabel | | [ ] Pass [ ] Fail |
| 3 | Buka Odoo di browser LAIN (atau jendela mode Incognito baru), login dengan AKUN YANG SAMA, buka menu Kontak lagi | Kolom "Street" SUDAH langsung tampil, tanpa perlu diaktifkan ulang | | [ ] Pass [ ] Fail |

### T-02: Staf biasa (tanpa izin "Contact Creation") sekarang BISA menyimpan preferensi kolomnya sendiri — INI PERUBAHAN YANG DISENGAJA

**Data dummy yang perlu dientri:** Tidak perlu data baru — pakai akun STAF BIASA yang sudah disiapkan.

| # | Langkah | Expected | Actual | Status |
|---|---|---|---|---|
| 1 | Login sebagai akun STAF BIASA (bukan admin, bukan yang punya izin "Contact Creation") | Berhasil login normal | | [ ] Pass [ ] Fail |
| 2 | Buka menu Kontak, aktifkan/matikan salah satu kolom optional (mis. "Email" atau "Phone") | Kolom berubah tampil/hilang, tidak ada pesan error apapun yang muncul di layar | | [ ] Pass [ ] Fail |
| 3 | Logout, login lagi dengan akun STAF BIASA yang sama (boleh browser sama atau beda) | Perubahan kolom di langkah 2 TETAP tersimpan (tidak balik ke tampilan semula) | | [ ] Pass [ ] Fail |

> **Catatan untuk stakeholder:** sebelum migrasi ke versi 20.0, langkah 3 di atas akan GAGAL (kolom
> balik ke tampilan semula setiap logout) untuk staf tanpa izin "Contact Creation" — modul ini
> punya keterbatasan bawaan sejak dulu yang membuatnya gagal SENYAP tanpa pesan error (lihat item
> di bawah). Perubahan Odoo versi 20.0 sendiri (bukan sesuatu yang tim developer ubah dari kode
> modul) membuat keterbatasan ini tidak lagi terjadi. Kalau langkah 3 di atas GAGAL saat UAT
> (kembali seperti versi lama), itu artinya perubahan yang diharapkan belum berhasil — laporkan.

### T-03: Item yang TIDAK Bisa Dites Lewat Tampilan Biasa (Informasi, Bukan Kegagalan)

- **Nilai tersembunyi kosong secara default** — kalau tim teknis mengecek data mentah kontak yang
  baru dibuat lewat menu developer, field penyimpanan preferensi (`optional_field_save`) akan
  terlihat kosong (`false`), bukan `{}`. Ini quirk teknis kosmetik warisan lama, TIDAK mempengaruhi
  fungsi apapun yang terlihat user — tidak perlu dites lewat tampilan biasa. Referensi: `BSL-009`.
- **Pembersihan data sesi saat logout** — modul ini membersihkan data sementara browser
  (`sessionStorage`) saat user logout, supaya preferensi kolom user sebelumnya tidak "kebaca"
  sesaat oleh user berikutnya di tab yang sama. Ini teknis di balik layar (bisa dicek lewat
  DevTools browser, F12 → Application → Session Storage), TIDAK ada tampilan UI yang perlu diklik
  user untuk memverifikasi — kalau stakeholder tetap ingin memverifikasi, lihat
  `10_qa/human_qa/04_NEGATIVE.md` untuk langkah teknisnya. Referensi: `BSL-007`.

## Sign-off per Kelompok Fitur

| # | Kelompok fitur | Skenario tercakup | Status | Catatan |
|---|---|---|---|---|
| 1 | Preferensi kolom tersimpan lintas browser/device | T-01 | [ ] Pass [ ] Fail | |
| 2 | Staf biasa bisa menyimpan preferensinya sendiri (perubahan disengaja) | T-02 | [ ] Pass [ ] Fail | |

## Review Item Out-of-Scope

Stakeholder mengonfirmasi sadar & menerima item berikut yang sengaja di luar scope migrasi ini
(dari `03_MIGRATION_SPEC.md` §4):

- Fitur baru Odoo 20.0 "kolom optional ikut diingat per filter tersimpan/favorite" TIDAK didukung
  oleh modul ini — kalau punya kolom tersimpan lewat modul ini, fitur filter-remembers-columns
  bawaan Odoo 20.0 tidak akan aktif. Ini bukan bug, cuma belum diimplementasikan (bisa ditambahkan
  nanti sebagai permintaan terpisah kalau dibutuhkan).
- Beberapa file "sampah" bawaan modul (file verifikasi Google, security file yang tidak pernah
  aktif, controller kosong) tetap dibawa apa adanya, tidak dibersihkan.
- Pembersihan sesi saat logout (lihat T-03) belum pernah diverifikasi lewat klik-manual oleh
  siapapun sejak modul ini pertama dibuat — bukan regresi migrasi ini, tapi tetap item terbuka.

## Prasyarat Sebelum Go-Live Produksi

- [ ] Rehearsal upgrade sungguhan (kalau instalasi produksi nanti adalah upgrade dari instance 19.0
  yang sudah berjalan dengan data nyata, bukan instalasi baru kosong seperti yang diasumsikan
  migrasi ini) — **WAJIB dilakukan terpisah**, migrasi ini diasumsikan "port kode saja, instalasi
  baru" (dikonfirmasi di intake), belum pernah diuji sebagai upgrade data produksi nyata.
- [ ] Backup database produksi sebelum upgrade nyata (kalau berlaku sesuai poin di atas).
- [x] README modul sudah direview dan diperbaiki (versi Odoo lama yang disebut di `README.md`/
  `LISEZMOI.md` sudah diupdate ke 20.0, lihat `06_implementation/06c_IMPLEMENTATION_LOG.md` Fase A6).

## Sign-off

| Role | Nama | Tanggal | Tanda tangan |
|---|---|---|---|
| PM | | | |
| FA | | | |
| User | | | |

> Kosongkan sampai stakeholder benar-benar menjalankan skenario T-01/T-02 dengan tangan sendiri.

## Penutupan Migrasi

Ditulis setelah Sign-off di atas benar-benar terisi oleh stakeholder — lihat `templates/MIGRATION_CLOSED.md` untuk formatnya. **BELUM ditulis di sesi ini** (menunggu sign-off manusia, bukan tugas AI).

- [ ] `doc/MIGRATION_CLOSED.md` — belum ditulis, menunggu sign-off di atas.
