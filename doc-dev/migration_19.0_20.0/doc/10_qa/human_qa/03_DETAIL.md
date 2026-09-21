# Detail Test — optional_field_save

**Level:** Detail — varian/edge-case, fitur sekunder.
**Estimasi waktu:** ~4 menit.
**Sumber:** S-04, S-05 di `../10_BUSINESS_FLOW_MIGRATION.md`.

## User DENGAN grup "Contact Creation" — tetap bisa self-write (tidak berubah dari versi lama)

```
1. Buat/pakai user internal dengan grup "Contact Creation" (Settings → Users → Access Rights).
2. Login sebagai user itu, buka Contacts, toggle kolom optional.
```

**Hasil yang diharapkan:** Berhasil tanpa error — sama seperti versi Odoo sebelumnya, grup ini tidak
terpengaruh perubahan apapun di migrasi ini.

## Bug kosmetik warisan — field tersembunyi selalu kosong untuk partner baru

```
1. Buat kontak baru (Contacts → New).
2. Buka DevTools Console, jalankan: `await fetch('/web/dataset/call_kw', {method:'POST', headers:
   {'Content-Type':'application/json'}, body: JSON.stringify({jsonrpc:"2.0", method:"call",
   params:{model:"res.partner", method:"read", args:[[<ID_PARTNER_BARU>], ["optional_field_save"]],
   kwargs:{}}})}).then(r=>r.json())` (ganti `<ID_PARTNER_BARU>` dengan ID kontak yang baru dibuat).
```

**Hasil yang diharapkan:** Field `optional_field_save` bernilai `false` (BUKAN `{}`) — ini bug
kosmetik warisan yang SENGAJA tidak diperbaiki (tidak berdampak fungsional, cuma "terlihat aneh" di
level data mentah). Kalau tim berubah pikiran ingin ini diperbaiki, itu keputusan terpisah, bukan
bagian migrasi ini.

## Hasil eksekusi

*(isi tiap kali dipakai — jangan overwrite riwayat lama, tambah baris baru)*

| Tanggal | Environment | Dijalankan oleh | Hasil | Catatan |
|---|---|---|---|---|
| 2026-09-21 | `docker-env/` (native-target 20.0 built-from-source) | AI (otomatis, `TransactionCase`) | ✅ Pass (kedua flow) | — |
