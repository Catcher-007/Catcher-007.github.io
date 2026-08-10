export class School {
  constructor(fish = [], leader = null, {
    preferredSpacing = 30,
    compactness = 1
  } = {}) {
    this.fish = fish;
    this.leader = leader;
    this.preferredSpacing = preferredSpacing;
    this.compactness = compactness;
    this.aspectRatio = 1;
  }

  setLeader(leader) {
    this.leader = leader;
    if (leader) {
      leader.isLeader = true;
      if (!this.fish.includes(leader)) this.fish.push(leader);
    }
  }

  add(fish) {
    if (!this.fish.includes(fish)) this.fish.push(fish);
    return fish;
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
    // Fast schools naturally stretch along their travel direction; slow schools
    // relax toward a wider, rounder formation.
    const speedRatio = Math.max(0, Math.min(1, (avgSpeed - 1.2) / 2.2));
    this.aspectRatio += ((1 + speedRatio * 1.15) - this.aspectRatio) * Math.min(1, dt * .06);

    for (const fish of this.fish) fish.update(speed, dt);
    for (const fish of this.fish) fish.edge();
  }

  getLeader() {
    return this.leader;
  }

  getFormation() {
    return {
      preferredSpacing: this.preferredSpacing,
      compactness: this.compactness,
      aspectRatio: this.aspectRatio
    };
  }
}
