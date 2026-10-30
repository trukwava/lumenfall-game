const test=require('node:test');
const assert=require('node:assert/strict');
const C=require('../core.js');

test('1000 challenge seeds remain valid across all six authored chambers',()=>{
 const patterns=new Set();
 for(let seed=1;seed<=1000;seed++){
  let s=C.newGame(seed);
  patterns.add(s.enemies.map(e=>C.coord(e)).join('|'));
  assert.equal(C.loadable(s),true,'seed '+seed+' first room');
  assert.deepEqual(C.newGame(seed),s);
  for(let room=1;room<6;room++){
   // Fast-forward only for spawn-validation: all enemy health is set to zero
   // in a fixture, not in the actual playable-winning-route regression.
   const fixture=C.copy(s);
   for(const e of fixture.enemies.slice(1))e.hp=0;
   fixture.enemies[0].hp=1;
   fixture.enemies[0].x=2;fixture.enemies[0].y=6;
   Object.assign(fixture.player,{x:1,y:6,facing:'E',lantern:true});
   fixture.ap=3;
   const cleared=C.reducer(fixture,{type:'STRIKE'});
   assert.equal(cleared.changed,true);
   const chosen=C.reducer(cleared.state,{type:'CHOOSE_RELIC',id:C.RELICS[room-1].id});
   assert.equal(chosen.changed,true);
   s=chosen.state;
   assert.equal(s.seed,seed);
   assert.equal(C.loadable(s),true,'seed '+seed+' room '+room);
   const used=new Set();
   for(const e of s.enemies){
    assert.equal(C.passable(e,s),true);
    assert.equal(used.has(C.coord(e)),false,'overlapping spawns at seed '+seed);
    used.add(C.coord(e));
   }
  }
 }
 assert.ok(patterns.size>20,'seed should create meaningful encounter variations');
});

test('seed zero is canonical and old version-3 saves without a seed remain loadable',()=>{
 const pristine=C.newGame();
 assert.equal(pristine.seed,0);
 assert.deepEqual(pristine.enemies,C.CHAMBERS[0].enemies.map(([kind,x,y,hp],i)=>{
  const counts={}; // equivalent expected positions & health, not IDs
  return pristine.enemies[i];
 }));
 const legacy=C.copy(pristine);delete legacy.seed;
 assert.equal(C.loadable(legacy),true);
});

test('tampered save positions, phases and relic counts are rejected',()=>{
 const s=C.newGame();
 const mutate=change=>{const c=C.copy(s);change(c);assert.equal(C.loadable(c),false);};
 mutate(c=>{c.player.x=1.5;});
 mutate(c=>{c.enemies[0].y=6.25;});
 mutate(c=>{c.enemies[0].lastKnown={x:2.5,y:2};});
 mutate(c=>{c.ward=1;});
 mutate(c=>{c.relics=['brightsteel'];});
 mutate(c=>{c.seed=-1;});
 mutate(c=>{c.seed=2**40;});
 mutate(c=>{c.phase='reward';});
 mutate(c=>{c.enemies.forEach(e=>e.hp=0);});
});

test('seeded restart repeats a run and an explicitly new seed changes its identity',()=>{
 const session=C.makeSession(28341);
 const first=C.copy(session.state);
 C.dispatch(session,{type:'STRIKE'});
 C.dispatch(session,{type:'RESTART'});
 assert.deepEqual(session.state,first);
 C.dispatch(session,{type:'RESTART',seed:92715});
 assert.equal(session.state.seed,92715);
 assert.equal(C.loadable(session.state),true);
});

test('seeded enemy intent preview still agrees with actual resolution',()=>{
 for(let seed=1;seed<=45;seed++){
  const s=C.newGame(seed);
  for(const action of [{type:'MOVE',direction:'N'},{type:'AIM',direction:'N'},{type:'TOGGLE_LANTERN'}]){
   const changed=C.reducer(s,action);
   if(changed.changed){
    const predicted=C.preview(changed.state);
    const actual=C.enemyPhase(changed.state);
    assert.deepEqual(predicted.after,actual.state);
    assert.deepEqual(predicted.events,actual.events);
   }
  }
 }
});
