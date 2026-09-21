# Code Review — optional_field_save

**Step:** 8 — Code Review (gate)
**Ref:** `03_spec/03_MIGRATION_SPEC.md`, `05_acceptance/05a_MIGRATION_ACCEPTANCE_CRITERIA.md`, `06_implementation/06c_IMPLEMENTATION_LOG.md`, `01_intake/01b_BASELINE_SPEC.md`
**Odoo Version:** 20.0
**Files reviewed:** `__manifest__.py`, `models/res_partner.py`, `controllers/controllers.py`, `security/ir.model.access.csv`, `static/src/js/list_renderer.js`, `static/src/js/webclient.js`, `static/src/js/user_menu_items.js`, `tests/test_optional_field_save.py`, `tests/test_optional_field_save_tour.py`
**Tanggal:** 2026-09-21

---

> **⚠️ ADDENDUM 2026-09-21 (step 10, setelah review ini "Lulus"):** review di bawah ini **MELEWATKAN
> bug kritis nyata** — `CustomLogOutItem` (`user_menu_items.js`) navigasi via `browser.location.href
> = route` (GET) ke `/web/session/logout`, yang di 20.0 MENOLAK GET (405 Method Not Allowed). Logout
> RUSAK TOTAL. Baru ketahuan lewat verifikasi visual/live manual di step 10 (dipaksa oleh dev setelah
> menegur gate yang lolos tanpa test visual). **Kenapa review ini tidak menangkapnya:** §C AC-03-01/02
> di bawah cuma memverifikasi (a) file ter-load tanpa error [BENAR] dan (b) logic sessionStorage tidak
> berubah [JUGA BENAR] — tapi TIDAK men-trace mekanisme navigasi (`browser.location.href`) TERHADAP
> kontrak `/web/session/logout` di native 20.0 (yang ternyata sudah berubah ke POST-only). Ini gap
> METODOLOGIS: Desk Review yang cuma "baca kode, kelihatan masuk akal" TIDAK SAMA dengan "kode ini
> masih valid terhadap kontrak native versi target" — untuk KLAIM SPESIFIK soal kontrak API/route
> native yang berubah antar versi, WAJIB cross-check langsung ke `native-target`, bukan cukup baca
> kode modul sendiri. Fix sudah diterapkan (lihat `FINDINGS.md` MF-05, `02_DIFF_ANALYSIS.md` DIFF-08)
> + test permanen ditambahkan. **Section §C AC-03-01/02 di bawah DIBIARKAN APA ADANYA** (tidak diedit)
> sebagai jejak historis kesalahan metodologis ini — koreksinya ada di sini dan di dokumen lain.

**Status skill `odoo-review` (WAJIB diisi, sebelum isi tabel Issues di bawah):**
- [x] Terinstall & sudah dijalankan — hasil temuan digabung ke tabel Issues §A (skill `odoo-review` di-load, dispatch ke `odoo-guidelines` §Manifest/Fields/Access rights dan `odoo-web-guidelines` §Avoid patching JavaScript code)

## A. Issues (Lint, Konvensi Odoo, Business Logic, Security, Performance, Code Quality)

| ID | Severity | Kategori | File | Baris | Issue | Rekomendasi |
|---|---|---|---|---|---|---|
| CR-01 | 🔵 Info | Konvensi (Manifest) | `__manifest__.py` | 18 | `depends` mencantumkan eksplisit `'base'` — guideline `odoo-guidelines` §Manifest: "Don't list `base`: a manifest without `depends` gets `['base']` injected". Warisan sejak 17.0, TIDAK diperkenalkan migrasi ini. | Di luar scope port-kode (bukan kompatibilitas 20.0, murni gaya) — TIDAK diperbaiki sesuai `CLAUDE.md` (jangan refactor demi style di migrasi port-kode). Dicatat untuk kelengkapan review saja. |
| CR-02 | 🔵 Info | Konvensi (JS, `odoo-web-guidelines`) | `static/src/js/list_renderer.js`, `webclient.js`, `user_menu_items.js` | seluruh file | Guideline §"Avoid patching JavaScript code": "Patching... strongly discouraged inside Odoo itself. **It is fine outside of Odoo**" — modul ini ADALAH kode "outside Odoo" (custom addon), jadi pola `patch()` di 3 file ini SESUAI guideline, bukan violation. Dicatat di sini murni supaya jelas sudah dicek, bukan temuan. | Tidak ada aksi — pola ini valid untuk custom addon. |
| CR-03 | 🔵 Info | Business Logic (P1 Fidelity) | `security/ir.model.access.csv` | seluruh file | File dead (BSL-011, F-01) — tidak ada key `data` di manifest, tidak pernah di-load. Dikonfirmasi TIDAK berubah relevansinya di 20.0 (manifest tidak menambah `data` key). | Tidak ada aksi — di luar scope migrasi port-kode (dikonfirmasi ulang intake §5). |

**Tidak ada temuan 🔴 Critical atau 🟡 Warning** — kode yang disentuh migrasi ini (version bump, penghapusan dead import) minimal dan sudah diverifikasi eksekusi nyata (G1) tanpa error.

