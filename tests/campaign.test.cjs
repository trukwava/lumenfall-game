const test=require('node:test');
const assert=require('node:assert/strict');
const C=require('../core.js');
const finishRoom=(s)=>{
 const n=C.copy(s);n.enemies.slice(1).forEach(e=>e.hp=0);
 const target=n.enemies[0];target.x=2;target.y=6;target.hp=1;
 n.player.x=1;n.player.y=6;n.player.facing='E';n.player.lantern=true;n.ap=3;
 return C.reducer(n,{type:'STRIKE'});
};
test('three authored chambers are valid and have distinct wall arrangements',()=>{
 assert.equal(C.CHAMBERS.length,3);
 assert.equal(new Set(C.CHAMBERS.map(c=>JSON.stringify(c.walls))).size,3);
 for(const c of C.CHAMBERS){
  for(const [kind,x,y] of c.enemies)assert.ok(!c.walls.some(([wx,wy])=>wx===x&&wy===y),kind);
  assert.ok(!c.walls.some(([x,y])=>x===1&&y===6));
 }
});
test('clearing chamber one offers a relic rather than ending the run',()=>{
 const result=finishRoom(C.newGame());
 assert.equal(result.changed,true);assert.equal(result.state.phase,'reward');
 assert.equal(result.state.roomIndex,0);
 assert.ok(result.events.some(e=>e.type==='reward'));
});
test('relic choice advances chamber and retains player damage',()=>{
 const one=finishRoom(C.newGame()).state;one.player.hp=3;
 const two=C.reducer(one,{type:'CHOOSE_RELIC',id:'longwick'});
 assert.equal(two.changed,true);assert.equal(two.state.roomIndex,1);
 assert.equal(two.state.player.hp,3);assert.equal(two.state.phase,'player');
 assert.equal(two.state.ap,3);assert.equal(two.state.enemies.length,3);
 assert.equal(two.state.relics[0],'longwick');
});
test('longwick extends unobstructed lantern ray to five tiles',()=>{
 const s=C.reducer(finishRoom(C.newGame()).state,{type:'CHOOSE_RELIC',id:'longwick'}).state;
 s.player.x=0;s.player.y=0;s.player.facing='S';
 assert.equal(C.beamCells(s).length,6);
});
test('emberwell heals at acquisition but never over max health',()=>{
 const reward=finishRoom(C.newGame()).state;reward.player.hp=5;
 const result=C.reducer(reward,{type:'CHOOSE_RELIC',id:'emberwell'});
 assert.equal(result.state.player.hp,6);
});
test('ash ward stops one hit per chamber, and preview agrees',()=>{
 let s=C.reducer(finishRoom(C.newGame()).state,{type:'CHOOSE_RELIC',id:'ashward'}).state;
 assert.equal(s.ward,1);
 s.enemies.forEach(e=>e.hp=0);s.enemies[0].hp=1;s.enemies[0].x=2;s.enemies[0].y=6;
 const predicted=C.preview(s),actual=C.enemyPhase(s);
 assert.equal(predicted.damage,0);
 assert.equal(predicted.events.find(e=>e.type==='enemyAttack').blocked,true);
 assert.equal(actual.state.ward,0);assert.equal(actual.state.player.hp,s.player.hp);
 assert.deepEqual(predicted.after,actual.state);
});
test('unavailable relic or relic outside reward phase rejected',()=>{
 const one=C.newGame();
 assert.equal(C.reducer(one,{type:'CHOOSE_RELIC',id:'longwick'}).changed,false);
 const r=finishRoom(one).state;
 assert.equal(C.reducer(r,{type:'CHOOSE_RELIC',id:'invalid'}).changed,false);
 r.relics=['longwick'];assert.equal(C.reducer(r,{type:'CHOOSE_RELIC',id:'longwick'}).changed,false);
});
test('clear third chamber to win, not receive further relics',()=>{
 const one=finishRoom(C.newGame()).state;
 const two=C.reducer(one,{type:'CHOOSE_RELIC',id:'longwick'}).state;
 const rewardTwo=finishRoom(two).state;
 const three=C.reducer(rewardTwo,{type:'CHOOSE_RELIC',id:'ashward'}).state;
 assert.equal(three.roomIndex,2);assert.equal(three.relics.length,2);
 assert.equal(three.ward,1);
 const finish=finishRoom(three);
 assert.equal(finish.state.phase,'won');
 assert.ok(finish.events.some(e=>e.type==='victory'));
});
test('replay resets chambers, relics and health',()=>{
 const ses=C.makeSession();
 C.dispatch(ses,{type:'STRIKE'});
 ses.state=finishRoom(C.newGame()).state;
 C.dispatch(ses,{type:'CHOOSE_RELIC',id:'longwick'});
 C.dispatch(ses,{type:'RESTART'});
 assert.deepEqual(ses.state,C.newGame());assert.equal(ses.history.length,0);
});

test('an entire three-chamber run is winnable with legal actions',()=>{
 const paths=[
  ['STRIKE','MOVE:N','AIM:N','END_TURN','MOVE:E','STRIKE','STRIKE','END_TURN','MOVE:N','MOVE:E','END_TURN','AIM:E','STRIKE'],
  ['STRIKE','MOVE:E','END_TURN','STRIKE','AIM:N','END_TURN','MOVE:E','STRIKE','STRIKE'],
  ['STRIKE','MOVE:N','MOVE:W','END_TURN','MOVE:N','MOVE:N','END_TURN','MOVE:N','STRIKE','STRIKE','END_TURN','MOVE:E','STRIKE','STRIKE','END_TURN','MOVE:S','MOVE:S','MOVE:S','END_TURN','MOVE:S','STRIKE']
 ];
 let s=C.newGame();
 for(let i=0;i<paths.length;i++){
  for(const a of paths[i]){
   const [type,direction]=a.split(':');const r=C.reducer(s,{type,direction});
   assert.equal(r.changed,true,`room ${i+1}, action ${a}`);s=r.state;
  }
  assert.equal(s.phase,i===paths.length-1?'won':'reward');
  if(i<2){const r=C.reducer(s,{type:'CHOOSE_RELIC',id:i===0?'longwick':'emberwell'});assert.equal(r.changed,true);s=r.state;}
 }
 assert.ok(s.player.hp>0);assert.equal(s.roomIndex,2);
});
