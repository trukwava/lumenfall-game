/* LUMENFALL — deterministic, renderer-independent simulation.
   No Date, Math.random, DOM, Phaser, timers, or rendering calls in this file. */
(function(root, factory){
  const api=factory();
  if(typeof module==='object'&&module.exports) module.exports=api;
  root.LumenCore=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const SIZE=8, MAX_HP=6, MAX_AP=3, BASE_RANGE=4;
  const DIRECTIONS={N:{x:0,y:-1},E:{x:1,y:0},S:{x:0,y:1},W:{x:-1,y:0}};
  const ORDER=['N','E','S','W'];
  const WALLS=[[3,1],[3,2],[3,3],[1,2],[5,1],[3,5],[4,5],[6,4]];
  const coord=(p)=>`${p.x},${p.y}`;
  const same=(a,b)=>a.x===b.x&&a.y===b.y;
  const inside=p=>p.x>=0&&p.y>=0&&p.x<SIZE&&p.y<SIZE;
  const dist=(a,b)=>Math.abs(a.x-b.x)+Math.abs(a.y-b.y);
  const copy=o=>JSON.parse(JSON.stringify(o));
  const CHAMBERS=[
    {name:'THE SHATTERED PASSAGE',walls:WALLS,enemies:[['skitter',5,6,1],['skitter',6,3,1],['watcher',2,2,2]]},
    {name:'THE VEILED GALLERY',walls:[[2,1],[2,2],[5,1],[5,2],[2,4],[5,4],[2,5]],enemies:[['skitter',4,6,1],['skitter',6,5,1],['watcher',3,2,2]]},
    {name:'THE STARLESS ALTAR',walls:[[3,1],[4,1],[2,3],[5,3],[3,4],[4,4],[2,5],[5,5]],enemies:[['skitter',6,6,1],['skitter',5,4,1],['watcher',1,2,2],['watcher',6,2,2]]},
    {name:'THE CINDER LABYRINTH',walls:[[3,1],[3,2],[5,2],[3,4],[5,4],[2,5],[4,5]],enemies:[['skitter',5,6,1],['skitter',6,3,1],['watcher',2,2,2]]},
    {name:'THE MIRROR VAULT',walls:[[2,1],[5,1],[3,3],[4,3],[2,5],[5,5]],enemies:[['skitter',4,6,1],['watcher',6,2,2],['watcher',1,3,2]]},
    {name:'THE ECLIPSE SANCTUM',walls:[[2,2],[5,2],[2,5],[5,5],[3,3],[4,3]],enemies:[['heart',5,4,5],['skitter',6,6,1]]}
  ];
  const RELICS=[
    {id:'longwick',name:'LONGWICK',symbol:'✧',description:'Lantern range increases by one tile.'},
    {id:'ashward',name:'ASH WARD',symbol:'◈',description:'Negate the first enemy hit in each later chamber.'},
    {id:'emberwell',name:'EMBERWELL',symbol:'✦',description:'Restore two points of vital flame immediately.'},
    {id:'starheart',name:'STARHEART',symbol:'◆',description:'Increase maximum flame by one and restore one flame.'},
    {id:'brightsteel',name:'BRIGHTSTEEL',symbol:'◇',description:'Radiant Strike inflicts two damage on Watchers and the Eclipse Heart.'},
    {id:'pilgrim',name:'PILGRIM FLAME',symbol:'☼',description:'Restore one flame when entering each later chamber.'}
  ];
  const WALL_SET=new Set(WALLS.map(([x,y])=>`${x},${y}`));
  const wall=(p,s)=>s?.walls ? s.walls.some(([x,y])=>x===p.x&&y===p.y) : WALL_SET.has(coord(p));
  const add=(p,d)=>({x:p.x+DIRECTIONS[d].x,y:p.y+DIRECTIONS[d].y});
  const passable=(p,s)=>inside(p)&&!wall(p,s);
  const facing=(a,b)=>a.x===b.x?(a.y>b.y?'N':'S'):(a.x>b.x?'W':'E');
  // Bounded spawn variations on authored floorplans; seeded and deterministic.
  // Seed zero preserves the original handcrafted encounter exactly.
  function spawnEnemies(index,seed=0){
    const counts={},used=new Set();
    return CHAMBERS[index].enemies.map(([kind,x,y,hp],i)=>{
      const label=String.fromCharCode(97+(counts[kind]||0));counts[kind]=(counts[kind]||0)+1;
      let pos={x,y};
      if(seed){
        const options=[pos,...ORDER.map(d=>add(pos,d))]
          .filter(p=>passable(p,{walls:CHAMBERS[index].walls})&&dist(p,{x:1,y:6})>1&&!used.has(coord(p)));
        let hash=(seed^Math.imul(index+1,0x9e3779b1)^Math.imul(i+1,0x85ebca6b))>>>0;
        hash^=hash>>>16;hash=Math.imul(hash,0x7feb352d);hash^=hash>>>15;
        if(options.length)pos=options[(hash>>>0)%options.length];
      }
      used.add(coord(pos));
      return {id:`${kind}-${label}`,kind,x:pos.x,y:pos.y,hp,maxHp:hp,lastKnown:(kind==='skitter'||kind==='heart')?{x:1,y:6}:null};
    });
  }
  function newGame(seed=0){
    seed=Number.isSafeInteger(seed)&&seed>=0&&seed<=0xffffffff?seed:0;
    return {
    version:3,seed,phase:'player',turn:1,ap:MAX_AP,roomIndex:0,relics:[],ward:0,
    walls:copy(CHAMBERS[0].walls),
    player:{x:1,y:6,hp:MAX_HP,maxHp:MAX_HP,facing:'E',lantern:true},
    enemies:spawnEnemies(0,seed)
  };}
  function beamCells(s){
    if(!s.player.lantern)return [];
    const p=s.player, cells=[{x:p.x,y:p.y}];
    let cur={x:p.x,y:p.y};
    for(let i=0;i<BASE_RANGE+(s.relics?.includes('longwick')?1:0);i++){
      cur=add(cur,p.facing);
      if(!inside(cur)||wall(cur,s))break;
      cells.push(cur);
    }
    return cells;
  }
  function illuminated(s,p){return beamCells(s).some(q=>same(q,p));}
  function clearLane(a,b,maxRange=5,s){
    if(a.x!==b.x&&a.y!==b.y)return false;
    if(dist(a,b)>maxRange||dist(a,b)===0)return false;
    const dir=facing(a,b);let q={x:a.x,y:a.y};
    while(!same(q,b)){
      q=add(q,dir);
      if(wall(q,s))return false;
    }
    return true;
  }
  function nearestLit(s){
    return s.enemies.filter(e=>e.hp>0&&illuminated(s,e))
      .sort((a,b)=>dist(s.player,a)-dist(s.player,b)||a.id.localeCompare(b.id))[0]||null;
  }
  function occupied(s,p,exceptId){return s.enemies.some(e=>e.hp>0&&e.id!==exceptId&&same(e,p));}
  // Deterministic BFS; fixed direction tie-breaking is essential to previews and replays.
  function nextStep(s,from,to,id){
    if(!to||same(from,to))return null;
    const queue=[{p:{x:from.x,y:from.y},first:null}];
    const visited=new Set([coord(from)]);
    for(let index=0;index<queue.length;index++){
      const cur=queue[index];
      for(const dir of ORDER){
        const p=add(cur.p,dir), key=coord(p);
        if(visited.has(key)||!passable(p,s)||occupied(s,p,id))continue;
        // Cannot occupy the player's tile; enemies attack it only when adjacent.
        if(same(p,s.player))continue;
        const first=cur.first||p;
        if(same(p,to))return first;
        visited.add(key);queue.push({p,first});
      }
    }
    // Approach a blocked target (e.g. remembered player tile) via nearest adjacent tile.
    const choices=ORDER.map(d=>add(to,d)).filter(p=>passable(p,s)&&!occupied(s,p,id)&&!same(p,s.player));
    const candidates=[];
    for(const goal of choices){
      const step=pathToOpenTile(s,from,goal,id);
      if(step)candidates.push({step,length:step.length,goal});
    }
    candidates.sort((a,b)=>a.length-b.length||dist(a.goal,to)-dist(b.goal,to));
    return candidates.length?candidates[0].step.first:null;
  }
  function pathToOpenTile(s,from,to,id){
    const queue=[{p:{x:from.x,y:from.y},first:null,length:0}],visited=new Set([coord(from)]);
    if(same(from,to))return null;
    for(let i=0;i<queue.length;i++){
      for(const dir of ORDER){
        const p=add(queue[i].p,dir),key=coord(p);
        if(visited.has(key)||!passable(p,s)||occupied(s,p,id)||same(p,s.player))continue;
        const first=queue[i].first||p;
        if(same(p,to))return {first,length:queue[i].length+1};
        visited.add(key);queue.push({p,first,length:queue[i].length+1});
      }
    }
    return null;
  }
  function enemyHit(s,events,e,from,target){
    const blocked=s.ward>0;
    if(blocked)s.ward--;
    else s.player.hp=Math.max(0,s.player.hp-1);
    events.push({type:'enemyAttack',enemyId:e.id,from,target,damage:blocked?0:1,blocked});
  }
  function enemyPhase(source){
    const s=copy(source),events=[];
    if(s.phase!=='player')return {state:s,events};
    const ordered=s.enemies.filter(e=>e.hp>0).sort((a,b)=>a.id.localeCompare(b.id));
    for(const e of ordered){
      if(s.player.hp<=0)break;
      const from={x:e.x,y:e.y},p={x:s.player.x,y:s.player.y};
      if(dist(e,p)===1){
        enemyHit(s,events,e,from,p);
        continue;
      }
      if(e.kind==='heart'){
        // Pulses every second enemy phase; the same exact resolution is used by previews.
        if(s.turn%2===0 && s.player.lantern && dist(e,p)<=2){
          enemyHit(s,events,e,from,p);
          events.push({type:'heartPulse',enemyId:e.id,from});
        }else if(s.player.lantern&&clearLane(e,p,4,s)){
          enemyHit(s,events,e,from,p);
        }else{
          if(s.player.lantern)e.lastKnown={x:p.x,y:p.y};
          const step=nextStep(s,from,e.lastKnown,e.id);
          if(step){e.x=step.x;e.y=step.y;events.push({type:'enemyMove',enemyId:e.id,from,to:{x:e.x,y:e.y}});}
          else events.push({type:'enemyWait',enemyId:e.id,from});
        }
        continue;
      }
      if(e.kind==='watcher'){
        if(s.player.lantern&&clearLane(e,p,5,s)){
          enemyHit(s,events,e,from,p);
        }else events.push({type:'enemyWait',enemyId:e.id,from});
        continue;
      }
      // Skitters perceive the illuminated player within five tiles.
      if(s.player.lantern&&dist(e,p)<=5)e.lastKnown={x:p.x,y:p.y};
      const goal=e.lastKnown;
      const step=nextStep(s,from,goal,e.id);
      if(step){e.x=step.x;e.y=step.y;events.push({type:'enemyMove',enemyId:e.id,from,to:{x:e.x,y:e.y}});}
      else events.push({type:'enemyWait',enemyId:e.id,from});
    }
    if(s.player.hp===0){s.phase='lost';events.push({type:'defeat'});}
    else{s.turn++;s.ap=MAX_AP;events.push({type:'newTurn',turn:s.turn});}
    return {state:s,events};
  }
  function reducer(source,action){
    const s=copy(source),events=[];
    const invalid=reason=>({state:source,events:[{type:'invalid',reason}],changed:false});
    if(s.phase==='reward' && action?.type==='CHOOSE_RELIC'){
      if(!RELICS.some(r=>r.id===action.id)||s.relics.includes(action.id))return invalid('Choose an available relic.');
      if(action.id==='emberwell')s.player.hp=Math.min(s.player.maxHp,s.player.hp+2);
      if(action.id==='starheart'){s.player.maxHp++;s.player.hp=Math.min(s.player.maxHp,s.player.hp+1);}
      s.relics.push(action.id);
      s.roomIndex++;
      if(s.roomIndex>=CHAMBERS.length)return invalid('No chambers remain.');
      s.walls=copy(CHAMBERS[s.roomIndex].walls);
      s.enemies=spawnEnemies(s.roomIndex,s.seed||0);
      Object.assign(s.player,{x:1,y:6,facing:'E',lantern:true});
      if(s.relics.includes('pilgrim'))s.player.hp=Math.min(s.player.maxHp,s.player.hp+1);
      s.ward=s.relics.includes('ashward')?1:0;
      s.ap=MAX_AP;s.phase='player';
      return {state:s,events:[{type:'chamberStart',roomIndex:s.roomIndex,relic:action.id}],changed:true};
    }
    if(s.phase!=='player')return invalid('The encounter is over.');
    if(!action||typeof action.type!=='string')return invalid('Unknown action.');
    if(action.type==='END_TURN'){
      const after=enemyPhase(s);
      return {...after,changed:true};
    }
    if(s.ap<=0)return invalid('No action points left. End your turn.');
    if(action.type==='MOVE'){
      if(!DIRECTIONS[action.direction])return invalid('Invalid direction.');
      const to=add(s.player,action.direction);
      if(!passable(to,s)||occupied(s,to))return invalid('That tile is blocked.');
      s.player.x=to.x;s.player.y=to.y;s.ap--;
      events.push({type:'move',from:{x:source.player.x,y:source.player.y},to,dir:action.direction});
    }else if(action.type==='AIM'){
      if(!DIRECTIONS[action.direction]||s.player.facing===action.direction)return invalid('Choose a different direction.');
      s.player.facing=action.direction;s.ap--;events.push({type:'aim',dir:action.direction});
    }else if(action.type==='TOGGLE_LANTERN'){
      s.player.lantern=!s.player.lantern;s.ap--;
      events.push({type:'lantern',on:s.player.lantern});
    }else if(action.type==='STRIKE'){
      const target=action.targetId?s.enemies.find(e=>e.id===action.targetId):nearestLit(s);
      if(!target||target.hp<=0||!illuminated(s,target))return invalid('Aim your lantern at a living enemy first.');
      const damage=s.relics.includes('brightsteel')&&(target.kind==='watcher'||target.kind==='heart')?2:1;
      target.hp=Math.max(0,target.hp-damage);s.ap--;
      events.push({type:'strike',targetId:target.id,to:{x:target.x,y:target.y},damage,killed:target.hp===0});
      if(s.enemies.every(e=>e.hp<=0)){
        if((s.roomIndex||0)===CHAMBERS.length-1){s.phase='won';events.push({type:'victory'});}
        else{s.phase='reward';events.push({type:'reward'});}
      }
    }else return invalid('Unknown action.');
    return {state:s,events,changed:true};
  }
  // Save files are user-controlled local data. Validate before restoring to avoid corrupt runs.
  function loadable(s){
    if(!s||s.version!==3||!Number.isInteger(s.roomIndex)||s.roomIndex<0||s.roomIndex>=CHAMBERS.length)return false;
    if(s.seed!==undefined&&(!Number.isSafeInteger(s.seed)||s.seed<0||s.seed>0xffffffff))return false;
    if(!['player','reward'].includes(s.phase)||!Number.isSafeInteger(s.turn)||s.turn<1)return false;
    if(!Number.isInteger(s.ap)||s.ap<0||s.ap>MAX_AP)return false;
    if(!Array.isArray(s.walls)||JSON.stringify(s.walls)!==JSON.stringify(CHAMBERS[s.roomIndex].walls))return false;
    if(!Array.isArray(s.relics)||new Set(s.relics).size!==s.relics.length||s.relics.some(id=>!RELICS.some(r=>r.id===id))||s.relics.length!==s.roomIndex)return false;
    if(!Number.isInteger(s.ward)||s.ward<0||s.ward>1||(!s.relics.includes('ashward')&&s.ward!==0))return false;
    const p=s.player;
    if(!p||!Number.isInteger(p.x)||!Number.isInteger(p.y)||!passable(p,s)||!Object.hasOwn(DIRECTIONS,p.facing)||typeof p.lantern!=='boolean')return false;
    if(!Number.isInteger(p.maxHp)||p.maxHp!==MAX_HP+(s.relics.includes('starheart')?1:0))return false;
    if(!Number.isInteger(p.hp)||p.hp<=0||p.hp>p.maxHp)return false;
    const template=spawnEnemies(s.roomIndex,s.seed||0);
    if(!Array.isArray(s.enemies)||s.enemies.length!==template.length)return false;
    const occupiedPositions=new Set([coord(p)]);
    for(let i=0;i<template.length;i++){
      const e=s.enemies[i],b=template[i];
      if(!e||e.id!==b.id||e.kind!==b.kind||e.maxHp!==b.maxHp||!Number.isInteger(e.x)||!Number.isInteger(e.y)||!passable(e,s))return false;
      if(!Number.isInteger(e.hp)||e.hp<0||e.hp>e.maxHp)return false;
      if(e.hp>0){if(occupiedPositions.has(coord(e)))return false;occupiedPositions.add(coord(e));}
      if(e.lastKnown!==null&&e.lastKnown!==undefined&&(!Number.isInteger(e.lastKnown.x)||!Number.isInteger(e.lastKnown.y)||!inside(e.lastKnown)))return false;
    }
    if(s.phase==='reward' && (s.roomIndex===CHAMBERS.length-1||s.enemies.some(e=>e.hp>0)))return false;
    if(s.phase==='player' && s.enemies.every(e=>e.hp===0))return false;
    return true;
  }
  function makeSession(seed=0){return {state:newGame(seed),history:[],lastEvents:[],message:'Find the light. Master the dark.'};}
  function dispatch(session,action){
    if(action.type==='RESTART'){
      session.state=newGame(action.seed===undefined?(session.state.seed||0):action.seed);session.history=[];
      session.lastEvents=[{type:'restart'}];session.message='A new light burns.';
      return true;
    }
    if(action.type==='UNDO'){
      if(!session.history.length){session.message='Nothing to undo this turn.';return false;}
      session.state=session.history.pop();session.lastEvents=[{type:'undo'}];session.message='Moment rewound.';return true;
    }
    const result=reducer(session.state,action);
    if(!result.changed){session.message=result.events[0]?.reason||'Action not available.';session.lastEvents=result.events;return false;}
    if(action.type==='END_TURN'||action.type==='CHOOSE_RELIC')session.history=[];
    else session.history.push(copy(session.state));
    session.state=result.state;session.lastEvents=result.events;
    const messages={CHOOSE_RELIC:'A deeper chamber awaits.',MOVE:'A quiet step through the ruin.',AIM:'The lantern turns.',TOGGLE_LANTERN:session.state.player.lantern?'The light returns.':'The dark embraces you.',STRIKE:'Radiance cuts through shadow.',END_TURN:'The darkness answers.'};
    session.message=session.state.phase==='won'?'The observatory remembers the dawn.':session.state.phase==='lost'?'The final ember fades.':session.state.phase==='reward'?'A relic calls from the darkness.':messages[action.type];
    return true;
  }
  function preview(s){
    if(s.phase!=='player')return {events:[],damage:0,actions:[]};
    const result=enemyPhase(s);
    return {
      events:result.events,
      damage:s.player.hp-result.state.player.hp,
      actions:result.events.filter(e=>e.type==='enemyAttack'||e.type==='enemyMove'),
      after:result.state
    };
  }
  return {SIZE,MAX_HP,MAX_AP,BASE_RANGE,DIRECTIONS,WALLS,CHAMBERS,RELICS,loadable,wall,inside,passable,add,dist,coord,same,copy,newGame,beamCells,illuminated,clearLane,nearestLit,enemyPhase,reducer,makeSession,dispatch,preview};
});
