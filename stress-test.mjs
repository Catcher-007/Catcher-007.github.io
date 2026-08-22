// 压力测试：验证 Simulation 在极端条件下的一致性不变量
// 用法: node --input-type=module stress-test.mjs 不行——直接 `node stress-test.mjs`（.mjs 后缀）
import { Simulation } from './js/simulation/Simulation.js';

let failures = 0;
let checks = 0;
const fail = msg => { failures++; console.error('  ✗ FAIL:', msg); };
const pass = msg => { checks++; console.log('  ✓', msg); };

function invariants(sim, label) {
  // 1. 总数守恒：主表长度 == this.count
  if (sim.fish.length !== sim.count) fail(`${label}: 主表 ${sim.fish.length} != count ${sim.count}`);
  // 2. 每条鱼恰好属于一个群，且引用双向一致
  const seen = new Set();
  let inSchools = 0;
  for (const sc of sim.schools) {
    for (const f of sc.fish) {
      inSchools++;
      if (seen.has(f)) fail(`${label}: 鱼出现在多个群`);
      seen.add(f);
      if (!sim.fish.includes(f)) fail(`${label}: 群内鱼不在主表`);
      if (f.school !== sc) fail(`${label}: fish.school 指向错误群`);
    }
    // 3. 每群必须有 leader
    if (!sc.leader || !sc.fish.includes(sc.leader)) fail(`${label}: 群缺少 leader 或 leader 不在群内`);
  }
  if (inSchools !== sim.fish.length) fail(`${label}: 群内总数 ${inSchools} != 主表 ${sim.fish.length}（有孤儿鱼）`);
  // 4. 无 NaN / Infinity
  for (const f of sim.fish) {
    if (!Number.isFinite(f.x) || !Number.isFinite(f.y) || !Number.isFinite(f.vx) || !Number.isFinite(f.vy) || !Number.isFinite(f.angle)) {
      fail(`${label}: 鱼 ${sim.fish.indexOf(f)} 出现 NaN/Infinity (${f.x},${f.y},${f.vx},${f.vy})`);
      break;
    }
  }
  // 5. 硬兜底边界：不允许超出 hard+50 的位置
  for (const f of sim.fish) {
    if (f.x < -140 || f.x > sim.width + 140 || f.y < -140 || f.y > sim.height + 140) {
      fail(`${label}: 鱼 ${sim.fish.indexOf(f)} 逃逸过远 (${f.x.toFixed(0)},${f.y.toFixed(0)})`);
      break;
    }
  }
}

function report(name, ok, detail = '') {
  ok ? pass(`${name}${detail ? ' — ' + detail : ''}`) : fail(name);
}

// ========== 测试 1: 大鱼量长时间运行 ==========
console.log('\n[1] 压力: 300 条鱼 × 2000 步');
{
  const sim = new Simulation(1280, 800, { count: 300 });
  let merges = 0, splits = 0, lastSchools = sim.schools.length;
  for (let i = 0; i < 2000; i++) {
    sim.step(1);
    if (sim.schools.length > lastSchools) splits += sim.schools.length - lastSchools;
    if (sim.schools.length < lastSchools) merges += lastSchools - sim.schools.length;
    lastSchools = sim.schools.length;
    if (i % 400 === 399) invariants(sim, `step ${i + 1}`);
  }
  invariants(sim, 'final');
  report('300×2000 步不变量', failures === 0, `merges=${merges} splits=${splits} schools=${sim.schools.length}`);
}
failures = 0; checks++;

// ========== 测试 2: 快速随机参数抖动 ==========
console.log('\n[2] 压力: count 50↔300 随机抖动 × 500 次');
{
  const sim = new Simulation(1280, 800, { count: 160 });
  let badTransitions = 0;
  for (let i = 0; i < 500; i++) {
    const c = 50 + Math.floor(Math.random() * 251);
    sim.setParams({ count: c });
    if (sim.fish.length !== c) { badTransitions++; break; }
  }
  invariants(sim, 'after jitter');
  report('随机数量抖动守恒', badTransitions === 0 && failures === 0);
}
failures = 0; checks++;

// ========== 测试 3: 单调递减到极限再递增 ==========
console.log('\n[3] 压力: 300→50 单调递减 → 50→300 递增');
{
  const sim = new Simulation(1280, 800, { count: 300 });
  let ok = true;
  for (let c = 299; c >= 50; c--) {
    sim.setParams({ count: c });
    if (sim.fish.length !== c) { ok = false; fail(`递减到 ${c} 时主表=${sim.fish.length}`); break; }
  }
  for (let c = 51; c <= 300; c++) {
    sim.setParams({ count: c });
    if (sim.fish.length !== c) { ok = false; fail(`递增到 ${c} 时主表=${sim.fish.length}`); break; }
  }
  invariants(sim, 'ramp');
  report('单调增减精确守恒', ok && failures === 0);
}
failures = 0; checks++;

