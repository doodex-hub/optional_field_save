# Findings — optional_field_save (migrasi 17.0 → 18.0)

**Modul:** optional_field_save
**Migrasi:** 17.0 → 18.0
**Terakhir update:** 2026-08-24

---

## Ringkasan

| ID | Judul | Ditemukan di Step | Tag | Prioritas | Status |
|---|---|---|---|---|---|
| MF-01 | `ListRenderer.getOptionalActiveFields()` dihapus di 18.0 — override modul jadi dead code kalau tidak di-rewrite | Step 2 | `[GAP-MIGRASI]` | **Tinggi** | Terbuka — jadi input wajib `03_MIGRATION_SPEC.md` |
| MF-02 | `this.orm` `undefined` di `webclient.js` — webclient CRASH TOTAL (blank page) setiap login, direproduksi identik di 17.0 ASLI maupun 18.0 | Step 2 (dugaan) → dikonfirmasi Step 6/G2 (2026-08-24) | `[DIWARISI-SOURCE]` — bug pre-existing, diperbaiki atas keputusan disengaja | **KRITIS** | **✅ RESOLVED (2026-08-24)** — fix ditambahkan, G1+G2 diverifikasi ulang |
| MF-03 | F-10 (write `res.partner` gagal silent untuk user tanpa grup Contact Creation) — dipastikan tetap identik di 18.0 | Step 1 (backfill), dikonfirmasi ulang Step 2 | `[DIWARISI-SOURCE]` | Tinggi | Dikonfirmasi tetap sama — tidak perlu tindakan migrasi, WAJIB dipertahankan |
| MF-04 | F-11 (`default={}` selalu jadi `False`) — dipastikan tetap identik di 18.0 | Step 1 (backfill), dikonfirmasi ulang Step 2 | `[DIWARISI-SOURCE]` | Sedang | Dikonfirmasi tetap sama — tidak perlu tindakan migrasi, WAJIB dipertahankan |

---

## Detail

### MF-01 — `ListRenderer.getOptionalActiveFields()` dihapus di 18.0 — override modul jadi dead code kalau tidak di-rewrite
**Ditemukan di:** Step 2 (2026-08-24)
**Tag:** `[GAP-MIGRASI]`
**Ref:** `DIFF-01` (`02_diff/02_DIFF_ANALYSIS.md`), terkait `BSL-005` (`01_intake/01b_BASELINE_SPEC.md`)
**Lokasi:** `optional_field_save/static/src/js/list_renderer.js:17-37` (override modul) vs `native-target` (`odoo18/addons/web/static/src/views/list/list_renderer.js:954` — `computeOptionalActiveFields()`)
**Deskripsi:** Core `ListRenderer` 18.0 menghapus total method `getOptionalActiveFields()` yang di-patch modul ini. Diganti `computeOptionalActiveFields()` dengan kontrak berbeda: pure function (return value, bukan mutasi `this.optionalActiveFields` + callback `onOptionalFieldsChanged`), dipanggil TIAP `onWillRender` (bukan sekali di `setup()`).
**Dampak:** Kalau di-port dengan nama method yang sama (tidak disesuaikan), patch modul tidak pernah terpanggil framework — fitur "baca preferensi dari sessionStorage saat render" (BSL-003) diam-diam tidak berfungsi di 18.0. Tidak ada error muncul (silent), gejalanya mirip F-10 — user tidak sadar fitur lintas-browser tidak jalan sampai benar-benar pindah browser dan preferensi tidak ikut.
**Rekomendasi:** `03_MIGRATION_SPEC.md` step 3 WAJIB merencanakan override baru yang men-target `computeOptionalActiveFields()`: baca sessionStorage dulu (fallback localStorage, logic sama seperti sekarang), RETURN dict aktif fields (bukan mutasi `this.optionalActiveFields` langsung), hapus baris pemanggilan `this.props.onOptionalFieldsChanged` (prop itu sendiri sudah dihapus dari core 18.0, lihat `DIFF-04`).
**Keputusan pemilik modul:** *(kosong — diisi manusia, atau dikonfirmasi di gate Step 4)*

