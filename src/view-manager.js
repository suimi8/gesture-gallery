import { FlatRenderer } from './renderers/flat-renderer.js';
import { SphereRenderer } from './renderers/sphere-renderer.js';

export class ViewManager {
    constructor(app) {
        this.app = app;
        this.renderers = {
            'FLAT': new FlatRenderer(this),
            'SPHERE': new SphereRenderer(this)
        };
        this.currentMode = 'FLAT';
        this.activeRenderer = this.renderers['FLAT'];
    }

    init() {
        this.activeRenderer.mount();
    }

    switchMode(mode) {
        if (this.currentMode === mode || !this.renderers[mode]) return;

        this.activeRenderer.unmount();
        this.currentMode = mode;
        this.activeRenderer = this.renderers[mode];
        this.activeRenderer.mount();

        console.log(`Switched to ${mode} mode`);
    }

    onResize() {
        this.activeRenderer.updateLayout();
    }

    onGesture(data, screenX, screenY) {
        // Delegate gesture handling to the active renderer
        if (this.activeRenderer && this.activeRenderer.onGesture) {
            this.activeRenderer.onGesture(data, screenX, screenY);
        }
    }

    // --- Interface for Renderers ---

    getHoverElement(x, y) {
        // Helper to hit-test skipping cursor
        this.app.cursor.style.display = 'none';
        const el = document.elementFromPoint(x, y);
        this.app.cursor.style.display = 'flex';
        return el;
    }

    setCursorScale(scale) {
        this.app.cursor.style.transform = `scale(${scale})`;
    }

    updateCursorProgress(progress) {
        this.app.updateCursorProgress(progress);
    }

    enterDetailView(item) {
        this.app.enterDetailView(item);
    }
}
