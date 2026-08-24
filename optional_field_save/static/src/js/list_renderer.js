/** @odoo-module **/

const { patch } = require("@web/core/utils/patch");
const { browser } = require("@web/core/browser/browser");
const { registry } = require("@web/core/registry");
const { useService } = require("@web/core/utils/hooks");
const { session } = require("@web/session");
const { ListRenderer } = require("@web/views/list/list_renderer");

patch(ListRenderer.prototype, {
    setup() {
        this.session = session;
        this.orm = useService("orm");
        super.setup();
    },

    computeOptionalActiveFields() {
        // MIGRATION 17.0->18.0 (MF-01 / DIFF-01, lihat 03_MIGRATION_SPEC.md): core
        // ListRenderer.getOptionalActiveFields() dihapus di 18.0, diganti
        // computeOptionalActiveFields() - pure function, return value (bukan mutasi
        // this.optionalActiveFields), dipanggil tiap onWillRender oleh core.
        let str = this.keyOptionalFields.split(",")[1];
        str = "optional_field." + str;
        let optionalActiveFields = sessionStorage.getItem(str);
        if (!optionalActiveFields) {
            // Tidak ada di sessionStorage -> delegasikan fallback (localStorage / default
            // "show") ke core, dikonfirmasi user (03_MIGRATION_SPEC.md) behaviorally identik
            // dengan logic lama, sekaligus mengurangi risiko drift F-02.
            return super.computeOptionalActiveFields();
        }
        const result = {};
        optionalActiveFields = optionalActiveFields.split(",");
        const optionalColumn = this.allColumns.filter((col) => col.type === "field" && col.optional);
        optionalColumn.forEach((col) => {
            result[col.name] = optionalActiveFields.includes(col.name);
        });
        return result;
    },

    saveOptionalActiveFields() {
        this.setDatabase(this.keyOptionalFields, Object.keys(this.optionalActiveFields).filter((fieldName) => this.optionalActiveFields[fieldName]));
        browser.localStorage.setItem(this.keyOptionalFields, Object.keys(this.optionalActiveFields).filter((fieldName) => this.optionalActiveFields[fieldName]));
    },

    async setDatabase(value1, value2) {
        try {
            const partnerId = session.partner_id;
            const datapartnerId = await this.orm.call("res.partner", "search_read", [[["id", "=", partnerId]], ["id", "name", "optional_field_save"]]);
            let old_value = {}
            old_value = datapartnerId[0].optional_field_save;
            let keysToCheck = Object.keys(old_value);
            let string = value1;
            let arrayString = string.split(",");
            let key = "optional_field." + arrayString[1];
            let value = value2.join(",");
            if (datapartnerId.length > 0) {
                if (keysToCheck.includes(key)) {
                    old_value[key] = value;
                    await this.orm.call("res.partner", "write", [[partnerId], { optional_field_save: old_value }]);
                    browser.sessionStorage.removeItem(key);
                    browser.sessionStorage.setItem(key, value);
                } else {
                    if (!old_value) {
                        old_value = { [key]: value };
                        browser.sessionStorage.setItem(key, value);
                    } else {
                        old_value[key] = value;
                        browser.sessionStorage.setItem(key, value);
                    }
                    await this.orm.call("res.partner", "write", [[partnerId], { optional_field_save: old_value }]);
                }
            } else {
                console.warn("Partner not found");
            }
        } catch (error) {
            console.error("Error fetching data:", error);
        }
    },
});
