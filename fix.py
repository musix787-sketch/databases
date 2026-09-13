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

    parts = re.split(r'(<p[^>]*class="caption"[^>]*>.*?</p>)\s*', body)
    # parts alternates: [pre-caption junk, caption_html, section_html, caption_html, section_html, ...]
    new_chunks = [parts[0]] if parts[0].strip() else []
    for caption_html, sec in zip(parts[1::2], parts[2::2]):
        sec = sec.strip()
        inner = re.sub(r'^<ul>\s*', '', sec)
        inner = re.sub(r'\s*</ul>\s*$', '', inner)
        inner = re.sub(r'</ul>\s*<ul(?:\s+class="[^"]*")?>', '', inner)
        new_chunks.append(caption_html + '\n<ul>\n' + inner + '\n</ul>\n')

    new_body = '\n'.join(new_chunks)

    content = content[:m.start()] + prefix + new_body + suffix + content[m.end():]

    with open(fname, "w", encoding="utf-8") as f:
        f.write(content)
    print("fixed", fname)
