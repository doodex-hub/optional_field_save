/** @odoo-module **/

import { registry } from "@web/core/registry";
import { _t } from "@web/core/l10n/translation";
import { session } from '@web/session';
import { useBus, useService } from "@web/core/utils/hooks";
import { post } from "@web/core/network/http_service";
import { redirect } from "@web/core/utils/urls";

function CustomLogOutItem(env) {
    const route = "/web/session/logout";
    return {
        type: "item",
        id: "logout",
        description: _t("Log out"),
        callback: async () => {
            const keys = Object.keys(sessionStorage);
            const keysWithData = keys.filter(key => key.includes('optional_field')); // Filter with word  "optional_field"
            keysWithData.forEach(key => {
                console.log(`Key: ${key}`);
                sessionStorage.removeItem(key)
            });
            // MIGRATION 19.0->20.0 (DIFF-08/MF-05, lihat FINDINGS.md): /web/session/logout di 20.0
            // menolak GET (405 Method Not Allowed) - navigasi lewat browser.location.href = route
            // (pola 17.0-19.0) tidak lagi valid. Padanan baru: POST dengan csrf_token, lalu redirect
            // ke URL hasilnya - persis pola native logOutItem() di user_menu_items.js core 20.0.
            const url = await post(route, { csrf_token: odoo.csrf_token }, "url");
            redirect(url);
        },
        sequence: 70,
    };
}

registry.category("user_menuitems").remove("log_out"); registry.category("user_menuitems").add("log_out", CustomLogOutItem);
