import { GestureEngine } from './gesture-engine.js';
import { ViewManager } from './view-manager.js';

const app = {
    state: 'GALLERY', // GALLERY | DETAIL
    gestureEngine: new GestureEngine(),
    viewManager: null,

    // UI Elements
    galleryTrack: document.getElementById('gallery-track'),
    cursor: document.getElementById('cursor'),
    cursorRing: document.querySelector('.cursor-ring'),
    loader: document.getElementById('loader'),
    statusBar: document.getElementById('status-bar'),

    // Logic State
    lerpedCursor: { x: 0.5, y: 0.5 },
    wasStrictPointing: false,

    // Detail View State (Global Overlay)
    detailImage: null,
    zoomLevel: 1,
    startZoomLevel: 1,
    initialPinchDist: 0,

    // Pan State (left hand open palm)
    panOffset: { x: 0, y: 0 },
    lastPalmPos: null,
    wasPanning: false,

    // Image loading - check Pic folder first using a manifest
    async loadImages() {
        const galleryTrack = document.getElementById('gallery-track');

        try {
            // Try to load pic.json manifest which lists images in Pic folder
            const response = await fetch('/Pic/pic.json');
            if (response.ok) {
                const images = await response.json();
                if (images && images.length > 0) {
                    galleryTrack.innerHTML = images.map((filename, idx) =>
                        `<div class="gallery-item"><img src="/Pic/${filename}" alt="Image ${idx + 1}"></div>`
                    ).join('');
                    return;
                }
            }
        } catch (e) {
            // No manifest or error - use default images
        }
        // Keep existing HTML placeholder images
    },

    async init() {
        // Global Error Handler for Mobile/No-Console
        window.onerror = (msg, url, lineNo, columnNo, error) => {
            this.alertError(`Script Error: ${msg}`);
            return false;
        };

        try {
            // Load images from Pic folder (or keep placeholders)
            await this.loadImages();

            this.viewManager = new ViewManager(this);
            this.viewManager.init();

            window.addEventListener('resize', () => {
                if (this.viewManager) this.viewManager.onResize();
            });

            // Mode Switcher UI
            this.createUI();

            // Initialize Gesture Engine
            await this.gestureEngine.initialize();
            this.loader.classList.add('hidden');
            this.statusBar.innerText = "系统就绪 - 请伸出食指控制";

            this.gestureEngine.start((data) => this.loop(data));
        } catch (e) {
            console.error(e);
            this.alertError(`Startup Failed: ${e.message}`);
        }
    },

    createUI() {
        // Mode Switch Button
        const btn = document.createElement('button');
        btn.innerText = "切换 3D 地球模式";
        btn.style.cssText = "position:fixed; top:20px; right:20px; z-index:1000; padding:10px 20px; background:#646cff; color:white; border:none; border-radius:8px; cursor:pointer; font-family: 'Inter', sans-serif;";
        btn.onclick = () => {
            const next = this.viewManager.currentMode === 'FLAT' ? 'SPHERE' : 'FLAT';
            this.viewManager.switchMode(next);
            btn.innerText = next === 'FLAT' ? "切换 3D 地球模式" : "切换平面模式";
        };
        document.body.appendChild(btn);

        // Help Button
        const helpBtn = document.createElement('button');
        helpBtn.innerText = "❓ 使用说明";
        helpBtn.style.cssText = "position:fixed; top:20px; right:200px; z-index:1000; padding:10px 20px; background:#333; color:white; border:none; border-radius:8px; cursor:pointer; font-family: 'Inter', sans-serif;";
        helpBtn.onclick = () => this.toggleHelp();
        document.body.appendChild(helpBtn);

        // Create Help Overlay
        this.createHelpOverlay();
    },

    createHelpOverlay() {
        const overlay = document.createElement('div');
        overlay.id = 'help-overlay';
        overlay.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
            background: rgba(0,0,0,0.9); z-index: 2000;
            display: flex; justify-content: center; align-items: center;
            opacity: 1; transition: opacity 0.3s;
        `;

        overlay.innerHTML = `
            <div style="max-width: 600px; padding: 40px; background: #1a1a2e; border-radius: 20px; color: white; font-family: 'Inter', sans-serif; box-shadow: 0 0 40px rgba(100,108,255,0.3);">
                <h1 style="text-align: center; color: #646cff; margin-bottom: 30px;">🖐️ 手势控制指南</h1>
                
                <div style="margin-bottom: 25px;">
                    <h3 style="color: #646cff;">👆 移动光标</h3>
                    <p style="color: #aaa; line-height: 1.6;">伸出<strong style="color:white;">右手食指</strong>，将光标移动到目标位置</p>
                </div>
                
                <div style="margin-bottom: 25px;">
                    <h3 style="color: #646cff;">✌️ 浏览画廊</h3>
                    <p style="color: #aaa; line-height: 1.6;">保持食指伸出，左右移动进行<strong style="color:white;">拖动滑动</strong></p>
                </div>
                
                <div style="margin-bottom: 25px;">
                    <h3 style="color: #646cff;">🤏 选择图片</h3>
                    <p style="color: #aaa; line-height: 1.6;">将光标移到图片上，然后<strong style="color:white;">捏合拇指和食指</strong>进入详情</p>
                </div>
                
                <div style="margin-bottom: 25px;">
                    <h3 style="color: #646cff;">🔍 缩放图片 (左手控制)</h3>
                    <p style="color: #aaa; line-height: 1.6;">详情模式下，<strong style="color:white;">左手👍放大</strong>，<strong style="color:white;">左手☝️缩小</strong>，持续生效</p>
                </div>
                
                <div style="margin-bottom: 30px;">
                    <h3 style="color: #646cff;">✋ 关闭详情</h3>
                    <p style="color: #aaa; line-height: 1.6;">在详情模式下，<strong style="color:white;">右手张开手掌</strong>退出</p>
                </div>
                
                <button id="help-close-btn" style="
                    width: 100%; padding: 15px; 
                    background: linear-gradient(135deg, #646cff, #747bff);
                    color: white; border: none; border-radius: 10px;
                    font-size: 16px; cursor: pointer;
                    font-family: 'Inter', sans-serif;
                ">开始使用 →</button>
            </div>
        `;

        document.body.appendChild(overlay);

        document.getElementById('help-close-btn').onclick = () => this.toggleHelp();
    },

    toggleHelp() {
        const overlay = document.getElementById('help-overlay');
        if (overlay) {
            if (overlay.style.display === 'none') {
                overlay.style.display = 'flex';
            } else {
                overlay.style.display = 'none';
            }
        }
    },

    loop(data) {
        if (!data) {
            this.cursor.style.opacity = '0';
            this.initialPinchDist = 0;
            return;
        }

        if (data.error === 'WRONG_HAND') {
            this.statusBar.innerText = "⚠️ 请使用右手控制";
            this.statusBar.style.color = 'orange';
            this.cursor.style.opacity = '0';
            return;
        } else {
            // Update Status Text
            if (this.state === 'GALLERY') {
                if (this.viewManager && this.viewManager.currentMode === 'SPHERE') {
                    this.statusBar.innerText = "地球模式：单指旋转，悬停查看";
                } else {
                    this.statusBar.innerText = "画廊模式：使用右手食指滑动";
                }
            } else {
                this.statusBar.innerText = "详情模式：双指缩放，握拳关闭";
            }
            this.statusBar.style.color = '#aaa';
        }

        let screenX, screenY;

        // Allow cursor control for both strict pointing and pinch-ready gestures
        const canControl = data.canControlCursor || data.isStrictPointing;

        if (canControl) {
            this.cursor.style.opacity = '1';
            this.cursorRing.style.borderColor = '#646cff';

            // Snap cursor on re-entry
            if (!this.wasControlling) {
                this.lerpedCursor.x = data.cursor.x;
                this.lerpedCursor.y = data.cursor.y;
            }

            // Update Cursor (Smooth LERP)
            const smoothing = 0.2;
            this.lerpedCursor.x += (data.cursor.x - this.lerpedCursor.x) * smoothing;
            this.lerpedCursor.y += (data.cursor.y - this.lerpedCursor.y) * smoothing;

            screenX = this.lerpedCursor.x * window.innerWidth;
            screenY = this.lerpedCursor.y * window.innerHeight;

            this.cursor.style.left = `${screenX}px`;
            this.cursor.style.top = `${screenY}px`;

            // Delegate to View Manager
            if (this.state === 'GALLERY') {
                this.viewManager.onGesture(data, screenX, screenY);
            }
        } else {
            // Not in control mode
            if (this.state === 'GALLERY') {
                this.viewManager.onGesture(data, screenX, screenY);
            }

            this.cursor.style.opacity = '0.3';
            this.cursorRing.style.borderColor = 'red';
            this.updateCursorProgress(0);
        }

        this.wasControlling = canControl;

        // Detail State (Global)
        if (this.state === 'DETAIL') {
            this.handleDetailState(data);
        }
    },

    handleDetailState(data) {
        // Zoom Logic - Left Hand Control
        // Left thumb up = continuous zoom in
        // Left index up = continuous zoom out
        const MIN_ZOOM = 0.3;
        const MAX_ZOOM = 5;
        const ZOOM_SPEED = 0.03; // Zoom rate per frame

        if (data.leftThumbUp) {
            // Zoom In
            this.zoomLevel = Math.min(MAX_ZOOM, this.zoomLevel + ZOOM_SPEED);
            this.setZoom(this.zoomLevel);
            this.statusBar.innerText = "🔍 放大中...";
            this.wasPanning = false;
        } else if (data.leftIndexUp) {
            // Zoom Out
            this.zoomLevel = Math.max(MIN_ZOOM, this.zoomLevel - ZOOM_SPEED);
            this.setZoom(this.zoomLevel);
            this.statusBar.innerText = "🔍 缩小中...";
            this.wasPanning = false;
        } else if (data.leftOpenPalm && data.leftPalmCenter) {
            // Pan with left open palm
            const palmX = data.leftPalmCenter.x * window.innerWidth;
            const palmY = data.leftPalmCenter.y * window.innerHeight;

            if (!this.wasPanning) {
                // First frame of panning - snap to current position
                this.lastPalmPos = { x: palmX, y: palmY };
                this.wasPanning = true;
            } else {
                // Ongoing panning - calculate delta
                const dx = palmX - this.lastPalmPos.x;
                const dy = palmY - this.lastPalmPos.y;

                this.panOffset.x += dx;
                this.panOffset.y += dy;

                this.lastPalmPos = { x: palmX, y: palmY };
                this.setZoom(this.zoomLevel);
            }
            this.statusBar.innerText = "✋ 移动中...";
        } else {
            // No gesture - reset panning state
            this.wasPanning = false;
            if (this.state === 'DETAIL') {
                this.statusBar.innerText = "详情模式：左手👍放大 ☝️缩小 ✋移动，右手✋退出";
            }
        }

        // Exit Gesture: Open Palm on RIGHT hand only
        if (data.rightHandDetected && data.isOpenPalm) {
            this.exitDetailView();
        }
    },

    enterDetailView(card) {
        this.state = 'DETAIL';
        // this.hoverTarget = null; // handled by renderer reset
        this.updateCursorProgress(0);

        // Clone image to overlay
        const imgMsg = card.querySelector('img').src;

        // create overlay
        const overlay = document.createElement('div');
        overlay.id = 'detail-view';
        overlay.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
      background: rgba(0,0,0,0.95); z-index: 500;
      display: flex; justify-content: center; align-items: center;
      opacity: 0; transition: opacity 0.5s;
    `;

        const img = document.createElement('img');
        img.src = imgMsg;
        img.style.cssText = `
      max-width: 90%; max-height: 90%;
      transition: transform 0.1s;
      transform-origin: center;
    `;

        overlay.appendChild(img);
        document.body.appendChild(overlay);

        // Trigger fade in
        requestAnimationFrame(() => overlay.style.opacity = '1');

        this.detailImage = img;
        this.zoomLevel = 1;
        this.statusBar.innerText = "详情模式：双指缩放，握拳关闭";
    },

    exitDetailView() {
        const overlay = document.getElementById('detail-view');
        if (overlay) {
            overlay.style.opacity = '0';
            setTimeout(() => overlay.remove(), 500);
        }
        this.state = 'GALLERY';
        this.detailImage = null;
        this.panOffset = { x: 0, y: 0 };
        this.wasPanning = false;
        this.zoomLevel = 1;
        this.statusBar.innerText = "画廊模式：食指滑动，悬停选择";
    },

    setZoom(scale) {
        if (this.detailImage) {
            this.detailImage.style.transform = `translate(${this.panOffset.x}px, ${this.panOffset.y}px) scale(${scale})`;
        }
    },

    updateCursorProgress(progress) {
        if (progress > 0) {
            this.cursorRing.style.backgroundColor = `rgba(100, 108, 255, ${progress * 0.5})`;
            this.cursorRing.style.transform = `scale(${1 + progress * 0.5})`;
        } else {
            this.cursorRing.style.backgroundColor = 'transparent';
            this.cursorRing.style.transform = 'scale(1)';
        }
    },

    alertError(msg) {
        this.statusBar.style.color = 'red';
        this.statusBar.innerText = msg;
    }
};

app.init();
