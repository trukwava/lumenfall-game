const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const C=require('../core.js');
const game=fs.readFileSync(path.join(__dirname,'..','game.js'),'utf8');
const markup=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const ids=new Set([...markup.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]));

function boot(){
 const canvasOps={calls:0};
 const gradient={addColorStop(){}};
 const ctx=new Proxy({},{
  get(_target,key){
   if(key==='createRadialGradient'||key==='createLinearGradient')return ()=>gradient;
   if(typeof key==='string')return (..._args)=>{canvasOps.calls++;};
   return undefined;
  },
  set(){return true;}
 });
 const elements={},handlers={};
 const classes=()=>({add(){},remove(){},toggle(){}});
 function element(id){
  if(!elements[id])elements[id]={
   id,value:id==='seedInput'?'0':'',hidden:id==='continueBtn',classList:classes(),
   innerHTML:'',textContent:'',disabled:false,open:false,
   getContext(){return ctx;},
   addEventListener(type,fn){handlers[id+':'+type]=fn;},
   getBoundingClientRect(){return{left:0,top:0,width:768,height:768};},
   showModal(){this.open=true;},close(){this.open=false;}
  };
  return elements[id];
 }
 element('seedInput');
 const document={
  getElementById(id){assert.ok(ids.has(id),'missing '+id);return element(id);},
  querySelector(){return element('css-query');},
  body:{}
 };
 const store=new Map([['lumenfall-motion','on']]);
 const localStorage={
  getItem:k=>store.has(k)?store.get(k):null,
  setItem:(k,v)=>store.set(k,v),
  removeItem:k=>store.delete(k)
 };
 let frames=[],previewCalls=0;
 const LumenCore={...C,preview(s){previewCalls++;return C.preview(s);}};
 const window={
  LumenCore,devicePixelRatio:2,
  matchMedia(){return{matches:false};},
  addEventListener(type,fn){handlers['window:'+type]=fn;}
 };
 new Function('window','document','localStorage','requestAnimationFrame',game)(
  window,document,localStorage,fn=>{frames.push(fn);}
 );
 return{
  elements,handlers,store,canvasOps,
  get previewCalls(){return previewCalls;},
  render(ts){const frame=frames.shift();assert.equal(typeof frame,'function');frame(ts);}
 };
}

test('Canvas renders animated frames without changing the simulated game state',()=>{
 const ui=boot();
 ui.handlers['startBtn:click']();
 const before=JSON.parse(ui.store.get('lumenfall-run-v3')).state;
 for(let i=1;i<=12;i++)ui.render(16.67*i);
 const after=JSON.parse(ui.store.get('lumenfall-run-v3')).state;
 assert.deepEqual(after,before);
 assert.ok(ui.canvasOps.calls>400,'expected drawing operations');
});

test('enemy simulation is cached across animation frames',()=>{
 const ui=boot();
 ui.handlers['startBtn:click']();
 const before=ui.previewCalls;
 for(let i=1;i<=18;i++)ui.render(i*16.67);
 assert.equal(ui.previewCalls,before,'frames must not repeatedly simulate enemies');
 ui.handlers['strikeBtn:click']();
 assert.ok(ui.previewCalls>before);
 const afterAction=ui.previewCalls;
 for(let i=19;i<=35;i++)ui.render(i*16.67);
 assert.equal(ui.previewCalls,afterAction,'new simulation should be cached');
});

test('after combat actions, battlefield and player effects remain drawable',()=>{
 const ui=boot();
 ui.handlers['startBtn:click']();
 ui.handlers['strikeBtn:click']();
 ui.render(16);
 ui.handlers['window:keydown']({key:'ArrowUp',shiftKey:false,preventDefault(){}});
 ui.render(32);
 ui.handlers['window:keydown']({key:'Enter',shiftKey:false,preventDefault(){}});
 ui.render(48);
 assert.ok(ui.canvasOps.calls>100);
});

test('seed-copy fallback gives the player their reproducible challenge code',()=>{
 const ui=boot();
 ui.elements.seedInput.value='864209';
 ui.handlers['startBtn:click']();
 ui.handlers['seedCopyBtn:click']();
 assert.match(ui.elements.statusMessage.textContent,/864209/);
});
