project = "dbms docs"
copyright = "2026"
author = "you"

extensions = [
    "sphinx_design",
]

templates_path = ["_templates"]
exclude_patterns = ["_build", "Thumbs.db", ".DS_Store"]

html_theme = "shibuya"
html_static_path = ["_static"]
html_css_files = ["custom.css"]
html_js_files = ["custom.js"]

html_theme_options = {
    "nav_links": [
        {"title": "Start", "url": "start"},
        {"title": "Reference", "url": "reference"},
    ],
}
