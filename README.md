# dbms

Database fundamentals guide, built with Sphinx + the Shibuya theme.

## Building locally

```
pip install -r requirements.txt
make html
```

The built site is written to `build/html/`.

## Deploying

Point Cloudflare Pages (or any static host) at this repo with:

- Build command: `pip install -r requirements.txt && make html`
- Output directory: `build/html`

## Viewing on GitHub

GitHub's own `.rst` preview uses plain docutils, not Sphinx, so it doesn't
know about the `sphinx-design` directives used throughout `source/*.rst`
(`tab-set`, `dropdown`, `grid`). Files that use them (`postgresql.rst`,
`mysql.rst`, `mongodb.rst`, `redis.rst`, `sqlite.rst`, `cassandra.rst`, and
most of the "Operating in production"/"Security and access"/"Scaling in
practice" pages) will show "Unknown directive type" error blocks in
GitHub's file preview. That's expected and cosmetic — build the site
(above) or use the Cloudflare Pages deployment to read them properly.