## B. Gap Analysis — Implementasi vs Migration Spec

| Spec item (`DIFF-NNN`/Fase) | Implementasi | Status | Catatan |
|---|---|---|---|
| DIFF-01 (`list_optional_show` inert) | Tidak diubah, port as-is | ✅ Match | Sesuai keputusan default `03_MIGRATION_SPEC.md` — tidak extend override |
| DIFF-02 (hapus dead import `logOutItem`) | `user_menu_items.js` — import+export `OriginalLogOutItem` dihapus | ✅ Match | Dikonfirmasi G1: asset bundle load bersih, tour 7/7 sukses |
| DIFF-03 (ACL `res.partner` self-write) | Tidak ada kode modul diubah | ✅ Match | Behavior berubah di native, dikonfirmasi EMPIRIS (2 putaran) — lihat §C AC-05-02 di bawah |
| DIFF-04 (`patch()`/`require()` loader) | Tidak diubah | ✅ Match | Dikonfirmasi G1: 3 file JS ter-load, ter-patch dengan benar |
| DIFF-05 (`user.partnerId`) | Tidak diubah | ✅ Match | Dikonfirmasi G1: tour test membaca `partnerId` dengan benar (avatar image request `res.partner/2/avatar_128` di log) |
| DIFF-06 (`fields.Json` default) | Tidak diubah | ✅ Match | Dikonfirmasi test `test_new_partner_default_is_falsy_not_empty_dict` PASS |
| DIFF-07 (tour selector/xmlid) | Tidak diubah | ✅ Match | Dikonfirmasi tour 7/7 langkah sukses |
| Fase A1 (manifest version bump) | `20.0.1.0.0` | ✅ Match | — |
| Fase A6 (README/LISEZMOI basi) | Versi basi diperbaiki | ✅ Match | Di luar tabel DIFF (bukan breaking change), housekeeping murni |
| Fase E (JS) | Hanya DIFF-02 diubah | ✅ Match | Sesuai `06c_IMPLEMENTATION_LOG.md` |

## C. Gap Analysis — Implementasi vs Acceptance Criteria

| AC ID | Behavior | Status | Jejak Nalar (Desk Review) | Catatan |
|---|---|---|---|---|
| AC-01-01/02/03 | Load & restore preferensi saat mount | ✅ Match | User login → `webclient.js` `setup()` patch jalan sebelum `super.setup()` → `getOptionalActiveFields()` fire-and-forget → `orm.call(search_read)` → `sessionStorage` terisi → `list_renderer.js` `computeOptionalActiveFields()` baca `sessionStorage` saat render → kolom optional ter-set sesuai preferensi tersimpan. Dikonfirmasi G1 (tour: avatar image request menunjukkan `partnerId` terbaca benar). | — |
| AC-02-01/02/03 | Toggle & simpan preferensi | ✅ Match | User klik checkbox kolom → core panggil `saveOptionalActiveFields()` (patch) → tulis `localStorage` (asli) + `setDatabase()` (round-trip search_read ulang, gabung dict lama+baru, `orm.call write`) → `sessionStorage` sinkron. Dikonfirmasi test `test_write_and_read_roundtrip_matches_js_pattern` PASS + tour langkah 5-7 (toggle "Street" → `th[data-name='street']` muncul → `sessionStorage` terisi "street"). | — |
| AC-03-01/02 | Cleanup logout | ✅ Match (statis, belum ada tour logout) | `user_menu_items.js` registry `remove("log_out")`+`add("log_out", CustomLogOutItem)` → klik "Log out" → callback hapus semua `sessionStorage` key mengandung "optional_field" → redirect. Prasyarat (import dead dihapus, DIFF-02) dikonfirmasi TIDAK menghalangi load file ini (tour test lain di file JS yang sama berjalan sukses, membuktikan module JS ini ter-load benar). | Belum ada tour test khusus logout (gap warisan 18→19, di luar scope migrasi port-kode ini — dicatat, tidak ditambah baru) |
| AC-04-01 | Entry point/instalasi | ✅ Match | `-i optional_field_save` sukses tanpa error, `application: False` (manifest tidak berubah selain version), version `20.0.1.0.0` terkonfirmasi di manifest. | — |
| AC-05-01 | `default={}` → `False` | ✅ Match | `create()` partner baru → `fields.Json.convert_to_cache`: `if not value: return None` → DB `NULL` → baca balik `False`. Dikonfirmasi test `test_new_partner_default_is_falsy_not_empty_dict` PASS. | — |
| **AC-05-02** | **Self-write `base.group_user` — behavior BERUBAH (dikonfirmasi)** | ✅ Match (setelah koreksi 2 putaran — lihat catatan) | User `base.group_user` (tanpa Contact Creation) → `setDatabase()` → `orm.call("res.partner","write",[[user.partnerId], ...])` → target = partner MILIK SENDIRI → domain `res_partner_rule_write_self` (`id = user.partner_id.id`) MATCH → write BERHASIL (dikonfirmasi test BARU `test_plain_internal_user_can_write_own_partner_record`, 2x termasuk fresh-DB). | **GAP DITEMUKAN DI REVIEW INI:** test warisan `test_plain_internal_user_cannot_write_own_partner_field` menulis ke partner LAIN (dibuat baru di test), BUKAN partner user yang diuji — domain rule baru TIDAK PERNAH match target itu, jadi test itu TIDAK MENGUJI skenario self-write yang sebenarnya relevan untuk production (`setDatabase()` selalu target `user.partnerId`). Ditemukan saat membaca `odoo-guidelines` §"Access rights" ("Rows dengan grup adalah *permissions*: OR-ed... domain baris itu membatasi apa yang baris itu berikan") lalu re-cek domain test warisan. **Test baru ditambahkan** (lihat §D di bawah) untuk menutup gap ini. |
| AC-05-03 | Self-write `group_partner_manager` (companion) | ✅ Match | Tidak terpengaruh DIFF-03 (grup ini sudah punya akses penuh sejak 19.0). Dikonfirmasi test `test_user_with_partner_manager_group_can_write` PASS. | — |

