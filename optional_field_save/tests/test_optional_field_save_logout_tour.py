# -*- coding: utf-8 -*-
"""
Tour test - ditambahkan 2026-09-21 (Step 8/9, setelah verifikasi visual/live manual menemukan
regresi nyata di logout - lihat FINDINGS.md MF-05, DIFF-08). Companion of
static/tests/tours/optional_field_save_logout_tour.js.

Sebelum fix ini ditulis, TIDAK ADA test/tour apapun yang pernah mengeksekusi klik "Log out"
sungguhan - gap ini murni ketahuan lewat browser live, bukan dari automated test manapun. Tour ini
menutup gap tersebut secara permanen.
"""
from odoo.tests import tagged
from odoo.tests.common import HttpCase


@tagged("post_install", "-at_install")
class TestOptionalFieldSaveLogoutTour(HttpCase):

    def test_optional_field_save_logout_tour(self):
        self.start_tour("/odoo", "optional_field_save_logout_tour", login="admin")
