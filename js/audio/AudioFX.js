export class AudioFX {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.noiseBuffer = null;
    this.lastSlider = 0;
    // 总开关默认关闭；四类音效可独立开关
    this.enabled = false;
    this.channels = { water: true, merge: true, reset: true, slider: true };
    this._channelGains = {};
    this._volume = .5;
  }

  // 浏览器自动播放策略：必须在用户手势中调用 resume 才能出声
  unlock() {
    if (!this.ctx) this.#init();
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  }

  // 总开关：开启时在用户手势中初始化并恢复音频上下文；
  // 关闭时除静音外还挂起上下文，彻底释放音频资源
  setEnabled(on) {
    this.enabled = on;
    if (on) {
      this.unlock();
      if (this.master) this.master.gain.value = this._volume;
    } else if (this.ctx) {
      if (this.master) this.master.gain.value = 0;
      this.ctx.suspend();
    }
    return on;
  }

  isChannelOn(type) { return !!this.channels[type]; }

  setChannel(type, on) {
    this.channels[type] = !!on;
    // 同步已创建的通道增益，保证初始化后切换立即生效
    const g = this._channelGains[type];
    if (g) g.gain.value = on ? 1 : 0;
  }

  setVolume(v) {
    this._volume = v;
    if (this.master && this.enabled) this.master.gain.value = v;
  }

  // 页面不可见时挂起 AudioContext，节省系统音频资源；
  // 恢复时仅在总开关开启的情况下 resume，避免绕过关闭状态
  suspendOnHidden() {
    document.addEventListener('visibilitychange', () => {
      if (!this.ctx) return;
      if (document.hidden) this.ctx.suspend();
      else if (this.enabled) this.ctx.resume();
    });
  }

  #init() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    // 尊重初始化前的总开关状态：用户可能在开启前就触发过音效调用
    this.master.gain.value = this.enabled ? this._volume : 0;
    this.master.connect(this.ctx.destination);
    // 每类音效一条独立通道，便于单独静音
    for (const type of Object.keys(this.channels)) {
      const g = this.ctx.createGain();
      g.gain.value = this.channels[type] ? 1 : 0;
      g.connect(this.master);
      this._channelGains[type] = g;
    }
    const len = this.ctx.sampleRate;
    this.noiseBuffer = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = this.noiseBuffer.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  }

  // 返回指定类型音效的输出节点；未启用时返回 null 直接跳过合成
  // （init 会为 channels 的全部 key 建通道增益，无需兑底）
  #out(type) {
    if (!this.enabled || !this.ctx || !this.channels[type]) return null;
    return this._channelGains[type];
  }

  #noise(seconds, freq, gain, duration, type = 'water') {
    const out = this.#out(type);
    if (!out) return;
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
    g.connect(out);
    src.start(t, Math.random() * .5, seconds);
    src.stop(t + duration);
  }

  // 水声：指针按下 / 点击波纹
  water(volume = .5) {
    const out = this.#out('water');
    if (!out) return;
    this.unlock();
    this.#noise(.2, 900 + Math.random() * 400, .18 * volume, .12, 'water');
  }

  // 合并声：双气泡上升 + 轻噪
  merge() {
    const out = this.#out('merge');
    if (!out) return;
    this.unlock();
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
      g.connect(out);
      o.start(t + delay);
      o.stop(t + delay + .25);
    }
    this.#noise(.15, 1400, .05, .1, 'merge');
  }

  // 重置声：一串上升气泡涌起
  reset() {
    const out = this.#out('reset');
    if (!out) return;
    this.unlock();
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
      g.connect(out);
      o.start(t + delay);
      o.stop(t + delay + .18);
    }
    this.#noise(.2, 800, .04, .12, 'reset');
  }

  // 滑块声：轻"嗒"，节流避免拖动时过密
  slider() {
    const out = this.#out('slider');
    if (!out) return;
    this.unlock();
    const now = performance.now();
    if (now - this.lastSlider < 70) return;
    this.lastSlider = now;
    this.#noise(.04, 2000 + Math.random() * 800, .06, .05, 'slider');
  }
}
