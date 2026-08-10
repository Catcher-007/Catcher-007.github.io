import { Fish } from './Fish.js';
import { Boids } from './Boids.js';
import { SpatialGrid } from './SpatialGrid.js';

export class Simulation {
  constructor(width,height,{count=160,speed=.9,attraction=.65,cell=64}={}) {
    this.width=width; this.height=height; this.count=count; this.speed=speed; this.attraction=attraction;
    this.grid=new SpatialGrid(cell); this.flowGrid=new SpatialGrid(128);
    this.fish=[]; this.flows=[]; this.ripples=[];
    this.mouse={x:-9999,y:-9999,down:false,inside:false}; this.reset();
  }
  resize(width,height){this.width=width;this.height=height;for(const f of this.fish){f.width=width;f.height=height}}
  reset(){this.fish=Array.from({length:this.count},()=>new Fish(this.width,this.height))}
  setParams({count,speed,attraction}={}){if(count!==undefined&&count!==this.count){this.count=count;this.reset()}if(speed!==undefined)this.speed=speed;if(attraction!==undefined)this.attraction=attraction}
  addFlow(x,y,vx,vy){this.flows.push({x,y,vx,vy,p:Math.min(2.1,Math.hypot(vx,vy)*.4),life:1});if(this.flows.length>14)this.flows.shift()}
  addRipple(x,y,power=.8){this.ripples.push({x,y,r:5,life:1,power});if(this.ripples.length>6)this.ripples.shift()}
  step(){this.grid.build(this.fish);this.flowGrid.build(this.flows);Boids.update(this.fish,this.grid,60);for(const f of this.fish){this.#interact(f);f.update(this.speed);f.edge()}this.#effects()}
  #interact(f){let ax=f.accx,ay=f.accy;const dx=this.mouse.x-f.x,dy=this.mouse.y-f.y,d2=dx*dx+dy*dy;if(this.mouse.down&&d2>64){const inv=1/Math.sqrt(d2),force=this.attraction*Math.min(1,140*inv);ax+=dx*inv*force;ay+=dy*inv*force;f.limit=f.max*1.45}else{if(this.mouse.inside&&d2<14400&&d2>0){const d=Math.sqrt(d2),force=(1-d/120)*.34;ax-=dx/d*force;ay-=dy/d*force}f.limit=f.max}this.flowGrid.near(f.x,f.y,i=>{const q=this.flows[i],qx=f.x-q.x,qy=f.y-q.y,qd2=qx*qx+qy*qy;if(qd2<16384){const d=Math.sqrt(qd2)||1,fall=1-d/128;ax+=q.vx*q.p*fall*.045;ay+=q.vy*q.p*fall*.045}});for(const r of this.ripples){const rx=f.x-r.x,ry=f.y-r.y,rd2=rx*rx+ry*ry,rr=r.r+42;if(rd2<rr*rr){const d=Math.sqrt(rd2)||1,ring=Math.abs(d-r.r);if(ring<34){const force=(1-ring/34)*r.power*.012;ax+=rx/d*force;ay+=ry/d*force}}}f.accx=ax;f.accy=ay}
  #effects(){for(let i=this.flows.length-1;i>=0;i--){if((this.flows[i].life-=.07)<=0)this.flows.splice(i,1)}for(let i=this.ripples.length-1;i>=0;i--){const r=this.ripples[i];r.r+=3.8;if((r.life-=.055)<=0)this.ripples.splice(i,1)}}
}