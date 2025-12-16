export class FlatRenderer {
    constructor(context) {
        this.context = context; // Access to shared state/events
        this.container = document.getElementById('app');
        this.track = document.getElementById('gallery-track');

        // State
        this.scrollX = 0;
        this.maxScroll = 0;

        // Drag Physics
        this.isDragging = false;
        this.dragStartCursorX = 0;
        this.dragStartScrollX = 0;
        this.velocity = 0;
        this.lastDragTime = 0;
        this.friction = 0.95;
        this.isInertia = false;

        // Hover
        this.hoverTarget = null;
        this.hoverStartTime = 0;
        this.HOVER_THRESHOLD = 3000;
    }

    mount() {
        if (this.container) this.container.style.display = 'flex';
        this.updateLayout();
        // Reset state
        this.scrollX = 0;
        if (this.track) this.track.style.transform = `translateX(0px)`;
    }

    unmount() {
        if (this.container) this.container.style.display = 'none';
        this.isInertia = false;
    }

    updateLayout() {
        if (!this.track) return;
        const trackWidth = this.track.scrollWidth;
        const viewportWidth = window.innerWidth;
        this.maxScroll = trackWidth - viewportWidth;
        if (this.maxScroll < 0) this.maxScroll = 0;
    }

    onGesture(data, screenX, screenY) {
        // Allow cursor control for both strict pointing and pinch-ready gestures
        const canControl = data.canControlCursor || data.isStrictPointing;

        if (canControl) {
            this.handleActiveGesture(data, screenX, screenY);
        } else {
            this.handleInactiveGesture();
        }
    }

    handleActiveGesture(data, screenX, screenY) {
        // Stop Inertia
        if (this.isInertia) {
            this.isInertia = false;
            this.velocity = 0;
        }

        // --- Drag Logic ---
        if (!this.isDragging) {
            this.isDragging = true;
            this.dragStartCursorX = screenX;
            this.dragStartScrollX = this.scrollX;
            this.lastDragTime = performance.now();
            this.velocity = 0;
        }

        const deltaX = screenX - this.dragStartCursorX;
        const sensitivity = 1.5;

        // Velocity Calculation
        const now = performance.now();
        const dt = now - this.lastDragTime;
        if (dt > 16) {
            const disp = (this.dragStartScrollX - (deltaX * sensitivity)) - this.scrollX;
            this.velocity = (0.5 * this.velocity) + (0.5 * disp);
            this.lastDragTime = now;
        }

        // Apply Scroll
        let targetScroll = this.dragStartScrollX - (deltaX * sensitivity);
        targetScroll = Math.max(0, Math.min(this.maxScroll, targetScroll));
        this.scrollX = targetScroll;
        this.track.style.transform = `translateX(${-this.scrollX}px)`;

        // Debug Info
        // this.context.app.statusBar.innerText = `Scroll: ${Math.round(this.scrollX)} / ${this.maxScroll}`;


        // --- Hover Logic ---
        // If moving fast, don't hover
        if (Math.abs(deltaX) > 20 || Math.abs(this.velocity) > 2) {
            this.resetHover();
            // Scale cursor down to indicate "Grabbing/Moving"
            this.context.setCursorScale(0.8);
        } else {
            // Stable
            this.context.setCursorScale(1);
            this.checkHover(data, screenX, screenY);
        }
    }

    handleInactiveGesture() {
        // Reset Drag
        if (this.isDragging) {
            this.isDragging = false;
            if (Math.abs(this.velocity) > 0.5) {
                this.isInertia = true;
            }
        }

        // Inertia
        if (this.isInertia) {
            this.scrollX += this.velocity;
            this.velocity *= this.friction;

            if (this.scrollX < 0 || this.scrollX > this.maxScroll) {
                this.velocity = 0;
                this.isInertia = false;
                this.scrollX = Math.max(0, Math.min(this.maxScroll, this.scrollX));
            }

            if (Math.abs(this.velocity) < 0.1) {
                this.isInertia = false;
                this.velocity = 0;
            }
            this.track.style.transform = `translateX(${-this.scrollX}px)`;
        }

        this.resetHover();
    }

    checkHover(data, x, y) {
        const el = this.context.getHoverElement(x, y);
        const imageCard = el?.closest('.gallery-item');

        if (imageCard) {
            if (this.hoverTarget !== imageCard) {
                this.hoverTarget = imageCard;
                document.querySelectorAll('.gallery-item').forEach(el => el.classList.remove('hovered'));
                imageCard.classList.add('hovered');
            }

            // Pinch-to-Select: If thumb and index finger touch, select immediately
            const pinchDist = data.pinchDistance || 1;
            if (pinchDist < 0.06) {
                // Pinching! Enter detail view
                this.context.enterDetailView(imageCard);
                this.resetHover();
            } else {
                // Show visual feedback based on how close to pinching
                // Map 0.06-0.15 to progress 1-0
                const progress = Math.max(0, Math.min(1, (0.15 - pinchDist) / 0.09));
                this.context.updateCursorProgress(progress);
            }
        } else {
            this.resetHover();
        }
    }

    resetHover() {
        this.hoverTarget = null;
        this.context.updateCursorProgress(0);
        document.querySelectorAll('.gallery-item').forEach(el => el.classList.remove('hovered'));
    }
}
