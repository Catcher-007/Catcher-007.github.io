import { Fish } from './Fish.js';
import { LeaderFish } from './LeaderFish.js';
import { School } from './School.js';
import { Boids } from './Boids.js';
import { SpatialGrid } from './SpatialGrid.js';
import { Bubbles } from './Bubbles.js';
import { BackgroundBubbles } from './BackgroundBubbles.js';

export class Simulation {
  constructor(width, height, {
    count = 160, speed = .9, attraction = .65, cell = 96, flowCell = 160,
    maxFlow = 14, maxRipple = 6, mobile = false
  } = {}) {
    this.width = width; this.height = height; this.count = count;
    this.speed = speed; this.attraction = attraction; this.mobile = mobile;
    this.maxFlow = maxFlow; this.maxRipple = maxRipple;
    this.grid = new SpatialGrid(cell); this.flowGrid = new SpatialGrid(flowCell);
    this.schools = []; this.fish = []; this.flows = []; this.ripples = [];
    this.bubbles = new Bubbles(mobile ? 10 : 18);
    this.background = new BackgroundBubbles(width, height, mobile ? 22 : 42);
    this.mouse = { x: -9999, y: -9999, down: false, inside: false, speed: 0, speedX: 0, speedY: 0 };
    this.reset();
  }

  resize(width, height) {
    this.width = width;
    this.height = height;
    this.background.resize(width, height);
    for (const f of this.fish) { f.width = width; f.height = height; }
  }

  reset() {
    // 按设备上限随机 1..max 个鱼群，平分鱼数；每群由一条 leader 带队
    const maxGroups = Math.min(this.mobile ? 3 : 5, Math.max(1, Math.floor(this.count / 6)));
    const groups = 1 + Math.floor(Math.random() * maxGroups);
    const sizes = this.#distribute(this.count, groups);
    this.schools = [];
    this.fish = [];
    for (const size of sizes) {
      const leader = new LeaderFish(this.width, this.height);
      leader.size *= 1.12;
      leader.max *= 1.04;
      leader.limit = leader.max;
      const fish = Array.from({ length: Math.max(0, size - 1) }, () => new Fish(this.width, this.height));
      const school = new School(fish, leader, { preferredSpacing: 30 });
      school.setLeader(leader);
      for (const f of school.fish) f.school = school;
      this.schools.push(school);
      this.fish.push(...school.fish);
    }
    this.bubbles.items.length = 0;
  }

  #distribute(total, groups) {
    const min = 6;
    const sizes = [];
    let remaining = total;
    for (let i = 0; i < groups; i++) {
      const left = groups - i - 1;
      const max = Math.max(min, remaining - min * left);
      const size = i === groups - 1 ? remaining : min + Math.floor(Math.random() * (max - min + 1));
      sizes.push(size);
      remaining -= size;
    }
    return sizes;
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
    // 1) 重建空间网格 → 2) Boids 计算群聚/对齐/分离 + 跟随 leader → 3) 鼠标/流场/波纹交互 → 4) 合并/分裂 → 5) 随机气泡
    this.grid.build(this.fish);
    this.flowGrid.build(this.flows);
    Boids.update(this.fish, this.grid, 78);

    for (const f of this.fish) this.#interact(f);
    for (const sc of this.schools) sc.update(dt, this.speed, this.width, this.height);

    // 每帧先尝试合并再尝试分裂，两个独立随机过程驱动群数动态平衡
    this.#maybeMerge();
    this.#maybeSplit();

