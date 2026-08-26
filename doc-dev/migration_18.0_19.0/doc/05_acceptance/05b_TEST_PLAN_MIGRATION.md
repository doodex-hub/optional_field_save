# Test Plan (Migrasi) — optional_field_save

**Step:** 5 — Acceptance Criteria & Test Plan (satu paket dengan `05a_MIGRATION_ACCEPTANCE_CRITERIA.md`)
**Ref:** `05_acceptance/05a_MIGRATION_ACCEPTANCE_CRITERIA.md`
**Tanggal:** 2026-08-26

---

## Step 9 — Dev Testing

> Eksekusi: `odoo-bin -i optional_field_save --test-enable --test-tags /optional_field_save --stop-after-init`. Beda dari migrasi 17→18 (yang tour test-nya "WAJIB baru, belum pernah dijalankan"), modul ini SUDAH punya suite test lengkap yang tervalidasi produksi (4 test Python + 1 tour test + 1 HttpCase wrapper, hasil migrasi 17→18 — lulus G1/G2/Step 9/10/11 penuh). Step 9 di sini pada dasarnya **regression run**: terapkan 2 fix mekanis (manifest version, `groups_id`→`group_ids`), lalu jalankan ulang suite yang sama, expect semua tetap PASS tanpa perubahan hasil.

| AC | Deskripsi | Unit | Integration | Tour (Owl/JS) |
|---|---|---|---|---|
| AC-01-01 | Instalasi modul sukses di 19.0 | — | ✅ (implicit via `-i` + `--stop-after-init`) | — |
| AC-02-01 | Toggle kolom → DB+localStorage+sessionStorage ter-update | — | ✅ `test_write_and_read_roundtrip_matches_js_pattern` (level ORM) | ✅ `optional_field_save_tour` (via `test_optional_field_save_tour.py`) |
| AC-02-02 | Load preferensi dari DB saat browser lain | — | — | ✅ (dikonfirmasi jalur sudah bekerja sejak fix MF-05, regression check di sini) |
| AC-02-03 | Partner baru/lama sama-sama `False` | ✅ `test_new_partner_default_is_falsy_not_empty_dict` (port apa adanya) | — | — |
| AC-02-04 | `setDatabase()` handle `old_value` falsy tanpa crash | ✅ `test_new_partner_default_is_falsy_not_empty_dict` (implicit) | — | — |
| AC-03-01 | Fallback ke localStorage saat sessionStorage kosong | — | — | (tidak ada tour khusus untuk fallback — dicek statis DIFF-01, cukup low-risk untuk regression run tanpa tour terpisah) |
| AC-04-01 | Cleanup sessionStorage saat logout | — | — | (tidak ada tour khusus — dicek statis DIFF-05, low-risk) |
| AC-05-01 | Modul tidak muncul di Apps (application: False) | — | — | — (visual/manual, cukup QA Step 10) |
| AC-06-01 | User tanpa Contact Creation gagal write (TETAP gagal, bukan regresi) | ✅ `test_plain_internal_user_cannot_write_own_partner_field` + `test_user_with_partner_manager_group_can_write` (setelah fix AC-07-01) | — | — |
| AC-07-01 | `groups_id`→`group_ids` fix tidak mengubah hasil AC-06 | ✅ (prasyarat AC-06-01 bisa jalan sama sekali di 19.0) | — | — |

**Catatan audit kesiapan test (9a, WAJIB sebelum hasil dipercaya):** audit isi method (bukan cuma nama/jumlah) tetap wajib dilakukan ulang di `09_DEV_TESTING.md` — walau suite ini SUDAH pernah lulus di 18.0, perubahan `groups_id`→`group_ids` menyentuh langsung 2 dari 4 test Python, jadi tidak boleh diasumsikan "pasti masih benar" tanpa run ulang nyata.

## Step 10 — QA Testing

| AC | Deskripsi | Manual | AI-interaktif | AI+tool eksternal |
|---|---|---|---|---|
| AC-02-02 | Load preferensi lintas browser (end-to-end, dua browser/profile beneran) | ✅ | — | — |
| AC-05-01 | Modul tidak muncul di Apps grid (visual) | ✅ | — | — |
| AC-06-01 | End-to-end: user role gudang/akunting biasa tidak bisa persist preferensi (business-level) | ✅ | — | — |

Level skenario (Smoke/Main Flow/Detail/Negative) diisi di `10_BUSINESS_FLOW_MIGRATION.md` step 10 sendiri, bukan di sini.

## Step 11 — UAT

| Kelompok fitur | AC tercakup | UAT |
|---|---|---|
| Persistensi preferensi kolom optional lintas browser | AC-02-01, AC-02-02 | Business user login di 2 device berbeda, konfirmasi preferensi kolom konsisten — regression check terhadap hasil migrasi 17→18 yang sudah disetujui sebelumnya |
| Perilaku user tanpa akses penuh (F-10, dipertahankan) | AC-06-01 | Business user dengan role terbatas konfirmasi fitur "silent gagal" ini tetap seperti sebelumnya, bukan bug baru dari migrasi 19.0 |

## Ringkasan

| Step | Role | Tipe | Eksekusi | Jumlah AC |
|---|---|---|---|---|
| 9 | Developer | Unit/Integration/Tour (Owl/JS) | Otomatis/background (regression run atas suite yang sudah ada) | 10 AC (2 AC baru murni infra — AC-07-01, 8 AC regression) |
| 10 | QA | Manual | Manual (end-to-end dua-browser, visual, business role) | 3 AC |
| 11 | PM/FA/User | UAT | Manual (selalu) | 2 kelompok fitur |
