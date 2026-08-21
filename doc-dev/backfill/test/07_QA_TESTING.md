# QA Testing — optional_field_save

**Step:** 07 — QA Testing (backfill, TANPA UAT — BACKFILL berhenti di sini)
**Ref:** `doc-dev/backfill/spec/01A_FUNCTIONAL_SPEC.md`, `doc-dev/backfill/spec/01B_ACCEPTANCE_CRITERIA.md`, `03B_TEST_PLAN.md`, `04A_DEV_TESTING.md`
**Tanggal:** 2026-08-07

---

## 1. Area / AC yang Harus Dicakup

- [x] AC-01 — Instalasi modul (F-01)
- [x] AC-02 — Persistensi preferensi kolom optional lintas browser (F-11 utk default value)
- [x] AC-03 — Override method core `ListRenderer` tanpa `super()` (F-02)
- [ ] AC-04 — Cleanup sessionStorage saat logout (F-06) — **belum diverifikasi eksekusi live**, lihat §3 S-04
- [ ] AC-05 — Entry point modul di Apps menu (F-03) — verifikasi statis saja (tidak ada `views/`)
- [x] AC-06 — Akses tulis `res.partner` untuk user internal biasa (F-10, **Tinggi**)

**Cek wajib "hanya satu dialog disentuh":** TIDAK RELEVAN — modul ini tidak punya wizard/dialog
apapun (dikonfirmasi Step 01, `01A_FUNCTIONAL_SPEC.md` §3).

---

## 2. Format Skenario

```
### S-{{NN}}: {{Nama Skenario}}
**Precondition:** {{kondisi awal}}
**Mode eksekusi:** {{Mode B (docker) / AI-in-the-loop (browser) / Desk-review}}
**Steps:** ...
**Expected:** {{hasil yang diharapkan}}
**Actual:** {{diisi saat eksekusi}}
**Status:** ☐ Pass / ☐ Fail
**Provenance:** [HASIL-BACA] / [DIKONFIRMASI] / [PERLU-KEPUTUSAN]
```

---

## 3. Skenario

### S-01: Instalasi modul di database fresh
**Precondition:** DB Odoo 17.0 kosong, `base`+`web` saja
**Mode eksekusi:** Mode B/C (docker, dieksekusi Step 04)
**Steps:** `docker compose up` (command `-i optional_field_save --test-enable --stop-after-init`)
**Expected:** Instalasi sukses, tidak ada Traceback
**Actual:** Sukses — 12 modul loaded, `Modules loaded.` tanpa error. Lihat `04A_DEV_TESTING.md` §2.
**Status:** ✅ Pass
**Provenance:** `[DIKONFIRMASI]` (eksekusi nyata)

### S-02: Partner belum pernah ditulis — nilai field
**Precondition:** Partner baru dibuat, `optional_field_save` belum pernah di-`write`
**Mode eksekusi:** Mode B/C (`TransactionCase`, Step 04)
**Steps:** `create()` partner tanpa field ini, baca balik
**Expected (SEKARANG, setelah dikoreksi F-11):** `False`, BUKAN `{}`
**Actual:** `False` — dikonfirmasi `test_new_partner_default_is_falsy_not_empty_dict`
**Status:** ✅ Pass
**Provenance:** `[DIKONFIRMASI]` (eksekusi nyata) — lihat F-11

### S-03: Write dict non-kosong, round-trip
**Precondition:** Partner dengan `optional_field_save` falsy
**Mode eksekusi:** Mode B/C (`TransactionCase`, Step 04)
**Steps:** `write({"optional_field_save": {"optional_field.res.partner": "email,phone"}})`, baca balik
**Expected:** Dict sama persis kembali
**Actual:** Sama persis — `test_write_and_read_roundtrip_matches_js_pattern`
**Status:** ✅ Pass
**Provenance:** `[DIKONFIRMASI]`

