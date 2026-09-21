# Test Plan (Migrasi) — optional_field_save

**Step:** 5 — Acceptance Criteria & Test Plan (satu paket dengan `05a_MIGRATION_ACCEPTANCE_CRITERIA.md`)
**Ref:** `05_acceptance/05a_MIGRATION_ACCEPTANCE_CRITERIA.md`
**Tanggal:** 2026-09-21

---

## Step 9 — Dev Testing

> Eksekusi: otomatis/background — `odoo-bin -i optional_field_save --test-enable --test-tags /optional_field_save --stop-after-init`. Fase E (JS/Owl) **applicable** untuk modul ini (intake §2b) — tour test WAJIB disertakan, bukan cuma backend.

| AC | Deskripsi | Unit | Integration | Tour (Owl/JS) |
|---|---|---|---|---|
| AC-01-01/02/03 | Load & restore preferensi saat mount | — | Diverifikasi tidak langsung lewat tour (sessionStorage terisi setelah load) — tidak ada unit test Python terpisah untuk logic JS ini (sesuai desain warisan 18→19) | `optional_field_save_tour.js` via `test_optional_field_save_tour.py::test_optional_field_save_tour` — meng-cover write path; load path (webclient.js `getOptionalActiveFields()`) diverifikasi via RPC langsung (bukan tour), lihat catatan scope di komentar tour file |
| AC-02-01/02/03 | Toggle & simpan preferensi (`setDatabase`) | `test_optional_field_save.py::test_write_and_read_roundtrip_matches_js_pattern` (round-trip Python, mensimulasikan pola `setDatabase()`) | Sama seperti Unit — test ini sekaligus integration (create+write+read partner nyata) | `optional_field_save_tour.js` — toggle kolom "Street", assert `th[data-name='street']` muncul DAN `sessionStorage` ter-set setelah write sukses |
| AC-03-01/02 | Cleanup logout (sessionStorage) | — | — | **Tidak ada tour test warisan untuk logout flow** — GAP kecil warisan dari 18→19, di luar scope memperbaiki cakupan test di migrasi port-kode ini (dicatat, tidak ditambah baru kecuali user minta) |
| AC-04-01 | Entry point/instalasi | Implisit — `-i optional_field_save --stop-after-init` sukses TANPA error TERMASUK loading `web.assets_backend` (memverifikasi fix DIFF-02 tidak break bundle) | — | — |
| AC-05-01 | `default={}` → `False` | `test_optional_field_save.py::test_new_partner_default_is_falsy_not_empty_dict` | Sama (create partner nyata) | — |
| **AC-05-02** | **Self-write `base.group_user` — RESOLVED, write BERHASIL (DIFF-03/MF-01 CLOSED, 2 putaran)** | `test_optional_field_save.py::test_plain_internal_user_can_write_own_partner_record` (BARU, ditambahkan step 8) — **PASS, dikonfirmasi 2x termasuk fresh-DB run.** Test warisan `test_plain_internal_user_cannot_write_own_partner_field` (skenario BEDA — partner tak terkait) tetap PASS, TIDAK diedit. Lihat `FINDINGS.md` MF-01 untuk kronologi lengkap (2 putaran verifikasi, kesimpulan-antara yang sempat salah di putaran 1). | Sama seperti Unit | — |
| AC-05-03 | Self-write `group_partner_manager` (companion, tidak terpengaruh) | `test_optional_field_save.py::test_user_with_partner_manager_group_can_write` | Sama | — |
| AC-06 (informational) | Dead artifact (BSL-011/012/013) | — | — | — (tidak butuh test eksekusi, cukup review kode step 8) |

**Audit Kesiapan Test (9a, ringkas):** 4 method test Python (`test_optional_field_save.py`) — SEMUA
berisi assertion nyata (bukan stub/docstring kosong), dikonfirmasi lewat baca isi lengkap sesi step 4
(bukan cuma `grep -c "def test_"`). 1 method tour Python (`test_optional_field_save_tour.py`) — cuma
1 baris `self.start_tour(...)`, valid (bukan stub, memang cukup 1 baris untuk delegasi ke tour JS).
Total 5 method test, seluruhnya "Lengkap" (bukan Stub/Tidak ada) — cakupan step 9 sudah representatif
untuk baseline yang terdokumentasi, TIDAK perlu audit tambahan gaya `totp_enhancement`.

## Step 10 — QA Testing

> Modul ini kecil, murni backend-enhancer tanpa UI tersendiri — regresi UI utama (toggle kolom,
> load preferensi) SUDAH tercakup tour test step 9. Step 10 di sini fokus ke skenario yang tour
> TIDAK cover: cross-browser (localStorage/sessionStorage per-browser, load ulang lintas browser
> beneran) dan skenario ACL dua-user (AC-05-02) di staging nyata (bukan `TransactionCase` sintetis).

| AC | Deskripsi | Manual | AI-interaktif | AI+tool eksternal (ref script) |
|---|---|---|---|---|
| AC-01/AC-02 (end-to-end lintas browser) | Toggle kolom di Browser A, buka Browser B (user sama) — preferensi harus ikut muncul | Manual — butuh 2 browser/profile fisik berbeda, tidak bisa disimulasikan tour headless single-browser | — | — |
| AC-03 (cleanup logout, lintas tab) | Logout di satu tab, cek sessionStorage tab lain (jendela browser sama) tidak lagi terbaca oleh user login berikutnya | Manual | — | — |
| **AC-05-02 (staging nyata, 2 user)** | Login sebagai user `base.group_user` biasa (bukan admin, bukan `TransactionCase` sintetis) di staging 20.0, toggle kolom optional — **ekspektasi terkonfirmasi step 8/9: persist ke DB SEKARANG berhasil** (beda dari 19.0), konfirmasi UI juga mencerminkan ini (tidak ada gejala silent-fail tersisa di browser) | **AI-interaktif** (Claude in Chrome) — cek staging nyata, screenshot state sebelum/sesudah, konfirmasi silang dengan hasil step 8/9 | AI-interaktif (lihat kolom sebelah) | — |

## Step 11 — UAT

> Tool cuma generate skrip test-nya — eksekusi & pengisian Actual/Status/Sign-off 100% manual business user.

| Kelompok fitur | AC tercakup | UAT |
|---|---|---|
| Persistensi kolom optional lintas browser/device | AC-01, AC-02 | Business user login browser berbeda, konfirmasi kolom yang dipilih sebelumnya muncul otomatis |
| Cleanup saat logout | AC-03 | Business user logout, login user lain di browser/device yang sama, konfirmasi tidak melihat preferensi user sebelumnya |
| Perilaku ACL user biasa vs Contact Creation | AC-05-02, AC-05-03 | Business user (kalau ada akun test dengan grup berbeda) mengonfirmasi: SEKARANG user biasa (tanpa Contact Creation) tetap bisa persist preferensinya sendiri — perubahan positif dibanding 19.0, sign-off eksplisit mencatat perubahan behavior ini |

## Ringkasan

| Step | Role | Tipe | Eksekusi | Jumlah AC |
|---|---|---|---|---|
| 9 | Developer | Unit/Integration/Tour (Owl/JS) | Otomatis/background (semua, termasuk tour) | 8 dari 8 AC fungsional (AC-06 informational, tidak dihitung) |
| 10 | QA | Manual/AI-interaktif | Campuran — lintas browser manual, skenario ACL 2-user AI-interaktif di staging | 3 skenario (AC-01/02 gabungan, AC-03, AC-05-02) |
| 11 | PM/FA/User | UAT | Manual (selalu) | 3 kelompok fitur |
