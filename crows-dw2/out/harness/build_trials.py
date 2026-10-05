import os, shutil, subprocess, sys
ROOT="/home/user/Tbe-foundry/crows-dw2"; OUT=f"{ROOT}/out"
scen=["S1","S2","S3","S4","S5"]
def build(v,s,tag=""):
    d=f"{OUT}/transcripts/{v}_{s}{tag}"
    if os.path.exists(d): shutil.rmtree(d)
    os.makedirs(d)
    shutil.copy(f"{OUT}/variants/{v}/rules.md", f"{d}/rules.md")
    sc=open(f"{OUT}/scenarios/common.md").read()+"\n"+open(f"{OUT}/scenarios/{s}.md").read()
    keep,drop=("[GRID]","[BANDS]") if v=="RAW" else ("[BANDS]","[GRID]")
    sc="\n".join(l.replace(keep+" ","") for l in sc.split("\n") if drop not in l)
    open(f"{d}/scenario.md","w").write(sc)
    shutil.copy(f"{OUT}/scenarios/blocks.md", f"{d}/blocks.md")
    sealed=open(f"{OUT}/scenarios/sealed_common.md").read()+open(f"{OUT}/scenarios/sealed_{'front' if v in ('RAW','A') else 'threat'}.md").read()
    open(f"{d}/sealed.md","w").write(sealed)
    shutil.copytree(f"{ROOT}/engine", f"{d}/engine", ignore=shutil.ignore_patterns("__pycache__","notes_*","gen_map_docs.py","validate_tables.py","map_legend.md","README.md"))
    for f in ("ledger.py","player.py","player_scripts.json"): shutil.copy(f"{OUT}/harness/{f}", f"{d}/{f}")
    env=dict(os.environ, LEDGER_STATE=f"{d}/ledger_state.json")
    subprocess.run([sys.executable,"ledger.py","init","mid"],cwd=d,env=env,check=True,capture_output=True)
    return d
if __name__=="__main__":
    vs=sys.argv[1].split(","); ss=sys.argv[2].split(","); tag=sys.argv[3] if len(sys.argv)>3 else ""
    for v in vs:
        for s in ss: print(build(v,s,tag))
