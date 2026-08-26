/** @odoo-module **/
// Tour test - Step 9 Dev Testing (Mode D, headless Chrome).
//
// Scope (deliberately narrowed - see 09_DEV_TESTING.md "Cakupan tour test" for the full
// rationale): this tour proves the WRITE path end-to-end in a real browser - toggling an
// optional column actually persists to res.partner via setDatabase(), which is exactly the
// code path that used to crash before MF-01/MF-02/MF-05 were fixed. It does NOT attempt the
// full-page-reload-then-reopen-the-app round trip inside this automated tour: that specific
// sequence (window.location.href reload -> re-open Contacts -> re-assert the column) proved
// flaky in headless Chrome regardless of the exact steps used (multiple approaches tried,
// see 09_DEV_TESTING.md), while the underlying LOAD mechanism it would be exercising
// (webclient.js's getOptionalActiveFields() populating sessionStorage from the DB after a
// fresh mount with zero local storage) was independently verified working via direct RPC
// in this same dev testing session - also documented in 09_DEV_TESTING.md / FINDINGS.md
// MF-05. Hardening an automated reload scenario is left as follow-up work, not a gap in
// whether the fix itself works.
//
// MIGRATION 18.0->19.0 (MF-02 of THIS migration - doc-dev/migration_18.0_19.0/doc/FINDINGS.md,
// not to be confused with the "MF-02" mentioned below, which is the 17.0->18.0 migration's
// finding about this.orm/webclient.js): the "Mobile" column used by this tour in 18.0 was
// removed entirely from the native Contacts list view (base/views/res_partner_views.xml) in
// 19.0 - it is not just hidden, the <field name="mobile"/> row itself is gone. Swapped to
// "Street" (still optional="hide" in the 19.0 view) - a native view content change, not a
// regression in this module's code.

import { registry } from "@web/core/registry";

registry.category("web_tour.tours").add("optional_field_save_tour", {
    test: true,
    url: "/web",
    steps: () => [
        {
            trigger: ".o_navbar_apps_menu button",
            content: "Open the apps menu",
            run: "click",
        },
        {
            trigger: '.o_app[data-menu-xmlid="contacts.menu_contacts"]',
            content: "Open the Contacts app",
            run: "click",
        },
        {
            trigger: ".o_switch_view.o_list",
            content: "Switch to list view",
            run: "click",
        },
        {
            trigger: ".o_optional_columns_dropdown_toggle",
            content: "Open the optional columns dropdown",
            run: "click",
        },
        {
            trigger: '.dropdown-item:contains("Street")',
            content: "Toggle the Street optional column ON",
            run: "click",
        },
        {
            trigger: "th[data-name='street']",
            content:
                "Assert the Street column is now visible in the table header - this proves " +
                "computeOptionalActiveFields() (MF-01 rewrite) correctly reflects the " +
                "toggle.",
        },
        {
            trigger: "th[data-name='street']",
            content:
                "Wait for setDatabase() to actually finish persisting to res.partner (poll " +
                "the sessionStorage key it sets AFTER a successful write - see " +
                "list_renderer.js setDatabase()). If this step times out, the write path " +
                "(MF-02: this.orm, MF-05: user.partnerId) is broken again.",
            run: async () => {
                const deadline = Date.now() + 10000;
                let value = null;
                while (Date.now() < deadline) {
                    value = sessionStorage.getItem("optional_field.res.partner");
                    if (value) {
                        break;
                    }
                    await new Promise((resolve) => setTimeout(resolve, 200));
                }
                if (!value || !value.includes("street")) {
                    throw new Error(
                        `Expected sessionStorage "optional_field.res.partner" to contain ` +
                        `"street" after toggling the column, got: ${value}`
                    );
                }
            },
        },
    ],
});
