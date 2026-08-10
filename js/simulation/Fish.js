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
    this.trailX = this.x;
    this.trailY = this.y;
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

    if (ns > .08) {
      const target = Math.atan2(this.vy, this.vx);
      let delta = target - this.angle;
      while (delta > Math.PI) delta -= Math.PI * 2;
      while (delta < -Math.PI) delta += Math.PI * 2;
      const deadZone = .035;
      if (Math.abs(delta) > deadZone) this.angle = target;
    }

    // Very short motion trail: a single faded segment, intentionally subtle.
    const trailFollow = Math.min(1, .12 * dt + .04);
    this.trailX += (this.x - this.trailX) * trailFollow;
    this.trailY += (this.y - this.trailY) * trailFollow;
  }

  edge() {
    if (this.x < -20) this.x = this.width + 20;
    if (this.x > this.width + 20) this.x = -20;
    if (this.y < -20) this.y = this.height + 20;
    if (this.y > this.height + 20) this.y = -20;
    this.trailX = this.x;
    this.trailY = this.y;
  }

  draw(ctx) {
    const z = .68 + this.depth * .7;
    const s = this.size * z;
    const a = .18 + this.depth * .7;
    const ang = this.angle;
    const cs = Math.cos(ang);
    const sn = Math.sin(ang);

    // Subtle cyan motion trail behind the fish.
    const speed = Math.hypot(this.vx, this.vy);
    if (speed > .35) {
      ctx.save();
      ctx.globalAlpha = Math.min(.16, .035 + speed * .018) * (.55 + this.depth * .45);
      ctx.strokeStyle = '#62dff5';
      ctx.lineWidth = Math.max(.45, s * .18);
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(this.trailX, this.trailY);
      ctx.lineTo(this.x - cs * s * 1.25, this.y - sn * s * 1.25);
      ctx.stroke();
      ctx.restore();
    }

    const body = [
      [2.8 * s, 0],
      [1.25 * s, -.58 * s],
      [-.75 * s, -.68 * s],
      [-1.65 * s, 0],
      [-.75 * s, .68 * s],
      [1.25 * s, .58 * s]
    ];
    const tail = [
      [-1.25 * s, 0],
      [-2.35 * s, -1.0 * s],
      [-1.95 * s, 0],
      [-2.35 * s, 1.0 * s]
    ];

    ctx.globalAlpha = a;
    ctx.fillStyle = this.depth > .72 ? '#8eefff' : this.depth > .38 ? '#62dff5' : '#48b9d6';

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
