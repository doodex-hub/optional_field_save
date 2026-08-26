# Human QA Checklists — optional_field_save

**Sumber:** diturunkan dari skenario S-XX di `../10_BUSINESS_FLOW_MIGRATION.md`. Kalau skenario/level di file itu berubah, regenerate 4 file di folder ini juga.

| File | Isi | Kapan dipakai |
|---|---|---|
| `01_SMOKE.md` | Webclient tidak blank saat login | Re-cek super cepat sebelum deploy/hotfix — kalau gagal, STOP |
| `02_MAIN_FLOW.md` | Preferensi kolom optional ter-restore lintas browser | QA rutin, atau setelah deploy yang menyentuh `webclient.js`/`list_renderer.js` |
| `03_DETAIL.md` | Kolom default muncul benar di browser baru | QA menyeluruh sebelum rilis besar |
| `04_NEGATIVE.md` | User tanpa akses gagal silent + cleanup logout | Direkomendasikan sebelum rilis besar APAPUN |

**Kombinasi disarankan:**
- Deploy/hotfix kecil → `01_SMOKE.md` saja
- Deploy rutin → `01_SMOKE.md` + `02_MAIN_FLOW.md`
- Rilis besar / sebelum UAT → keempat file

**Catatan versi 19.0:** contoh field yang dipakai untuk demonstrasi kolom optional berubah dari "Mobile" (18.0) ke "Street" (19.0) — field "Mobile" dihapus total dari native Contacts list view di Odoo 19.0 (lihat `FINDINGS.md` MF-02). Kalau menguji manual, gunakan kolom optional APAPUN yang tersedia di dropdown "⚙" — bukan cuma "Street" secara spesifik, itu cuma contoh yang dipakai dokumentasi ini.
