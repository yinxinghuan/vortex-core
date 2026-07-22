# Vortex Core 技术文档

## 1. 技术栈

- Vite 5 工程，构建根目录为 `src/`，输出 `dist/`，`base: './'`。
- 原作 Three.js 0.173 WebGPURenderer + TSL 节点材质；WebGPU 不可用时由 Three.js WebGPU renderer 使用兼容路径。
- GSAP 保留原作加载/时间线基础设施；产品交互使用原生 Pointer Events、requestAnimationFrame 与 Web Audio API。
- 静态资源包括 Rogaland Clear Night 1K HDR、原背景/位移纹理及 Three.js 解码器，全部使用 `./` 相对路径。

## 2. 目录结构

- `src/Experience/Worlds/MainWorld/Galaxy.js`：原作五层 FBM TSL 涡旋、513×513 粒子实例与可控 uniforms。
- `src/Experience/Worlds/MainWorld/Sphere.js`：原作玻璃球 `MeshPhysicalNodeMaterial`。
- `src/Experience/Worlds/MainWorld/Camera.js`：25° 相机与基线 OrbitControls。
- `src/Experience/Worlds/MainWorld/Environment.js`：HDR 反射与灰蓝渐变背景。
- `src/product-ui.js`：产品状态机、真实/幽灵输入、参数插值、双语提示和程序化音频。
- `index.html`、`src/style.css`：Codrops 原界面、产品极简 HUD、Material 幽灵手指与响应式规则。
- `static/`：原作 HDR、纹理和解码器；`_qa/ui/`：390×844 与 320×568 真实运行截图。

## 3. 核心模块

`Experience` 在资源加载完成后创建 `Worlds`，并通过 `WebGPURenderer.setAnimationLoop()` 驱动原场景。`Galaxy.swirlTexture()` 以 TSL 计算时间偏移、对数旋转和五层 3D FBM，再把同一结果用于实例位置、颜色和 alpha 阈值；没有新增粒子系统。

产品入口由 `product-ui.js` 管理 `idle → charging/full → release → recover → idle`。它只写入原 `radius/speed/frequency/emissionMultiplier` uniform 与玻璃 `dispersion` 属性。900 ms 蓄能、180 ms 释放和 1450 ms 恢复都在 rAF 中插值；幽灵手指调用同一 `begin()/release()`，因此引导画面与真实效果不会脱节。真实 Pointer/Space 手势才创建 AudioContext，自动演示静音。

语言优先读取 `localStorage.game_locale`，否则按浏览器语言选择 zh/en。`?baseline=1` 在 `Debug` 创建前决定模式：恢复原 Tweakpane、作者导航、TransformControls helper 和 OrbitControls；默认产品入口关闭这些调试元素。

## 4. 扩展点

- 调蓄能/释放手感：修改 `src/product-ui.js` 的 `chargeTarget`、`releaseTarget` 与 900/180/1450 ms 时长。
- 调原始涡旋公式或粒子数量：修改 `src/Experience/Worlds/MainWorld/Galaxy.js`，不要另建近似 shader。
- 调玻璃、环境或相机：分别修改 `Sphere.js`、`Environment.js`、`Camera.js`。
- 调标题、提示、蓄能环或幽灵手指：修改 `index.html` 与 `src/style.css`。
- 加平台存档、统计或分享：在 `product-ui.js` 的 `release()` 完成事件接入共享 runtime，保持渲染主循环不等待网络。
