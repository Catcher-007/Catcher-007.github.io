export const Boids = {
  update(fish, grid, neighborRadius = 60) {
    const r2 = neighborRadius * neighborRadius;

    for (let i = 0; i < fish.length; i++) {
      const f = fish[i];
      let ax = 0, ay = 0;
      let cx = 0, cy = 0;
      let sx = 0, sy = 0;
      let n = 0;

      grid.near(f.x, f.y, j => {
        if (j === i) return;

        const o = fish[j];
        const dx = f.x - o.x;
        const dy = f.y - o.y;
        const d2 = dx * dx + dy * dy;

        if (d2 > 0 && d2 < r2) {
          ax += o.vx;
          ay += o.vy;
          cx += o.x;
          cy += o.y;

          if (d2 < 625) {
            const inv = 1 / Math.sqrt(d2);
            sx += dx * inv;
            sy += dy * inv;
          }

          n++;
        }
      });

      if (!n) continue;

      // Average separation as well as alignment/cohesion. This avoids a
      // close pair repeatedly pushing each other past the desired heading.
      sx /= n;
      sy /= n;

      f.accx += (ax / n - f.vx) * .065
        + (cx / n - f.x) * .0035
        + sx * .055;
      f.accy += (ay / n - f.vy) * .065
        + (cy / n - f.y) * .0035
        + sy * .055;
    }
  }
};
