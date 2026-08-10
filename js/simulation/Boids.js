export const Boids = {
  update(fish, grid, neighborRadius = 78) {
    const r2 = neighborRadius * neighborRadius;
    const separationRadius = 32;
    const separationRadius2 = separationRadius * separationRadius;

    for (let i = 0; i < fish.length; i++) {
      const f = fish[i];
      let alignX = 0, alignY = 0;
      let centerX = 0, centerY = 0;
      let sepX = 0, sepY = 0;
      let n = 0;

      grid.near(f.x, f.y, j => {
        if (j === i) return;

        const o = fish[j];
        const dx = f.x - o.x;
        const dy = f.y - o.y;
        const d2 = dx * dx + dy * dy;

        if (d2 <= 0 || d2 >= r2) return;

        alignX += o.vx;
        alignY += o.vy;
        centerX += o.x;
        centerY += o.y;
        n++;

        if (d2 < separationRadius2) {
          const d = Math.sqrt(d2);
          const falloff = 1 - d / separationRadius;
          const w = falloff * falloff / d;
          sepX += dx * w;
          sepY += dy * w;
        }
      });

      if (!n) continue;

      const invN = 1 / n;
      const avgVX = alignX * invN;
      const avgVY = alignY * invN;

      f.accx += (avgVX - f.vx) * .055;
      f.accy += (avgVY - f.vy) * .055;
      f.accx += (centerX * invN - f.x) * .0017;
      f.accy += (centerY * invN - f.y) * .0017;
      f.accx += sepX * .22;
      f.accy += sepY * .22;

      // Propagate only a small portion of a local turn. The wave is based on
      // heading difference, not a synchronized global rotation.
      const avgSpeed = Math.hypot(avgVX, avgVY);
      if (avgSpeed > .12) {
        let target = Math.atan2(avgVY, avgVX);
        let delta = target - f.angle;
        while (delta > Math.PI) delta -= Math.PI * 2;
        while (delta < -Math.PI) delta += Math.PI * 2;

        const influence = Math.min(.18, n / 80 * .18);
        f.turnWave = f.turnWave * .88 + delta * influence;
        f.turnWave = Math.max(-.16, Math.min(.16, f.turnWave));
      }
    }
  }
};
