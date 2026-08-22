// AudioFX 单元测试：总开关 / 分项通道 / 挂起恢复逻辑
// 运行：node audio-test.mjs（无依赖，mock 浏览器 WebAudio API）

const param = () => ({ value: 0, setValueAtTime() {}, exponentialRampToValueAtTime() {} });
const node = () => ({ gain: param(), frequency: param(), connect() {}, start() {}, stop() {}, type: '' });
let suspended = 0, resumed = 0;

globalThis.performance = { now: () => 0 };
globalThis.document = { hidden: false, addEventListener(ev, fn) { globalThis.__vis = fn; } };

class FakeAudioContext {
  get state() { return this._s || 'running'; }
  resume() { resumed++; this._s = 'running'; }
  suspend() { suspended++; this._s = 'suspended'; }
  get currentTime() { return 0; }
  get sampleRate() { return 48000; }
  createGain() { return node(); }
  createBufferSource() { return node(); }
  createBiquadFilter() { return node(); }
  createOscillator() { return { ...node(), frequency: param() }; }
  createBuffer() { return { getChannelData: () => new Float32Array(8) }; }
  get destination() { return {}; }
}
globalThis.window = { AudioContext: FakeAudioContext };

const { AudioFX } = await import('./js/audio/AudioFX.js');

let failures = 0;
const ok = (cond, msg) => { cond ? console.log(' ✓', msg) : (failures++, console.error(' ✗ FAIL:', msg)); };

// --- 默认状态 ---
{
  const a = new AudioFX();
  ok(a.enabled === false, '默认总开关关闭');
  a.water(); a.merge(); a.reset(); a.slider();
  ok(a.ctx === null, '关闭状态不创建 AudioContext');
}

// --- 总开关生命周期 ---
{
  const a = new AudioFX();
  a.suspendOnHidden();
  ok(a.setEnabled(true) === true && a.ctx !== null, '开启后创建 AudioContext');
  ok(suspended === 0, '开启过程无 suspend');
  ok(a.master.gain.value === .5, '开启后 master 音量生效');
  a.setEnabled(false);
  ok(a.master.gain.value === 0 && suspended === 1, '关闭时静音并挂起 AudioContext');
  document.hidden = false; globalThis.__vis();
  ok(resumed === 0, '关闭状态下页面可见不 resume');
  a.setEnabled(true);
  ok(resumed >= 1 && a.ctx.state === 'running', '重新开启恢复运行');
  document.hidden = true; globalThis.__vis();
  ok(suspended === 2, '页面隐藏挂起');
  document.hidden = false; globalThis.__vis();
  ok(a.ctx.state === 'running', '页面可见且开启则恢复');
}

// --- 分项通道 ---
{
  const a = new AudioFX();
  a.setEnabled(true);
  a.setChannel('merge', false);
  ok(!a.isChannelOn('merge') && a.isChannelOn('water'), '分项开关切换');
  ok(a._channelGains.merge.gain.value === 0 && a._channelGains.water.gain.value === 1, '通道增益同步');
  // 延迟初始化场景：先关再开，init 时应尊重已存状态
  const b = new AudioFX();
  b.setChannel('slider', false);
  b.setEnabled(true);
  ok(b._channelGains.slider.gain.value === 0, '延迟初始化尊重分项开关状态');
}

// --- setVolume 与总开关协作 ---
{
  const a = new AudioFX();
  a.setVolume(.9);
  ok(a._volume === .9 && a.master === null, '禁用状态 setVolume 只记账不碰 master');
  a.setEnabled(true);
  a.setChannel('merge', false);
  a.setVolume(.3);
  ok(a.master.gain.value === .3 && a._channelGains.merge.gain.value === 0, '启用后 setVolume 生效且不影响分项通道');
}

console.log(failures ? `\n${failures} FAILED` : '\nALL PASS');
process.exit(failures ? 1 : 0);
