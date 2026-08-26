# -*- coding: utf-8 -*-
"""
Tour test - Step 9 Dev Testing (Mode D, headless Chrome). Companion of
static/tests/tours/optional_field_save_tour.js.

Prasyarat: docker-env/Dockerfile dengan google-chrome-stable (lihat
06_implementation/06c_IMPLEMENTATION_LOG.md).
"""
from odoo.tests import tagged
from odoo.tests.common import HttpCase


@tagged("post_install", "-at_install")
class TestOptionalFieldSaveTour(HttpCase):

    def test_optional_field_save_tour(self):
        self.start_tour("/web", "optional_field_save_tour", login="admin")
