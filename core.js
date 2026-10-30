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
  const WALL_SET=new Set(WALLS.map(([x,y])=>`${x},${y}`));
  const wall=p=>WALL_SET.has(coord(p));
  const add=(p,d)=>({x:p.x+DIRECTIONS[d].x,y:p.y+DIRECTIONS[d].y});
  const passable=p=>inside(p)&&!wall(p);
  const facing=(a,b)=>a.x===b.x?(a.y>b.y?'N':'S'):(a.x>b.x?'W':'E');
  function newGame(){return {
    version:1,phase:'player',turn:1,ap:MAX_AP,
    player:{x:1,y:6,hp:MAX_HP,maxHp:MAX_HP,facing:'E',lantern:true},
    enemies:[
      {id:'skitter-a',kind:'skitter',x:5,y:6,hp:1,maxHp:1,lastKnown:{x:1,y:6}},
      {id:'skitter-b',kind:'skitter',x:6,y:3,hp:1,maxHp:1,lastKnown:{x:1,y:6}},
      {id:'watcher-a',kind:'watcher',x:2,y:2,hp:2,maxHp:2,lastKnown:null}
    ]
  };}
  function beamCells(s){
    if(!s.player.lantern)return [];
    const p=s.player, cells=[{x:p.x,y:p.y}];
    let cur={x:p.x,y:p.y};
    for(let i=0;i<BASE_RANGE;i++){
      cur=add(cur,p.facing);
      if(!inside(cur)||wall(cur))break;
      cells.push(cur);
    }
    return cells;
  }
  function illuminated(s,p){return beamCells(s).some(q=>same(q,p));}
  function clearLane(a,b,maxRange=5){
    if(a.x!==b.x&&a.y!==b.y)return false;
    if(dist(a,b)>maxRange||dist(a,b)===0)return false;
    const dir=facing(a,b);let q={x:a.x,y:a.y};
    while(!same(q,b)){
      q=add(q,dir);
      if(wall(q))return false;
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
        if(visited.has(key)||!passable(p)||occupied(s,p,id))continue;
        // Cannot occupy the player's tile; enemies attack it only when adjacent.
        if(same(p,s.player))continue;
        const first=cur.first||p;
        if(same(p,to))return first;
        visited.add(key);queue.push({p,first});
      }
    }
    // Approach a blocked target (e.g. remembered player tile) via nearest adjacent tile.
    const choices=ORDER.map(d=>add(to,d)).filter(p=>passable(p)&&!occupied(s,p,id)&&!same(p,s.player));
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
        if(visited.has(key)||!passable(p)||occupied(s,p,id)||same(p,s.player))continue;
        const first=queue[i].first||p;
        if(same(p,to))return {first,length:queue[i].length+1};
        visited.add(key);queue.push({p,first,length:queue[i].length+1});
      }
    }
    return null;
  }
  function enemyPhase(source){
    const s=copy(source),events=[];
    if(s.phase!=='player')return {state:s,events};
    const ordered=s.enemies.filter(e=>e.hp>0).sort((a,b)=>a.id.localeCompare(b.id));
    for(const e of ordered){
      if(s.player.hp<=0)break;
      const from={x:e.x,y:e.y},p={x:s.player.x,y:s.player.y};
      if(dist(e,p)===1){
        s.player.hp=Math.max(0,s.player.hp-1);
        events.push({type:'enemyAttack',enemyId:e.id,from,target:p,damage:1});
        continue;
      }
      if(e.kind==='watcher'){
        if(s.player.lantern&&clearLane(e,p,5)){
          s.player.hp=Math.max(0,s.player.hp-1);
          events.push({type:'enemyAttack',enemyId:e.id,from,target:p,damage:1});
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
      if(!passable(to)||occupied(s,to))return invalid('That tile is blocked.');
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
      target.hp--;s.ap--;
      events.push({type:'strike',targetId:target.id,to:{x:target.x,y:target.y},killed:target.hp===0});
      if(s.enemies.every(e=>e.hp<=0)){
        s.phase='won';events.push({type:'victory'});
      }
    }else return invalid('Unknown action.');
    return {state:s,events,changed:true};
  }
  function makeSession(){return {state:newGame(),history:[],lastEvents:[],message:'Find the light. Master the dark.'};}
  function dispatch(session,action){
    if(action.type==='RESTART'){
      session.state=newGame();session.history=[];
      session.lastEvents=[{type:'restart'}];session.message='A new light burns.';
      return true;
    }
    if(action.type==='UNDO'){
      if(!session.history.length){session.message='Nothing to undo this turn.';return false;}
      session.state=session.history.pop();session.lastEvents=[{type:'undo'}];session.message='Moment rewound.';return true;
    }
    const result=reducer(session.state,action);
    if(!result.changed){session.message=result.events[0]?.reason||'Action not available.';session.lastEvents=result.events;return false;}
    if(action.type==='END_TURN')session.history=[];
    else session.history.push(copy(session.state));
    session.state=result.state;session.lastEvents=result.events;
    const messages={MOVE:'A quiet step through the ruin.',AIM:'The lantern turns.',TOGGLE_LANTERN:session.state.player.lantern?'The light returns.':'The dark embraces you.',STRIKE:'Radiance cuts through shadow.',END_TURN:'The darkness answers.'};
    session.message=session.state.phase==='won'?'The observatory remembers the dawn.':session.state.phase==='lost'?'The final ember fades.':messages[action.type];
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
  return {SIZE,MAX_HP,MAX_AP,BASE_RANGE,DIRECTIONS,WALLS,wall,inside,passable,add,dist,coord,same,copy,newGame,beamCells,illuminated,clearLane,nearestLit,enemyPhase,reducer,makeSession,dispatch,preview};
});
