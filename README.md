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