    if (Math.random() < .018 * (this.mobile ? .65 : 1)) {
      const source = this.fish[(Math.random() * this.fish.length) | 0];
      if (source) this.bubbles.spawn(source.x, source.y, .75 + this.speed * .5);
    }
  }

  #maybeMerge() {
    // 跨群成员接触（55px）有 3% 概率合并；同帧去重 + 冷却期防止抖动
    if (this.schools.length < 2) return;
    const dist2 = 55 * 55;
    const merged = new Set();
    for (let i = 0; i < this.fish.length; i++) {
      const a = this.fish[i];
      this.grid.near(a.x, a.y, j => {
        if (j <= i) return;
        const b = this.fish[j];
        if (a.school === b.school) return;
        const dx = a.x - b.x, dy = a.y - b.y;
        if (dx * dx + dy * dy < dist2) {
          if (a.school.mergeCooldown > 0 || b.school.mergeCooldown > 0) return;
          const key = this.schools.indexOf(a.school) + '|' + this.schools.indexOf(b.school);
          const rkey = this.schools.indexOf(b.school) + '|' + this.schools.indexOf(a.school);
          if (merged.has(key) || merged.has(rkey) || Math.random() >= .03) return;
          merged.add(key);
          this.#merge(a.school, b.school);
        }
      });
    }
  }

  #merge(a, b) {
    // 被并群的 leader 降级为普通鱼（后续走 Fish 行为），所有鱼改归 a 群，设置冷却期
    b.leader.isLeader = false;
    for (const f of b.fish) {
      f.school = a;
      a.fish.push(f);
    }
    a.mergeCooldown = 600;
    this.schools = this.schools.filter(s => s !== b);
  }

  #maybeSplit() {
    // 群数达上限则不再分裂；大群（>16）每帧 0.15% 概率分裂（期望 667 帧 ≈ 11 秒触发一次）
    if (this.schools.length >= (this.mobile ? 3 : 5)) return;
    for (const sc of this.schools) {
      if (sc.fish.length > 16 && Math.random() < .0015) {
        this.#split(sc);
        return;
      }
    }
  }

  #split(sc) {
    const followers = sc.fish.filter(f => f !== sc.leader);
    if (followers.length < 5) return;
    const k = Math.max(3, Math.floor(followers.length * (.3 + Math.random() * .3)));
    if (k >= followers.length) return;
    const pool = followers.slice();
    const chosen = [];
    for (let i = 0; i < k; i++) chosen.push(pool.splice((Math.random() * pool.length) | 0, 1)[0]);

    const template = chosen[0];   // 选一条普通鱼做模板
    chosen.splice(0, 1);
    const leader = new LeaderFish(this.width, this.height);
    leader.x = template.x; leader.y = template.y;
    leader.vx = template.vx; leader.vy = template.vy;
    leader.angle = template.angle;
    leader.size = template.size; leader.depth = template.depth;
    leader.max = template.max; leader.limit = template.max;

    sc.fish = sc.fish.filter(f => f !== template && !chosen.includes(f));
    this.fish = this.fish.filter(f => f !== template);  // 模板被新 leader 顶替，维持总数守恒
    this.fish.push(leader);        // 新 leader 进入主鱼表（网格/渲染/交互才能覆盖它）
    const school = new School(chosen, leader, { preferredSpacing: 30 });
    school.setLeader(leader);
    school.mergeCooldown = 300 + Math.random() * 400;  // 新群 5-12 秒独立期，先游离再可合并
    for (const f of school.fish) f.school = school;
    this.schools.push(school);
  }

  updateEffects(frameUnits = 1) {
    const flowDecay = this.mobile ? .09 : .07, rippleDecay = this.mobile ? .07 : .055;
    const rippleGrowth = this.mobile ? 3 : 3.8;
    for (let i = this.flows.length - 1; i >= 0; i--) { this.flows[i].life -= flowDecay * frameUnits; if (this.flows[i].life <= 0) this.flows.splice(i, 1); }
    for (let i = this.ripples.length - 1; i >= 0; i--) { const r = this.ripples[i]; r.r += rippleGrowth * frameUnits; r.life -= rippleDecay * frameUnits; if (r.life <= 0) this.ripples.splice(i, 1); }
    this.bubbles.update(frameUnits);
    this.background.update(frameUnits);
  }

  #interact(f) {
    let ax = f.accx, ay = f.accy;
    const dx = this.mouse.x - f.x, dy = this.mouse.y - f.y, d2 = dx * dx + dy * dy;
    if (d2 < 22500 && d2 > 0) {
      const d = Math.sqrt(d2), fall = 1 - d / 150;
      if (fall > 0 && this.mouse.speed > .15) { const inv = 1 / d, swirl = .16 * fall; ax += (this.mouse.speedX * .075 - dy * inv * swirl) * fall; ay += (this.mouse.speedY * .075 + dx * inv * swirl) * fall; }
    }

    if (this.mouse.inside && this.mouse.speed > 2.4 && d2 < 10000 && d2 > 0) {
      const d = Math.sqrt(d2);
      const force = (1 - d / 100) * .85 * Math.min(1.5, this.mouse.speed / 4);
      const flee = Math.max(0, 1 - d / 100);
      ax -= dx / d * force;
      ay -= dy / d * force;
      if (!f.isLeader) f.panic = Math.min(1, f.panic + .42 * flee);
    }

    if (f.panic > 0) {
      // Preserve outward momentum for a short period after the cursor passes.
      // This is intentionally weak: the normal Boids cohesion can take over
      // again as panic decays, producing Scatter -> Regroup instead of a snap-back.
      const fleeX = f.x - this.mouse.x;
      const fleeY = f.y - this.mouse.y;
      const fd2 = fleeX * fleeX + fleeY * fleeY;
      if (fd2 > 1 && fd2 < 22500) {
        const fd = Math.sqrt(fd2);
        const panicForce = f.panic * .045;
        ax += fleeX / fd * panicForce;
        ay += fleeY / fd * panicForce;
      }
    }

    if (this.mouse.down && d2 > 64) { const inv = 1 / Math.sqrt(d2), force = this.attraction * Math.min(1, 140 * inv); ax += dx * inv * force; ay += dy * inv * force; f.limit = f.max * 1.45; }
    else { if (this.mouse.inside && d2 < 14400 && d2 > 0) { const d = Math.sqrt(d2), force = (1 - d / 120) * .34; ax -= dx / d * force; ay -= dy / d * force; } f.limit = f.max; }
    this.flowGrid.near(f.x, f.y, i => { const q = this.flows[i], qx = f.x - q.x, qy = f.y - q.y, qd2 = qx * qx + qy * qy; if (qd2 < 19600) { const d = Math.sqrt(qd2) || 1, fall = 1 - d / 140; ax += q.vx * q.p * fall * .055; ay += q.vy * q.p * fall * .055; } });
    for (const r of this.ripples) { const rx = f.x - r.x, ry = f.y - r.y, rd2 = rx * rx + ry * ry, rr = r.r + 42; if (rd2 < rr * rr) { const d = Math.sqrt(rd2) || 1, ring = Math.abs(d - r.r); if (ring < 34) { const force = (1 - ring / 34) * r.power * .012; ax += rx / d * force; ay += ry / d * force; } } }
    f.accx = ax; f.accy = ay;
  }
}
