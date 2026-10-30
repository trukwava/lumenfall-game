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

function boot(store){
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
 const document={
  getElementById(id){assert.ok(ids.has(id),'missing DOM element '+id);return element(id);},
  querySelector(){return element('synthetic');},body:{}
 };
 const window={LumenCore:C,devicePixelRatio:1,addEventListener(type,fn){handlers['window:'+type]=fn;}};
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
