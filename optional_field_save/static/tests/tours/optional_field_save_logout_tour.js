/** @odoo-module **/
// Tour test - Step 6/8/9, ditambahkan 2026-09-21 setelah verifikasi visual/live manual menemukan
// regresi NYATA (lihat FINDINGS.md MF-05, DIFF-08): `CustomLogOutItem` (user_menu_items.js) di
// 19.0 menavigasi via `browser.location.href = "/web/session/logout"` (GET) - route ini di 20.0
// menolak GET dengan 405 Method Not Allowed (native `logOutItem()` sudah pindah ke POST+redirect,
// lihat komentar di user_menu_items.js modul ini). TIDAK ADA test/tour manapun (warisan sejak
// 17.0) yang pernah mengklik "Log out" sungguhan sampai ditemukan lewat browser live sesi ini -
// gap ini sekarang ditutup permanen oleh tour ini, supaya regresi serupa di masa depan tertangkap
// otomatis (--test-enable), bukan cuma lewat verifikasi manual lagi.

import { registry } from "@web/core/registry";

registry.category("web_tour.tours").add("optional_field_save_logout_tour", {
    test: true,
    url: "/odoo",
    steps: () => [
        {
            trigger: "button.o_user_menu",
            content: "Open the user account menu",
            run: "click",
        },
        {
            trigger: ".dropdown-item:contains('Log out')",
            content: "Click Log out",
            run: "click",
            expectUnloadPage: true,
        },
        {
            trigger: "#login",
            content:
                "Assert landing back on the login page (input#login present) - proves the " +
                "logout request actually succeeded (POST + redirect) instead of dying with a " +
                "405 Method Not Allowed page, which has no #login input at all.",
        },
    ],
});
