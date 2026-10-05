import sim, csv, statistics
N=10000
CFG=["RAW","A+K0","A+K2","A+K2+K5","A+K3+K5","A+K2+K1","B"]
# time model: 20 min for a typical RAW fight (Rules Book, Dungeon Turns, "might take 20 minutes to play out").
# Calibrate minutes per turn on S1 RAW start-crow median turns. A/B/C exchange costed at same per-turn minutes.
cal=sim.run("RAW","S1_chapel","start",N,seed=11)
MIN_PER_TURN=20.0/cal["turns_med"]
rows=[]
for ci,c in enumerate(sim.CROWS):
    for si,sc in enumerate(sim.SCEN):
        for cfg in CFG:
            seed=1000*ci+100*si+7 if cfg=="RAW" else 5+ci*100+si
            v = "A0" if cfg=="A+K0" else cfg
            a=sim.run(cfg if cfg!="A+K0" else "A+K0",sc,c,N,seed)
            minutes=a["turns_mean"]*MIN_PER_TURN
            a.update(config=cfg,minutes=round(minutes,1),dt=round(minutes/30,3),
                     torch_expire_p=round(1-(2/3)**(minutes/30),3))
            rows.append(a)
keys=["config","crow","scen","n","death","dmg","eff","wounds","turns_mean","turns_med","minutes","dt","torch_expire_p"]
with open("final_combat.csv","w",newline="") as f:
    w=csv.DictWriter(f,fieldnames=keys,extrasaction="ignore"); w.writeheader(); w.writerows(rows)
print("min/turn",round(MIN_PER_TURN,2),"cal median turns",cal["turns_med"])
