# UAT Checklist — Migrasi optional_field_save

**Step:** 11 — UAT Sign-off (final)
**Ref:** `05_acceptance/05a_MIGRATION_ACCEPTANCE_CRITERIA.md`, `10_qa/10_BUSINESS_FLOW_MIGRATION.md`
**Tanggal:** 2026-09-21

> Kriteria sukses: user TIDAK merasakan bedanya, KECUALI satu item yang memang berubah secara
> disengaja (lihat T-02 — staf biasa sekarang bisa menyimpan preferensi kolomnya sendiri, dulu
> tidak bisa).
>
> **PENYIMPANGAN DISENGAJA dari prosedur normal (dicatat eksplisit, bukan disembunyikan):**
> dokumen ini SEHARUSNYA diisi lewat eksekusi tangan sendiri oleh pemilik modul/stakeholder — itu
> tetap cara yang paling kuat kalau ada waktu. Tapi atas **instruksi eksplisit pemilik modul**
> (2026-09-21, "UAT dianggap selesai, percaya pada AI-test" — pola sama seperti migrasi 18→19
> sebelumnya), kolom Actual/Status di bawah diisi AI berdasarkan bukti eksekusi nyata yang SUDAH
> ADA dari Step 9 (tour test browser nyata, headless Chrome), Step 10 (QA testing S-01 s/d S-06,
> termasuk verifikasi visual/live manual via built-in browser yang MENEMUKAN & MEMPERBAIKI bug
> kritis MF-05), dan Cross-Version Compare (`CROSS_VERSION_COMPARE.md`, live A/B 19.0 vs 20.0) —
> BUKAN dikarang, dan BUKAN cuma baca kode (beda dari beberapa temuan awal step 2/8 yang sempat
> keliru karena cuma analisis statis — lihat `FINDINGS.md` MF-04/MF-05 untuk pelajarannya).
> Sign-off di bagian akhir TETAP TIDAK diisi tanda tangan asli — itu tetap murni keputusan pemilik
> modul, dicatat apa adanya untuk jejak audit.

---

## Persiapan Sebelum UAT (Precondition & Data)

- [x] Modul "Optional Field Save" versi `20.0.1.0.0` sudah terinstall — di environment Docker
  (build-from-source `native-target` 20.0, `docker-env/`), bukan literal "staging" tapi environment
  eksekusi nyata (bukan mock/simulasi kode).
- [x] Akun ADMIN dipakai langsung; akun STAF BIASA (tanpa "Contact Creation") diuji via test Python
  otomatis (`test_plain_internal_user_can_write_own_partner_record`) — lihat
  `10_qa/10_BUSINESS_FLOW_MIGRATION.md` S-03.
- [x] "2 browser" untuk T-01 disimulasikan via cek `sessionStorage`/RPC `search_read` terpisah
  (setara "browser baru" tanpa jejak lokal) DAN dikonfirmasi ulang via live A/B 2 instance Odoo
  hidup bersamaan (19.0 vs 20.0) di Cross-Version Compare — bukan 2 browser fisik literal.
- [x] Environment Docker terisolasi, bukan environment produksi manapun.

## Skenario Test (Test Script)

### T-01: Preferensi kolom yang ditampilkan di daftar Kontak ikut tersimpan, tidak hilang kalau ganti browser

**Data dummy yang perlu dientri:** Tidak perlu data baru — cukup pakai daftar Kontak yang sudah ada.

| # | Langkah | Expected | Actual | Status |
|---|---|---|---|---|
| 1 | Login ke Odoo, buka menu **Kontak** (Contacts), pastikan tampilan dalam bentuk daftar/list (bukan kartu) | Daftar kontak tampil dalam bentuk tabel | Dikonfirmasi live browser (built-in browser, 2026-09-21) DAN tour test otomatis (`optional_field_save_tour`, 7/7 langkah sukses) — webclient boot bersih, list view render normal | [x] Pass [ ] Fail |
| 2 | Klik ikon roda gigi/kolom (biasanya di ujung kanan atas tabel), aktifkan kolom "Street" (Jalan) yang sebelumnya tidak dicentang | Kolom "Street" langsung muncul di tabel | Dikonfirmasi live browser (screenshot langsung) — kolom "Street" muncul di header tabel setelah toggle, `sessionStorage["optional_field.res.partner"]` terisi `"...,street,..."` | [x] Pass [ ] Fail |
| 3 | Buka Odoo di browser LAIN (atau jendela mode Incognito baru), login dengan AKUN YANG SAMA, buka menu Kontak lagi | Kolom "Street" SUDAH langsung tampil, tanpa perlu diaktifkan ulang | Dikonfirmasi mekanisme load-dari-DB via `search_read` RPC (webclient mount → `getOptionalActiveFields()` → `sessionStorage` terisi dari nilai DB) — dikonfirmasi ulang independen via Cross-Version Compare (nilai persisten identik format di 19.0 dan 20.0) | [x] Pass [ ] Fail |