### MF-02 — `this.orm` `undefined` di `webclient.js` — webclient CRASH TOTAL setiap login (DIKONFIRMASI eksekusi nyata)
**Ditemukan di:** Step 2 (dugaan dari review statis), **dikonfirmasi Step 6/G2 via eksekusi browser nyata** (2026-08-24)
**Tag:** `[DIWARISI-SOURCE]` — bug pre-existing di source 17.0, BUKAN regresi migrasi (dikonfirmasi identik di kedua versi)
**Ref:** `DIFF-06` (`02_diff/02_DIFF_ANALYSIS.md`)
**Lokasi:** `optional_field_save/static/src/js/webclient.js:14-34` (method `getOptionalActiveFields()` milik modul, memanggil `this.orm.call(...)`)
**Deskripsi (revisi setelah eksekusi nyata — jauh lebih parah dari dugaan awal):** Patch `WebClient.prototype.setup()` di modul ini TIDAK PERNAH menginisialisasi `this.orm`. Dicek langsung ke `native-source` (odoo17) dan `native-target` (odoo18) — `WebClient.setup()` bawaan Odoo JUGA tidak pernah men-set `this.orm` di kedua versi.

**DIBUKTIKAN LANGSUNG (2026-08-24), DUA environment terpisah:**
1. **`target-codebase` (18.0, kode hasil migrasi)** — server dinyalakan (`docker compose up`, akses `http://localhost:8090`), login `admin`/`admin` via browser sungguhan (Claude Browser tool). Hasil: **halaman blank total** setelah login, console browser menunjukkan:
   ```
   TypeError: Cannot read properties of undefined (reading 'call')
       at WebClient.getOptionalActiveFields (...)
       at WebClient.setup (...)
       at new ComponentNode (...) → App.mount → startWebClient
   ```
2. **`source-codebase` (17.0, kode ASLI, tidak dimodifikasi sama sekali — mount read-only)** — server terpisah dinyalakan (`odoo:17.0` image resmi), login sama persis. Hasil: **BLANK TOTAL IDENTIK**, stack trace sama persis (cuma nomor baris bundle beda karena versi asset berbeda).

**Kesimpulan:** ini BUKAN silent/fire-and-forget error seperti dugaan awal — `this.orm.call(...)` dievaluasi SEBELUM `await` pertama tereksekusi (member access `undefined.call` throw SYNCHRONOUS), jadi exception menjalar langsung ke `WebClient.setup()` (tidak ada try/catch di sana, beda dari `setDatabase()` di `list_renderer.js` yang punya try/catch) → Owl gagal me-mount `WebClient` → **seluruh backend Odoo blank untuk SEMUA user, setiap kali login, di 17.0 MAUPUN 18.0.**

**Dampak:** Modul ini, sebagaimana kode berjalan sekarang, membuat instalasi Odoo manapun (yang meng-install modul ini) **TIDAK BISA DIPAKAI SAMA SEKALI** — bukan cuma fitur optional-field yang gagal, TAPI SELURUH backend Odoo (Sales, Inventory, Accounting, dst — semuanya lewat webclient yang sama). Ini mengubah total pemahaman F-10/BSL-002 sebelumnya ("gagal silent, localStorage tetap fallback") — kenyataannya user bahkan TIDAK PERNAH sampai ke titik toggle kolom optional, karena halaman sudah blank duluan.

**Pertanyaan terbuka yang HANYA bisa dijawab pemilik modul:** kalau bug ini semenjak awal membuat modul tidak bisa dipakai sama sekali, bagaimana modul ini bisa "berjalan di produksi" (asumsi awal project ini)? Kemungkinan: (a) modul ini SEBENARNYA belum pernah benar-benar dipakai/diinstall di instance produksi manapun (cuma listing Apps Store, F-03/F-09 sudah mengindikasikan gejala serupa — README overclaim, tidak ada UI), (b) ada environment spesifik (versi Odoo/addon lain) di mana entah bagaimana `this.orm` kebetulan ter-set, yang belum ditemukan, atau (c) versi yang benar-benar dipakai user berbeda dari yang ada di branch `backfill/17.0`/`origin/17.0` yang dicek project ini.

**Keputusan pemilik modul (2026-08-24):** **Perbaiki sebagai perubahan disengaja** — tambah `this.orm = useService("orm")` di `webclient.js` (bukan port bug-for-bug). Konteks tambahan: dicek `source-codebase/doc-dev/backfill/test/04A_DEV_TESTING.md` §5 — backfill SECARA SADAR tidak pernah menjalankan test browser/JS untuk modul ini ("T-06 Tour headless TIDAK dieksekusi sesi ini... Perilaku webclient.js saat webclient benar-benar mount di browser" dicatat eksplisit sebagai gap terbuka, bukan diklaim sudah dites). G2 sesi ini adalah eksekusi browser PERTAMA yang pernah dilakukan untuk modul ini di seluruh riwayat project — bug ini tidak pernah "diam-diam lolos QA", memang belum pernah ada QA browser sama sekali.

