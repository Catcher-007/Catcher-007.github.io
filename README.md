<div align="center">

# AQUA · 灵动鱼群

**Boids 群体智能 · Spatial Grid · Canvas 2D · 实时渲染**

一个纯前端、零依赖的实时鱼群仿真交互应用，部署于 GitHub Pages。

[**在线体验**](https://catcher-007.github.io/)

[![JavaScript](https://img.shields.io/badge/JavaScript-ES%20Modules-f7df1e?style=flat-square)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Canvas 2D](https://img.shields.io/badge/Canvas%202D-Real--time-65e8ff?style=flat-square)](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)
[![Dependencies](https://img.shields.io/badge/Dependencies-Zero-4caf50?style=flat-square)](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)
[![Hosted](https://img.shields.io/badge/Hosted-GitHub%20Pages-4078c0?style=flat-square)](https://pages.github.com/)

</div>

---

## 特性

- **群体智能** — Boids 分离 / 对齐 / 聚合三大规则驱动鱼群游动，首领鱼引导编队
- **多鱼群动态** — 鱼群随机分组，相遇时合并、大群随机分裂，首领随之升降级
- **实时交互** — 移动指针产生水流、快速划过激起漩涡、按住聚拢鱼群、点击泛起涟漪
- **氛围渲染** — 深海洋背景光晕、环境小气泡、鱼群吐泡、半透明尾迹
- **音效反馈** — WebAudio 全合成水声：点击、鱼群合并、重置与滑杆调节均有响应
- **自适应性能** — 空间网格加速邻近查询，移动端自动降帧与渲染降级
- **响应式界面** — 桌面悬浮面板与移动端触控面板，实时调节参数

## 交互操作

| 操作 | 效果 |
| :--- | :--- |
| 移动指针 / 触摸拖动 | 产生水流 |
| 快速划过 | 激起流体漩涡 |
| 按住左键 / 长按 | 聚拢鱼群 |
| 点击 / 轻点 | 泛起涟漪 |
| 调节滑杆 | 鱼群数量 / 游速 / 聚拢力度 |

## 技术亮点

> **固定时间步解耦** — 渲染与仿真分离，`simAccumulator` 累计帧时间，`simHz` 动态调节仿真频率，保证运动稳定。

> **空间哈希加速** — `SpatialGrid` 以网格化邻居查询将 Boids 从 O(n²) 降为近线性，支持 160 条鱼实时计算。

> **首领状态机** — `LeaderFish` 在 CRUISE / TURN / EXPLORE 状态间切换，通过环带权重让鱼群平滑跟随。

> **交互物理反馈** — 鼠标速度向量驱动流体场与涟漪，恐慌值（panic）提供"散开—再聚拢"的自然过渡。

> **多鱼群机制** — 鱼群按设备上限随机分组，跨群接触触发合并（含冷却防抖），大群随机分裂并克隆新首领，合并首领自动降级。

> **程序化音效** — 噪声缓冲与振荡器实时合成水声、气泡声，无需任何音频资源文件，浏览器手势解锁后生效。

## 本地运行

纯静态站点，任选一种方式：

```bash
# npm（推荐，等价于 python3 方式）
npm start

# Python
python3 -m http.server 8000 --bind 0.0.0.0

# Node
npx serve -l 8000
```

打开浏览器访问 `http://localhost:8000`。

## 目录结构

```text
index.html                页面入口（桌面 / 移动端控制面板）
css/main.css              深色海洋主题样式
js/
  main.js                 渲染循环、交互事件、自适应降级
  config.js               全局配置与移动端参数
  audio/AudioFX.js        WebAudio 合成音效（水声 / 气泡 / 合并声）
  rendering/Renderer.js   Canvas 绘制（尾迹批量、气泡、涟漪）
  simulation/
    Fish.js               单条鱼的运动物理与绘制
    LeaderFish.js         首领鱼状态机
    School.js             鱼群编队管理
    Boids.js              群体智能算法
    SpatialGrid.js        空间网格加速
    Bubbles.js            鱼群吐泡粒子
    BackgroundBubbles.js  背景漂浮气泡
    Simulation.js         仿真主类与鼠标交互
```

---

<div align="center">

由 AQUA 项目团队维护 · 灵感源自 [Boids](https://en.wikipedia.org/wiki/Boids)（Craig Reynolds）

</div>
