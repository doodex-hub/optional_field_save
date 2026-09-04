{
    "name": "Optional Field Save",
    "summary": """
        This module enhances the list of selected options by saving the data to the database,
        so that the user can access the saved list of options even when opening in a new browser.
    """,
    "description": """
        This Odoo module enhances the functionality of the list of options by allowing the saving of selected options
        to the database. This ensures that the user can access and restore the same list of options when opening
        the application in a new browser or after reloading the page, providing a consistent and efficient user experience.
    """,
    "author": "Doodex",
    "company": "Doodex",
    "website": "https://www.doodex.net/",
    "category": "Tools",
    "license": "AGPL-3",
    "version": "17.0.1.0.0",
    "depends": [
        "base",
        "web",
    ],
    "application": False,
    "assets": {
        "web.assets_backend": [
            "optional_field_save/static/src/js/list_renderer.js",
            "optional_field_save/static/src/js/webclient.js",
            "optional_field_save/static/src/js/user_menu_items.js",
        ],
    },
    'images': [
       'static/description/banner.gif',
       'static/description/icon.png',
    ],
}
