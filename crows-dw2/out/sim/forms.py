import sys; sys.path.insert(0,'.')
import sim, sim2, csv, itertools
N=10000
raw={}
for ci,c in enumerate(sim.CROWS):
    for si,sc in enumerate(sim.SCEN):
        raw[(c,sc)]=sim.run("RAW",sc,c,N,seed=1000*ci+100*si+7)
def ok(a,r):
    dd = abs(a["death"]-r["death"])/r["death"]<=0.15 if r["death"]>=0.05 else abs(a["death"]-r["death"])<=0.02
    dm = abs(a["dmg"]/r["dmg"]-1)<=0.15
    return dd,dm
cfgs=[]
for f in ("FA","FB"):
    cfgs += [f"{f}+K2", f"{f}+K2+KC", f"{f}+K2+K1", f"{f}+K2+KC+K1"]
rows=[]; summ=[]
for cfg in cfgs:
    cnt={c:[0,0,0] for c in sim.CROWS}
    for ci,c in enumerate(sim.CROWS):
        for si,sc in enumerate(sim.SCEN):
            a=sim.run(cfg,sc,c,N,seed=5+ci*100+si)
            d,m=ok(a,raw[(c,sc)]); cnt[c][0]+=d; cnt[c][1]+=m; cnt[c][2]+=(d and m)
            a.update(config=cfg); rows.append(a)
    summ.append((cfg,cnt["start"],cnt["t5000"]))
    print(cfg,"start d/m/both",cnt["start"],"t5000",cnt["t5000"])
keys=["config","crow","scen","n","death","dmg","eff","wounds","turns_mean","turns_med"]
with open("forms_combat.csv","w",newline="") as fh:
    w=csv.DictWriter(fh,fieldnames=keys,extrasaction="ignore"); w.writeheader(); w.writerows(rows)