// ========== 测试 4: 极端窗口 resize ==========
console.log('\n[4] 压力: 极端窗口切换 3840×2160 ↔ 100×100 × 20 轮');
{
  const sim = new Simulation(800, 600, { count: 120 });
  for (let i = 0; i < 20; i++) {
    sim.resize(i % 2 ? 100 : 3840, i % 2 ? 100 : 2160);
    for (let k = 0; k < 30; k++) sim.step(1);
  }
  sim.resize(1280, 800);
  for (let k = 0; k < 60; k++) sim.step(1);
  invariants(sim, 'resize cycle');
  report('极端 resize 后收敛', failures === 0);
}
failures = 0; checks++;

// ========== 测试 5: 高强度鼠标交互 ==========
console.log('\n[5] 压力: 鼠标高速扫屏 + 按住聚拢 × 600 步');
{
  const sim = new Simulation(1280, 800, { count: 160 });
  for (let i = 0; i < 600; i++) {
    const t = i / 600;
    sim.mouse.x = t * 1280;
    sim.mouse.y = Math.sin(t * Math.PI * 8) * 400 + 400;
    sim.mouse.inside = true;
    sim.mouse.speed = 20;          // 远超恐慌阈值
    sim.mouse.speedX = 20; sim.mouse.speedY = 5;
    sim.mouse.down = i % 2 === 0;  // 半程按住
    if (i % 10 === 0) { sim.addFlow(sim.mouse.x, sim.mouse.y, 15, 3); sim.addRipple(sim.mouse.x, sim.mouse.y, .9); }
    sim.step(1);
  }
  sim.mouse.inside = false; sim.mouse.down = false;
  for (let k = 0; k < 120; k++) sim.step(1); // 冷却观察是否恢复
  invariants(sim, 'mouse storm');
  report('鼠标风暴不变量', failures === 0);
}
failures = 0; checks++;

// ========== 测试 6: 合并/分裂长期稳定性 ==========
console.log('\n[6] 压力: 10000 步合并/分裂动态平衡');
{
  const sim = new Simulation(1280, 800, { count: 200, mobile: false });
  for (let i = 0; i < 10000; i++) sim.step(1);
  invariants(sim, 'long run');
  report('10000 步长跑', failures === 0, `schools=${sim.schools.length}`);
}
failures = 0; checks++;

// ========== 测试 7: dt 抖动（模拟掉帧）==========
console.log('\n[7] 压力: dt 在 0.2~4 之间随机抖动 × 1500 步');
{
  const sim = new Simulation(1280, 800, { count: 160 });
  for (let i = 0; i < 1500; i++) {
    sim.step(.2 + Math.random() * 3.8);
  }
  invariants(sim, 'dt jitter');
  report('变步长稳定性', failures === 0);
}
failures = 0; checks++;

// ========== 测试 8: 移动端配置 ==========
console.log('\n[8] 压力: 移动端参数 70 条 × 2000 步');
{
  const sim = new Simulation(390, 844, { count: 70, mobile: true, maxFlow: 7, maxRipple: 3 });
  for (let i = 0; i < 2000; i++) sim.step(1);
  invariants(sim, 'mobile');
  report('移动端长跑', failures === 0);
}

// ========== 测试 9: 下限以下数量守恒（#removeFish 解散分支回归）==========
console.log('\n[9] 回归: 30→25→…→1 严格守恒（曾因整群解散过度删除而清零）');
{
  const sim = new Simulation(1280, 800, { count: 30 });
  let ok = true;
  for (const c of [25, 24, 20, 15, 10, 7, 5, 3, 1]) {
    sim.setParams({ count: c });
    if (sim.fish.length !== c) { ok = false; fail(`count=${c} 时主表=${sim.fish.length}`); break; }
  }
  invariants(sim, 'below-min');
  sim.setParams({ count: 160 });
  if (sim.fish.length !== 160) fail('恢复 160 失败: ' + sim.fish.length);
  report('下限以下守恒 + 恢复', ok && failures === 0);
}
failures = 0; checks++;

console.log('\n========================================');
console.log(failures === 0 ? '✅ 全部压力测试通过' : `❌ 共 ${failures} 处失败`);
process.exit(failures === 0 ? 0 : 1);
