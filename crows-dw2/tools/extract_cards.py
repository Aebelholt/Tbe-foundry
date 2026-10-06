#!/usr/bin/env python3
"""Build crows/src/cards.json from your own copy of the Playtest 2 inventory card PDF (file 02).
Usage: python3 tools/extract_cards.py <01..05 PDF folder or the 02 pdf> [crows/src/cards.json]
Needs: pip install pymupdf. Output is your own copy of the cards; do not commit it (.gitignore).
Also writes cards_04.txt (POI and dungeon cards) next to it when that PDF is present."""
import sys, os, re, json, glob
import pymupdf

def find(arg, key):
    if os.path.isdir(arg):
        m = [f for f in glob.glob(os.path.join(arg, "*.pdf")) if key in os.path.basename(f)]
        return m[0] if m else None
    return arg if key in os.path.basename(arg) else None

def clean(t):
    return re.sub(r"[ \t]+", " ", t.replace("’", "'")).strip()

def cards_from(pdf):
    d = pymupdf.open(pdf); out = []
    for pi, p in enumerate(d, 1):
        words = p.get_text("words")
        if any(w[4] == "Greatsword" for w in words):  # last page: 3 x 5 grid of 2-slot weapons, armor, gear
            for r in range(5):
                for k in range(3):
                    clip = pymupdf.Rect(18 + 190 * k, 17 + 108.3 * r, 18 + 190 * k + 190, 17 + 108.3 * (r + 1))
                    t = p.get_text("text", clip=clip).strip()
                    if t: out.append((pi, t))
            continue
        heads = sorted({round(w[1]) for w in words if "Occupies" in w[4] and w[1] > 400})
        strip_y = None
        for hy in heads:
            if strip_y is None or hy - strip_y > 30: strip_y = hy
        # wide strips: header lines holding "(Occupies N Slots)" in a row of 2-slot cards
        wide = [h for h in heads if h > 540 or True]
        bands = []
        for h in wide:
            if not bands or h - bands[-1] > 30: bands.append(h)
        wide_y0 = min(bands) - 4 if bands else None
        # std grid (5 cols x 4 rows) above the first wide band
        for r in range(4):
            y0 = 17 + 188 * r
            if wide_y0 is not None and y0 >= wide_y0 - 2: break
            for c in range(5):
                clip = pymupdf.Rect(18 + 108 * c, y0, 18 + 108 * c + 108, y0 + 188)
                t = p.get_text("text", clip=clip).strip()
                if t: out.append((pi, t))
        if wide_y0 is not None:
            ys = [b - 4 for b in bands] + [792]
            for i in range(len(bands)):
                for k in range(3):
                    clip = pymupdf.Rect(18 + 190 * k, ys[i], 18 + 190 * k + 190, ys[i + 1])
                    t = p.get_text("text", clip=clip).strip()
                    if t: out.append((pi, t))
    return out

def name_of(t):
    first = t.split("\n")[0]
    m = re.split(r"\s+(?:Stack|R\d)\b", first)
    return clean(m[0]) if m else clean(first)

def main():
    a = sys.argv[1]; dst = sys.argv[2] if len(sys.argv) > 2 else "crows/src/cards.json"
    pdf = find(a, "02_")
    if not pdf: sys.exit("no 02_ cards pdf found")
    cards = {}
    for pi, t in cards_from(pdf):
        n = name_of(t)
        if len(n) < 3 or not re.match(r"[A-Z0-9]", n) or "(" in n or ")" in n or "|" in n or n.endswith(" gc"): continue
        cards[n] = {"page": pi, "text": clean(t)}
    os.makedirs(os.path.dirname(dst) or ".", exist_ok=True)
    json.dump(cards, open(dst, "w"), indent=1, ensure_ascii=False)
    print(f"{len(cards)} cards -> {dst}")
    p4 = find(a, "04_") if os.path.isdir(a) else None
    if p4:
        d = pymupdf.open(p4)
        open(os.path.join(os.path.dirname(dst), "cards_04.txt"), "w").write("\n\n".join(f"===== PAGE {i} =====\n" + p.get_text("text") for i, p in enumerate(d, 1)))
        print("POI and dungeon cards text written")
main()
