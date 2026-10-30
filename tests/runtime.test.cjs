const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const coreSource=fs.readFileSync(path.join(__dirname,'..','core.js'),'utf8');
const gameSource=fs.readFileSync(path.join(__dirname,'..','game.js'),'utf8');
const markup=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const ids=new Set([...markup.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]));
const isolated={};
new Function('globalThis',coreSource)(isolated);
const C=isolated.LumenCore;

function boot(store,location=null){
 const elements={},handlers={};
 const clazz=()=>({add(){},remove(){},toggle(){}});
 function element(id){
  if(!elements[id])elements[id]={
   id,innerHTML:'',textContent:'',hidden:id==='continueBtn',classList:clazz(),disabled:false,open:false,
   addEventListener(type,fn){handlers[id+':'+type]=fn;},
   getContext(){return {};},
   showModal(){this.open=true;},close(){this.open=false;},
   getBoundingClientRect(){return {left:0,top:0,width:768,height:768};}
  };
  return elements[id];
 }
 element('seedInput').value='0'; // Keep baseline smoke tests on the authored seed.
 const document={
  getElementById(id){assert.ok(ids.has(id),'missing DOM element '+id);return element(id);},
  querySelector(){return element('synthetic');},body:{}
 };
 const window={LumenCore:C,devicePixelRatio:1,location,addEventListener(type,fn){handlers['window:'+type]=fn;}};
 const localStorage={
  getItem:key=>store.has(key)?store.get(key):null,
  setItem:(key,value)=>store.set(key,value),
  removeItem:key=>store.delete(key)
 };
 new Function('window','document','localStorage','requestAnimationFrame',gameSource)(window,document,localStorage,()=>{});
 return {elements,handlers};
}
test('interface boots with no missing elements and game starts with a valid save',()=>{
 const store=new Map(),ui=boot(store);
 ui.handlers['startBtn:click']();
 const snapshot=JSON.parse(store.get('lumenfall-run-v3')).state;
 assert.ok(C.loadable(snapshot));
 assert.equal(snapshot.ap,3);
 assert.equal(snapshot.roomIndex,0);
});
test('striking saves an action and resume restores the exact board state',()=>{
 const store=new Map();let ui=boot(store);
 ui.handlers['startBtn:click']();ui.handlers['strikeBtn:click']();
 const old=JSON.parse(store.get('lumenfall-run-v3')).state;
 assert.equal(old.ap,2);assert.equal(old.enemies[0].hp,0);
 ui=boot(store);
 assert.equal(ui.elements.continueBtn.hidden,false);
 ui.handlers['continueBtn:click']();
 assert.equal(ui.elements.apLabel.textContent,'2 AVAILABLE');
 assert.equal(ui.elements.chamberLabel.textContent,'THE SHATTERED PASSAGE');
});
test('victory in first chamber opens the relic interlude and saves reward state',()=>{
 const store=new Map(),ui=boot(store);
 ui.handlers['startBtn:click']();
 const script=['F','w','W','Enter','d','F','F','Enter','w','d','Enter','D','F'];
 const shifted=new Set([2,11]);
 for(let i=0;i<script.length;i++){
  const key=script[i]==='Enter'?'Enter':script[i].toLowerCase();
  ui.handlers['window:keydown']({key,shiftKey:shifted.has(i),preventDefault(){}});
 }
 const saved=JSON.parse(store.get('lumenfall-run-v3')).state;
 assert.equal(saved.phase,'reward');
 assert.equal(ui.elements.rewardOverlay.classList===undefined,false);
 assert.ok(ui.elements.rewardOptions.innerHTML.includes('data-relic="longwick"'));
 ui.handlers['rewardOptions:click']({target:{closest:()=>({dataset:{relic:'longwick'}})}});
 const next=JSON.parse(store.get('lumenfall-run-v3')).state;
 assert.equal(next.roomIndex,1);assert.equal(next.phase,'player');
 assert.equal(next.relics[0],'longwick');
});

