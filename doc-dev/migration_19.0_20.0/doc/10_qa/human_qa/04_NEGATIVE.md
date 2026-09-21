# Negative Test — optional_field_save

**Level:** Negative — hal yang HARUS ditolak/tidak boleh muncul.
**Estimasi waktu:** ~3 menit.
**Sumber:** S-06 di `../10_BUSINESS_FLOW_MIGRATION.md`.

> **✅ Sudah dieksekusi live 2026-09-21 dan LULUS — TAPI sempat menemukan bug kritis (405 Method Not
> Allowed saat logout, sudah difix) sebelum lulus.** Kalau kamu re-run checklist ini dan logout tetap
> gagal dengan halaman error apapun (bukan redirect bersih ke halaman login) — itu REGRESI, laporkan
> segera, jangan asumsikan "gap warisan yang sudah diketahui" seperti sebelumnya.

## Preferensi user TIDAK bocor ke user lain lewat sessionStorage setelah logout

```
1. Login sebagai User A. Buka Contacts, toggle satu kolom optional (mis. "Street") supaya
   sessionStorage terisi.
2. Buka DevTools (F12) → Application/Storage → Session Storage → cek ada key mengandung
   "optional_field" (mis. `optional_field.res.partner`).
3. Logout (klik avatar kanan atas → "Log out").
4. SEGERA setelah landing di halaman login, cek Session Storage lagi (masih di tab/browser yang sama).
```

**Hasil yang diharapkan:** SEMUA key yang mengandung "optional_field" SUDAH TIDAK ADA di Session
Storage setelah logout (langkah 4). Kalau masih ada — ini gap keamanan/privasi: user B yang login
berikutnya di tab/browser yang sama bisa "mewarisi" preferensi kolom User A sebelum preferensi
User B sendiri termuat ulang (bocor sesaat, bukan bocor permanen — tapi tetap harus ditolak).

## Hasil eksekusi

*(isi tiap kali dipakai — jangan overwrite riwayat lama, tambah baris baru)*

| Tanggal | Environment | Dijalankan oleh | Hasil | Catatan |
|---|---|---|---|---|
| 2026-09-21 (percobaan 1) | `docker-env/` live server, built-in browser | AI | ❌ **Fail** | `405 Method Not Allowed` saat klik "Log out" — `/web/session/logout` menolak GET. Bug nyata, lihat FINDINGS.md MF-05 |
| 2026-09-21 (percobaan 2, setelah fix) | `docker-env/` live server, built-in browser | AI | ✅ Pass | Redirect bersih ke login, sessionStorage key terhapus (dikonfirmasi manual via console) |
