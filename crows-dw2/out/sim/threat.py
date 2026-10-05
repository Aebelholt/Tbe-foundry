"""Run C Threat tick sim. Ticks: (1) outdoor rest in the Miasma, (2) village cycle ending
without a Prosperity rise (Characters Book: Lowering Prosperity), (3) 'doom on an encounter
check' from runs_ABC. Crows encounter check is 1d10 vs EN 9 (Rules Book, Dungeon Encounters);
it has no doom. Interpreted as natural 10 (immediate encounter). [UNSOURCED interpretation]
Session model values are ASSUMPTIONS, swept below."""
import random, csv, statistics, itertools
def campaign(r, D, dts, p_rest, spc, p_rise, cap, doom_rule, S=10):
    ticks=0; done=None; sessions_since_cycle=0
    for s in range(1,S+1):
        t=0
        if r.random()<p_rest: t+=1                                   # outdoor Miasma rest
        if doom_rule=="nat10": t+=sum(1 for _ in range(dts) if r.randint(1,10)==10)
        elif doom_rule=="encounter": t+=sum(1 for _ in range(dts) if r.randint(1,10)>=9)
        sessions_since_cycle+=1
        if sessions_since_cycle>=spc:
            sessions_since_cycle=0
            if r.random()>=p_rise: t+=1                              # cycle without a rise
        if cap: t=min(t,cap)
        ticks+=t
        if ticks>=D and done is None: done=s
    return done
rows=[]
for D,dts,p_rest,spc,p_rise,cap,rule in itertools.product(
        (4,5,6),(4,6,10),(0.5,1.0),(1,2,3),(0.15,0.3,0.5),(0,1,2),("nat10","encounter")):
    r=random.Random(1)
    res=[campaign(r,D,dts,p_rest,spc,p_rise,cap,rule) for _ in range(2000)]
    comp=[x for x in res if x]
    rows.append(dict(D=D,dts=dts,p_rest=p_rest,sessions_per_cycle=spc,p_rise=p_rise,cap=cap,doom_rule=rule,
        median=statistics.median(comp) if comp else None,
        mean=round(statistics.mean(comp),2) if comp else None,
        in_2_5=round(sum(1 for x in res if x and 2<=x<=5)/len(res),3),
        before_2=round(sum(1 for x in res if x and x<2)/len(res),3),
        after_5_or_never=round(sum(1 for x in res if (x is None) or x>5)/len(res),3)))
with open("threat_ticks.csv","w",newline="") as f:
    w=csv.DictWriter(f,fieldnames=list(rows[0].keys())); w.writeheader(); w.writerows(rows)
def show(f):
    s=[x for x in rows if f(x)]
    return len(s), round(statistics.mean(x['in_2_5'] for x in s),3), round(min(x['in_2_5'] for x in s),3)
print("all", show(lambda x:True))
for rule in ("nat10","encounter"):
    for cap in (0,1,2):
        print(rule,"cap",cap, show(lambda x:x['doom_rule']==rule and x['cap']==cap))
c=[x for x in rows if x['dts']==6 and x['p_rest']==1.0 and x['sessions_per_cycle']==2 and x['p_rise']==0.3 and x['doom_rule']=="nat10"]
for x in c: print("central",x)
