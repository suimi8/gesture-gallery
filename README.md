# 🖐️ 手势控制画廊 (Gesture Gallery)

一个基于 **MediaPipe 机器学习手势识别** 的沉浸式图片画廊应用，使用手势控制浏览、缩放和平移图片，无需触摸屏幕。



## ✨ 特性

- 🎯 **实时手势识别** - 使用 MediaPipe 深度学习模型进行精准的手部追踪
- 🌍 **双模式切换** - 支持 2D 平面画廊和 3D 地球模式
- 🤏 **直观的手势控制** - 右手控制光标，左手控制缩放和移动
- 📷 **自定义图片** - 支持加载本地图片文件夹
- 🚀 **离线运行** - WASM 模型本地运行，无需网络

## 🎮 手势操作指南

### 画廊模式（右手）

| 手势 | 操作 |
|------|------|
| ☝️ 伸出食指 | 移动光标 |
| 👆 食指左右移动 | 滑动浏览画廊 |
| 🤏 食指+拇指捏合 | 选择图片进入详情 |

### 详情模式

| 手 | 手势 | 操作 |
|----|------|------|
| 左手 | 👍 大拇指竖起 | 持续放大 |
| 左手 | ☝️ 食指竖起 | 持续缩小 |
| 左手 | ✋ 张开巴掌 | 移动图片（平移） |
| 右手 | ✋ 张开四指 | 退出详情模式 |

## 📦 安装与运行

### 环境要求

- Node.js 16+
- 现代浏览器（Chrome/Edge/Firefox 推荐）
- 摄像头

### 快速开始

```bash
# 克隆项目

### HTTPS
```bash
git clone https://github.com/suimi8/gesture-gallery.git
```

### SSH
```bash
git clone git@github.com:suimi8/gesture-gallery.git
```

### GitHub CLI
```bash
gh repo clone suimi8/gesture-gallery
```

# 进入项目目录
cd gesture-gallery

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

浏览器访问 `http://localhost:5173`，允许摄像头权限即可使用。

## 📷 添加自定义图片

### 方法一：使用 Pic 文件夹（推荐）

1. 将图片放入 `public/Pic/` 文件夹
2. 支持格式：`.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`, `.bmp`
3. 运行 `npm run dev` 时会**自动生成**图片清单

```
public/
└── Pic/
    ├── 1.jpg
    ├── 2.png
    ├── photo.webp
    └── ... (任意文件名)
```

### 方法二：手动编辑清单

1. 在 `public/Pic/` 目录创建 `pic.json` 文件
2. 写入图片文件名数组：

```json
["image1.jpg", "photo.png", "sunset.webp"]
```

### 注意事项

- ⚠️ 图片文件名**区分大小写**
- ⚠️ 如果 `Pic` 文件夹为空，将显示默认占位图
- ⚠️ 每次 `npm run dev` 会重新扫描并更新清单

## 🔧 项目结构

```
├── public/
│   ├── Pic/               # 自定义图片文件夹
│   ├── models/            # MediaPipe 手势模型
│   └── wasm/              # WebAssembly 运行时
├── scripts/
│   └── generate-pic-manifest.js  # 自动生成图片清单
├── src/
│   ├── main.js            # 主应用逻辑
│   ├── gesture-engine.js  # 手势识别引擎
│   ├── view-manager.js    # 视图管理器
│   └── renderers/         # 渲染器模块
│       ├── flat-renderer.js    # 2D 平面画廊
│       └── sphere-renderer.js  # 3D 地球模式
└── index.html             # 入口页面
```

## 🛠️ 构建生产版本

```bash
npm run build
```

构建产物位于 `dist/` 目录，可部署到任意静态服务器。

## 🖥️ 构建桌面应用

本项目支持打包为 Windows、Linux 和 macOS 桌面应用。

```bash
# 构建所有平台 (需相应环境支持)
npm run electron:build

# 仅构建 Windows
npm run electron:build -- --win

# 仅构建 Linux
npm run electron:build -- --linux

# 仅构建 macOS
npm run electron:build -- --mac
```

构建产物位于 `release/` 目录。

> **注意**: 在 Windows 上构建 macOS 应用可能有局限性，建议在对应平台上进行构建。

## ⚠️ 限制与已知问题

1. **光线要求** - 手势识别需要良好的光线条件
2. **单手追踪优先** - 右手用于光标控制，左手用于缩放/平移
3. **浏览器兼容性** - 需要支持 WebGL 和 WebAssembly
4. **摄像头权限** - 首次使用需授权摄像头访问

## 📄 技术栈

- **手势识别**: MediaPipe Tasks Vision
- **3D 渲染**: Three.js
- **构建工具**: Vite
- **语言**: JavaScript (ES Modules)

## 👤 作者

**suimi8 (碎米)**

- GitHub: [@suimi8](https://github.com/suimi8)

## 📝 许可证

本项目基于 MIT 许可证分发。详见 [LICENSE](LICENSE) 文件。
---

❤️ 基于 AI 智能手势识别技术打造
