# Main Flow Test — optional_field_save

**Level:** Main Flow — flow bisnis inti yang paling sering dipakai.
**Estimasi waktu:** ~5 menit.
**Sumber:** S-02, S-03 di `../10_BUSINESS_FLOW_MIGRATION.md`.

## Toggle kolom optional → tersimpan lintas browser

```
1. Login ke Odoo (user apa saja), buka app Contacts, switch ke tampilan List.
2. Klik ikon "⚙" (kolom optional) di kanan atas tabel.
3. Aktifkan kolom "Street" (atau kolom optional lain yang sebelumnya tidak aktif).
4. Buka Odoo di BROWSER LAIN (atau mode Incognito baru), login sebagai USER YANG SAMA, buka Contacts
   list view yang sama.
```

**Hasil yang diharapkan:** Kolom "Street" (atau kolom yang diaktifkan di langkah 3) SUDAH otomatis
aktif di browser/incognito baru — TANPA perlu toggle ulang. Ini membuktikan preferensi tersimpan ke
database (`res.partner.optional_field_save`), bukan cuma `localStorage` per-browser.

## Self-write untuk user BIASA (tanpa grup "Contact Creation")

```
1. Buat/pakai user internal biasa yang HANYA punya grup "Internal User" (Settings → Users, cek
   kolom "Access Rights" — pastikan TIDAK ada "Contact Creation").
2. Login sebagai user itu, buka Contacts, toggle kolom optional (sama seperti flow di atas).
3. Tunggu ~2 detik, buka DevTools Console.
```

**Hasil yang diharapkan (Odoo 20.0 — BEDA dari versi lama):** TIDAK ADA error `AccessError`/403 di
Console saat toggle. Preferensi berhasil tersimpan ke database (ulangi langkah "browser lain" di
atas dengan user ini — kolom harus ikut muncul). **Kalau muncul error di Console saat toggle** —
ini REGRESI, laporkan segera (beda dari perilaku yang sudah dikonfirmasi di migrasi 20.0 ini).

## Hasil eksekusi

*(isi tiap kali dipakai — jangan overwrite riwayat lama, tambah baris baru)*

| Tanggal | Environment | Dijalankan oleh | Hasil | Catatan |
|---|---|---|---|---|
| 2026-09-21 | `docker-env/` (native-target 20.0 built-from-source) | AI (otomatis — tour test untuk flow 1, `TransactionCase` nyata untuk flow 2) | ✅ Pass (kedua flow) | Flow 2: write self berhasil, dikonfirmasi 3x independen (lihat FINDINGS.md MF-01) |
