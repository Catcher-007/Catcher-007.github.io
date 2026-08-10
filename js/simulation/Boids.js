export const Boids = {
  update(fish, grid, neighborRadius = 78, leader = null) {
    const r2 = neighborRadius * neighborRadius;
    const separationRadius = 34;
    const separationRadius2 = separationRadius * separationRadius;
    const leaderRadius = 190;
    const leaderRadius2 = leaderRadius * leaderRadius;
    const leaderRing1 = 62;
    const leaderRing2 = 124;

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
          const w = falloff * falloff / Math.max(d, 0.5);
          sepX += dx * w;
          sepY += dy * w;
        }
      });

      if (n) {
        const invN = 1 / n;
        const avgVX = alignX * invN;
        const avgVY = alignY * invN;

        f.accx += (avgVX - f.vx) * .052;
        f.accy += (avgVY - f.vy) * .052;
        f.accx += (centerX * invN - f.x) * .00145;
        f.accy += (centerY * invN - f.y) * .00145;
        f.accx += sepX * .25;
        f.accy += sepY * .25;

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
          const leadSpeed = Math.hypot(leader.vx, leader.vy);

          if (leadSpeed > .12) {
            let ringWeight;
            if (d < leaderRing1) ringWeight = .060;
            else if (d < leaderRing2) ringWeight = .035;
            else ringWeight = .014;

            const fall = Math.max(0, 1 - d / leaderRadius);
            const follow = ringWeight * fall * fall;
            const intentX = leader.intentX ?? leader.vx / leadSpeed;
            const intentY = leader.intentY ?? leader.vy / leadSpeed;

            f.accx += (intentX * leadSpeed - f.vx) * follow;
            f.accy += (intentY * leadSpeed - f.vy) * follow;

            let delta = Math.atan2(intentY, intentX) - f.angle;
            while (delta > Math.PI) delta -= Math.PI * 2;
            while (delta < -Math.PI) delta += Math.PI * 2;
            const waveGain = ringWeight * .30 * fall;
            f.turnWave += delta * waveGain;
            f.turnWave = Math.max(-.18, Math.min(.18, f.turnWave));
          }
        }
      }
    }
  }
};
