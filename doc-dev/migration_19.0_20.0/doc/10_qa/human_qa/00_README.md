# Human QA Checklists — optional_field_save

**Sumber:** diturunkan dari skenario S-01 s/d S-06 di `../10_BUSINESS_FLOW_MIGRATION.md`, dikelompokkan per `Level`. Kalau skenario/level di file itu berubah, regenerate 4 file di folder ini juga.

Tiap file berisi HANYA skenario dari satu `Level`, format bahasa manusia, langkah bernomor siap-jalan.

| File | Isi | Kapan dipakai |
|---|---|---|
| `01_SMOKE.md` | Instalasi bersih, webclient tidak crash | Re-cek super cepat sebelum deploy/hotfix |
| `02_MAIN_FLOW.md` | Toggle kolom optional + persist; self-write user biasa | QA rutin, atau setelah deploy fitur baru menyentuh flow ini |
| `03_DETAIL.md` | Varian grup user (Contact Creation); bug kosmetik `default={}` | QA menyeluruh sebelum rilis besar |
| `04_NEGATIVE.md` | Cleanup sessionStorage saat logout | Direkomendasikan sebelum rilis besar apapun — belum ada automated test untuk ini |

**Kombinasi yang disarankan untuk modul ini:**
- Deploy/hotfix kecil → `01_SMOKE.md` saja
- Deploy rutin → `01_SMOKE.md` + `02_MAIN_FLOW.md`
- Rilis besar / sebelum UAT (step 11) → keempat file, terutama `04_NEGATIVE.md` (satu-satunya yang belum pernah dieksekusi live sama sekali)
