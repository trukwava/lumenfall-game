const test=require('node:test');
const assert=require('node:assert/strict');
const C=require('../core.js');

// Recorded with an adversarial deterministic tactical search agent.
// This is a real winning route for a nonzero challenge seed, not a fixture.
const ROUTE=[
  {
    "actions": [
      "AN",
      "ME",
      "Swatcher-a",
      "E",
      "Swatcher-a",
      "AE",
      "Sskitter-a",
      "E",
      "MN",
      "MN",
      "Sskitter-b"
    ],
    "relic": "brightsteel"
  },
  {
    "actions": [
      "Sskitter-a",
      "AN",
      "ME",
      "E",
      "ME",
      "ME",
      "Swatcher-a",
      "E",
      "AE",
      "Sskitter-b"
    ],
    "relic": "ashward"
  },
  {
    "actions": [
      "MN",
      "MN",
      "E",
      "MN",
      "MN",
      "Swatcher-a",
      "E",
      "MN",
      "E",
      "MN",
      "E",
      "ME",
      "E",
      "MS",
      "MS",
      "Sskitter-b",
      "E",
      "AS",
      "MW",
      "Sskitter-a",
      "E",
      "MN",
      "E",
      "MN",
      "E",
      "AN",
      "E",
      "ME",
      "E",
      "ME",
      "E",
      "ME",
      "ME",
      "E",
      "ME",
      "AS",
      "Swatcher-b"
    ],
    "relic": "longwick"
  },
  {
    "actions": [
      "Sskitter-a",
      "MN",
      "E",
      "MN",
      "MN",
      "Swatcher-a",
      "E",
      "MS",
      "E",
      "MS",
      "MS",
      "Sskitter-b"
    ],
    "relic": "starheart"
  },
  {
    "actions": [
      "Sskitter-a",
      "AN",
      "Swatcher-b",
      "E",
      "MN",
      "E",
      "MN",
      "MN",
      "E",
      "MN",
      "AE",
      "Swatcher-a"
    ],
    "relic": "pilgrim"
  },
  {
    "actions": [
      "Sskitter-a",
      "MN",
      "MN",
      "E",
      "Sheart-a",
      "Sheart-a",
      "Sheart-a"
    ],
    "relic": null
  }
];
const decode=s=>s==='E'?{type:'END_TURN'}:s==='L'?{type:'TOGGLE_LANTERN'}:s[0]==='M'?{type:'MOVE',direction:s.slice(1)}:s[0]==='A'?{type:'AIM',direction:s.slice(1)}:{type:'STRIKE',targetId:s.slice(1)};

test('shared challenge seed 183604 has a legitimate complete winning run',()=>{
 let state=C.newGame(183604),commands=0;
 for(let room=0;room<ROUTE.length;room++){
  assert.equal(C.loadable(state),true);
  assert.equal(state.roomIndex,room);
  for(const code of ROUTE[room].actions){
   const action=decode(code),res=C.reducer(state,action);
   assert.equal(res.changed,true,'illegal '+code+' in room '+(room+1));
   if(action.type==='END_TURN'){
    const p=C.preview(state);
    assert.deepEqual(res.state,p.after);
   }
   state=res.state;commands++;
   if(state.phase!=='won')assert.equal(C.loadable(state),true);
   assert.ok(state.player.hp>0);
  }
  assert.equal(state.phase,room===5?'won':'reward');
  if(room<5){
   const choice=C.reducer(state,{type:'CHOOSE_RELIC',id:ROUTE[room].relic});
   assert.equal(choice.changed,true);state=choice.state;
  }
 }
 assert.equal(state.phase,'won');
 assert.equal(state.seed,183604);
 assert.equal(state.turn,25);
 assert.equal(state.player.hp,7);
 assert.ok(commands>65);
});
