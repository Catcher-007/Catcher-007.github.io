import { Fish } from './Fish.js';

/**
 * A fish with a small amount of autonomous steering used as a school leader.
 * The leader remains a Fish so it can participate in the existing simulation,
 * while keeping leader-specific behavior outside Boids.
 */
export class LeaderFish extends Fish {
  constructor(x, y, depth, rng = Math.random) {
    super(x, y, depth);
    this.isLeader = true;
    this.rng = rng;
    this.leaderPhase = rng() * Math.PI * 2;
    this.leaderTurn = (rng() - 0.5) * 0.018;
    this.leaderTurnTarget = this.leaderTurn;
    this.leaderTimer = 0;
  }

  update(dt, width, height) {
    this.leaderTimer -= dt;
    if (this.leaderTimer <= 0) {
      this.leaderTimer = 1.2 + this.rng() * 2.4;
      this.leaderTurnTarget = (this.rng() - 0.5) * 0.024;
    }

    const blend = Math.min(1, dt * 0.8);
    this.leaderTurn += (this.leaderTurnTarget - this.leaderTurn) * blend;
    this.leaderPhase += dt * 0.7;

    const speed = Math.hypot(this.vx, this.vy);
    if (speed > 0.001) {
      const angle = Math.atan2(this.vy, this.vx);
      const targetAngle = angle + this.leaderTurn + Math.sin(this.leaderPhase) * 0.006;
      const nextVx = Math.cos(targetAngle) * speed;
      const nextVy = Math.sin(targetAngle) * speed;
      this.vx += (nextVx - this.vx) * Math.min(1, dt * 1.2);
      this.vy += (nextVy - this.vy) * Math.min(1, dt * 1.2);
    }

    super.update(dt, width, height);
  }
}
