const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const game=fs.readFileSync(path.join(root,'game.js'),'utf8');
const style=fs.readFileSync(path.join(root,'style.css'),'utf8');

test('HTML loads matching cache-pinned assets in correct dependency order',()=>{
 const files=[...html.matchAll(/(?:href|src)="(style\\.css|core\\.js|game\\.js)\\?v=([0-9.]+)"/g)];
 assert.deepEqual(files.map(m=>m[1]),['style.css','core.js','game.js']);
 assert.equal(new Set(files.map(m=>m[2])).size,1,'all assets must use the same cache version');
 assert.match(html,new RegExp('name="lumenfall-build" content="'+files[0][2].replace(/\\./g,'\\\\.')+'"'));
 assert.ok(html.indexOf('src="core.js')<html.indexOf('src="game.js'));
});

test('every game.js DOM ID exists in index.html',()=>{
 const ids=[...game.matchAll(/\$\(['"]([A-Za-z][\w-]*)['"]\)/g)].map(m=>m[1]);
 const htmlIds=new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]));
 const missing=[...new Set(ids)].filter(id=>!htmlIds.has(id));
 assert.deepEqual(missing,[]);
});

test('all game controls and progression overlays are available',()=>{
 for(const id of ['board','startOverlay','startBtn','continueBtn','rewardOverlay','rewardOptions','resultOverlay','replayBtn','undoBtn','endBtn','strikeBtn','toggleBtn','helpDialog']) {
  assert.ok(html.includes('id="'+id+'"'),id+' missing');
 }
 assert.match(style,/\.reward-content\s*\{/);
 assert.match(style,/\[hidden\]/);
});

test('game source references validated save-state restoration',()=>{
 assert.match(game,/C\.loadable\(payload\.state\)/);
 assert.match(game,/localStorage\.setItem\(SAVE_KEY/);
 assert.match(game,/localStorage\.removeItem\(SAVE_KEY/);
});
