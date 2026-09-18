global.foundry = {}; global.Roll = class {}; global.game = {}; global.canvas = {};
const fs = require('fs');
const src = fs.readFileSync('macros/_lib.js','utf8');
const TBE = eval(src + '; TBE');
const t = [];
const chk = (label, got, want) => t.push([label, JSON.stringify(got), JSON.stringify(want), JSON.stringify(got)===JSON.stringify(want)]);

let r = TBE.resolve(52,65); chk('Track 65 roll 52', [r.success,r.sl,r.crit], [true,5,false]);
r = TBE.resolve(6,65); chk('roll 06 skill 65', [r.success,r.sl], [true,1]);
for (const x of [11,22,33,38]) { r = TBE.resolve(x,38); chk('skill38 crit '+x, [r.success,r.crit], [true,true]); }
for (const x of [44,55,66,77,88,99,100]) { r = TBE.resolve(x,38); chk('skill38 critfail '+x, [r.success,r.critFail], [false,true]); }
r = TBE.resolve(83,105); chk('skill105 roll83', [r.success,r.sl,r.critFail], [true,9,false]);
r = TBE.resolve(44,105); chk('skill105 roll44 crit', [r.success,r.crit,r.sl], [true,true,8]);
r = TBE.resolve(100,105); chk('skill105 roll00', [r.success,r.critFail], [false,false]);
r = TBE.resolve(120,120); // nonsense roll guard skip
r = TBE.resolve(4,0); chk('skill0 roll4', [r.success,r.sl,r.crit], [true,1,false]);
r = TBE.resolve(5,0); chk('skill0 roll5', [r.success,r.crit,r.sl], [true,true,4]);
r = TBE.resolve(6,0); chk('skill0 roll6', [r.success], [false]);
r = TBE.resolve(3,30); chk('roll03 always succ', [r.success,r.sl], [true,1]);
r = TBE.resolve(99,99); chk('skill99 roll99 fail not crit', [r.success,r.crit,r.critFail], [false,false,false]);
r = TBE.resolve(100,100); chk('skill100 roll00', [r.success,r.crit,r.critFail], [false,false,false]);
r = TBE.resolve(70,70); chk('exact skill crit', [r.success,r.crit,r.sl], [true,true,10]);
r = TBE.resolve(52,70); const b = TBE.resolve(23,65); chk('Arn DoS', [r.sl,b.sl,r.sl-b.sl], [5,2,3]);
const a2 = TBE.resolve(62,70), b2 = TBE.resolve(33,65); chk('Arn6 vs critBandit6', [a2.sl,b2.sl,b2.crit], [6,6,true]);
chk('face 100', TBE.face(100), '00'); chk('face 6', TBE.face(6), '06');
chk('doubles 100', TBE.isDoubles(100), true); chk('doubles 11', TBE.isDoubles(11), true); chk('doubles 10', TBE.isDoubles(10), false);
let fails = 0;
for (const [l,g,w,ok] of t) { if(!ok){fails++; console.log('FAIL', l, 'got', g, 'want', w);} }
console.log(t.length + ' checks, ' + fails + ' failures');
