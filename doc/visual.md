# Vortex Core 视觉方向

## 方向

“把一场恒星风暴封进实验室玻璃”。视觉主体始终是原作的黑金 FBM 涡旋和高色散玻璃球；交互只改变原 TSL uniform 与玻璃材质，不增加爆炸碎片、二维光斑、屏幕闪白或伪造粒子。

## 原版基线合同

- 源码锚点：`MisterPrada/vortex-glass-sphere@3587870c...`，MIT。
- 保留 513×513 TSL 实例粒子、原 FBM 五层噪声、粒子阈值、Rogaland HDR、PhysicalNodeMaterial、25° 相机和渐变背景。
- `?baseline=1` 必须显示原 Codrops 标题/链接、Tweakpane、TransformControls helper 和 OrbitControls，不加入产品状态机。
- 禁止以 Canvas 2D、视频、贴图序列或另一套 CPU/GPU 粒子系统代替原作。

## 界面系统

产品版只有三层：左上 `VORTEX CORE` 与 `STUDY 07 / TSL GLASS FIELD`；球心 68 px 的细线蓄能环；底部一个动词提示。文字使用系统等宽字体，冷白色，字距 0.14–0.18em，阴影只用于从星云中分离文字。不要卡片、按钮、手机设备框或大标题。

幽灵手指使用系列统一 Google Material `touch_app` 实心 SVG，44×44 触控区域。它在球心按下时蓄能环和原作涡旋必须同步收缩，松开时必须看到真实释放，不能只移动图标。

## 动效与状态

- idle：保持原作运动，提示“按住风暴”。
- charging：环由 0 绘制到 100%，涡旋逐步压暗、收紧；900 ms 时提示“松手点燃”。
- release：环在 180 ms 内扩到 1.9 倍并消失，原粒子阈值打开、速度和发光升至峰值。
- recover：1450 ms 内回到原版参数，不添加装饰性余波。

## 响应式与无障碍

在 390×844 与 320×568 下玻璃球保持居中且占短边约 96%；标题避开 44 px 顶部安全区，提示距底部至少 58 px。所有真实输入覆盖整屏。`prefers-reduced-motion` 下取消自动幽灵演示并把释放/恢复总时长压缩到 520 ms；界面始终保持可读。
