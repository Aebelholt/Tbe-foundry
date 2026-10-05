import sim, itertools, csv, json, sys
N=int(sys.argv[1]) if len(sys.argv)>1 else 3000
raw={}
for ci,c in enumerate(sim.CROWS):
    for si,sc in enumerate(sim.SCEN):
        raw[(c,sc)]=sim.run("RAW",sc,c,10000,seed=1000*ci+100*si+7)
def ok(a,r):
    dd = abs(a["death"]-r["death"])/r["death"]<=0.15 if r["death"]>=0.05 else abs(a["death"]-r["death"])<=0.02
    dm = abs(a["dmg"]-r["dmg"])/r["dmg"]<=0.15
    return dd,dm
cfgs=["A+K0"]+["A+"+k for k in sim.KNOBS]+["A+"+"+".join(p) for p in itertools.combinations(sim.KNOBS,2)]
res=[]
for cfg in cfgs:
    p_d=p_m=p_b=0; dev=0
    for (c,sc),r in raw.items():
        a=sim.run(cfg,sc,c,N,seed=5)
        d,m=ok(a,r); p_d+=d; p_m+=m; p_b+=(d and m)
        dev+=abs(a["dmg"]-r["dmg"])/r["dmg"]
    res.append((cfg,p_d,p_m,p_b,round(dev/len(raw),3)))
res.sort(key=lambda x:(-x[3],x[4]))
with open("tuning_grid.csv","w",newline="") as f:
    w=csv.writer(f); w.writerow(["config","death_pass_of16","dmg_pass_of16","both_pass_of16","mean_abs_dmg_dev"]); w.writerows(res)
for r in res[:8]+[x for x in res if x[0]=="A+K0"]: print(r)
