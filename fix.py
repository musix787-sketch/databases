import re, glob

for fname in glob.glob("*.html"):
    with open(fname, encoding="utf-8") as f:
        content = f.read()

    if 'caption-text' not in content:
        continue

    content = content.replace(
        '<nav class="sy-head-links"><ul><li class="link"><a href="#">Home</a></li></ul></nav>',
        ''
    )

    m = re.search(r'(<div class="globaltoc"[^>]*>)(.*?)(\s*</div>\s*</div>\s*</div>\s*</aside>)', content, re.DOTALL)
    if not m:
        print("NO MATCH", fname)
        continue

    prefix, body, suffix = m.groups()

    sections = re.split(r'<p class="caption"[^>]*>.*?</p>\s*', body)
    sections = [s for s in sections if s.strip()]
    merged_items = []
    for sec in sections:
        sec = sec.strip()
        inner = re.sub(r'^<ul>\s*', '', sec)
        inner = re.sub(r'\s*</ul>\s*$', '', inner)
        merged_items.append(inner)

    new_body = '<p class="caption" role="heading" aria-level="3"><span class="caption-text">Start here</span></p>\n<ul>\n' + '\n'.join(merged_items) + '\n</ul>\n'

    content = content[:m.start()] + prefix + new_body + suffix + content[m.end():]

    with open(fname, "w", encoding="utf-8") as f:
        f.write(content)
    print("fixed", fname)
