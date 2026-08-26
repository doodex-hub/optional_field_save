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
