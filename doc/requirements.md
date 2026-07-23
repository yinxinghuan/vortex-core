# Vortex Core 需求文档

## 1. Overview

Vortex Core 是一个 5–8 秒的 WebGPU 玻璃涡旋感官玩具：玩家可单指旋转观察原作玻璃球，或用双指在涡核上按住把星云压成暗核，松手后释放一次由同一组 TSL 参数产生的强光涡旋。

## 2. Visual Design

直接基于 `MisterPrada/vortex-glass-sphere@3587870c1d699ef8adcc73f1441800b45d71e3a5` 的 MIT 源码，保留 Three.js WebGPU、TSL FBM、263169 个实例粒子、玻璃球 PhysicalNodeMaterial、Rogaland 夜空 HDR、原相机与渐变背景。默认入口隐藏原作者导航和 Tweakpane，保留自由 OrbitControls，仅增加左上实验标题、首次可见的双指隐藏手势提示与蓄能环；`?baseline=1` 恢复原作的界面与调参面板。

## 3. Game Mechanics

- 产品入口首先处于静止的抽象暗场封面。用户主动点击封面之前，不导入 Three/WebGPU 体验包、不创建 GPU renderer、不编译 shader、不加载 HDR，也不启动任何动画循环。
- 点击后根据设备选择渲染档位：Low 使用 225×225 顶点（50625 个粒子）、DPR 1.0、30 FPS；Medium 使用 321×321 顶点（103041 个粒子）、DPR 上限 1.25、45 FPS；High 使用 385×385 顶点（148225 个粒子）、DPR 上限 1.5、60 FPS。密度降低时仅补偿粒子点尺寸，不改五层 TSL FBM、世界尺寸、材质或交互参数。
- `?baseline=1` 始终使用原版 513×513 顶点（263169 个实例）、DPR 上限 2.0、抗锯齿与显示器刷新率循环。
- 任意时刻最多允许一个异步 WebGPU render 在途；页面隐藏时暂停提交新帧。
- 原始参数为 `radius=1`、`speed=0.1`、`frequency=1.4`、`emissionMultiplier=0.4`。
- `charging`：按住时用 900 ms 将 `radius` 推至 1.82、`speed` 降至 0.025、`frequency` 推至 1.54、`emissionMultiplier` 降至 0.14；球体色散从 5 增至 5.5，全部变化直接作用于原节点材质。
- `release`：松手后 180 ms 内将 `radius` 拉至 0.94、`speed` 推至 0.38、`frequency` 降至 1.36、`emissionMultiplier` 推至 0.58，形成一次无遮罩、无附加碎片的原生涡旋闪耀。
- `recover`：随后 1450 ms 回到原始参数；恢复完毕再次进入 idle，可无限重玩。
- 按住不足 180 ms 仍触发较弱释放；按满 900 ms 达到完整释放。
- 双指触点必须同时落在屏幕中心短边 32% 半径内才进入蓄能；第一次有效双指按下后隐藏手势文字，蓄能、释放和恢复不再用底部文字逐步播报。

## 4. Controls

- 单指/鼠标左键拖动：保留原 OrbitControls 旋转相机，无文字教学。
- 双指：两个触点都从涡核中心区域开始时蓄能，任一手指松开即释放；中心区域外保留 OrbitControls 的双指缩放。
- Keyboard：按住 `Space` 在球心蓄能，松开释放。

## 5. Win / Lose Conditions

没有失败、分数或教学弹窗。一次完整闭环为 `idle → charging → release → recover → idle`；进度由球心细环和涡旋本体的实时变化表达，不用状态文字解释。

## 6. Sound Effects

真实按下播放 58→46 Hz 正弦 120 ms；蓄满播放 196 Hz 三角 80 ms；释放播放 74→620 Hz 正弦 420 ms并叠加 42 Hz 正弦 260 ms；恢复静音。AudioContext 只由真实用户手势解锁，幽灵演示完全静音。
