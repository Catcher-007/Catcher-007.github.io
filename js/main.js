import { CONFIG, isMobile } from './config.js';
import { Simulation } from './simulation/Simulation.js';
import { Renderer } from './rendering/Renderer.js';
import { AudioFX } from './audio/AudioFX.js';

const $ = id => document.getElementById(id);
const canvas = $('c');
const ui = { count:$('count'),cv:$('cv'),speed:$('speed'),sv:$('sv'),attr:$('attr'),av:$('av'),reset:$('reset'),sound:$('sound'),msound:$('msound'),channels:$('channels'),panel:$('panel'),collapse:$('collapse'),mc:$('mc'),mcv:$('mcv'),ms:$('ms'),msv:$('msv'),ma:$('ma'),mav:$('mav'),mreset:$('mreset'),toggle:$('toggle'),mp:$('mp'),fs:$('fs'),fps:$('fps'),sim:$('sim'),tip:$('tip') };
let width=innerWidth,height=innerHeight,renderScale=1,simHz=CONFIG.simHz,simStep=1000/simHz,simAccumulator=0,lastFrame=performance.now(),fpsFrames=0,fpsClock=lastFrame,fpsValue=60,adaptiveClock=lastFrame,lastPointer=null;
const simulation=new Simulation(width,height,{count:CONFIG.count,speed:CONFIG.speed,attraction:CONFIG.attraction,cell:CONFIG.cell,flowCell:CONFIG.flowCell,maxFlow:CONFIG.maxFlow,maxRipple:CONFIG.maxRipple,mobile:isMobile});
const renderer=new Renderer(canvas,{mobile:isMobile});
const audio=new AudioFX();
simulation.onMerge=()=>audio.merge();
audio.suspendOnHidden();
let touchHintDismissed=false;

const pointerDot=document.createElement('div');
pointerDot.className='pointer-dot';
pointerDot.setAttribute('aria-hidden','true');
document.body.appendChild(pointerDot);