### S-04: Cleanup `sessionStorage` saat logout (`user_menu_items.js`)
**Precondition:** User login, ada key `sessionStorage` berprefix `optional_field`
**Mode eksekusi:** AI-in-the-loop (browser) — **TIDAK DIEKSEKUSI sesi ini**
**Steps:** (belum dijalankan) klik menu user → "Log out" → cek `sessionStorage` sebelum redirect
**Expected:** Semua key mengandung `"optional_field"` terhapus sebelum redirect ke
`/web/session/logout`
**Actual:** N/A — tidak dieksekusi. Alasan: (1) `mcp__Claude_Browser__*` TERBUKTI blocked total di
sesi CLI (lesson terdokumentasi `PLAYBOOK.md` §Mode E, tab tidak pernah `visible`); (2) Mode E
(Tour headless) butuh setup image Chrome tambahan (`Dockerfile.template`) yang diputuskan TIDAK
dilanjutkan sesi ini (lihat alasan cakupan di `04A_DEV_TESTING.md` §5 — dua finding berdampak
tertinggi, F-10/F-11, sudah terbukti lewat jalur test yang lebih murah/cepat). Kode
`user_menu_items.js` SENDIRI sudah dibaca statis di Step 01 (§2.4 `01A_FUNCTIONAL_SPEC.md`) — logic
`keys.filter(key => key.includes('optional_field'))` + `removeItem` cukup sederhana dan tidak
melibatkan async/race-condition, risiko implementasi salah tergolong rendah dibanding
finding lain yang sudah dites nyata.
**Status:** ⬜ Belum dieksekusi (bukan Fail — tidak dicoba)
**Provenance:** `[HASIL-BACA]`

### S-05: User internal biasa mencoba menyimpan preferensi kolom optional
**Precondition:** User login dengan `base.group_user` SAJA (tanpa "Contact Creation")
**Mode eksekusi:** Mode B/C (`TransactionCase`, Step 04) — meniru LANGSUNG code path
`orm.call("res.partner","write",...)` yang dipanggil `setDatabase()`, level akses IDENTIK dengan
yang akan dialami user itu di browser sungguhan (ORM check akses sama, tidak ada jalur berbeda
antara panggilan JS vs test Python untuk operasi `write` biasa)
**Steps:** `partner.with_user(test_user).write({"optional_field_save": {...}})`
**Expected (sebelum dites):** Sukses (asumsi field baru otomatis ikut ACL `res.partner` existing)
**Actual:** `AccessError` — user `base.group_user` biasa TIDAK BOLEH write `res.partner` (hanya
`perm_read`). Dikonfirmasi `test_plain_internal_user_cannot_write_own_partner_field` +
cross-check statis `base/security/ir.model.access.csv` (`access_res_partner_group_user`
`perm_write=0`).
**Status:** ❌ Fail (terhadap ekspektasi AWAL — SEKARANG jadi F-10, finding Tinggi)
**Provenance:** `[DIKONFIRMASI]` (eksekusi nyata + cross-check source core)

### S-06: User dengan "Contact Creation" — pembanding S-05
**Precondition:** User login dengan `base.group_user` + `base.group_partner_manager`
**Mode eksekusi:** Mode B/C (`TransactionCase`, Step 04)
**Steps:** sama seperti S-05, group berbeda
**Expected:** Sukses
**Actual:** Sukses — `test_user_with_partner_manager_group_can_write`
**Status:** ✅ Pass
**Provenance:** `[DIKONFIRMASI]`

### S-07: Tabrakan method `ListRenderer` vs Odoo core (verifikasi statis)
**Precondition:** —
**Mode eksekusi:** Desk-review (`docker run --rm odoo:17.0` baca source langsung, bukan cuma baca
kode modul)
**Steps:** Bandingkan `list_renderer.js` modul vs
`odoo/addons/web/static/src/views/list/list_renderer.js` core baris 1093-1111, 1817-1823
**Expected:** —
**Actual:** Logic modul IDENTIK dengan core + tambahan sessionStorage/DB, TANPA `super()`. Lihat
F-02.
**Status:** ✅ Pass (verifikasi selesai, temuannya sendiri tetap `[PERLU-KEPUTUSAN]`)
**Provenance:** `[DIKONFIRMASI]` (baca source langsung, bukan dugaan)

---

## 4. Status Sub-file & Rekap Eksekusi

| File | Isi | Status | Dieksekusi? | Mode |
|---|---|---|---|---|
| §3 di file ini | S-01 s.d. S-03, S-05 s.d. S-07 | ✅ Selesai | Ya | Mode B/C (docker/`TransactionCase`) + Desk-review (baca source core) |
| §3 S-04 | Cleanup logout | ⬜ Belum dieksekusi | Tidak | N/A |
| `07B_QA_AI_BROWSER.md` | Verifikasi browser AI | N/A | Tidak | — |

