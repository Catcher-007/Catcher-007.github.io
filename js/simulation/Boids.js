export const Boids = {
  update(fish, grid, neighborRadius = 78, leader = null) {
    const r2 = neighborRadius * neighborRadius;
    const separationRadius = 32;
    const separationRadius2 = separationRadius * separationRadius;
    const leaderRadius = 190;
    const leaderRadius2 = leaderRadius * leaderRadius;

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

      if (n) {
        const invN = 1 / n;
        const avgVX = alignX * invN;
        const avgVY = alignY * invN;

        f.accx += (avgVX - f.vx) * .055;
        f.accy += (avgVY - f.vy) * .055;
        f.accx += (centerX * invN - f.x) * .0017;
        f.accy += (centerY * invN - f.y) * .0017;
        f.accx += sepX * .22;
        f.accy += sepY * .22;

        const avgSpeed = Math.hypot(avgVX, avgVY);
        if (avgSpeed > .12) {
          let delta = Math.atan2(avgVY, avgVX) - f.angle;
          while (delta > Math.PI) delta -= Math.PI * 2;
          while (delta < -Math.PI) delta += Math.PI * 2;
          const influence = Math.min(.18, n / 80 * .18);
          f.turnWave = f.turnWave * .88 + delta * influence;
          f.turnWave = Math.max(-.16, Math.min(.16, f.turnWave));
        }
      }

      if (leader && f !== leader) {
        const dx = leader.x - f.x;
        const dy = leader.y - f.y;
        const d2 = dx * dx + dy * dy;
        if (d2 > 36 && d2 < leaderRadius2) {
          const d = Math.sqrt(d2);
          const fall = 1 - d / leaderRadius;
          const leadSpeed = Math.hypot(leader.vx, leader.vy);

          // The leader supplies direction intent, not positional attraction.
          // This prevents the school from collapsing onto the leader.
          if (leadSpeed > .12) {
            const intentX = leader.intentX ?? leader.vx / leadSpeed;
            const intentY = leader.intentY ?? leader.vy / leadSpeed;
            const follow = .045 * fall * fall;
            f.accx += (intentX * leadSpeed - f.vx) * follow;

            f.accy += (intentY * leadSpeed - f.vy) * follow;

            let delta = Math.atan2(intentY, intentX) - f.angle;
            while (delta > Math.PI) delta -= Math.PI * 2;
            while (delta < -Math.PI) delta += Math.PI * 2;
            f.turnWave += delta * .014 * fall;
            f.turnWave = Math.max(-.18, Math.min(.18, f.turnWave));
          }
        }
      }
    }
  }
};
