project = "dbms docs"
copyright = "2026"
author = "cyrodev"

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
    "globaltoc_expand_depth": 1,
    "toctree_maxdepth": 2,
    "toctree_titles_only": False,
    "nav_links": [
        {"title": "Start", "url": "start"},
        {"title": "Reference", "url": "reference"},
    ],
}
