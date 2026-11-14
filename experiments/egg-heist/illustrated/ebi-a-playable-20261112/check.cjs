const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync(`${__dirname}/../ebi-a-playable-20261112.html`,'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)[1];
async function setup({reduced=false,fail=false}={}){
  const elements=new Map(),listeners=new Map(),draws=[];
  function element(id){
    if(!elements.has(id))elements.set(id,{disabled:true,textContent:'',getContext:()=>({
      clearRect(){},drawImage(image,...values){assert.ok(values.every(Number.isFinite));draws.push(values);},
    })});
    return elements.get(id);
  }
  class Image{
    width=512; height=512;
    set src(value){assert.ok(value.startsWith('data:image/'));queueMicrotask(()=>fail?this.onerror():this.onload());}
  }
  const context=vm.createContext({document:{querySelector:element,addEventListener:(type,callback)=>listeners.set(type,callback)},Image,matchMedia:()=>({matches:reduced}),requestAnimationFrame(){}});
  const run=code=>vm.runInContext(code,context);
  run(script);
  await new Promise(resolve=>setImmediate(resolve));
  return {element,run,draws,key:(repeat=false,inButton=false)=>{
    let prevented=false;
    listeners.get('keydown')({code:'Space',repeat,target:{closest:()=>inButton},preventDefault(){prevented=true;}});
    return prevented;
  }};
}
(async()=>{
  const game=await setup(),{run,element}=game;
  assert.equal(run('phase'),'ready');assert.equal(run('running'),false,'No autoplay');
  element('#jump').onclick();assert.equal(run('phase'),'jumping');assert.equal(run('sample(elapsed).frame'),1,'Immediate crouch');
  run('tick(0);tick(50)');const elapsed=run('elapsed');
  element('#scene').onclick();assert.equal(run('elapsed'),elapsed,'In-flight taps cannot restart jump');
  for(let now=100;now<=1100;now+=10)run(`tick(${now})`);
  assert.equal(run('phase'),'landed');assert.equal(run('running'),false);assert.equal(element('#jump').disabled,false);
  assert.equal(element('#status').textContent,'Eggs acquired.');
  const landing=run('elapsed');run('tick(4000)');assert.equal(run('elapsed'),landing,'Landed scene stays visible');
  game.key(true);assert.equal(run('phase'),'landed','Held Space cannot repeat');
  assert.equal(game.key(false,true),false,'Native button keyboard activation is preserved');
  assert.equal(game.key(),true);assert.equal(run('phase'),'jumping','Space starts another attempt');
  element('#reset').onclick();assert.equal(run('phase'),'ready');assert.equal(run('sample(elapsed).trayY'),145);
  run('tick(5000)');assert.equal(run('elapsed'),0,'Reset cancels flight');
  element('#scene').onclick();assert.equal(run('running'),true,'Scene tap starts jump');
  run('tick(6000);tick(66000)');assert.ok(run('elapsed')<=.301,'Long frame cannot skip the jump');
  const reduced=await setup({reduced:true});reduced.element('#scene').onclick();
  assert.equal(reduced.run('phase'),'landed');assert.equal(reduced.run('running'),false,'Reduced motion skips movement');
  const failed=await setup({fail:true});assert.equal(failed.run('ready'),false);
  assert.equal(failed.element('#jump').disabled,true);assert.match(failed.element('#status').textContent,/could not load/);
  assert.equal((html.match(/data:image\/png;base64,/g)||[]).length,7);
  assert.equal((html.match(/data:image\/webp;base64,/g)||[]).length,1);
  console.log('Passed: button, scene tap, Space, repeat guard, catch and stable landing, mid-jump reset, long frame, reduced motion, asset failure, inline assets.');
})().catch(error=>{console.error(error);process.exitCode=1;});
