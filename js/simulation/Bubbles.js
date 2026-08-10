export class Bubbles {
  constructor(max = 18) {
    this.max = max;
    this.items = [];
  }

  spawn(x, y, strength = 1) {
    if (this.items.length >= this.max || Math.random() > 0.16 * strength) return;
    const r = 1.2 + Math.random() * 2.8;
    this.items.push({
      x: x + (Math.random() - .5) * 14,
      y: y + (Math.random() - .5) * 10,
      r,
      vx: (Math.random() - .5) * .08,
      vy: -(0.25 + Math.random() * .35),
      phase: Math.random() * Math.PI * 2,
      life: .7 + Math.random() * .8,
      age: 0
    });
  }

  update(dt = 1) {
    for (let i = this.items.length - 1; i >= 0; i--) {
      const b = this.items[i];
      b.age += dt;
      b.life -= .006 * dt;
      b.phase += .035 * dt;
      b.x += (b.vx + Math.sin(b.phase) * .018) * dt;
      b.y += b.vy * dt;
      b.r += .0025 * dt;
      if (b.life <= 0 || b.y < -12) this.items.splice(i, 1);
    }
  }

  draw(ctx) {
    ctx.save();
    for (const b of this.items) {
      const fadeIn = Math.min(1, b.age / 8);
      const alpha = Math.min(.32, b.life * .28) * fadeIn;
      if (alpha <= .01) continue;
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = '#8eefff';
      ctx.lineWidth = Math.max(.45, b.r * .22);
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }
}