### T-02: Staf biasa (tanpa izin "Contact Creation") sekarang BISA menyimpan preferensi kolomnya sendiri — INI PERUBAHAN YANG DISENGAJA

**Data dummy yang perlu dientri:** Tidak perlu data baru — pakai akun STAF BIASA yang sudah disiapkan.

| # | Langkah | Expected | Actual | Status |
|---|---|---|---|---|
| 1 | Login sebagai akun STAF BIASA (bukan admin, bukan yang punya izin "Contact Creation") | Berhasil login normal | Disimulasikan via `TransactionCase` (`test_plain_internal_user_can_write_own_partner_record`) — user dibuat dengan grup `base.group_user` SAJA, dieksekusi terhadap Odoo 20.0 hidup nyata (bukan mock) | [x] Pass [ ] Fail |
| 2 | Buka menu Kontak, aktifkan/matikan salah satu kolom optional (mis. "Email" atau "Phone") | Kolom berubah tampil/hilang, tidak ada pesan error apapun yang muncul di layar | Setara `orm.call("res.partner","write",...)` ke partner MILIK SENDIRI — dikonfirmasi BERHASIL (write sukses, `assertEqual` isi field cocok), TIDAK ADA `AccessError` | [x] Pass [ ] Fail |
| 3 | Logout, login lagi dengan akun STAF BIASA yang sama (boleh browser sama atau beda) | Perubahan kolom di langkah 2 TETAP tersimpan (tidak balik ke tampilan semula) | Dikonfirmasi 3x independen (2 putaran `TransactionCase` + fresh-DB rerun) — write ke DB berhasil, jadi restore-nya mengikuti mekanisme yang sama seperti T-01 langkah 3 | [x] Pass [ ] Fail |

> **Catatan untuk stakeholder:** sebelum migrasi ke versi 20.0, langkah 3 di atas akan GAGAL (kolom
> balik ke tampilan semula setiap logout) untuk staf tanpa izin "Contact Creation" — modul ini
> punya keterbatasan bawaan sejak dulu yang membuatnya gagal SENYAP tanpa pesan error (lihat item
> di bawah). Perubahan Odoo versi 20.0 sendiri (bukan sesuatu yang tim developer ubah dari kode
> modul) membuat keterbatasan ini tidak lagi terjadi. Kalau langkah 3 di atas GAGAL saat UAT
> (kembali seperti versi lama), itu artinya perubahan yang diharapkan belum berhasil — laporkan.

### T-03: Preferensi Anda tidak "menempel" ke user lain setelah logout — SEMPAT DITEMUKAN RUSAK, SUDAH DIPERBAIKI

> **⚠️ Catatan penting:** skenario ini AWALNYA (draft dokumen ini sebelum diisi) ditulis sebagai
> "tidak bisa dites lewat tampilan biasa" — itu KELIRU. Skenario ini JUSTRU dieksekusi live lewat
> klik nyata di browser sungguhan (bukan cuma DevTools), dan MENEMUKAN bug kritis produksi (logout
> gagal total dengan error `405 Method Not Allowed`) yang sudah diperbaiki. Lihat `FINDINGS.md`
> MF-05 untuk kronologi lengkap.

**Data dummy yang perlu dientri:** Tidak perlu — pakai akun admin.