function resize(){width=innerWidth;height=innerHeight;simulation.resize(width,height);renderer.resize(width,height,renderScale)}
function updateDesktopCount(v){simulation.setParams({count:v});ui.cv.textContent=v;ui.fs.textContent=v;audio.slider()}
function updateDesktopSpeed(v){const speed=v/100;simulation.setParams({speed});ui.sv.textContent=speed.toFixed(1)+'×';audio.slider()}
function updateDesktopAttraction(v){const attraction=v/100;simulation.setParams({attraction});ui.av.textContent=attraction.toFixed(2);audio.slider()}
function syncMobile(){const count=+ui.mc.value,speed=+ui.ms.value/100,attraction=+ui.ma.value/100;simulation.setParams({count,speed,attraction});ui.mcv.textContent=count;ui.msv.textContent=speed.toFixed(1)+'×';ui.mav.textContent=attraction.toFixed(2);ui.fs.textContent=count;audio.slider()}
function reset(){simulation.reset();ui.fs.textContent=simulation.count;audio.reset()}
function pointerMove(e){const q=e.touches?e.touches[0]:e,now=performance.now();if(!isMobile){pointerDot.style.transform=`translate3d(${q.clientX}px,${q.clientY}px,0)`;pointerDot.classList.add('visible')}if(lastPointer){const dt=Math.max(8,now-lastPointer.t),dx=q.clientX-lastPointer.x,dy=q.clientY-lastPointer.y,scale=16/dt;const vx=dx*scale,vy=dy*scale,v=Math.hypot(dx,dy)*scale;simulation.mouse.speedX=vx;simulation.mouse.speedY=vy;simulation.mouse.speed=v;if(v>1)simulation.addFlow(q.clientX,q.clientY,vx,vy)}else{simulation.mouse.speedX=0;simulation.mouse.speedY=0;simulation.mouse.speed=0}lastPointer={x:q.clientX,y:q.clientY,t:now};simulation.mouse.x=q.clientX;simulation.mouse.y=q.clientY;simulation.mouse.inside=true}
function setPointerDown(x,y,power=1){simulation.mouse.down=true;simulation.addRipple(x,y,power)}
function setPointerUp(){simulation.mouse.down=false}
function adaptive(now){if(isMobile||now-adaptiveClock<1200)return;adaptiveClock=now;if(fpsValue<42&&renderScale>.72){renderScale=Math.max(.72,renderScale-.08);resize()}else if(fpsValue>57&&renderScale<1){renderScale=Math.min(1,renderScale+.04);resize()}if(fpsValue<38&&simHz>30){simHz=30;simStep=1000/simHz}else if(fpsValue>56&&simHz<45){simHz=45;simStep=1000/simHz}}
function frame(now){const frameDt=Math.min(50,now-lastFrame);lastFrame=now;simAccumulator+=frameDt;while(simAccumulator>=simStep){simulation.step(simStep/16.667);simAccumulator-=simStep}simulation.updateEffects(frameDt/16.667);simulation.mouse.speed*=.82;simulation.mouse.speedX*=.82;simulation.mouse.speedY*=.82;renderer.render(simulation);fpsFrames++;if(now-fpsClock>=800){fpsValue=Math.round(fpsFrames*1000/(now-fpsClock));fpsFrames=0;fpsClock=now;ui.fps.textContent=fpsValue;ui.sim.textContent=simHz+'Hz'}adaptive(now);requestAnimationFrame(frame)}
ui.count?.addEventListener('input',e=>updateDesktopCount(+e.target.value));ui.speed?.addEventListener('input',e=>updateDesktopSpeed(+e.target.value));ui.attr?.addEventListener('input',e=>updateDesktopAttraction(+e.target.value));ui.reset?.addEventListener('click',reset);ui.mc?.addEventListener('input',syncMobile);ui.ms?.addEventListener('input',syncMobile);ui.ma?.addEventListener('input',syncMobile);ui.mreset?.addEventListener('click',reset);ui.toggle?.addEventListener('click',()=>ui.mp.classList.toggle('open'));
function syncSoundUI(){const on=audio.enabled;if(ui.sound){ui.sound.textContent=on?'🔊 声音开':'🔇 声音关';ui.sound.setAttribute('aria-pressed',String(on))}if(ui.msound){ui.msound.textContent=on?'🔊':'🔇';ui.msound.setAttribute('aria-pressed',String(on))}if(ui.channels)ui.channels.hidden=!on}
ui.sound?.addEventListener('click',()=>{audio.setEnabled(!audio.enabled);syncSoundUI()});
ui.msound?.addEventListener('click',()=>{audio.setEnabled(!audio.enabled);syncSoundUI()});
ui.channels?.querySelectorAll('.chip').forEach(btn=>btn.addEventListener('click',()=>{const type=btn.dataset.ch,on=!audio.isChannelOn(type);audio.setChannel(type,on);btn.classList.toggle('on',on);btn.setAttribute('aria-pressed',String(on));}));
ui.collapse?.addEventListener('click',()=>{if(!ui.panel)return;const collapsed=ui.panel.classList.toggle('collapsed');ui.collapse.textContent=collapsed?'▸':'▾';ui.collapse.setAttribute('aria-expanded',String(!collapsed));ui.collapse.title=collapsed?'展开面板':'收起面板';});
addEventListener('mousemove',pointerMove,{passive:true});addEventListener('mousedown',e=>{if(e.button===0){setPointerDown(e.clientX,e.clientY,1);audio.water(.6)}});addEventListener('mouseup',setPointerUp);addEventListener('mouseleave',()=>{simulation.mouse.inside=false;simulation.mouse.down=false;simulation.mouse.speed=0;pointerDot.classList.remove('visible')});addEventListener('click',e=>{if(e.target===canvas){simulation.addRipple(e.clientX,e.clientY,.7);audio.water(.45)}});addEventListener('touchstart',e=>{lastPointer=null;pointerMove(e);setPointerDown(e.touches[0].clientX,e.touches[0].clientY,1);audio.water(.5);if(!touchHintDismissed){touchHintDismissed=true;const hint=document.querySelector('.touch');if(hint)hint.classList.add('dismissed')}},{passive:true});addEventListener('touchmove',pointerMove,{passive:true});addEventListener('touchend',()=>{setPointerUp();simulation.mouse.inside=false;lastPointer=null},{passive:true});addEventListener('blur',()=>{setPointerUp();pointerDot.classList.remove('visible')});addEventListener('resize',resize,{passive:true});
if(ui.tip){document.querySelectorAll('[data-tip]').forEach(row=>{row.addEventListener('mouseenter',()=>{if(isMobile)return;ui.tip.querySelector('b').textContent=row.dataset.tip;ui.tip.querySelector('span').textContent=row.dataset.text;ui.tip.style.display='block'});row.addEventListener('mousemove',e=>{ui.tip.style.left=Math.min(innerWidth-235,e.clientX+14)+'px';ui.tip.style.top=Math.min(innerHeight-90,e.clientY+14)+'px'});row.addEventListener('mouseleave',()=>{ui.tip.style.display='none'});row.addEventListener('click',()=>{if(!isMobile)return;ui.tip.querySelector('b').textContent=row.dataset.tip;ui.tip.querySelector('span').textContent=row.dataset.text;ui.tip.style.display=ui.tip.style.display==='block'?'none':'block';ui.tip.style.left='12px';ui.tip.style.bottom='130px';ui.tip.style.top='auto'})});addEventListener('click',e=>{if(isMobile&&!e.target.closest('.row'))ui.tip.style.display='none'})}
resize();requestAnimationFrame(frame);
