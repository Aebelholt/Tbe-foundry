#!/usr/bin/env python3
"""Extract the five Crows Playtest 2 HTML books into the text files the system layer expects
(`crows/src/crows_0N_*.txt`, with `===== PDFPAGE n =====` markers). Your own copies of the books; do not commit the output.
Usage: python3 extract_sources.py <folder with the five .html files> [out folder, default ./crows/src]"""
import re, html, glob, os, sys
src = sys.argv[1]; out = sys.argv[2] if len(sys.argv) > 2 else os.path.join("crows", "src")
os.makedirs(out, exist_ok=True)
NAMES = {"00": "crows_00_readme.txt", "01": "crows_01_rules.txt", "02": "crows_02_characters.txt", "03": "crows_03_ref.txt", "04": "crows_04_dungeons.txt"}
for f in sorted(glob.glob(os.path.join(src, "*.html"))):
    b = os.path.basename(f)
    m = re.search(r"(?:^|[^0-9])(0[0-4])[ _]", re.sub(r"^[0-9a-f]{8}-", "", b)) or re.search(r"(0[0-4])", b)
    if not m or m.group(1) not in NAMES: print("skip", b); continue
    t = open(f, encoding="utf8", errors="ignore").read()
    t = re.sub(r"(?s)<(script|style).*?</\1>", "", t)
    t = re.sub(r"(?i)</(p|div|h\d|li|tr|table|ul|ol)>", "\n", t)
    t = re.sub(r"(?i)<br\s*/?>", "\n", t)
    t = re.sub(r"(?i)</t[dh]>", " | ", t)
    t = html.unescape(re.sub(r"<[^>]+>", "", t))
    t = re.sub(r"\n\s*\n+", "\n", t)
    # the books print "© 2026 MCDM Productions LLC" then the page number at each page end
    parts = re.split(r"© 2026 MCDM Productions LLC\s*\n\s*(\d+)\s*\n", t)
    res, page = [], 1
    for i in range(0, len(parts), 2):
        res.append(f"===== PDFPAGE {page} =====\n{parts[i].strip()}\n")
        if i + 1 < len(parts): page = int(parts[i + 1]) + 1
    open(os.path.join(out, NAMES[m.group(1)]), "w").write("\n".join(res))
    print(NAMES[m.group(1)], len(res), "pages")
