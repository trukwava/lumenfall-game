const test=require('node:test');
const assert=require('node:assert/strict');
const C=require('../core.js');
const action=(s,a)=>C.reducer(s,a);
test('lantern starts on facing east, illuminates 4 cells and an enemy',()=>{
 const s=C.newGame(),beam=C.beamCells(s);
 assert.deepEqual(beam.map(C.coord),['1,6','2,6','3,6','4,6','5,6']);
 assert.equal(C.nearestLit(s).id,'skitter-a');
});
test('lantern stops at wall, does not illuminate behind it',()=>{
 const s=C.newGame();s.player.x=2;s.player.y=2;s.player.facing='E';
 assert.deepEqual(C.beamCells(s).map(C.coord),['2,2']);
});
test('movement spends one AP, invalid movement spends zero',()=>{
 const s=C.newGame();const m=action(s,{type:'MOVE',direction:'N'});assert.equal(m.changed,true);assert.equal(m.state.ap,2);assert.deepEqual([m.state.player.x,m.state.player.y],[1,5]);
 assert.equal(s.ap,3);const bad=action(s,{type:'MOVE',direction:'S'}); // empty southern tile is valid
 assert.equal(bad.changed,true);
 const blocked=action(s,{type:'MOVE',direction:'E'});assert.equal(blocked.changed,true);
 const ss=C.copy(s);ss.player.x=2;ss.player.y=1;const wallMove=action(ss,{type:'MOVE',direction:'E'});assert.equal(wallMove.changed,false);assert.equal(wallMove.state.ap,3);
});
test('cannot exceed three action points',()=>{
 let s=C.newGame();for(const dir of ['N','S','N'])s=action(s,{type:'MOVE',direction:dir}).state;
 assert.equal(s.ap,0);const extra=action(s,{type:'TOGGLE_LANTERN'});assert.equal(extra.changed,false);assert.equal(extra.state.ap,0);
});
test('light toggle disables strike and preserves original state',()=>{
 const s=C.newGame();const off=action(s,{type:'TOGGLE_LANTERN'});assert.equal(off.state.player.lantern,false);assert.equal(C.nearestLit(off.state),null);
 assert.equal(action(off.state,{type:'STRIKE'}).changed,false);assert.equal(s.player.lantern,true);
});
test('strike hits lit enemy and one-health Skitter dies',()=>{
 const s=C.newGame(),r=action(s,{type:'STRIKE'});assert.equal(r.changed,true);assert.equal(r.state.ap,2);assert.equal(r.state.enemies[0].hp,0);assert.equal(s.enemies[0].hp,1);
});
test('strike cannot attack enemies outside beam',()=>{
 const s=C.newGame();assert.equal(action(s,{type:'STRIKE',targetId:'watcher-a'}).changed,false);
});
test('adjacent skitter attacks even in darkness',()=>{
 const s=C.newGame();s.player.lantern=false;s.enemies[0].x=1;s.enemies[0].y=5;s.enemies[1].hp=0;s.enemies[2].hp=0;
 const p=C.preview(s);assert.equal(p.damage,1);assert.equal(p.after.player.hp,5);
});
test('watcher attacks lit player in unblocked cardinal lane',()=>{
 const s=C.newGame();s.enemies[0].hp=0;s.enemies[1].hp=0;s.enemies[2].x=4;s.enemies[2].y=6;
 const p=C.preview(s);assert.equal(p.damage,1);assert.equal(p.actions[0].enemyId,'watcher-a');
});
test('watcher cannot acquire extinguished player',()=>{
 const s=C.newGame();s.enemies[0].hp=0;s.enemies[1].hp=0;s.enemies[2].x=4;s.enemies[2].y=6;s.player.lantern=false;
 assert.equal(C.preview(s).damage,0);
});
test('walls block watcher line of fire',()=>{
 const s=C.newGame();s.enemies[0].hp=0;s.enemies[1].hp=0;
 s.player.x=1;s.player.y=2;s.enemies[2].x=6;s.enemies[2].y=2;
 assert.equal(C.preview(s).damage,0); // wall at 3,2
});
test('preview is the actual enemy resolution without state mutation',()=>{
 const s=C.newGame(),str=JSON.stringify(s),preview=C.preview(s),real=C.enemyPhase(s);
 assert.deepEqual(preview.after,real.state);assert.deepEqual(preview.events,real.events);assert.equal(JSON.stringify(s),str);
});
test('undo restores lantern, AP, HP and movement; end turn clears history',()=>{
 const ses=C.makeSession();C.dispatch(ses,{type:'MOVE',direction:'N'});C.dispatch(ses,{type:'TOGGLE_LANTERN'});
 assert.equal(ses.history.length,2);C.dispatch(ses,{type:'UNDO'});assert.equal(ses.state.player.lantern,true);assert.equal(ses.state.ap,2);
 C.dispatch(ses,{type:'UNDO'});assert.deepEqual(ses.state,C.newGame());C.dispatch(ses,{type:'END_TURN'});assert.equal(ses.history.length,0);
});
test('defeating last enemy wins immediately',()=>{
 const s=C.newGame();s.enemies[1].hp=0;s.enemies[2].hp=0;
 assert.equal(action(s,{type:'STRIKE'}).state.phase,'won');
});
test('taking last hit loses without negative health',()=>{
 const s=C.newGame();s.player.hp=1;s.enemies[0].x=1;s.enemies[0].y=5;s.enemies[1].hp=0;s.enemies[2].hp=0;
 const r=C.enemyPhase(s);assert.equal(r.state.phase,'lost');assert.equal(r.state.player.hp,0);
});
test('same input sequence always produces the same simulation',()=>{
 const seq=[{type:'STRIKE'},{type:'TOGGLE_LANTERN'},{type:'MOVE',direction:'N'},{type:'END_TURN'},{type:'MOVE',direction:'E'},{type:'END_TURN'}];
 function run(){let s=C.newGame();for(const a of seq){const r=C.reducer(s,a);if(r.changed)s=r.state;}return s;}
 assert.deepEqual(run(),run());
});
test('walls and enemy positions never overlap in the authored room',()=>{
 const s=C.newGame();assert.equal(C.WALLS.length,new Set(C.WALLS.map(p=>p.join(','))).size);
 for(const e of s.enemies)assert.equal(C.wall(e),false);
 assert.equal(C.wall(s.player),false);
});
test('authored Watcher lane changes predicted damage when the lantern is extinguished',()=>{
 const s=C.newGame();s.player.x=2;s.player.y=4;
 s.enemies[0].hp=0;s.enemies[1].hp=0;
 assert.equal(C.preview(s).damage,1);
 s.player.lantern=false;
 assert.equal(C.preview(s).damage,0);
});
test('previews equal committed enemy phases over many distinct deterministic states',()=>{
 let tested=0;
 for(let seed=1;seed<=24;seed++){
  let state=C.newGame(),rng=seed;
  const draw=(mod)=>{rng=(rng*1664525+1013904223)>>>0;return rng%mod;};
  const dirs=['N','E','S','W'];
  for(let k=0;k<35&&state.phase==='player';k++){
   const pool=[...dirs.map(direction=>({type:'MOVE',direction})),...dirs.map(direction=>({type:'AIM',direction})),{type:'TOGGLE_LANTERN'},{type:'STRIKE'},{type:'END_TURN'}];
   const pr=C.preview(state),resolution=C.enemyPhase(state);
   assert.deepEqual(pr.after,resolution.state);assert.deepEqual(pr.events,resolution.events);tested++;
   const res=C.reducer(state,pool[draw(pool.length)]);if(res.changed)state=res.state;
  }
 }
 assert.ok(tested>100);
});
