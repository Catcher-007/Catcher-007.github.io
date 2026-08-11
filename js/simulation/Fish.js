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
    this.angle = a;
    this.trailX = this.x;
    this.trailY = this.y;
    this.turnWave = 0;
    this.wavePhase = Math.random() * Math.PI * 2;
    this.isLeader = false;
    this.leaderPhase = Math.random() * Math.PI * 2;
    this.scare = 0;
    this.panic = 0;
  }

  update(speed = 1, dt = 1) {
    const depthSpeed = .68 + this.depth * .48;
    const maxAccel = this.isLeader ? .105 : .12;
    const acc = Math.hypot(this.accx, this.accy);
    if (acc > maxAccel) {
      const k = maxAccel / acc;
      this.accx *= k;
      this.accy *= k;
    }

    this.vx += this.accx * speed * depthSpeed * dt;
    this.vy += this.accy * speed * depthSpeed * dt;

    this.panic *= Math.pow(.965, dt);
    if (this.panic < .01) this.panic = 0;
    this.scare *= Math.pow(.92, dt);
    if (this.scare < .01) this.scare = 0;

    const panicBoost = 1 + this.panic * .38;
    const lim = this.limit * speed * depthSpeed * panicBoost;
    let s = Math.hypot(this.vx, this.vy);
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

    if (ns > .08) {
      const target = Math.atan2(this.vy, this.vx) + this.turnWave * .32;
      let delta = target - this.angle;
      while (delta > Math.PI) delta -= Math.PI * 2;
      while (delta < -Math.PI) delta += Math.PI * 2;
      const deadZone = .035;
      if (Math.abs(delta) > deadZone) this.angle = target;
    }

    this.turnWave *= Math.pow(.82, dt);
    const trailFollow = Math.min(1, .12 * dt + .04);
    this.trailX += (this.x - this.trailX) * trailFollow;
    this.trailY += (this.y - this.trailY) * trailFollow;
  }

  edge() {
    const margin = 20;
    const jitter = 24;
    const minY = Math.min(margin, Math.max(0, this.height * .5));
    const maxY = Math.max(minY, this.height - margin);
    const minX = Math.min(margin, Math.max(0, this.width * .5));
    const maxX = Math.max(minX, this.width - margin);

    const outLeft = this.x < -margin;
    const outRight = this.x > this.width + margin;
    const outTop = this.y < -margin;
    const outBottom = this.y > this.height + margin;

    if (outLeft || outRight) {
      this.x = outLeft ? this.width + margin : -margin;
      this.y = Math.min(maxY, Math.max(minY, this.y + (Math.random() * 2 - 1) * jitter));
    }

    if (outTop || outBottom) {
      this.y = outTop ? this.height + margin : -margin;
      this.x = Math.min(maxX, Math.max(minX, this.x + (Math.random() * 2 - 1) * jitter));
    }

    if (outLeft || outRight || outTop || outBottom) {
      this.trailX = this.x;
      this.trailY = this.y;
    }
  }

  draw(ctx) {
    const z = .68 + this.depth * .7;
    const s = this.size * z * (this.isLeader ? 1.55 : 1);
    const a = .18 + this.depth * .7;
    const ang = this.angle;
    const cs = Math.cos(ang);
    const sn = Math.sin(ang);

    const body = [[2.8 * s, 0], [1.25 * s, -.58 * s], [-.75 * s, -.68 * s], [-1.65 * s, 0], [-.75 * s, .68 * s], [1.25 * s, .58 * s]];
    const tail = [[-1.25 * s, 0], [-2.35 * s, -1.0 * s], [-1.95 * s, 0], [-2.35 * s, 1.0 * s]];

    ctx.globalAlpha = a;
    ctx.fillStyle = this.isLeader ? '#b8f7ff' : this.depth > .72 ? '#8eefff' : this.depth > .38 ? '#62dff5' : '#48b9d6';

    const drawShape = points => {
      ctx.beginPath();
      for (let i = 0; i < points.length; i++) {
        const X = this.x + points[i][0] * cs - points[i][1] * sn;
        const Y = this.y + points[i][0] * sn + points[i][1] * cs;
        i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y);
      }
      ctx.closePath();
      ctx.fill();
    };

    drawShape(tail);
    drawShape(body);
  }
}
