export const LeaderStates = Object.freeze({
  IDLE: 'IDLE',
  CRUISE: 'CRUISE',
  EXPLORE: 'EXPLORE',
  TURN: 'TURN',
  REST: 'REST'
});

export class LeaderStateMachine {
  constructor() {
    this.state = LeaderStates.IDLE;
    this.time = 0;
    this.duration = 2;
    this.nextState = LeaderStates.CRUISE;
  }

  enter(state, duration = 2) {
    this.state = state;
    this.time = 0;
    this.duration = duration;
  }

  update(dt = 1) {
    this.time += dt;

    if (this.time >= this.duration) {
      switch (this.state) {
        case LeaderStates.IDLE:
          this.enter(LeaderStates.CRUISE, 8 + Math.random() * 6);
          break;
        case LeaderStates.CRUISE:
          this.enter(
            Math.random() < 0.55 ? LeaderStates.EXPLORE : LeaderStates.TURN,
            4 + Math.random() * 5
          );
          break;
        case LeaderStates.EXPLORE:
          this.enter(LeaderStates.CRUISE, 6 + Math.random() * 8);
          break;
        case LeaderStates.TURN:
          this.enter(LeaderStates.CRUISE, 6 + Math.random() * 8);
          break;
        case LeaderStates.REST:
          this.enter(LeaderStates.CRUISE, 8 + Math.random() * 8);
          break;
        default:
          this.enter(LeaderStates.CRUISE, 8);
      }
    }

    return this.state;
  }

  getState() {
    return this.state;
  }
}
