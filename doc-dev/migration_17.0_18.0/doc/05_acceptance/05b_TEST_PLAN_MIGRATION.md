# Test Plan (Migrasi) — optional_field_save

**Step:** 5 — Acceptance Criteria & Test Plan (satu paket dengan `05a_MIGRATION_ACCEPTANCE_CRITERIA.md`)
**Ref:** `05_acceptance/05a_MIGRATION_ACCEPTANCE_CRITERIA.md`
**Tanggal:** 2026-08-24

---

## Step 9 — Dev Testing

> Eksekusi: `odoo-bin -i optional_field_save --test-enable --test-tags /optional_field_save --stop-after-init`. Modul sudah punya 4 test Python dari backfill (`source-codebase/optional_field_save/tests/test_optional_field_save.py`, dikonfirmasi ISI-nya bukan stub — 4 method dengan assertion nyata) yang mencakup AC-01 (implicit), AC-02-03, AC-02-04, AC-06-01 di level ORM — tinggal di-copy ke `target-codebase` di Step 6, tidak perlu ditulis ulang dari nol. **Owl/JS (AC-02-02, AC-03-01, AC-04-01, AC-07-01) WAJIB lewat tour test (`HttpCase.start_tour`)** — backfill TIDAK PERNAH menguji ini secara browser nyata (lihat MF-02), jadi tour test di sini BUKAN cuma port, tapi verifikasi baru yang genuinely belum pernah dijalankan.

| AC | Deskripsi | Unit | Integration | Tour (Owl/JS) |
|---|---|---|---|---|
| AC-01-01 | Instalasi modul sukses di 18.0 | — | ✅ (implicit via `-i` + `--stop-after-init`) | — |
| AC-02-01 | Toggle kolom → DB+localStorage+sessionStorage ter-update | — | ✅ `test_write_and_read_roundtrip_matches_js_pattern` (bagian DB saja — level ORM, tidak cover localStorage/sessionStorage) | ✅ (verifikasi localStorage/sessionStorage butuh browser nyata) |
| AC-02-02 | Load preferensi dari DB saat browser lain (KRITIS — verifikasi MF-01) | — | — | ✅ **WAJIB baru**, belum pernah ada di backfill |
| AC-02-03 | Partner baru/lama sama-sama `False` | ✅ `test_new_partner_default_is_falsy_not_empty_dict` (copy langsung) | — | — |
| AC-02-04 | `setDatabase()` handle `old_value` falsy tanpa crash | ✅ `test_new_partner_default_is_falsy_not_empty_dict` (implicit — dites via AC-02-03, tidak ada test terpisah untuk jalur JS `if (!old_value)`) | — | ✅ (jalur JS-nya sendiri butuh tour, bukan cuma ORM) |
| AC-03-01 | Fallback ke localStorage saat sessionStorage kosong (verifikasi `super()`) | — | — | ✅ **WAJIB baru** |
| AC-04-01 | Cleanup sessionStorage saat logout | — | — | ✅ **WAJIB baru** (belum ada test tour untuk ini di backfill) |
| AC-05-01 | Modul muncul di Apps tanpa menu | — | — | — (visual/manual, cukup QA Step 10) |
| AC-06-01 | User tanpa Contact Creation gagal write (TETAP gagal, bukan regresi) | ✅ `test_plain_internal_user_cannot_write_own_partner_field` + `test_user_with_partner_manager_group_can_write` (copy langsung) | — | — |
| AC-07-01 | Verifikasi `this.orm` di `webclient.js` (MF-02) | — | — | ✅ **WAJIB baru**, cek console error saat webclient mount |

**Catatan audit kesiapan test (lihat peringatan `USAGE_GUIDE.md` §5):** tabel di atas mendaftar method test yang DIRENCANAKAN, bukan yang sudah pasti berisi assertion lengkap — audit isi method (bukan cuma nama) WAJIB dilakukan ulang di `09_DEV_TESTING.md` fase "9a — Audit Kesiapan Test" sebelum hasil test dipercaya, terutama untuk 4 test Python yang di-port dari backfill (perlu dicek masih valid untuk API 18.0, bukan diasumsikan otomatis jalan).

## Step 10 — QA Testing

| AC | Deskripsi | Manual | AI-interaktif | AI+tool eksternal |
|---|---|---|---|---|
| AC-02-02 | Load preferensi lintas browser (end-to-end, dua browser/profile beneran) | ✅ | — | — (tour Step 9 sudah cover mekanisme dalam-modul; QA ini murni end-to-end dua-browser yang tour tidak bisa simulasikan) |
| AC-05-01 | Modul muncul di Apps grid tanpa menu (visual) | ✅ | — | — |
| AC-06-01 | End-to-end: user role gudang/akunting biasa tidak bisa persist preferensi (business-level, bukan cuma unit test) | ✅ | — | — |

## Step 11 — UAT

| Kelompok fitur | AC tercakup | UAT |
|---|---|---|
| Persistensi preferensi kolom optional lintas browser | AC-02-01, AC-02-02 | Business user login di 2 device berbeda, konfirmasi preferensi kolom konsisten |
| Perilaku user tanpa akses penuh (F-10, dipertahankan) | AC-06-01 | Business user dengan role terbatas konfirmasi fitur "silent gagal" ini sudah diketahui/diterima (bukan bug baru dari migrasi) |

## Ringkasan

| Step | Role | Tipe | Eksekusi | Jumlah AC |
|---|---|---|---|---|
| 9 | Developer | Unit/Integration/Tour (Owl/JS) | Otomatis/background (semua, termasuk tour) | 10 AC (7 baru butuh tour, 3 port dari backfill) |
| 10 | QA | Manual | Manual (end-to-end dua-browser, visual, business role) | 3 AC |
| 11 | PM/FA/User | UAT | Manual (selalu) | 2 kelompok fitur |
