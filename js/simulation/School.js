export class School {
  constructor(fish = [], leader = null, {
    preferredSpacing = 30
  } = {}) {
    this.fish = fish;
    this.leader = leader;
    this.preferredSpacing = preferredSpacing;
    this.aspectRatio = 1;
    this.localDensity = 1;
    this.densityTarget = 1;
  }

  setLeader(leader) {
    this.leader = leader;
    if (leader) {
      leader.isLeader = true;
      if (!this.fish.includes(leader)) this.fish.push(leader);
    }
  }

  update(dt, speed, width, height) {
    let vx = 0;
    let vy = 0;
    let moving = 0;
    for (const fish of this.fish) {
      const s = Math.hypot(fish.vx, fish.vy);
      if (s > .08) {
        vx += fish.vx;
        vy += fish.vy;
        moving++;
      }
    }

    const avgSpeed = moving ? Math.hypot(vx / moving, vy / moving) : 0;
    const speedRatio = Math.max(0, Math.min(1, (avgSpeed - 1.2) / 2.2));
    this.aspectRatio += ((1 + speedRatio * 1.15) - this.aspectRatio) * Math.min(1, dt * .06);

    // Density target adapts slowly so local spacing changes do not cause
    // oscillation or sudden school expansion/contraction.
    const countFactor = Math.sqrt(Math.max(1, this.fish.length) / 160);
    const speedSpacing = 1 + speedRatio * .18;
    this.densityTarget = Math.max(.82, Math.min(1.28, countFactor * speedSpacing));
    this.localDensity += (this.densityTarget - this.localDensity) * Math.min(1, dt * .08);

    for (const fish of this.fish) fish.update(speed, dt);
    for (const fish of this.fish) fish.edge();
  }

  getFormation() {
    return {
      preferredSpacing: this.preferredSpacing * this.localDensity,
      aspectRatio: this.aspectRatio,
      density: this.localDensity
    };
  }
}
