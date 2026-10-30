/* LUMENFALL — canvas presentation/input; all game rules live in core.js. */
(function(){
'use strict';
const C=window.LumenCore;
if(!C){document.body.textContent='Unable to load game rules.';return;}
const $=id=>document.getElementById(id),canvas=$('board'),ctx=canvas.getContext('2d');
const W=768, G=80, O=64, TAU=Math.PI*2;
const COLORS={gold:'#f4ca7e',cream:'#fff0be',stone:'#293249',violet:'#ab82d6',danger:'#e57787'};
let session=C.makeSession(),started=false,hover=null,lastFrame=0,shake=0,particles=[],soundOn=true,motionOn=true;
try{soundOn=localStorage.getItem('lumenfall-sound')!=='off';motionOn=localStorage.getItem('lumenfall-motion')!=='off';}catch{}
const rgba=(r,g,b,a)=>`rgba(${r},${g},${b},${a})`;
const centre=p=>({x:O+p.x*G+G/2,y:O+p.y*G+G/2});
const rect=p=>({x:O+p.x*G,y:O+p.y*G});
const rnd=(x,y,k=0)=>{const v=Math.sin(x*127.1+y*311.7+k*73.3)*43758.5453;return v-Math.floor(v);};
let AC;
function playTone(kind){
 if(!soundOn||!started)return;
 try{AC=AC||new (window.AudioContext||window.webkitAudioContext)();if(AC.state==='suspended')AC.resume();
 const t=AC.currentTime;
 const melody={step:[190,160,.045,'triangle'],aim:[350,500,.06,'sine'],toggleOn:[260,630,.22,'sine'],toggleOff:[400,150,.22,'sine'],strike:[560,110,.29,'triangle'],hurt:[130,45,.30,'sawtooth'],end:[180,125,.09,'sine'],win:[580,1020,.5,'sine'],lose:[210,70,.65,'triangle'],undo:[350,260,.13,'triangle'],bad:[120,90,.08,'sine']};
 const [freq,to,dur,type]=melody[kind]||melody.step;
 const o=AC.createOscillator(),g=AC.createGain();o.type=type;o.frequency.setValueAtTime(freq,t);o.frequency.exponentialRampToValueAtTime(Math.max(20,to),t+dur);g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.075,t+.015);g.gain.exponentialRampToValueAtTime(.0001,t+dur);o.connect(g).connect(AC.destination);o.start(t);o.stop(t+dur+.02);
 }catch{}
}
function particleBurst(pos,color,count=20){if(!motionOn)return;for(let i=0;i<count;i++){const a=TAU*rnd(i,pos.x,i*3),v=22+rnd(i,pos.y,2)*110;particles.push({x:pos.x,y:pos.y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-12,life:.3+rnd(i,pos.x,4)*.8,age:0,r:1+rnd(i,pos.y,7)*3,color});}}
function onAction(action){
 if(!started||!(session.state.phase==='player'||(session.state.phase==='reward'&&action.type==='CHOOSE_RELIC')))return;
 const beforeHp=session.state.player.hp;
 const result=C.dispatch(session,action);
 if(result){
  for(const e of session.lastEvents){
   if(e.type==='strike'){particleBurst(centre(e.to),'#f8d18a',34);shake=motionOn?3:0;playTone('strike');}
   else if(e.type==='move'){particleBurst(centre(e.from),'#c9a567',5);playTone('step');}
   else if(e.type==='aim')playTone('aim');
   else if(e.type==='lantern')playTone(e.on?'toggleOn':'toggleOff');
   else if(e.type==='enemyAttack'){particleBurst(centre(e.target),'#e57787',22);shake=motionOn?7:0;playTone('hurt');}
   else if(e.type==='undo')playTone('undo');
   else if(e.type==='reward')playTone('win');
   else if(e.type==='chamberStart'){playTone('toggleOn');particles=[];$('rewardOverlay').classList.remove('visible');}
   else if(e.type==='victory')playTone('win');
   else if(e.type==='defeat')playTone('lose');
  }
  if(action.type==='END_TURN'&&beforeHp===session.state.player.hp)playTone('end');
  if(session.state.phase==='reward')showReward();
  else if(session.state.phase!=='player')showResult();
 }else playTone('bad');
 updateHUD();
}
function showReward(){
 $('rewardOverlay').classList.add('visible');
 $('rewardChamber').textContent=`CHAMBER ${session.state.roomIndex+1} CLEARED`;
 $('rewardOptions').innerHTML=C.RELICS.filter(r=>!session.state.relics.includes(r.id)).map(r=>`<button class="relic-card" data-relic="${r.id}"><span class="relic-symbol">${r.symbol}</span><span><strong>${r.name}</strong><small>${r.description}</small></span><span class="relic-arrow">➜</span></button>`).join('');
}
function showResult(){const won=session.state.phase==='won';$('resultOverlay').classList.add('visible');$('resultSymbol').textContent=won?'✦':'◈';$('resultEyebrow').textContent=won?'THE SHADOWS ARE SILENT':'THE LANTERN GOES DARK';$('resultTitle').textContent=won?'DAWN RETURNS':'FALLEN';$('resultText').textContent=won?'For one more night, the stars remember their names.':'Even the last flame may be rekindled.';$('resultStat').textContent=`${won?'CLEARED':'SURVIVED'} • TURN ${String(session.state.turn).padStart(2,'0')} • ${session.state.player.hp} FLAME REMAINING`;}
function updateHUD(){
 const s=session.state,p=s.player,pr=C.preview(s);
 $('turnLabel').textContent=`TURN ${String(s.turn).padStart(2,'0')}`;
 $('chamberLabel').textContent=C.CHAMBERS[s.roomIndex].name;
 $('sectorLabel').textContent=`CHAMBER ${String(s.roomIndex+1).padStart(2,'0')} / ${String(C.CHAMBERS.length).padStart(2,'0')} // 08×08`;
 $('relicStatus').textContent=s.relics.length?`RELICS: ${s.relics.map(id=>C.RELICS.find(r=>r.id===id).name).join(' · ')}${s.ward?' · WARD READY':''}`:'NO RELICS YET';
 $('hpLabel').textContent=`${p.hp} / ${p.maxHp}`;
 $('hearts').innerHTML=Array.from({length:p.maxHp},(_,i)=>`<span class="heart ${i>=p.hp?'empty':''}" aria-hidden="true">${i<p.hp?'◆':'◇'}</span>`).join('');
 $('apLabel').textContent=`${s.ap} AVAILABLE`;
 $('apPoints').innerHTML=Array.from({length:C.MAX_AP},(_,i)=>`<div class="ap-point ${i>=s.ap?'empty':''}"></div>`).join('');
 $('lanternStatus').textContent=p.lantern?'RADIANT':'VEILED';
 $('lanternHint').textContent=p.lantern?'Reveals enemies. Exposes you.':'Conceals you from distant eyes.';
 $('lanternIcon').textContent=p.lantern?'✦':'☾';
 document.querySelector('.lantern-panel').classList.toggle('off',!p.lantern);
 $('toggleBtn').disabled=s.ap<=0||s.phase!=='player';
 for(const d of ['N','E','S','W']){const b=$('aim'+d);b.classList.toggle('selected',p.facing===d);b.disabled=s.ap<=0||s.phase!=='player'||p.facing===d;}
 $('strikeBtn').disabled=!C.nearestLit(s)||s.ap<=0||s.phase!=='player';
 $('undoBtn').disabled=!session.history.length||s.phase!=='player';
 $('endBtn').disabled=s.phase!=='player';
 $('statusMessage').textContent=session.message;
 const pretty={skitter:'Skitter',watcher:'Watcher'},name=e=>pretty[e.kind]||'Shade';
 $('previewList').innerHTML=pr.events.filter(e=>e.type!=='newTurn').map(e=>{
   const enemy=s.enemies.find(q=>q.id===e.enemyId);if(!enemy)return '';
   if(e.type==='enemyAttack')return `<div class="intent ${e.blocked?'wait':'attack'}"><div class="intent-icon">${e.blocked?'◇':'✕'}</div><span><strong>${name(enemy)}</strong> ${e.blocked?'is blocked by Ash Ward':'strikes you for 1'}</span></div>`;
   if(e.type==='enemyMove')return `<div class="intent"><div class="intent-icon">↗</div><span><strong>${name(enemy)}</strong> advances toward ${e.to.x+1},${e.to.y+1}</span></div>`;
   return `<div class="intent wait"><div class="intent-icon">◌</div><span><strong>${name(enemy)}</strong> holds position</span></div>`;
 }).join('')||'<div class="intent wait">No threats remain.</div>';
 $('previewDamage').textContent=pr.damage>0?`END TURN: −${pr.damage} FLAME`:'END TURN: NO DAMAGE PREDICTED';
 $('previewDamage').classList.toggle('danger',pr.damage>0);
 $('soundBtn').textContent=soundOn?'♪ SOUND ON':'♪ SOUND OFF';$('motionBtn').textContent=motionOn?'◌ MOTION ON':'◌ MOTION OFF';
}
function roundRect(x,y,w,h,r,fill,stroke){ctx.beginPath();ctx.roundRect(x,y,w,h,r);if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.strokeStyle=stroke;ctx.stroke();}}
function glow(x,y,r,color,a=1){let gr=ctx.createRadialGradient(x,y,0,x,y,r);gr.addColorStop(0,color);gr.addColorStop(1,'rgba(0,0,0,0)');ctx.save();ctx.globalAlpha=a;ctx.fillStyle=gr;ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.fill();ctx.restore();}
function line(x1,y1,x2,y2,color,width=1){ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.lineWidth=width;ctx.strokeStyle=color;ctx.stroke();}
function diamond(x,y,r,color){ctx.beginPath();ctx.moveTo(x,y-r);ctx.lineTo(x+r,y);ctx.lineTo(x,y+r);ctx.lineTo(x-r,y);ctx.closePath();ctx.fillStyle=color;ctx.fill();}
function floorTile(x,y,t){
 const xx=O+x*G,yy=O+y*G,a=rnd(x,y);
 ctx.fillStyle=(x+y)%2===0?'#192033':'#171e2e';ctx.fillRect(xx,yy,G,G);
 ctx.fillStyle=rgba(97,115,147,.06+a*.025);ctx.fillRect(xx+3,yy+3,G-6,G-6);
 ctx.strokeStyle='#9aabc018';ctx.lineWidth=1;ctx.strokeRect(xx+.5,yy+.5,G-1,G-1);
 if(a>.38){line(xx+15+a*19,yy+6,xx+24+a*19,yy+22,'#63718d2d');line(xx+24+a*19,yy+22,xx+19+a*13,yy+35,'#63718d22');}
 if(rnd(x,y,13)>.6){const px=xx+16+rnd(x,y,2)*45,py=yy+12+rnd(x,y,3)*56;diamond(px,py,1.4,'#a1a3b344');}
 if((x*13+y*7)%11===2){ctx.save();ctx.translate(xx+40,yy+40);ctx.strokeStyle='#9d8d642a';ctx.lineWidth=1;ctx.beginPath();ctx.arc(0,0,18,0,TAU);ctx.stroke();for(let j=0;j<4;j++){ctx.rotate(Math.PI/2);line(0,-12,0,-19,'#9d8d6438');}ctx.restore();}
}
function wallTile(p){const {x,y}=rect(p);
 ctx.fillStyle='#070d18aa';ctx.fillRect(x+5,y+7,G,G);
 let gr=ctx.createLinearGradient(x,y,x+G,y+G);gr.addColorStop(0,'#515875');gr.addColorStop(.45,'#343e56');gr.addColorStop(1,'#242d42');roundRect(x+4,y+2,G-8,G-8,5,gr,'#7d819151');
 roundRect(x+10,y+8,G-20,G-21,2,'#263146','#9b9ca032');line(x+14,y+15,x+G-15,y+15,'#8996af40',1.5);
 line(x+G*.23,y+G*.3,x+G*.45,y+G*.49,'#8e98af36');line(x+G*.45,y+G*.49,x+G*.35,y+G*.77,'#8e98af30');
 diamond(x+G/2,y+G/2,6,'#9c93704a');diamond(x+G/2,y+G/2,2,'#a9a8a36c');
}
function drawBackground(t){
 ctx.fillStyle='#080d19';ctx.fillRect(0,0,W,W);
 const bg=ctx.createRadialGradient(W/2,W/2,50,W/2,W/2,510);bg.addColorStop(0,'#30344a');bg.addColorStop(.72,'#111628');bg.addColorStop(1,'#070c16');ctx.fillStyle=bg;ctx.fillRect(0,0,W,W);
 for(let i=0;i<115;i++){const x=rnd(i,1)*W,y=rnd(i,2)*W,r=.3+rnd(i,3)*1.4;ctx.fillStyle=rgba(209,205,175,(.1+.12*Math.sin(t*.4+i)));ctx.fillRect(x,y,r,r);}
 ctx.save();ctx.translate(W/2,W/2);ctx.strokeStyle='#b8a17a24';ctx.lineWidth=1;for(const r of [328,344,358]){ctx.beginPath();ctx.arc(0,0,r,0,TAU);ctx.stroke();}for(let i=0;i<32;i++){const a=i*TAU/32;line(Math.cos(a)*328,Math.sin(a)*328,Math.cos(a)*340,Math.sin(a)*340,'#b8a17a35');}ctx.restore();
}
function drawBeam(s,t){
 const cells=C.beamCells(s);
 if(!cells.length)return;
 const amp=motionOn?.94+.06*Math.sin(t*2.7):1;
 for(const p of cells){const {x,y}=rect(p);ctx.fillStyle=`rgba(243,186,86,${.19*amp})`;ctx.fillRect(x+2,y+2,G-4,G-4);ctx.strokeStyle='#ffda8860';ctx.lineWidth=1;ctx.strokeRect(x+3.5,y+3.5,G-7,G-7);}
 const start=centre(s.player),end=centre(cells[cells.length-1]);
 const grad=ctx.createLinearGradient(start.x,start.y,end.x+1,end.y+1);grad.addColorStop(0,'rgba(255,219,133,.25)');grad.addColorStop(1,'rgba(249,193,80,.06)');
 ctx.save();ctx.lineCap='round';ctx.strokeStyle=grad;ctx.lineWidth=G*.72;ctx.shadowBlur=31;ctx.shadowColor='#edaa59';ctx.beginPath();ctx.moveTo(start.x,start.y);ctx.lineTo(end.x,end.y);ctx.stroke();ctx.restore();
 for(let i=1;i<cells.length;i++){const c=centre(cells[i]);glow(c.x,c.y,70,'rgba(249,187,81,.22)',amp);}
 glow(start.x,start.y,112,'rgba(244,177,87,.36)',amp);
}
function drawSkitter(e,t){const c=centre(e),x=c.x,y=c.y+(motionOn?Math.sin(t*3+e.x)*1.8:0);
 glow(x,y,38,'rgba(167,107,221,.24)');ctx.save();ctx.translate(x,y);
 ctx.shadowBlur=17;ctx.shadowColor='#7e4ebf';
 for(const k of [-1,1]){
  line(k*9,-6,k*23,-18,'#8069a6',4);line(k*11,6,k*26,14,'#8069a6',4);line(k*26,14,k*28,23,'#8069a6',2);
 }
 ctx.beginPath();ctx.ellipse(0,2,19,18,0,0,TAU);ctx.fillStyle='#5f497e';ctx.fill();ctx.strokeStyle='#ba8dea';ctx.lineWidth=2;ctx.stroke();
 ctx.beginPath();ctx.moveTo(-16,-6);ctx.lineTo(-6,-21);ctx.lineTo(0,-14);ctx.lineTo(7,-21);ctx.lineTo(16,-6);ctx.closePath();ctx.fillStyle='#79609d';ctx.fill();
 diamond(0,0,8,'#b48ddc');for(const k of [-1,1]){glow(k*7,5,8,'rgba(244,157,196,.5)');ctx.fillStyle='#f4bce1';ctx.fillRect(k*7-2,5,4,4);}ctx.restore();
}
function drawWatcher(e,t){const c=centre(e),x=c.x,y=c.y;
 glow(x,y,46,'rgba(210,98,138,.2)');ctx.save();ctx.translate(x,y);ctx.rotate(motionOn?Math.sin(t*.9+e.y)*.035:0);
 ctx.strokeStyle='#b879a8';ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,0,25,0,TAU);ctx.stroke();
 for(let i=0;i<4;i++){ctx.save();ctx.rotate(i*Math.PI/2);diamond(0,-27,7,'#5a5b87');line(0,-19,0,-13,'#b28db1',2);ctx.restore();}
 ctx.beginPath();ctx.moveTo(0,-20);ctx.lineTo(18,0);ctx.lineTo(0,20);ctx.lineTo(-18,0);ctx.closePath();ctx.fillStyle='#785273';ctx.fill();ctx.strokeStyle='#e1a2bb';ctx.stroke();
 ctx.shadowColor='#ff9fb5';ctx.shadowBlur=17;diamond(0,0,11,'#e58ba8');diamond(0,0,5,'#ffe0de');ctx.restore();
}
function drawPlayer(s,t){const p=s.player,c=centre(p),x=c.x,y=c.y;
 glow(x,y,39,'rgba(245,187,100,.23)');ctx.save();ctx.translate(x,y+(motionOn?Math.sin(t*2.2)*1:0));
 ctx.shadowBlur=13;ctx.shadowColor='#f4bd70';ctx.beginPath();ctx.ellipse(0,20,17,6,0,0,TAU);ctx.fillStyle='#04081680';ctx.fill();
 ctx.beginPath();ctx.moveTo(-15,-10);ctx.lineTo(-21,18);ctx.quadraticCurveTo(0,29,21,18);ctx.lineTo(14,-10);ctx.closePath();ctx.fillStyle='#36485a';ctx.fill();ctx.strokeStyle='#9eaaaf';ctx.lineWidth=1.5;ctx.stroke();
 ctx.beginPath();ctx.moveTo(-14,-17);ctx.quadraticCurveTo(0,-33,14,-17);ctx.lineTo(13,1);ctx.lineTo(-13,1);ctx.closePath();ctx.fillStyle='#a9abb1';ctx.fill();
 ctx.beginPath();ctx.ellipse(0,-9,10,12,0,0,TAU);ctx.fillStyle='#1f2538';ctx.fill();
 line(-6,-8,-2,-8,'#fae1a5',1.5);line(2,-8,6,-8,'#fae1a5',1.5);
 const vec=C.DIRECTIONS[p.facing],lx=vec.x*22,ly=vec.y*22;
 line(lx*.65-3,ly*.65+10,lx-2,ly+10,'#b7a57b',3);
 glow(lx,ly+10,p.lantern?32:12,p.lantern?'rgba(253,205,100,.84)':'rgba(139,145,170,.35)');
 diamond(lx,ly+10,7,p.lantern?'#ffe49b':'#76839c');
 ctx.restore();
 // An always-visible pale circular locator distinguishes the player from foes.
 ctx.strokeStyle='#fbdfaa8c';ctx.lineWidth=1;ctx.beginPath();ctx.arc(x,y,30,0,TAU);ctx.stroke();
}
function enemyHP(e){if(e.maxHp<2)return;const c=centre(e),sz=12,xx=c.x-((e.maxHp*sz+(e.maxHp-1)*3)/2);for(let j=0;j<e.maxHp;j++){roundRect(xx+j*(sz+3),c.y+29,sz,3,0,j<e.hp?'#eeafbd':'#5a4d68',null);}}
function drawPreview(s){const pr=C.preview(s);if(s.phase!=='player')return;
 for(const a of pr.actions){
  if(a.type==='enemyMove'){
    const c=centre(a.to),f=centre(a.from);ctx.save();ctx.setLineDash([6,6]);ctx.strokeStyle='#ca99f2c0';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(f.x,f.y);ctx.lineTo(c.x,c.y);ctx.stroke();ctx.beginPath();ctx.arc(c.x,c.y,21,0,TAU);ctx.stroke();ctx.restore();diamond(c.x,c.y,5,'#bd8be49b');
  }
  if(a.type==='enemyAttack'){
    const c=centre(a.target);ctx.strokeStyle='#f48091';ctx.lineWidth=3;ctx.beginPath();ctx.arc(c.x,c.y,34,0,TAU);ctx.stroke();line(c.x-39,c.y,c.x-27,c.y,'#f48091',3);line(c.x+27,c.y,c.x+39,c.y,'#f48091',3);line(c.x,c.y-39,c.x,c.y-27,'#f48091',3);line(c.x,c.y+27,c.x,c.y+39,'#f48091',3);
  }
 }
}
function drawHover(s){if(!hover||s.phase!=='player')return;const p=hover;
 if(!C.inside(p))return;
 const x=O+p.x*G,y=O+p.y*G;
 let allowed=false,color='#bdaca1';
 const e=s.enemies.find(q=>q.hp>0&&C.same(q,p));
 if(e&&C.illuminated(s,p)&&s.ap>0){allowed=true;color='#f6d58b';}
 else if(C.dist(s.player,p)===1&&C.passable(p,s)&&!s.enemies.some(q=>q.hp>0&&C.same(q,p))&&s.ap>0){allowed=true;color='#f6d58b';}
 ctx.fillStyle=allowed?'#ecc17228':'#00000010';ctx.fillRect(x+3,y+3,G-6,G-6);ctx.strokeStyle=color;ctx.lineWidth=2;ctx.strokeRect(x+3,y+3,G-6,G-6);
}
function drawParticles(dt){for(const p of particles){p.age+=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=18*dt;if(p.age<p.life){ctx.globalAlpha=(1-p.age/p.life)*.9;diamond(p.x,p.y,p.r,p.color);}}ctx.globalAlpha=1;particles=particles.filter(p=>p.age<p.life);}
function drawFrame(ts){const dt=Math.min((ts-lastFrame)/1000||0,.06);lastFrame=ts;const t=ts/1000;
 ctx.save();const dpr=Math.max(1,Math.min(2,window.devicePixelRatio||1));if(canvas.width!==W*dpr){canvas.width=W*dpr;canvas.height=W*dpr;}ctx.setTransform(dpr,0,0,dpr,0,0);
 ctx.clearRect(0,0,W,W);if(shake>.01&&motionOn){ctx.translate((rnd(ts,0)-.5)*shake,(rnd(0,ts)-.5)*shake);shake=Math.max(0,shake-dt*33);}else shake=0;
 drawBackground(t);
 ctx.fillStyle='#0a1022';ctx.fillRect(O-7,O-7,G*8+14,G*8+14);
 for(let y=0;y<C.SIZE;y++)for(let x=0;x<C.SIZE;x++)floorTile(x,y,t);
 drawBeam(session.state,t);
 for(const [x,y] of session.state.walls)wallTile({x,y});
 drawPreview(session.state);
 for(const e of session.state.enemies){if(e.hp<=0)continue;if(e.kind==='watcher')drawWatcher(e,t);else drawSkitter(e,t);enemyHP(e);}
 drawPlayer(session.state,t);
 drawHover(session.state);
 drawParticles(dt);
 ctx.strokeStyle='#bca8798c';ctx.lineWidth=2;ctx.strokeRect(O-.5,O-.5,G*8+1,G*8+1);
 for(let i=0;i<4;i++){const x=i%2===0?O-7:O+G*8+7,y=i<2?O-7:O+G*8+7;line(x-10,y,x+10,y,'#d9b66c',2);line(x,y-10,x,y+10,'#d9b66c',2);}
 ctx.restore();requestAnimationFrame(drawFrame);
}
function start(){session=C.makeSession();particles=[];started=true;$('startOverlay').classList.remove('visible');$('resultOverlay').classList.remove('visible');$('rewardOverlay').classList.remove('visible');updateHUD();playTone('toggleOn');}
function restart(){if(!started){start();return;}C.dispatch(session,{type:'RESTART'});particles=[];$('resultOverlay').classList.remove('visible');$('rewardOverlay').classList.remove('visible');updateHUD();playTone('toggleOn');}
function movement(dir,aim=false){onAction({type:aim?'AIM':'MOVE',direction:dir});}
function clickBoard(ev){if(!started||session.state.phase!=='player')return;const bounds=canvas.getBoundingClientRect();const x=(ev.clientX-bounds.left)*W/bounds.width,y=(ev.clientY-bounds.top)*W/bounds.height,p={x:Math.floor((x-O)/G),y:Math.floor((y-O)/G)};
 if(!C.inside(p))return;const e=session.state.enemies.find(q=>q.hp>0&&C.same(q,p));if(e){onAction({type:'STRIKE',targetId:e.id});return;}
 if(C.dist(session.state.player,p)===1){const direction=p.x>session.state.player.x?'E':p.x<session.state.player.x?'W':p.y>session.state.player.y?'S':'N';movement(direction);}
}
function moveHover(ev){const b=canvas.getBoundingClientRect(),x=(ev.clientX-b.left)*W/b.width,y=(ev.clientY-b.top)*W/b.height,p={x:Math.floor((x-O)/G),y:Math.floor((y-O)/G)};hover=C.inside(p)?p:null;}
canvas.addEventListener('pointermove',moveHover);canvas.addEventListener('pointerleave',()=>hover=null);canvas.addEventListener('click',clickBoard);
$('rewardOptions').addEventListener('click',ev=>{const btn=ev.target.closest('[data-relic]');if(btn)onAction({type:'CHOOSE_RELIC',id:btn.dataset.relic});});
$('startBtn').addEventListener('click',start);$('restartOverlayBtn').addEventListener('click',restart);$('replayBtn').addEventListener('click',restart);
$('toggleBtn').addEventListener('click',()=>onAction({type:'TOGGLE_LANTERN'}));$('strikeBtn').addEventListener('click',()=>onAction({type:'STRIKE'}));$('undoBtn').addEventListener('click',()=>{if(!started)return;C.dispatch(session,{type:'UNDO'});updateHUD();playTone('undo');});$('endBtn').addEventListener('click',()=>onAction({type:'END_TURN'}));
for(const d of ['N','E','S','W'])$('aim'+d).addEventListener('click',()=>movement(d,true));
$('soundBtn').addEventListener('click',()=>{soundOn=!soundOn;try{localStorage.setItem('lumenfall-sound',soundOn?'on':'off');}catch{}updateHUD();});
$('motionBtn').addEventListener('click',()=>{motionOn=!motionOn;try{localStorage.setItem('lumenfall-motion',motionOn?'on':'off');}catch{}updateHUD();});
function showHelp(){if(!$('helpDialog').open)$('helpDialog').showModal();}function closeHelp(){$('helpDialog').close();}
$('helpBtn').addEventListener('click',showHelp);$('closeHelp').addEventListener('click',closeHelp);$('closeHelpGold').addEventListener('click',closeHelp);
window.addEventListener('keydown',ev=>{
 if($('helpDialog').open){if(ev.key==='Escape')closeHelp();return;}
 if(ev.key==='?'||ev.key==='h'||ev.key==='H'){showHelp();return;}
 if(!started||session.state.phase!=='player')return;
 let d=null;const k=ev.key.toLowerCase();if(['arrowup','w'].includes(k))d='N';if(['arrowright','d'].includes(k))d='E';if(['arrowdown','s'].includes(k))d='S';if(['arrowleft','a'].includes(k))d='W';
 if(d){ev.preventDefault();movement(d,ev.shiftKey);return;}
 if(k==='l'||k==='t'){ev.preventDefault();onAction({type:'TOGGLE_LANTERN'});}
 else if(k==='f'||k===' '){ev.preventDefault();onAction({type:'STRIKE'});}
 else if(k==='z'||k==='u'){ev.preventDefault();C.dispatch(session,{type:'UNDO'});updateHUD();playTone('undo');}
 else if(k==='enter'){ev.preventDefault();onAction({type:'END_TURN'});}
 else if(k==='r'){restart();}
});
updateHUD();requestAnimationFrame(drawFrame);
})();
