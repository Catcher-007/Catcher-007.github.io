import { Fish } from './Fish.js';

export class LeaderFish extends Fish {
  constructor(width, height, rng = Math.random) {
    super(width, height);
    this.isLeader = true;
    this.rng = rng;
    this.state = 'CRUISE';
    this.stateTimer = 2 + rng() * 3;
    this.leaderPhase = rng() * Math.PI * 2;
    this.turnBias = 0;
    this.turnTarget = 0;
    this.intentX = Math.cos(this.angle);
    this.intentY = Math.sin(this.angle);
  }

  update(speed = 1, dt = 1) {
    // 合并后 leader 降级（isLeader=false），走普通鱼的 Boids 行为，不再自主巡航
    if (!this.isLeader) { super.update(speed, dt); return; }

    this.stateTimer -= dt;
    if (this.stateTimer <= 0) this.#chooseState();

    const stateBlend = Math.min(1, dt * 0.65);
    this.turnBias += (this.turnTarget - this.turnBias) * stateBlend;
    this.leaderPhase += dt * (this.state === 'EXPLORE' ? 0.9 : 0.55);

    const speedNow = Math.hypot(this.vx, this.vy);
    if (speedNow > 0.08) {
      const current = Math.atan2(this.vy, this.vx);
      const gentleNoise = Math.sin(this.leaderPhase) * (this.state === 'EXPLORE' ? 0.012 : 0.004);
      const target = current + this.turnBias + gentleNoise;
      const nextVx = Math.cos(target) * speedNow;
      const nextVy = Math.sin(target) * speedNow;
      const steer = Math.min(1, dt * 0.9);
      this.vx += (nextVx - this.vx) * steer;
      this.vy += (nextVy - this.vy) * steer;
    }

    // Advance the actual fish first, then publish the current heading so the
    // school responds to the leader's latest direction rather than one frame old.
    // 先推进自己位置，再发布当前朝向（intent）：群体响应的是 leader 最新方向，而非上一帧的方向
    super.update(speed, dt);

    const heading = Math.atan2(this.vy, this.vx);
    this.intentX = Math.cos(heading);
    this.intentY = Math.sin(heading);
  }

  #chooseState() {
    const roll = this.rng();
    if (this.state === 'CRUISE') {
      this.state = roll < 0.7 ? 'CRUISE' : 'TURN';
    } else if (this.state === 'TURN') {
      this.state = roll < 0.25 ? 'EXPLORE' : 'CRUISE';
    } else {
      this.state = 'CRUISE';
    }

    if (this.state === 'TURN') {
      this.stateTimer = 0.8 + this.rng() * 1.4;
      this.turnTarget = (this.rng() - 0.5) * 0.11;
    } else if (this.state === 'EXPLORE') {
      this.stateTimer = 1.2 + this.rng() * 2;
      this.turnTarget = (this.rng() - 0.5) * 0.045;
    } else {
      this.stateTimer = 2 + this.rng() * 4;
      this.turnTarget = (this.rng() - 0.5) * 0.018;
    }
  }
}
