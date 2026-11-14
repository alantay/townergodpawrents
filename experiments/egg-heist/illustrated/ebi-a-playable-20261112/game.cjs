const canvas=document.querySelector('canvas'),ctx=canvas.getContext('2d');
const scene=document.querySelector('#scene'),jumpButton=document.querySelector('#jump');
const resetButton=document.querySelector('#reset'),status=document.querySelector('#status');
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
let images,bg,tray,ready=false,running=false,elapsed=0,last=null,phase='loading';

function load(url){
  return new Promise((resolve,reject)=>{
    const image=new Image();
    image.onload=()=>resolve(image);
    image.onerror=()=>reject(Error('A drawing could not load. Reload to try again.'));
    image.src=url;
  });
}
function draw(){
  const s=sample(elapsed),image=images[s.frame],anchor=anchors[s.frame];
  ctx.clearRect(0,0,1536,1024);
  ctx.drawImage(bg,0,0,1536,1024);
  ctx.drawImage(tray,s.trayX,s.trayY,286,126);
  ctx.drawImage(image,s.x-anchor[0]*SCALE,s.y-anchor[1]*SCALE,image.width*SCALE,image.height*SCALE);
}
function finish(){
  running=false; elapsed=1.18; phase='landed';
  jumpButton.disabled=scene.disabled=false;
  jumpButton.textContent='Jump again';
  status.textContent='Eggs acquired.';
  draw();
}
function jump(){
  if(!ready||running)return;
  if(reducedMotion.matches){finish();return;}
  elapsed=.25; last=null; running=true; phase='jumping';
  jumpButton.disabled=scene.disabled=true;
  status.textContent='Here she goes.';
  draw();
}
function reset(){
  if(!ready)return;
  running=false; elapsed=0; last=null; phase='ready';
  jumpButton.disabled=scene.disabled=false;
  jumpButton.textContent='Jump';
  status.textContent='Ebi has spotted the eggs.';
  draw();
}
function tick(now){
  if(running){
    if(reducedMotion.matches){finish();}
    else{
      if(last!==null)elapsed=Math.min(1.18,elapsed+Math.min((now-last)/1000,.05));
      last=now;
      if(elapsed>=1.18)finish();
      else{
        if(elapsed>=.72&&phase!=='caught'){phase='caught';status.textContent='Got them.';}
        draw();
      }
    }
  }
  requestAnimationFrame(tick);
}
jumpButton.onclick=scene.onclick=jump;
resetButton.onclick=reset;
document.addEventListener('keydown',event=>{
  if(event.code!=='Space'||event.target.closest('button,input,textarea,select,a,[contenteditable]'))return;
  event.preventDefault();
  if(!event.repeat)jump();
});
Promise.all([Promise.all(urls.map(load)),load(background),load(trayUrl)]).then(values=>{
  if(!ctx)throw Error('This browser cannot display the scene. Try another browser.');
  [images,bg,tray]=values; ready=true; resetButton.disabled=false;
  reset(); requestAnimationFrame(tick);
}).catch(error=>{status.textContent=error.message;});