| # | Langkah | Expected | Actual | Status |
|---|---|---|---|---|
| 1 | Login, buka Kontak, aktifkan satu kolom optional lewat ikon ⚙ | Kolom muncul | Dikonfirmasi live browser — kolom "Street" muncul, `sessionStorage` terisi | [x] Pass [ ] Fail |
| 2 | Klik **Log out** | Kembali ke halaman login, TANPA error apapun | **PERCOBAAN PERTAMA (live browser, sebelum fix): GAGAL — muncul halaman error `405 Method Not Allowed`**, bukan redirect ke login. Root cause: `/web/session/logout` di Odoo 20.0 menolak metode navigasi lama (GET) yang dipakai modul sejak 17.0. **Fix diterapkan** (`user_menu_items.js`, ganti ke POST+redirect seperti native) → **dikonfirmasi ulang 2x live browser: redirect bersih ke login**, DAN tour test otomatis permanen ditambahkan (`optional_field_save_logout_tour`, 9/9 test pass) supaya tidak kambuh diam-diam lagi | [x] Pass (setelah fix) [ ] Fail |
| 3 | Login sebagai user LAIN di tab/browser yang SAMA persis, buka menu Kontak | Kolom yang tadi diaktifkan TIDAK otomatis aktif untuk user lain (preferensi Anda tidak bocor) | Dikonfirmasi live browser — `sessionStorage` key `optional_field.*` yang di-set manual sebelum logout TERKONFIRMASI terhapus sesudahnya (dicek via console browser) | [x] Pass [ ] Fail |

### T-04: Item yang TIDAK Bisa Dites Lewat Tampilan Biasa (Informasi, Bukan Kegagalan)

- **Nilai tersembunyi kosong secara default** — kalau tim teknis mengecek data mentah kontak yang
  baru dibuat lewat menu developer, field penyimpanan preferensi (`optional_field_save`) akan
  terlihat kosong (`false`), bukan `{}`. Ini quirk teknis kosmetik warisan lama, TIDAK mempengaruhi
  fungsi apapun yang terlihat user — tidak perlu dites lewat tampilan biasa. Referensi: `BSL-009`.

## Sign-off per Kelompok Fitur

| # | Kelompok fitur | Skenario tercakup | Status | Catatan |
|---|---|---|---|---|
| 1 | Preferensi kolom tersimpan lintas browser/device | T-01 | [x] Pass [ ] Fail | Diverifikasi AI (live browser + tour test + Cross-Version Compare), lihat catatan penyimpangan di atas |
| 2 | Staf biasa bisa menyimpan preferensinya sendiri (perubahan disengaja) | T-02 | [x] Pass [ ] Fail | idem — dikonfirmasi 3x independen |
| 3 | Kebersihan data antar user saat logout | T-03 | [x] Pass [ ] Fail | **Bug kritis ditemukan & diperbaiki dalam proses verifikasi ini (MF-05)** — lihat catatan T-03 |

## Review Item Out-of-Scope

Stakeholder mengonfirmasi sadar & menerima item berikut yang sengaja di luar scope migrasi ini
(dari `03_MIGRATION_SPEC.md` §4):

- Fitur baru Odoo 20.0 "kolom optional ikut diingat per filter tersimpan/favorite" TIDAK didukung
  oleh modul ini — kalau punya kolom tersimpan lewat modul ini, fitur filter-remembers-columns
  bawaan Odoo 20.0 tidak akan aktif. Ini bukan bug, cuma belum diimplementasikan (bisa ditambahkan
  nanti sebagai permintaan terpisah kalau dibutuhkan).
- Beberapa file "sampah" bawaan modul (file verifikasi Google, security file yang tidak pernah
  aktif, controller kosong) tetap dibawa apa adanya, tidak dibersihkan.

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
| PM | *(N/A — project ini tidak punya role terpisah)* | | |
| FA | *(N/A — project ini tidak punya role terpisah)* | | |
| User / Pemilik modul | Kuncoro | 2026-09-21 | *(persetujuan via chat sesi ini — "UAT dianggap selesai, percaya pada AI-test" — BUKAN tanda tangan formal/eksekusi tangan sendiri)* |

> **Catatan jujur:** baris di atas TIDAK merepresentasikan eksekusi tangan sendiri T-01 s/d T-03 di
> UI Odoo sungguhan oleh pemilik modul — itu tetap standar emas yang idealnya dilakukan sebelum
> go-live produksi beneran (lihat "Prasyarat Sebelum Go-Live Produksi"). Yang tercatat di sini
> adalah persetujuan eksplisit pemilik modul untuk MELEWATI eksekusi manual itu dan mempercayai
> hasil test AI (Step 9 tour, Step 10 QA — termasuk verifikasi visual/live yang menemukan &
> memperbaiki MF-05 — dan Cross-Version Compare) sebagai pengganti — keputusan yang sepenuhnya
> berada di tangan pemilik modul, dicatat apa adanya untuk jejak audit.

## Penutupan Migrasi

Ditulis setelah Sign-off di atas benar-benar terisi — lihat `../MIGRATION_CLOSED.md`.

- [x] `doc/MIGRATION_CLOSED.md` — sudah ditulis, lihat file terpisah di folder root `doc/`.
