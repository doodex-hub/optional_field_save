# -*- coding: utf-8 -*-
"""
Test baru ditulis oleh sesi BACKFILL (doc-dev-backfill) — modul ini belum punya tests/ sama
sekali sebelumnya. Lihat doc-dev/backfill/test/03B_TEST_PLAN.md (T-02..T-05) dan FINDINGS.md
(F-01, F-02, F-10, F-11 — dua finding terakhir baru ketahuan lewat eksekusi test ini, bukan
dari baca kode).
"""
import logging

from odoo.exceptions import AccessError
from odoo.tests.common import TransactionCase, tagged

_logger = logging.getLogger(__name__)


@tagged("post_install", "-at_install")
class TestOptionalFieldSave(TransactionCase):

    def test_new_partner_default_is_falsy_not_empty_dict(self):
        """T-02 (direvisi setelah eksekusi nyata) — lihat FINDINGS.md F-11.

        Asumsi awal `[HASIL-BACA]` di 01A_FUNCTIONAL_SPEC.md: default={} berlaku untuk partner
        BARU. TERBUKTI SALAH saat dieksekusi: {} adalah nilai falsy di Python, ORM/DB layer
        menyimpannya sebagai NULL (bukan literal '{}'), dan saat dibaca balik field Json
        mengembalikan False (bukan {}) — sama seperti Char/Text kalau NULL. Konsekuensi: TIDAK ADA
        partner (baru maupun lama) yang pernah punya {} dari `default={}` itu sendiri — SEMUA
        partner mulai dari False sampai pertama kali ditulis nilai non-kosong.
        """
        partner = self.env["res.partner"].create({"name": "BACKFILL Test Partner New"})
        _logger.info(
            "BACKFILL F-11: optional_field_save partner baru (belum pernah ditulis) = %r",
            partner.optional_field_save,
        )
        self.assertFalse(
            partner.optional_field_save,
            "TERBUKTI: default={} pada fields.Json TIDAK menghasilkan {} yang persisten — "
            "{} adalah falsy, disimpan sebagai NULL, dibaca balik jadi False. Lihat FINDINGS.md F-11.",
        )

    def test_write_and_read_roundtrip_matches_js_pattern(self):
        """T-04 — round-trip dict NON-KOSONG persis pola yang ditulis setDatabase() (list_renderer.js).

        Dites TERPISAH dari kasus {} (lihat test di atas) karena keduanya punya hasil BEDA:
        dict non-kosong round-trip normal, dict kosong TIDAK (falsy-value gotcha).
        """
        partner = self.env["res.partner"].create({"name": "BACKFILL Test Partner Roundtrip"})
        payload = {"optional_field.res.partner": "email,phone"}
        partner.write({"optional_field_save": payload})
        partner.invalidate_recordset(["optional_field_save"])
        self.assertEqual(
            partner.optional_field_save,
            payload,
            "Round-trip write/read field Json (nilai NON-KOSONG) harus persis sama dengan payload",
        )

    def test_plain_internal_user_cannot_write_own_partner_field(self):
        """T-05 (direvisi setelah eksekusi nyata) — lihat FINDINGS.md F-10.

        Asumsi awal: user base.group_user biasa BISA write field ini (karena field baru di
        res.partner "otomatis ikut ACL res.partner yang sudah ada"). TERBUKTI SALAH: ACL bawaan
        Odoo core (base/security/ir.model.access.csv baris access_res_partner_group_user) HANYA
        memberi group_user perm_read=1 (perm_write=0) pada res.partner — full read/write/create/
        unlink cuma utk group_partner_manager ("Contact Creation"). Dibuktikan lewat AccessError
        NYATA yang dilempar Odoo core saat user base.group_user coba write res.partner-nya SENDIRI.
        """
        partner = self.env["res.partner"].create({"name": "BACKFILL Test Partner ACL Plain"})
        test_user = self.env["res.users"].create(
            {
                "name": "BACKFILL Test User Plain",
                "login": "backfill_test_user_plain@example.com",
                "groups_id": [(6, 0, [self.env.ref("base.group_user").id])],
            }
        )
        partner_as_user = partner.with_user(test_user)
        with self.assertRaises(
            AccessError,
            msg="TERBUKTI: base.group_user SENDIRIAN tidak boleh write res.partner sama sekali "
            "(perm_write=0 di ACL core) — fitur modul ini akan GAGAL SILENT (try/catch di JS "
            "cuma console.error) untuk user tanpa 'Contact Creation'. Lihat FINDINGS.md F-10.",
        ):
            partner_as_user.write(
                {"optional_field_save": {"optional_field.res.partner": "email"}}
            )

    def test_user_with_partner_manager_group_can_write(self):
        """Pelengkap T-05 — batas atas: user DENGAN group_partner_manager ('Contact Creation')
        BISA write, membuktikan F-10 murni soal grup yang kurang, bukan bug lain."""
        partner = self.env["res.partner"].create({"name": "BACKFILL Test Partner ACL Manager"})
        test_user = self.env["res.users"].create(
            {
                "name": "BACKFILL Test User Manager",
                "login": "backfill_test_user_manager@example.com",
                "groups_id": [
                    (
                        6,
                        0,
                        [
                            self.env.ref("base.group_user").id,
                            self.env.ref("base.group_partner_manager").id,
                        ],
                    )
                ],
            }
        )
        partner_as_user = partner.with_user(test_user)
        partner_as_user.write({"optional_field_save": {"optional_field.res.partner": "email"}})
        partner.invalidate_recordset(["optional_field_save"])
        self.assertEqual(
            partner.optional_field_save,
            {"optional_field.res.partner": "email"},
            "User dengan group_partner_manager harus BISA write field ini",
        )