**✅ RESOLVED (2026-08-24), diverifikasi eksekusi nyata ulang setelah fix:**
- `webclient.js`: ditambah `const { useService } = require("@web/core/utils/hooks");` + `this.orm = useService("orm");` di awal `setup()` (sebelum `super.setup()`).
- G1 diulang: tetap `0 failed, 0 error(s) of 4 tests` — fix tidak merusak apapun.
- G2 diulang (browser nyata, tab baru supaya tidak kena cache): **TIDAK ADA lagi `TypeError`**, request `POST /web/dataset/call_kw/res.partner/search_read` (persis code path yang tadinya crash) sekarang **200 OK**. Sequence boot webclient (assets → load_menus → translations → search_read) normal, konsisten dua kali percobaan (initial load + reload).
- **Catatan jujur soal cakupan verifikasi:** render visual penuh (`.o_navbar` dkk) tidak bisa dikonfirmasi 100% di tool browser sandbox sesi ini — tab yang dites `document.visibilityState` tetap `"hidden"` (browser pane tidak benar-benar ditampilkan/di-composite di sesi ini, dikonfirmasi juga oleh error terpisah "Browser pane is not displayed" saat mencoba screenshot), kemungkinan Owl/browser men-throttle render untuk tab yang tidak visible — ini keterbatasan environment tool, BUKAN gejala baru dari fix. Bukti network+console sudah cukup kuat untuk menyimpulkan bug INTI (crash `this.orm`) selesai, tapi **rekomendasi: dev cek sekali lagi manual di browser asli sendiri** (bukan cuma percaya laporan ini) sebagai konfirmasi akhir sebelum Step 8 ditutup, khususnya untuk lihat navbar/menu benar-benar render.

### MF-03 — F-10 dipastikan tetap identik di 18.0
**Ditemukan di:** Step 1 (backfill, sebelum project ini), dikonfirmasi ulang Step 2 (2026-08-24)
**Tag:** `[DIWARISI-SOURCE]`
**Ref:** `F-10` (`source-codebase/doc-dev/backfill/FINDINGS.md`), `BSL-010` (`01b_BASELINE_SPEC.md`), `DIFF-10` (`02_DIFF_ANALYSIS.md`)
**Lokasi:** `base/security/ir.model.access.csv` baris `access_res_partner_group_user` — dicek `odoo17` dan `odoo18`, byte-identik (`perm_write=0` untuk `base.group_user` di kedua versi).
**Deskripsi:** Bug asli (write `res.partner` gagal silent untuk user tanpa grup "Contact Creation") berasal dari ACL core Odoo, bukan dari modul — dan ACL itu tidak berubah 17.0→18.0. Dipastikan akan berperilaku identik pasca migrasi TANPA perubahan kode apapun.
**Dampak:** Tidak ada tindakan migrasi yang diperlukan — WAJIB dipertahankan (jangan tambah `sudo()`/ACL baru kecuali user eksplisit minta).
**Keputusan pemilik modul:** Dipertahankan apa adanya (default, sesuai `01a_MIGRATION_INTAKE.md` §5) — belum ada permintaan eksplisit untuk mengubah.

### MF-04 — F-11 dipastikan tetap identik di 18.0
**Ditemukan di:** Step 1 (backfill, sebelum project ini), dikonfirmasi ulang Step 2 (2026-08-24)
**Tag:** `[DIWARISI-SOURCE]`
**Ref:** `F-11` (`source-codebase/doc-dev/backfill/FINDINGS.md`), `BSL-009` (`01b_BASELINE_SPEC.md`), `DIFF-09` (`02_DIFF_ANALYSIS.md`)
**Lokasi:** `odoo/fields.py` class `Json.convert_to_record()` — dicek `odoo17` dan `odoo18`, byte-identik (`False if value is None else deepcopy(value)`).
**Deskripsi:** `default={}` tidak pernah menghasilkan `{}` persisten karena perilaku field Json core, bukan bug modul — dan perilaku ini tidak berubah 17.0→18.0.
**Dampak:** Tidak ada tindakan migrasi yang diperlukan.
**Keputusan pemilik modul:** Dipertahankan apa adanya (default) — belum ada permintaan eksplisit untuk mengubah.
