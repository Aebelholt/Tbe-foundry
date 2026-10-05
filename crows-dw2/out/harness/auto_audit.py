#!/usr/bin/env python3
"""Mechanical audit of one trial dir. Writes audit_auto.json. LLM Auditor adds judgment counts."""
import re, sys, os, json
d = sys.argv[1]
def rd(n):
    p = f"{d}/{n}"; return open(p).read() if os.path.exists(p) else ""
tr = rd("transcript.md")
turns = re.split(r"\n## Turn (\d+)\n", tr)
blocks = []
for i in range(1, len(turns), 2):
    n = int(turns[i]); body = turns[i + 1]
    def sect(tag, nxt):
        m = re.search(rf"\[{tag}\](.*?)(?=\n\[(?:{nxt})\]|\Z)", body, re.S); return m.group(1) if m else ""
    blocks.append(dict(n=n, player=sect("PLAYER", "TOOLS|REF"), tools=sect("TOOLS", "REF"), ref=sect("REF", "ZZZ")))
src_nums = set()
for f in ("blocks.md", "scenario.md", "sealed.md", "rules.md"):
    src_nums |= set(re.findall(r"\d+", rd(f)))
tool_nums = set()
seen = set(); invented = []
for b in blocks:
    tool_nums |= set(re.findall(r"\d+", b["tools"])) | set(re.findall(r"\d+", b["player"]))
    allowed = src_nums | tool_nums
    # fiction + mechanics + status text of the reply, minus the verbatim tool lines
    text = re.sub(r"(?m)^(Ref:|ATTACK|TEST|MOVE|UD|LEDGER|STATUS|SEALED).*$", "", b["ref"])
    # arithmetic derived values are flagged for the auditor, not dismissed
    for m in re.finditer(r"(?<![\w\[])(\d+)(?![\w\]])", text):
        v = m.group(1)
        if v not in allowed: invented.append(dict(turn=b["n"], number=v, ctx=text[max(0, m.start() - 40):m.end() + 30].replace("\n", " ")))
tools_all = "\n".join(b["tools"] for b in blocks)
res = dict(
    turns=len(blocks),
    ledger_attacks=len(re.findall(r"^ATTACK", tools_all, re.M)),
    ledger_tests=len(re.findall(r"^(TEST|MOVE)", tools_all, re.M)),
    crow_T1=len(re.findall(r"→ T1", tools_all)),
    crow_T2=len(re.findall(r"→ T2", tools_all)),
    crow_T3=len(re.findall(r"→ T3", tools_all)),
    dooms=len(re.findall(r"DOOM", tools_all)), crits=len(re.findall(r"CRIT", tools_all)),
    engine_lines=len(re.findall(r"^Ref:", tools_all, re.M)),
    engine_tests=len(re.findall(r"^Ref: .*test|^Ref: .*\[\d+,\d+\]", tools_all, re.M)),
    named_moves=len(re.findall(r"Move:\s*[A-Z]", "\n".join(b["ref"] for b in blocks))),
    lookups=len([l for l in rd("lookups.log").split("\n") if l.strip()]),
    state_block_words=len(rd("state_block.md").split()),
    state_block_tokens_est=int(len(rd("state_block.md").split()) * 1.35),
    ref_words_total=sum(len(b["ref"].split()) for b in blocks),
    invented_candidates=invented,
)
json.dump(res, open(f"{d}/audit_auto.json", "w"), indent=1)
print(d.split("/")[-1], {k: v for k, v in res.items() if k != "invented_candidates"}, "invented:", len(invented))
