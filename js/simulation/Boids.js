export const Boids = {
  update(fish, grid, neighborRadius = 78, leader = null, formation = null) {
    const r2 = neighborRadius * neighborRadius;
    const density = formation?.density ?? 1;
    const spacing = formation?.preferredSpacing ?? 30;
    const separationRadius = Math.max(28, spacing + 4);
    const separationRadius2 = separationRadius * separationRadius;
    const leaderRadius = 190;
    const leaderRadius2 = leaderRadius * leaderRadius;
    const leaderRing1 = 62;
    const leaderRing2 = 124;
    const aspect = formation?.aspectRatio ?? 1;

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
          const d = Math.sqrt(Math.max(d2, .5));
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
        const avgSpeed = Math.hypot(avgVX, avgVY);

        f.accx += (avgVX - f.vx) * .052;
        f.accy += (avgVY - f.vy) * .052;

        if (avgSpeed > .08) {
          const inv = 1 / avgSpeed;
          const fx = avgVX * inv;
          const fy = avgVY * inv;
          const lx = -fy;
          const ly = fx;
          const cx = centerX * invN - f.x;
          const cy = centerY * invN - f.y;
          const along = cx * fx + cy * fy;
          const lateral = cx * lx + cy * ly;
          const longitudinalGain = .0017 / aspect;
          const lateralGain = .0017 * Math.min(1.35, aspect);
          f.accx += fx * along * longitudinalGain + lx * lateral * lateralGain;
          f.accy += fy * along * longitudinalGain + ly * lateral * lateralGain;
        } else {
          f.accx += (centerX * invN - f.x) * .00145;
          f.accy += (centerY * invN - f.y) * .00145;
        }

        const separationGain = .25 * Math.max(.9, Math.min(1.18, density));
        f.accx += sepX * separationGain;
        f.accy += sepY * separationGain;

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
