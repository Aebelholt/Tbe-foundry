"""Validate table JSON files. Usage: python3 validate_tables.py file.json [...]"""
import json,sys,re
DIE={"d50":(1,50),"d4":(1,4),"d6":(1,6),"d8":(1,8),"d10":(1,10),"d12":(1,12),"d20":(1,20),"d100":(1,100),"2d6":(2,12),"2d10":(2,20),"3d6":(3,18)}
ok=True
for f in sys.argv[1:]:
    data=json.load(open(f))
    for t in (data if isinstance(data,list) else [data]):
        err=[]
        for k in ("id","title","src","die","entries"):
            if k not in t: err.append(f"missing {k}")
        if t.get("die") not in DIE: err.append(f"die {t.get('die')} not in {list(DIE)}")
        E=t.get("entries",[])
        for i,e in enumerate(E):
            if not isinstance(e.get("lo"),int) or not isinstance(e.get("hi"),int) or e["lo"]>e["hi"]: err.append(f"bad range {e}")
            if not e.get("text","").strip(): err.append(f"empty text at {i}")
            if i and e["lo"]!=E[i-1]["hi"]+1: err.append(f"gap/overlap between {E[i-1]['hi']} and {e['lo']}")
        if E and not t.get("mod"):
            lo,hi=DIE.get(t["die"],(None,None))
            if E[0]["lo"]>lo or E[-1]["hi"]<hi: err.append(f"does not cover {lo}-{hi}")
        print(("OK  " if not err else "ERR ")+f"{f}:{t.get('id')} ({len(E)} entries)")
        for x in err: print("    ",x); ok=False
sys.exit(0 if ok else 1)
