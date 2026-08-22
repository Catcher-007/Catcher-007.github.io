export class BackgroundBubbles {
  constructor(width, height, count = 40) {
    this.width = width;
    this.height = height;
    this.count = count;
    this.items = [];
    this.seed();
  }

  resize(width, height) {
    const oldArea = this.width * this.height || 1;
    this.width = width;
    this.height = height;
    // 面积增长超过 20% 时补种气泡，避免窗口放大后新区域无覆盖
    const newArea = width * height || 1;
    if (newArea > oldArea * 1.2) {
      const deficit = Math.floor(this.count * (1 - oldArea / newArea));
      for (let i = 0; i < deficit; i++) this.items.push(this.#spawn(false));
    }
  }

  seed() {
    this.items.length = 0;
    for (let i = 0; i < this.count; i++) this.items.push(this.#spawn(true));
  }

  #spawn(scattered = false) {
    const depth = Math.random();
    return {
      x: Math.random() * this.width,
      y: scattered ? Math.random() * this.height : this.height + 4,
      r: 0.8 + depth * 2.6,
      vy: 0.12 + Math.random() * 0.3 + depth * 0.12,
      phase: Math.random() * Math.PI * 2,
      depth
    };
  }

  update(dt = 1) {
    for (let i = 0; i < this.items.length; i++) {
      const b = this.items[i];
      b.phase += 0.006 * dt;
      b.y -= b.vy * dt;
      b.x += Math.sin(b.phase) * 0.25;
      if (b.y < -6) this.items[i] = this.#spawn(false);
    }
  }

  draw(ctx) {
    ctx.save();
    for (const b of this.items) {
      ctx.globalAlpha = 0.05 + b.depth * 0.12;
      ctx.fillStyle = '#9ceeff';
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}
