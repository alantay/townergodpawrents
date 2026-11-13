from pathlib import Path
from base64 import b64encode

root = Path(__file__).parent
def uri(name):
    mime = 'image/webp' if name.endswith('.webp') else 'image/png'
    return f'data:{mime};base64,' + b64encode((root/name).read_bytes()).decode()

assets = [uri(f'pose-{i}.png') for i in range(6)]
buttons = ''.join(f'<button class="pose" data-time="{time}">{label}</button>' for time,label in [(0,'Look'),(.3,'Crouch'),(.54,'Rise'),(.76,'Catch'),(1.02,'Descend'),(1.4,'Land')])
html = '''<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Ebi from Behind</title>
<style>
:root{--bg:#f5f0e8;--ink:#332c26;--muted:#75695e;--panel:#fffcf7;--line:#d5c9b8;--accent:#9c4c22;--button:#ede3d4;--shadow:#241b15}
@media(prefers-color-scheme:dark){:root:not([data-theme="light"]){--bg:#211f1b;--ink:#f5ebdf;--muted:#c0b3a3;--panel:#2d2923;--line:#554a3d;--accent:#f1aa70;--button:#43382e;--shadow:#15100c}}
:root[data-theme="dark"]{--bg:#211f1b;--ink:#f5ebdf;--muted:#c0b3a3;--panel:#2d2923;--line:#554a3d;--accent:#f1aa70;--button:#43382e;--shadow:#15100c}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:16px/1.5 system-ui,sans-serif}main{max-width:1000px;margin:28px auto;padding:0 16px}header{display:flex;align-items:baseline;justify-content:space-between;gap:12px}h1{font:600 clamp(24px,4vw,34px)/1.15 Georgia,serif;margin:0}header span{color:var(--muted);font-size:13px}p{color:var(--muted);margin:10px 0 18px}.stage{position:relative;aspect-ratio:3/2;overflow:hidden;border-radius:12px;background:var(--panel)}canvas{display:block;width:100%;height:100%}.controls{margin-top:14px;display:flex;flex-wrap:wrap;align-items:center;gap:10px}button{font:inherit;border:1px solid var(--line);border-radius:8px;padding:9px 14px;cursor:pointer;color:var(--ink);background:var(--panel)}button:focus-visible,input:focus-visible{outline:3px solid var(--accent);outline-offset:3px}button[aria-pressed="true"]{background:var(--button);border-color:var(--accent)}#play{min-width:86px}label{display:flex;align-items:center;gap:8px;color:var(--muted)}input{accent-color:var(--accent)}#scrub{flex:1;min-width:130px}output{font-variant-numeric:tabular-nums;font-size:13px;min-width:48px}.poses{display:flex;gap:8px;flex-wrap:wrap;margin:16px 0}.poses button{font-size:13px;padding:7px 12px}aside{border-top:1px solid var(--line);padding-top:14px;color:var(--muted);font-size:13px}#status{color:var(--muted);font-size:13px;margin-top:8px}noscript{display:block;padding:20px}
</style><main><header><h1>Ebi from behind</h1><span>Style A · rear-view study</span></header>
<p>Same kitchen. Same eggs. This time we only see her back.</p><div class="stage"><canvas width="1536" height="1024" role="img" aria-label="Seen from behind, Ebi crouches, jumps toward the egg tray, catches it and lands. Her face stays hidden."></canvas><noscript>JavaScript is needed to play this animation.</noscript></div>
<div class="controls"><button id="play" aria-pressed="false" disabled>Play</button><input id="scrub" type="range" min="0" max="2" step="0.01" value="0" aria-label="Animation position in seconds"><output id="time">0.00 s</output><label><input id="slow" type="checkbox">Slow</label></div>
<div class="poses">BUTTONS</div><div id="status" role="status">Loading drawings…</div>
<aside>This is a pose animation test. The changes between drawings are still visible, especially at takeoff and landing. The final fade resets the loop. Nothing has been added to the game.</aside></main><script>
MOTION
const urls=ASSETS, background='BACKGROUND', trayUrl='TRAY';
const canvas=document.querySelector('canvas'),ctx=canvas.getContext('2d');
const play=document.querySelector('#play'),scrub=document.querySelector('#scrub'),slow=document.querySelector('#slow'),output=document.querySelector('#time'),status=document.querySelector('#status');
let images,bg,tray,playing=false,t=0,last=0;
function load(url){return new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>reject(Error('A drawing could not load.'));image.src=url})}
function draw(){
 const s=sample(t);ctx.clearRect(0,0,1536,1024);ctx.drawImage(bg,0,0,1536,1024);
 ctx.globalAlpha=s.alpha;
 const image=images[s.frame],m=anchors[s.frame];
 ctx.drawImage(tray,s.trayX,s.trayY,286,126);
 ctx.drawImage(image,s.x-m[0]*SCALE,s.y-m[1]*SCALE,image.width*SCALE,image.height*SCALE);
 ctx.globalAlpha=1;
 scrub.value=t;output.textContent=t.toFixed(2)+' s';
 document.querySelectorAll('.pose').forEach((b,i)=>b.setAttribute('aria-pressed',String(i===s.frame)));
}
function setPlaying(value){playing=value;last=0;play.textContent=value?'Pause':'Play';play.setAttribute('aria-pressed',String(value))}
play.onclick=()=>setPlaying(!playing);
scrub.oninput=()=>{setPlaying(false);t=Number(scrub.value);draw()};
document.querySelectorAll('.pose').forEach(button=>button.onclick=()=>{setPlaying(false);t=Number(button.dataset.time);draw()});
function tick(now){if(playing&&images){if(last)t=(t+Math.min((now-last)/1000,.05)*(slow.checked?.35:1))%DURATION;draw()}last=now;requestAnimationFrame(tick)}
Promise.all([Promise.all(urls.map(load)),load(background),load(trayUrl)]).then(values=>{[images,bg,tray]=values;draw();play.disabled=false;status.textContent='Six poses loaded. Drag the slider to inspect the catch.';setPlaying(!matchMedia('(prefers-reduced-motion: reduce)').matches);requestAnimationFrame(tick)}).catch(error=>status.textContent=error.message);
</script></html>'''
import json
html=html.replace('BUTTONS',buttons).replace('MOTION',(root/'motion.cjs').read_text()).replace('ASSETS',json.dumps(assets)).replace('BACKGROUND',uri('../ebi-a-motion-20261112/kitchen.webp')).replace('TRAY',uri('../ebi-a-motion-20261112/tray.png'))
output=root.parent/'ebi-a-rear-motion-proof-20261112.html'
output.write_text(html)
assert output.stat().st_size < 16_000_000
print(f'{output}: {output.stat().st_size:,} bytes')
