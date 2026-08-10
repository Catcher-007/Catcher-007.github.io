export class School {
  constructor(fish = [], leader = null) {
    this.fish = fish;
    this.leader = leader;
  }

  setLeader(leader) {
    this.leader = leader;
    if (leader) leader.isLeader = true;
  }

  update(dt, width, height) {
    for (const fish of this.fish) {
      fish.update(dt, width, height);
    }
  }

  getLeader() {
    return this.leader;
  }
}