**Keterbatasan eksekusi (WAJIB diisi):** Verifikasi UI-level (S-04, dan secara umum "apakah JS
benar-benar ter-trigger dengan tepat oleh interaksi user sungguhan di browser") TIDAK dieksekusi
sesi ini. `mcp__Claude_Browser__*` terbukti blocked total di lingkungan CLI sesi ini (limitasi tool
terdokumentasi, bukan bug modul — lihat `PLAYBOOK.md` §Mode E). Mode E (Tour headless via Chrome
di container) TIDAK dijalankan — keputusan cakupan eksplisit (lihat `04A_DEV_TESTING.md` §5):
dua finding paling berdampak (F-10 Tinggi, F-11 Sedang) SUDAH terbukti lewat `TransactionCase`
murni yang menguji code path yang SAMA PERSIS (ORM `write()`/`read()`) dengan yang dipanggil JS —
ini bukan cuma "desk-review", tapi eksekusi nyata terhadap logic Python/ORM yang identik. Yang
TETAP terbuka murni soal "apakah trigger UI-nya benar" (klik checkbox kolom optional memanggil
`saveOptionalActiveFields` yang tepat) — risiko dinilai RENDAH karena wiring `patch()`-nya
sederhana dan sudah diverifikasi identik dengan pola core yang sudah battle-tested (§S-07).

---

## 5. Rekap Findings (jumlah per tag)

| Tag | Jumlah |
|---|---|
| `[PERLU-KEPUTUSAN]` | 9 (F-01, F-02, F-03, F-06, F-09, F-10, F-11 — plus F-04/F-05/F-07 kosmetik ditandai `[HASIL-BACA]`) |
| `[DIKONFIRMASI]` | 6 (AC-01-01, AC-02-03, AC-02-04, AC-03-01 basis, AC-06-01, S-06) |
| `[HASIL-BACA]` (tanpa masalah/kosmetik) | F-04, F-05, F-07, F-08 |

**Verdict:** Backfill dokumentasi selesai sampai Step 07 (QA Testing). **Tidak ada sign-off** — ini
bukan release gate. Keputusan atas item `[PERLU-KEPUTUSAN]` di `FINDINGS.md` ada di tangan pemilik
modul — DUA yang paling perlu perhatian: **F-10 (Tinggi)** karena berdampak langsung ke apakah
fitur ini bekerja untuk user nyata, dan **F-01** (dead access file, kemungkinan usaha awal
menyelesaikan masalah yang sama dengan F-10 tapi gagal).

---

## 6. Bug / Perlu Perbaikan (konsolidasi)

| Ditemukan di | Scenario | Ringkasan masalah | Status perbaikan |
|---|---|---|---|
| §3 | S-05 | User internal biasa (`base.group_user`) tidak bisa menyimpan preferensi — `AccessError` silent (F-10) | ☐ Belum |
| Step 01 | — | `security/ir.model.access.csv` dead + cacat, kemungkinan usaha gagal menyelesaikan F-10 (F-01) | ☐ Belum |
| Step 01 | — | `fields.Json(default={})` menyesatkan, tidak pernah `{}` persisten (F-11) | ☐ Belum |
| Step 01 | — | Patch `ListRenderer` tanpa `super()`, risiko drift (F-02) | ☐ Belum |
| Step 01 | — | Logout item tidak delegasi ke `OriginalLogOutItem` (F-06) | ☐ Belum |
| Step 01 | — | README overclaim "management interface" (F-09) | ☐ Belum |

---

## 7. Slot Metode Masa Depan (belum dibuat)

- `07B_QA_AI_BROWSER.md` — N/A sesi ini (lihat §4). Bisa diisi sesi lanjutan kalau
  `mcp__claude-in-chrome` (bukan `mcp__Claude_Browser`) tersedia dan dev ingin verifikasi visual
  S-04 + trigger UI toggle kolom optional secara live.
- `07C_QA_PLAYWRIGHT.md` — belum relevan, tidak ada rencana E2E script terpisah untuk modul ini.
