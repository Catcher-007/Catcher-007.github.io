export class Fish {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.reset();
  }

  reset() {
    this.x = Math.random() * this.width;
    this.y = Math.random() * this.height;
    const a = Math.random() * Math.PI * 2;
    const s = 1.4 + Math.random() * 1.8;
    this.vx = Math.cos(a) * s;
    this.vy = Math.sin(a) * s;
    this.max = 2 + Math.random() * 2;
    this.limit = this.max;
    this.depth = Math.random();
    this.size = 1.7 + Math.random() * 2.6;
    this.h = 185 + Math.random() * 50;
    this.accx = 0;
    this.accy = 0;
    this.phase = Math.random() * Math.PI * 2;
    this.tail = 0;
    this.tailSpeed = .13 + Math.random() * .1;
    this.angle = a;
  }

  update(speed = 1, dt = 1) {
    const depthSpeed = .68 + this.depth * .48;
    const maxAccel = .12;
    const acc = Math.hypot(this.accx, this.accy);
    if (acc > maxAccel) {
      const k = maxAccel / acc;
      this.accx *= k;
      this.accy *= k;
    }

    this.vx += this.accx * speed * depthSpeed * dt;
    this.vy += this.accy * speed * depthSpeed * dt;

    const s = Math.hypot(this.vx, this.vy);
    const lim = this.limit * speed * depthSpeed;
    if (s > lim) {
      this.vx = this.vx / s * lim;
      this.vy = this.vy / s * lim;
    }

    const minSpeed = Math.min(1.05, lim * .42);
    if (s > 0 && s < minSpeed) {
      this.vx = this.vx / s * minSpeed;
      this.vy = this.vy / s * minSpeed;
    }

    const ns = Math.hypot(this.vx, this.vy);
    this.x += this.vx * depthSpeed * dt;
    this.y += this.vy * depthSpeed * dt;
    this.accx = 0;
    this.accy = 0;
    this.tail = 0;

    // Use a stable velocity direction. Ignore tiny angular changes so the
    // fish does not visually twitch when Boids forces fluctuate by a small amount.
    if (ns > .08) {
      const target = Math.atan2(this.vy, this.vx);
      let delta = target - this.angle;
      while (delta > Math.PI) delta -= Math.PI * 2;
      while (delta < -Math.PI) delta += Math.PI * 2;
      const deadZone = .035;
      if (Math.abs(delta) > deadZone) {
        this.angle = target;
      }
    }
  }

  edge() {
    if (this.x < -20) this.x = this.width + 20;
    if (this.x > this.width + 20) this.x = -20;
    if (this.y < -20) this.y = this.height + 20;
    if (this.y > this.height + 20) this.y = -20;
  }

  draw(ctx) {
    const z = .68 + this.depth * .7;
    const s = this.size * z;
    const a = .18 + this.depth * .7;
    const ang = this.angle;
    const cs = Math.cos(ang);
    const sn = Math.sin(ang);
    const p = [
      [3.1 * s, 0],
      [-.45 * s, -.7 * s],
      [-1.55 * s, -1.25 * s],
      [-.85 * s, 0],
      [-1.55 * s, 1.25 * s],
      [-.45 * s, .7 * s]
    ];

    ctx.globalAlpha = a;
    ctx.fillStyle = this.depth > .72 ? '#8eefff' : this.depth > .38 ? '#62dff5' : '#48b9d6';
    ctx.beginPath();
    for (let i = 0; i < p.length; i++) {
      const X = this.x + p[i][0] * cs - p[i][1] * sn;
      const Y = this.y + p[i][0] * sn + p[i][1] * cs;
      i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y);
    }
    ctx.closePath();
    ctx.fill();
  }
}
