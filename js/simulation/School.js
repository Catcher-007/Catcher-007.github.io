export class School {
  constructor(fish = [], leader = null) {
    this.fish = fish;
    this.leader = leader;
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
    for (const fish of this.fish) fish.update(speed, dt);
    for (const fish of this.fish) fish.edge();
  }

  getLeader() {
    return this.leader;
  }
}
