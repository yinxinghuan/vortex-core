# Vortex Core 需求文档

## 1. Overview

Vortex Core 是一个 5–8 秒的 WebGPU 玻璃涡旋感官玩具：玩家可单指旋转观察原作玻璃球，或用双指在涡核上按住把星云压成暗核，松手后释放一次由同一组 TSL 参数产生的强光涡旋。

## 2. Visual Design

直接基于 `MisterPrada/vortex-glass-sphere@3587870c1d699ef8adcc73f1441800b45d71e3a5` 的 MIT 源码，保留 Three.js WebGPU、TSL FBM、263169 个实例粒子、玻璃球 PhysicalNodeMaterial、Rogaland 夜空 HDR、原相机与渐变背景。默认入口隐藏原作者导航和 Tweakpane，保留自由 OrbitControls，仅增加左上实验标题、首次可见的双指隐藏手势提示与蓄能环；`?baseline=1` 恢复原作的界面与调参面板。

## 3. Game Mechanics

- 初始粒子平面为 513×513 顶点，共 263169 个实例；原始 `radius=1`、`speed=0.1`、`frequency=1.4`、`emissionMultiplier=0.4`。
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
