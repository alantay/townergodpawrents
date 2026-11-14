const DURATION = 2;
const SCALE = 1.25;
const anchors = [[269,108],[263,157],[246,90],[270,88],[261,110],[248,141]];
function sample(seconds) {
  const t = Math.max(0, Math.min(DURATION, seconds));
  let frame, y;
  if (t < .25) { frame=0; y=511.5; }
  else if (t < .43) { frame=1; y=582.75; }
  else if (t < .65) {
    frame=2; const u=(t-.43)/.22; y=500-275*(1-(1-u)**2);
  } else if (t < .85) { frame=3; y=225; }
  else if (t < 1.18) {
    frame=4; const u=(t-.85)/.33; y=225+270.25*u*u;
  } else { frame=5; y=530.25; }
  // shortcut: six held drawings leave visible pose changes; add in-betweens before production.
  const alpha = t > 1.8 ? Math.max(0,(2-t)/.2) : 1;
  const caught = t >= .72;
  return {frame,x:1109,y,alpha,caught,trayX:966,trayY:caught?y-80:145};
}
function checkMotion() {
  const assert=(ok,message)=>{if(!ok)throw Error(message)};
  for(let i=0;i<=200;i++) {
    const s=sample(i/100);
    assert(s.frame>=0&&s.frame<6&&Number.isFinite(s.x+s.y),'Invalid pose');
    assert(s.alpha>=0&&s.alpha<=1,'Invalid opacity');
    assert(s.trayX===966,'Egg tray moved sideways');
    assert(s.trayY===(s.caught?s.y-80:145),'Tray detached from hidden muzzle');
  }
  assert(!sample(.719).caught && sample(.72).caught,'Catch timing');
  assert(sample(0).frame===0&&sample(2).alpha===0,'Loop reset');
  assert(sample(.76).y===225&&sample(.76).trayY===145,'Catch changes original egg position');
  for(const [t,bottom] of [[0,458],[.3,450],[1.4,476]]) {
    const s=sample(t);
    assert(s.y+(bottom-anchors[s.frame][1])*SCALE===949,'Feet miss the floor');
  }
}
checkMotion();
if(typeof module!=='undefined') module.exports={sample,checkMotion};
