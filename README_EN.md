# 🖐️ Gesture Gallery

An immersive image gallery application powered by **MediaPipe machine learning gesture recognition**. Browse, zoom, and pan images using hand gestures without touching the screen.



## ✨ Features

- 🎯 **Real-time Gesture Recognition** - Precise hand tracking using MediaPipe deep learning models
- 🌍 **Dual View Modes** - Switch between 2D flat gallery and 3D Earth mode
- 🤏 **Intuitive Gesture Control** - Right hand for cursor, left hand for zoom/pan
- 📷 **Custom Images** - Load your own image collection
- 🚀 **Offline Operation** - WASM models run locally, no internet required

## 🎮 Gesture Control Guide

### Gallery Mode (Right Hand)

| Gesture | Action |
|---------|--------|
| ☝️ Point Index Finger | Move cursor |
| 👆 Swipe Left/Right | Scroll gallery |
| 🤏 Pinch Index + Thumb | Select image, enter detail view |

### Detail Mode

| Hand | Gesture | Action |
|------|---------|--------|
| Left | 👍 Thumb Up | Continuous zoom in |
| Left | ☝️ Index Up | Continuous zoom out |
| Left | ✋ Open Palm | Pan/move image |
| Right | ✋ Open Four Fingers | Exit detail view |

## 📦 Installation

### Requirements

- Node.js 16+
- Modern browser (Chrome/Edge/Firefox recommended)
- Webcam

### Quick Start

```bash
# Clone the repository

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

# Enter project directory
cd gesture-gallery

# Install dependencies
npm install

# Start development server
npm run dev
```

Open `http://localhost:5173` in your browser and grant camera permission.

## 📷 Adding Custom Images

### Method 1: Use Pic Folder (Recommended)

1. Place images in the `public/Pic/` folder
2. Supported formats: `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`, `.bmp`
3. Image manifest is **auto-generated** when running `npm run dev`

```
public/
└── Pic/
    ├── 1.jpg
    ├── 2.png
    ├── photo.webp
    └── ... (any filename)
```

### Method 2: Manual Manifest

1. Create `pic.json` in `public/Pic/` directory
2. Write an array of image filenames:

```json
["image1.jpg", "photo.png", "sunset.webp"]
```

### Important Notes

- ⚠️ Filenames are **case-sensitive**
- ⚠️ Empty `Pic` folder shows placeholder images
- ⚠️ Manifest regenerates on each `npm run dev`

## 🔧 Project Structure

```
├── public/
│   ├── Pic/               # Custom images folder
│   ├── models/            # MediaPipe gesture models
│   └── wasm/              # WebAssembly runtime
├── scripts/
│   └── generate-pic-manifest.js  # Auto-generate image manifest
├── src/
│   ├── main.js            # Main application logic
│   ├── gesture-engine.js  # Gesture recognition engine
│   ├── view-manager.js    # View manager
│   └── renderers/         # Renderer modules
│       ├── flat-renderer.js    # 2D flat gallery
│       └── sphere-renderer.js  # 3D Earth mode
└── index.html             # Entry page
```

## 🛠️ Production Build

```bash
npm run build
```

Built files are in the `dist/` directory, deployable to any static server.

## ⚠️ Limitations & Known Issues

1. **Lighting Requirements** - Good lighting improves gesture recognition
2. **Hand Priority** - Right hand controls cursor, left hand controls zoom/pan
3. **Browser Compatibility** - Requires WebGL and WebAssembly support
4. **Camera Permission** - Camera access must be granted on first use

## 📄 Tech Stack

- **Gesture Recognition**: MediaPipe Tasks Vision
- **3D Rendering**: Three.js
- **Build Tool**: Vite
- **Language**: JavaScript (ES Modules)

## 👤 Author

**suimi8 (碎米)**

- GitHub: [@suimi8](https://github.com/suimi8)

## 📝 License

Distributed under the MIT License. See [LICENSE](LICENSE) for more information.
---

Made with ❤️ using AI-powered gesture recognition
