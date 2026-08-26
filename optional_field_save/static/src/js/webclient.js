/** @odoo-module **/

const { patch } = require("@web/core/utils/patch");
const { useService } = require("@web/core/utils/hooks");
const { WebClient } = require("@web/webclient/webclient");
const { session } = require("@web/session");
const { user } = require("@web/core/user");

patch(WebClient.prototype, {
    setup() {
        // FIX DISENGAJA (MF-02, dikonfirmasi eksekusi nyata 2026-08-24): this.orm
        // tidak pernah diinisialisasi di 17.0 maupun 18.0 asli - this.orm.call()
        // di getOptionalActiveFields() throw TypeError SYNCHRONOUS, Owl gagal mount
        // WebClient, seluruh backend blank total setiap login. Bug ini pre-existing
        // di source 17.0 (direproduksi identik di source-codebase read-only, tidak
        // dimodifikasi) - diperbaiki di sini atas keputusan eksplisit pemilik modul
        // (lihat FINDINGS.md MF-02), BUKAN port bug-for-bug seperti default migrasi.
        this.orm = useService("orm");
        this.session = session;
        super.setup();
        this.getOptionalActiveFields();
    },

    async getOptionalActiveFields() {
        this.optionalActiveFields = {};
        // MIGRATION 17.0->18.0 (MF-05, lihat FINDINGS.md): session.partner_id
        // dihapus dari objek session di 18.0 (dipindah ke service @web/core/user
        // sebagai "single source of truth" - lihat komentar di source Odoo sendiri,
        // web/static/src/core/user.js). user.partnerId adalah padanan barunya.
        const partnerId = user.partnerId;
        let datapartnerId = await this.orm.call("res.partner", "search_read", [[["id", "=", partnerId]], ["id", "name", "optional_field_save"]]);
        await Promise.resolve();
        let jsonField = datapartnerId.length > 0 ? datapartnerId[0].optional_field_save : {};
        const dictionaries = [];

        Object.entries(jsonField).forEach(([key, value]) => {
            const dictionary = {};
            const fields = value.split(",");
            fields.forEach(field => {
                dictionary[field] = true;
            });
            dictionaries.push({ key: key, dictionary: Object.keys(dictionary).join(",") });
        });

        dictionaries.forEach(item => {
            sessionStorage.setItem(item.key, item.dictionary);
        });
    },
});
