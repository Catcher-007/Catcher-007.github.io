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

        // Separation is deliberately strong only at close range. This keeps
        // the school visually open instead of collapsing into one bright blob.
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
      f.accx += (alignX * invN - f.vx) * .055;
      f.accy += (alignY * invN - f.vy) * .055;

      // Gentle cohesion: fish should form a school, not a single point mass.
      f.accx += (centerX * invN - f.x) * .0017;
      f.accy += (centerY * invN - f.y) * .0017;

      f.accx += sepX * .22;
      f.accy += sepY * .22;
    }
  }
};
