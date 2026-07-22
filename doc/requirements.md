# Vortex Core 需求文档

## 1. Overview

Vortex Core 是一个 5–8 秒的 WebGPU 玻璃涡旋感官玩具：玩家按住球体把原作的程序化星云压成暗核，松手后释放一次由同一组 TSL 参数产生的强光涡旋，随后自然回到可重复的初始状态。

## 2. Visual Design

直接基于 `MisterPrada/vortex-glass-sphere@3587870c1d699ef8adcc73f1441800b45d71e3a5` 的 MIT 源码，保留 Three.js WebGPU、TSL FBM、263169 个实例粒子、玻璃球 PhysicalNodeMaterial、Rogaland 夜空 HDR、原相机与渐变背景。默认入口隐藏原作者导航和 Tweakpane，仅增加左上实验标题、底部单句动作提示、蓄能环和 Google Material `touch_app` 幽灵手指；`?baseline=1` 恢复原作的界面、自由 OrbitControls 与调参面板。

## 3. Game Mechanics

- 初始粒子平面为 513×513 顶点，共 263169 个实例；原始 `radius=1`、`speed=0.1`、`frequency=1.4`、`emissionMultiplier=0.4`。
- `charging`：按住时用 900 ms 将 `radius` 推至 1.82、`speed` 降至 0.025、`frequency` 推至 1.54、`emissionMultiplier` 降至 0.14；球体色散从 5 增至 5.5，全部变化直接作用于原节点材质。
- `release`：松手后 180 ms 内将 `radius` 拉至 0.94、`speed` 推至 0.38、`frequency` 降至 1.36、`emissionMultiplier` 推至 0.58，形成一次无遮罩、无附加碎片的原生涡旋闪耀。
- `recover`：随后 1450 ms 回到原始参数；恢复完毕再次进入 idle，可无限重玩。
- 按住不足 180 ms 仍触发较弱释放；按满 900 ms 达到完整释放。
- 就绪 1.4 秒且用户未操作时，幽灵手指在球体中心按住 900 ms 并松开，真实驱动同一个状态机；首次真实输入立即取消演示。

## 4. Controls

Pointer/Touch 在任意空白区域按住蓄能、松手释放；Space 键提供同样的按住/松开替代操作。产品模式锁定相机，避免拖动画面与按压手势冲突；基线模式保留原 OrbitControls。

## 5. Win / Lose Conditions

没有失败、分数或教学弹窗。一次完整闭环为 `idle → charging → release → recover → idle`；按满后提示“松手点燃”，释放峰值显示“风暴已点亮”，恢复后自动允许下一次操作。

## 6. Sound Effects

真实按下播放 58→46 Hz 正弦 120 ms；蓄满播放 196 Hz 三角 80 ms；释放播放 74→620 Hz 正弦 420 ms并叠加 42 Hz 正弦 260 ms；恢复静音。AudioContext 只由真实用户手势解锁，幽灵演示完全静音。
