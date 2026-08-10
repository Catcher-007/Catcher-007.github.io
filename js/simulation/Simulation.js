import { Fish } from './Fish.js';
import { Boids } from './Boids.js';
import { SpatialGrid } from './SpatialGrid.js';
import { Bubbles } from './Bubbles.js';

export class Simulation {
  constructor(width, height, {
    count = 160, speed = .9, attraction = .65, cell = 64, flowCell = 128,
    maxFlow = 14, maxRipple = 6, mobile = false
  } = {}) {
    this.width = width; this.height = height; this.count = count;
    this.speed = speed; this.attraction = attraction; this.mobile = mobile;
    this.maxFlow = maxFlow; this.maxRipple = maxRipple;
    this.grid = new SpatialGrid(cell); this.flowGrid = new SpatialGrid(flowCell);
    this.fish = []; this.flows = []; this.ripples = [];
    this.bubbles = new Bubbles(mobile ? 10 : 18);
    this.mouse = { x: -9999, y: -9999, down: false, inside: false, speed: 0, speedX: 0, speedY: 0 };
    this.reset();
  }

  resize(width, height) { this.width = width; this.height = height; for (const f of this.fish) { f.width = width; f.height = height; } }

  reset() {
    this.fish = Array.from({ length: this.count }, () => new Fish(this.width, this.height));
    this.bubbles.items.length = 0;
  }

  setParams({ count, speed, attraction } = {}) {
    if (count !== undefined && count !== this.count) { this.count = count; this.reset(); }
    if (speed !== undefined) this.speed = speed;
    if (attraction !== undefined) this.attraction = attraction;
  }

  addFlow(x, y, vx, vy) {
    const power = Math.min(2.4, Math.hypot(vx, vy) * .55);
    this.flows.push({ x, y, vx, vy, p: power, life: 1 });
    if (this.flows.length > this.maxFlow) this.flows.shift();
  }

  addRipple(x, y, power = .8) {
    this.ripples.push({ x, y, r: 5, life: 1, power });
    if (this.ripples.length > this.maxRipple) this.ripples.shift();
  }

  step(dt = 1) {
    this.grid.build(this.fish); this.flowGrid.build(this.flows);
    Boids.update(this.fish, this.grid, 78);
    for (const f of this.fish) { this.#interact(f); f.update(this.speed, dt); f.edge(); }

    // Sparse bubbles keep the aquarium alive without turning the canvas into a particle field.
    if (Math.random() < .018 * (this.mobile ? .65 : 1)) {
      const source = this.fish[(Math.random() * this.fish.length) | 0];
      if (source) this.bubbles.spawn(source.x, source.y, .75 + this.speed * .5);
    }
  }

  updateEffects(frameUnits = 1) {
    const flowDecay = this.mobile ? .09 : .07, rippleDecay = this.mobile ? .07 : .055;
    const rippleGrowth = this.mobile ? 3 : 3.8;
    for (let i = this.flows.length - 1; i >= 0; i--) { this.flows[i].life -= flowDecay * frameUnits; if (this.flows[i].life <= 0) this.flows.splice(i, 1); }
    for (let i = this.ripples.length - 1; i >= 0; i--) { const r = this.ripples[i]; r.r += rippleGrowth * frameUnits; r.life -= rippleDecay * frameUnits; if (r.life <= 0) this.ripples.splice(i, 1); }
    this.bubbles.update(frameUnits);
  }

  drawBubbles(ctx) { this.bubbles.draw(ctx); }

  #interact(f) {
    let ax = f.accx, ay = f.accy;
    const dx = this.mouse.x - f.x, dy = this.mouse.y - f.y, d2 = dx * dx + dy * dy;
    if (d2 < 22500 && d2 > 0) {
      const d = Math.sqrt(d2), fall = 1 - d / 150;
      if (fall > 0 && this.mouse.speed > .15) { const inv = 1 / d, swirl = .16 * fall; ax += (this.mouse.speedX * .075 - dy * inv * swirl) * fall; ay += (this.mouse.speedY * .075 + dx * inv * swirl) * fall; }
    }
    if (this.mouse.inside && this.mouse.speed > 2.4 && d2 < 10000 && d2 > 0) { const d = Math.sqrt(d2), force = (1 - d / 100) * .85 * Math.min(1.5, this.mouse.speed / 4); ax -= dx / d * force; ay -= dy / d * force; f.scare = Math.min(1, (f.scare || 0) + .35); }
    if (this.mouse.down && d2 > 64) { const inv = 1 / Math.sqrt(d2), force = this.attraction * Math.min(1, 140 * inv); ax += dx * inv * force; ay += dy * inv * force; f.limit = f.max * 1.45; }
    else { if (this.mouse.inside && d2 < 14400 && d2 > 0) { const d = Math.sqrt(d2), force = (1 - d / 120) * .34; ax -= dx / d * force; ay -= dy / d * force; } f.limit = f.max; }
    this.flowGrid.near(f.x, f.y, i => { const q = this.flows[i], qx = f.x - q.x, qy = f.y - q.y, qd2 = qx * qx + qy * qy; if (qd2 < 19600) { const d = Math.sqrt(qd2) || 1, fall = 1 - d / 140; ax += q.vx * q.p * fall * .055; ay += q.vy * q.p * fall * .055; } });
    for (const r of this.ripples) { const rx = f.x - r.x, ry = f.y - r.y, rd2 = rx * rx + ry * ry, rr = r.r + 42; if (rd2 < rr * rr) { const d = Math.sqrt(rd2) || 1, ring = Math.abs(d - r.r); if (ring < 34) { const force = (1 - ring / 34) * r.power * .012; ax += rx / d * force; ay += ry / d * force; } } }
    f.accx = ax; f.accy = ay;
  }
}
