# Vortex Core 技术文档

## 1. 技术栈

- Vite 5 工程，构建根目录为 `src/`，输出 `dist/`，`base: './'`。
- 原作 Three.js 0.173 WebGPURenderer + TSL 节点材质；WebGPU 不可用时由 Three.js WebGPU renderer 使用兼容路径。
- GSAP 保留原作加载/时间线基础设施；产品交互使用原生 Pointer Events、requestAnimationFrame 与 Web Audio API。
- 默认入口是约 3.3 KB 的启动壳，Three/WebGPU Experience 与产品交互均通过动态 `import()` 在明确点击后下载和初始化。
- 静态资源包括 Rogaland Clear Night 1K HDR、原背景/位移纹理及 Three.js 解码器，全部使用 `./` 相对路径。

## 2. 目录结构

- `src/Experience/Utils/PerformanceProfile.js`：按设备能力选择 Low / Medium / High，并提供 `?quality=` 固定档位与 `?baseline=1` 原版档。
- `src/Experience/Worlds/MainWorld/Galaxy.js`：原作五层 FBM TSL 涡旋、按档位生成的粒子实例与可控 uniforms；baseline 固定 513×513。
- `src/Experience/Worlds/MainWorld/Sphere.js`：原作玻璃球 `MeshPhysicalNodeMaterial`。
- `src/Experience/Worlds/MainWorld/Camera.js`：25° 相机与基线 OrbitControls。
- `src/Experience/Worlds/MainWorld/Environment.js`：HDR 反射与灰蓝渐变背景。
- `src/product-ui.js`：产品状态机、双指主体区命中、手势归属、参数插值、双语隐藏手势提示和程序化音频。
- `src/script.js`：休眠启动门、点击后的并行动态导入、轻量资源就绪退场合同；baseline 才导入原作 preloader。
- `src/preloader.js`：仅供 `?baseline=1` 使用的上游三角预加载动画。
- `index.html`、`src/style.css`：Codrops 原界面、零图片请求的抽象暗场封面、产品极简 HUD 与响应式规则。
- `static/`：原作 HDR、纹理和解码器；`_qa/ui/`：390×844 与 320×568 真实运行截图。

## 3. 核心模块

默认入口只解析启动壳、HTML 与 CSS；此时 `window.experience`、renderer、HDR 请求和 RAF 均不存在。点击封面后才并行加载 `Experience` 与 `product-ui`，产品资源表只加载实际使用的 HDR；baseline 仍加载上游三张纹理。

`Experience` 在资源加载完成后创建 `Worlds`，并通过 `WebGPURenderer.setAnimationLoop()` 驱动原场景。主循环用 `renderInFlight` 保证最多一个 `renderAsync()` 在途，按档位限制提交间隔，文档隐藏时停止提交。`Galaxy.swirlTexture()` 以 TSL 计算时间偏移、对数旋转和五层 3D FBM，再把同一结果用于实例位置、颜色和 alpha 阈值；没有新增粒子系统。Low / Medium / High 分别使用 50625 / 103041 / 148225 个粒子，baseline 使用 263169 个。

产品入口由 `product-ui.js` 管理 `idle → charging/full → release → recover → idle`。OrbitControls 始终开启，单指/鼠标保持旋转；仅当两个触点都从涡核主体区开始时，捕获阶段才临时接管双指，所有触点结束后恢复原 `touches.TWO`。它只写入原 uniform 与玻璃 `dispersion`，不自动演示；首次有效双指后提示淡出。

语言优先读取 `localStorage.game_locale`，否则按浏览器语言选择 zh/en。`?baseline=1` 在 `Debug` 创建前决定模式：恢复原 Tweakpane、作者导航、TransformControls helper 和 OrbitControls；默认产品入口关闭这些调试元素。

产品点击后由 `script.js` 提供轻量 `window.preloader.hidePreloader()` 合同：资源完成后将抽象暗场淡出并显示真实场景，不启动 Canvas loader。`?baseline=1` 才导入 `preloader.js` 并走原作绘制分支。

## 4. 扩展点

- 调蓄能/释放手感：修改 `src/product-ui.js` 的 `chargeTarget`、`releaseTarget` 与 900/180/1450 ms 时长。
- 调设备分档、粒子数量、DPR 或帧率：修改 `src/Experience/Utils/PerformanceProfile.js`；调原始涡旋公式则修改 `Galaxy.js`，不要另建近似 shader。
- 调玻璃、环境或相机：分别修改 `Sphere.js`、`Environment.js`、`Camera.js`。
- 调休眠暗场、标题、提示或蓄能环：修改 `index.html` 与 `src/style.css`。
- 加平台存档、统计或分享：在 `product-ui.js` 的 `release()` 完成事件接入共享 runtime，保持渲染主循环不等待网络。
