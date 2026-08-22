export class AudioFX {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.noiseBuffer = null;
    this.lastSlider = 0;
    this.muted = false;
    this._volume = .5;
  }

  // 浏览器自动播放策略：必须在用户手势中调用 resume 才能出声
  unlock() {
    if (!this.ctx) this.#init();
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.master) this.master.gain.value = this.muted ? 0 : this._volume;
    return this.muted;
  }

  setVolume(v) {
    this._volume = v;
    if (this.master && !this.muted) this.master.gain.value = v;
  }

  // 页面不可见时挂起 AudioContext，节省系统音频资源
  suspendOnHidden() {
    document.addEventListener('visibilitychange', () => {
      if (!this.ctx) return;
      if (document.hidden) this.ctx.suspend();
      else this.ctx.resume();
    });
  }

  #init() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = .5;
    this.master.connect(this.ctx.destination);
    const len = this.ctx.sampleRate;
    this.noiseBuffer = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = this.noiseBuffer.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  }

  #noise(seconds, freq, gain, duration) {
    if (!this.ctx) return;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = freq;
    const g = this.ctx.createGain();
    const t = this.ctx.currentTime;
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(.0001, t + duration);
    src.connect(filter);
    filter.connect(g);
    g.connect(this.master);
    src.start(t, Math.random() * .5, seconds);
    src.stop(t + duration);
  }

  // 水声：指针按下 / 点击波纹
  water(volume = .5) {
    this.unlock();
    if (!this.ctx) return;
    this.#noise(.2, 900 + Math.random() * 400, .18 * volume, .12);
  }

  // 合并声：双气泡上升 + 轻噪
  merge() {
    this.unlock();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    for (const [f0, f1, delay] of [[180, 380, 0], [260, 520, .06]]) {
      const o = this.ctx.createOscillator();
      o.type = 'sine';
      o.frequency.setValueAtTime(f0, t + delay);
      o.frequency.exponentialRampToValueAtTime(f1, t + delay + .18);
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(.0001, t + delay);
      g.gain.exponentialRampToValueAtTime(.25, t + delay + .03);
      g.gain.exponentialRampToValueAtTime(.0001, t + delay + .22);
      o.connect(g);
      g.connect(this.master);
      o.start(t + delay);
      o.stop(t + delay + .25);
    }
    this.#noise(.15, 1400, .05, .1);
  }

  // 重置声：一串上升气泡涌起
  reset() {
    this.unlock();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    for (let i = 0; i < 4; i++) {
      const delay = i * .06;
      const o = this.ctx.createOscillator();
      o.type = 'sine';
      o.frequency.setValueAtTime(200 + i * 45, t + delay);
      o.frequency.exponentialRampToValueAtTime(420 + i * 45, t + delay + .12);
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(.0001, t + delay);
      g.gain.exponentialRampToValueAtTime(.16, t + delay + .02);
      g.gain.exponentialRampToValueAtTime(.0001, t + delay + .15);
      o.connect(g);
      g.connect(this.master);
      o.start(t + delay);
      o.stop(t + delay + .18);
    }
    this.#noise(.2, 800, .04, .12);
  }

  // 滑块声：轻"嗒"，节流避免拖动时过密
  slider() {
    this.unlock();
    if (!this.ctx) return;
    const now = performance.now();
    if (now - this.lastSlider < 70) return;
    this.lastSlider = now;
    this.#noise(.04, 2000 + Math.random() * 800, .06, .05);
  }
}