## D. Cek Khusus Migrasi — P1 Fidelity

- [x] Tidak ada perubahan behavior yang tidak disengaja pada KODE PRODUKSI modul — semua deviasi dari source (`source-codebase`) sudah eksplisit tercatat & disetujui di `03_MIGRATION_SPEC.md` §4 (DIFF-02 satu-satunya perubahan kode wajib, murni kompatibilitas).
- [x] **Satu perubahan DI LUAR kode produksi ditemukan & ditambahkan review ini:** test baru `tests/test_optional_field_save.py::test_plain_internal_user_can_write_own_partner_record` — ini BUKAN perubahan business logic modul, murni menambah cakupan test regresi security yang sebelumnya punya gap (lihat §C AC-05-02). Ditelusuri penuh ke `FINDINGS.md` MF-01, bukan perubahan tak tertelusuri.

**Cek tabrakan nama method dengan Odoo core (WAJIB, DUA ARAH):**
1. **Arah 1:** modul TIDAK mendefinisikan method Python apapun yang meng-override core (`models/res_partner.py` hanya menambah field, tidak ada method) — **N/A, tidak ada risiko arah 1**.
2. **Arah 2:** grep `optional_field_save` (nama field unik modul ini) ke `native-target` (`odoo20/addons/**/*.py`, `odoo20/odoo/**/*.py`) — **0 match**, tidak ada kolisi nama field/method dengan core 20.0.

- [x] Sudah dicek (kedua arah) — tidak ada tabrakan nama method/field dengan core/Enterprise

## E. Perubahan Tak Tertelusuri (di luar spec)

- [x] Tidak ada perubahan yang tidak tertelusuri ke spec — semua perubahan kode (manifest, `user_menu_items.js`, README/LISEZMOI, test baru) tercatat di `03_MIGRATION_SPEC.md`/`06c_IMPLEMENTATION_LOG.md`/`FINDINGS.md` sebelum atau tepat saat diimplementasikan.

## F. Kontribusi ke Knowledge Base

- [x] Ada — dicatat ke `migration-records/optional_field_save_19.0_20.0/SUMMARY.md`:
  - Sub-temuan ACL `ir.access` (struktural + perilaku self-write + pelajaran metodologis "test regresi security harus menyasar record milik aktor yang diuji, bukan record baru tak terkait") — dikoreksi ke kesimpulan FINAL di review ini setelah sempat salah simpul di putaran 1 (step 6).
  - Gotcha operasional `docker compose up` tanpa `down -v` di atas DB yang sudah `-i` → silent no-op (0 tests dieksekusi, bukan sukses sebenarnya).

## G. Verdict

- Ringkasan Issues (SAAT REVIEW INI DITULIS, sebelum addendum): 0 🔴 · 0 🟡 · 3 🔵 — **REVISI setelah
  addendum: 1 🔴 yang TERLEWAT** (DIFF-08/MF-05, logout 405 — lihat ADDENDUM di atas). Sudah CLOSED,
  tapi verdict "Lulus tanpa catatan" di bawah TIDAK akurat secara retroaktif — dibiarkan apa adanya
  untuk jejak historis.
- [x] ✅ **Lulus (pada saat ditulis)** — tidak ada 🔴 YANG TERTANGKAP saat itu, lanjut ke step 9 (Dev
  Testing — hasilnya sudah tersedia dari eksekusi G1 di step 6/review ini, akan diformalkan di
  `09_DEV_TESTING.md`). **Lihat ADDENDUM di atas untuk koreksi lengkap.**
- [ ] ❌ Ditolak

**Catatan penting untuk step 9/10/11:** AC-05-02 bukan lagi "AC bercabang menunggu hasil" — SUDAH RESOLVED dengan kesimpulan **self-write berhasil** (behavior berubah dari 19.0, murni akibat ACL native). Test plan (`05b_TEST_PLAN_MIGRATION.md`) dan skenario QA (step 10) sudah diupdate untuk mencerminkan ini — pastikan skenario staging nyata (2 user) mengonfirmasi hasil yang SAMA (write berhasil), bukan menguji ulang dari nol tanpa ekspektasi.