test('numeric challenge seeds produce identical spawns on replay',()=>{
 const storeA=new Map(),storeB=new Map(),a=boot(storeA),b=boot(storeB);
 a.elements.seedInput.value='321765';
 b.elements.seedInput.value='321765';
 a.handlers['startBtn:click']();b.handlers['startBtn:click']();
 const runA=JSON.parse(storeA.get('lumenfall-run-v3')).state;
 const runB=JSON.parse(storeB.get('lumenfall-run-v3')).state;
 assert.equal(runA.seed,321765);
 assert.deepEqual(runA.enemies,runB.enemies);
 assert.equal(C.loadable(runA),true);
});
test('UI completes all six chambers, saves personal best, and clears active run',()=>{
 const store=new Map(),ui=boot(store);
 const scripts=[
 ['Sskitter-a','MN','AN','E','ME','Swatcher-a','Swatcher-a','E','MN','AE','Sskitter-b'],
 ['Sskitter-a','AN','E','ME','ME','Swatcher-a','E','AE','Sskitter-b'],
 ['AN','Swatcher-a','E','AE','Sskitter-a','E','MN','E','MS','ME','Sskitter-b','E','AN','E','ME','ME','E','ME','ME','Swatcher-b'],
 ['Sskitter-a','MN','MN','E','AN','ME','Swatcher-a','E','MN','AE','Sskitter-b'],
 ['Sskitter-a','AN','Swatcher-b','E','MN','E','MN','MN','E','MN','AE','Swatcher-a'],
 ['MN','MN','Sheart-a','E','Sheart-a','Sheart-a','E','MS','MS','Sskitter-a']
 ];
 const picks=['brightsteel','ashward','longwick','starheart','pilgrim'];
 const key={N:'ArrowUp',E:'ArrowRight',S:'ArrowDown',W:'ArrowLeft'};
 ui.handlers['startBtn:click']();
 for(let room=0;room<scripts.length;room++){
  for(const command of scripts[room]){
   if(command[0]==='S'){
    const saved=JSON.parse(store.get('lumenfall-run-v3')).state;
    const target=saved.enemies.find(e=>e.id===command.slice(1));
    assert.ok(target,'missing target '+command);
    const event={clientX:64+target.x*80+40,clientY:64+target.y*80+40};
    ui.handlers['board:click'](event);
   }else{
    const event={key:command==='E'?'Enter':key[command[1]],shiftKey:command[0]==='A',preventDefault(){}};
    ui.handlers['window:keydown'](event);
   }
  }
  if(room<5){
   const state=JSON.parse(store.get('lumenfall-run-v3')).state;
   assert.equal(state.phase,'reward','reward after chamber '+(room+1));
   ui.handlers['rewardOptions:click']({target:{closest:()=>({dataset:{relic:picks[room]}})}});
   assert.equal(JSON.parse(store.get('lumenfall-run-v3')).state.roomIndex,room+1);
  }
 }
 assert.equal(store.has('lumenfall-run-v3'),false);
 assert.equal(ui.elements.resultTitle.textContent,'DAWN RETURNS');
 const best=JSON.parse(store.get('lumenfall-personal-best-v1'));
 assert.equal(best.turns,18);assert.equal(best.hp,7);assert.equal(best.seed,0);
 const reloaded=boot(store);
 assert.match(reloaded.elements.recordLine.textContent,/PERSONAL BEST/);
});

test('shared challenge URL pre-fills a reproducible encounter seed',()=>{
 const location={search:'?seed=183604&mode=classic',protocol:'https:',origin:'https://trukwava.github.io',pathname:'/lumenfall-game/'};
 const store=new Map(),ui=boot(store,location);
 assert.equal(ui.elements.seedInput.value,'183604');
 ui.handlers['startBtn:click']();
 const saved=JSON.parse(store.get('lumenfall-run-v3')).state;
 assert.equal(saved.seed,183604);
 assert.deepEqual(saved.enemies,C.newGame(183604).enemies);
});

test('invalid out-of-range challenge URLs do not override default seed input',()=>{
 const store=new Map(),ui=boot(store,{search:'?seed=999999999999'});
 assert.equal(ui.elements.seedInput.value,'0');
});

test('restart confirmation protects an active saved run until approved',()=>{
 const store=new Map(),ui=boot(store);
 ui.handlers['startBtn:click']();
 ui.handlers['strikeBtn:click']();
 const before=store.get('lumenfall-run-v3');
 ui.handlers['replayBtn:click']();
 assert.equal(ui.elements.restartDialog.open,true);
 ui.handlers['window:keydown']({key:'ArrowUp',shiftKey:false,preventDefault(){}});
 assert.equal(store.get('lumenfall-run-v3'),before,'controls must not change state under dialog');
 ui.handlers['cancelRestartBtn:click']();
 assert.equal(ui.elements.restartDialog.open,false);
 assert.equal(store.get('lumenfall-run-v3'),before);
 ui.handlers['replayBtn:click']();
 ui.handlers['confirmRestartBtn:click']();
 assert.equal(ui.elements.restartDialog.open,false);
 assert.deepEqual(JSON.parse(store.get('lumenfall-run-v3')).state,C.newGame());
});

test('invalid challenge-seed input blocks new game until corrected',()=>{
 const store=new Map(),ui=boot(store);
 ui.elements.seedInput.value='not-a-number';
 ui.handlers['startBtn:click']();
 assert.equal(store.has('lumenfall-run-v3'),false);
 assert.match(ui.elements.seedError.textContent,/whole number/);
 ui.elements.seedInput.value='4294967295';
 ui.handlers['startBtn:click']();
 assert.equal(JSON.parse(store.get('lumenfall-run-v3')).state.seed,4294967295);
 assert.equal(ui.elements.seedError.textContent,'');
});
test('malformed stored personal-best record is ignored rather than displayed',()=>{
 const store=new Map([['lumenfall-personal-best-v1','{"turns":"unknown","hp":99,"seed":-1}']]);
 const ui=boot(store);
 assert.match(ui.elements.recordLine.textContent,/FIRST DESCENT/);
});

test('movement pad spends AP and disables blocked or unaffordable moves',()=>{
 const store=new Map(),ui=boot(store);
 ui.handlers['startBtn:click']();
 assert.equal(ui.elements.moveS.disabled,false);
 assert.equal(ui.elements.moveE.disabled,false);
 ui.handlers['moveN:click']();
 let s=JSON.parse(store.get('lumenfall-run-v3')).state;
 assert.equal(s.player.y,5);assert.equal(s.ap,2);
 ui.handlers['moveE:click']();
 s=JSON.parse(store.get('lumenfall-run-v3')).state;
 assert.equal(s.player.x,2);assert.equal(s.ap,1);
 ui.handlers['moveN:click']();
 s=JSON.parse(store.get('lumenfall-run-v3')).state;
 assert.equal(s.player.y,4);assert.equal(s.ap,0);
 assert.equal(ui.elements.moveN.disabled,true);
 assert.equal(ui.elements.moveS.disabled,true);
});
