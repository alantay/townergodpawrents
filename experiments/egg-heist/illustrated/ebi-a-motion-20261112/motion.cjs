const DURATION = 2;
const SCALE = 1.8;
const mouths = [[420,157],[432,215],[395,104],[380,108],[402,170],[420,195]];
function sample(seconds) {
  const t = Math.max(0, Math.min(DURATION, seconds));
  let frame, x, y;
  if (t < .25) { frame=0; x=820; y=459; }
  else if (t < .43) { frame=1; x=820; y=565; }
  else if (t < .65) {
    frame=2; const u=(t-.43)/.22; x=820+150*u; y=370-145*(1-(1-u)**2);
  } else if (t < .85) { frame=3; x=970; y=225; }
  else if (t < 1.18) {
    frame=4; const u=(t-.85)/.33; x=970-10*u; y=225+175*u*u;
  } else { frame=5; x=960; y=402; }
  // shortcut: six held drawings leave visible pose changes; add in-betweens before production.
  const alpha = t > 1.8 ? Math.max(0,(2-t)/.2) : 1;
  const caught = t >= .72;
  return {frame,x,y,alpha,caught,trayX:caught?x-4:966,trayY:caught?y-80:145};
}
function checkMotion() {
  const assert=(ok,message)=>{if(!ok)throw Error(message)};
  for(let i=0;i<=200;i++) {
    const s=sample(i/100);
    assert(s.frame>=0&&s.frame<6&&Number.isFinite(s.x+s.y),'Invalid pose');
    assert(s.alpha>=0&&s.alpha<=1,'Invalid opacity');
    if(s.caught) assert(s.trayX===s.x-4&&s.trayY===s.y-80,'Tray detached from mouth');
  }
  assert(!sample(.719).caught && sample(.72).caught,'Catch timing');
  assert(sample(0).frame===0&&sample(2).alpha===0,'Loop reset');
  assert(Math.abs(459+(428-mouths[0][1])*SCALE-947)<1,'Idle floor alignment');
  assert(Math.abs(402+(499-mouths[5][1])*SCALE-949)<1,'Landing floor alignment');
}
checkMotion();
if(typeof module!=='undefined') module.exports={sample,checkMotion};
