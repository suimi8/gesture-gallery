import * as THREE from 'three';
import { CSS3DRenderer, CSS3DObject } from 'three/addons/renderers/CSS3DRenderer.js';

export class SphereRenderer {
    constructor(context) {
        this.context = context;
        this.container = document.createElement('div');
        this.container.id = 'sphere-container';
        this.container.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; z-index:10; display:none; background: #000;';
        document.body.appendChild(this.container);

        this.camera = null;
        this.scene = null;
        this.renderer = null;
        this.objects = [];
        this.group = null;

        // Interactive State
        this.targetRotation = { x: 0, y: 0 };
        this.currentRotation = { x: 0, y: 0 };
        this.isDragging = false;
        this.wasStrictPointing = false;

        // Drag tracking - use base + delta approach
        this.baseRotation = { x: 0, y: 0 }; // Rotation at start of current drag
        this.dragStartMouse = { x: 0, y: 0 }; // Mouse position at start of drag
        this.lastMouse = { x: 0, y: 0 };

        // Hover
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2(); // Normalized mouse for raycasting logic (if needed, but CSS3D handles DOM events naturally)
        // Actually CSS3D elements are DOM elements. We can hit-test them via document.elementFromPoint if they face us.
        // But 3D transforms might make elementFromPoint tricky if we want exact "3D Ray".
        // However, standard elementFromPoint usually works on the projected 2D quad.

        this.hoverTarget = null;
        this.hoverStartTime = 0;
        this.HOVER_THRESHOLD = 2000; // 2s for 3D
    }

    mount() {
        this.container.style.display = 'block';
        if (!this.renderer) {
            this.initThree();
        }
        this.animate();
        // Hide standard track
        // Hide standard track
        const app = document.getElementById('app');
        if (app) app.style.display = 'none';
    }

    unmount() {
        this.container.style.display = 'none';
        cancelAnimationFrame(this.rafId);
        // Show standard track
        // document.getElementById('gallery-container').style.display = 'block'; // Handled by ViewManager switching
    }

    initThree() {
        // Camera
        this.camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 1, 5000);
        this.camera.position.z = 1800; // Distance

        // Scene
        this.scene = new THREE.Scene();

        // Group for Sphere
        this.group = new THREE.Group();
        this.scene.add(this.group);

        // Renderer
        this.renderer = new CSS3DRenderer();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.container.appendChild(this.renderer.domElement);

        this.createSphereElements();
    }

    createSphereElements() {
        const images = Array.from(document.querySelectorAll('.gallery-item img'));
        const total = images.length;

        // Fibonacci Sphere Algorithm
        const phi = Math.PI * (3 - Math.sqrt(5)); // Golden Angle

        const radius = 800;

        for (let i = 0; i < total; i++) {
            const y = 1 - (i / (total - 1)) * 2; // y goes from 1 to -1
            const radiusAtY = Math.sqrt(1 - y * y); // radius at y

            const theta = phi * i; // golden angle increment

            const x = Math.cos(theta) * radiusAtY;
            const z = Math.sin(theta) * radiusAtY;

            // Create Element
            const div = document.createElement('div');
            div.className = 'sphere-item';
            div.style.width = '240px';
            div.style.height = '360px'; // Aspect ratio approx
            // div.style.backfaceVisibility = 'hidden'; // Important?

            const img = document.createElement('img');
            img.src = images[i].src;
            img.style.width = '100%';
            img.style.height = '100%';
            img.style.objectFit = 'cover';
            img.style.borderRadius = '12px';
            img.style.boxShadow = '0 0 20px rgba(0,255,255,0.2)';

            div.appendChild(img);

            // CSS3D Object
            const object = new CSS3DObject(div);
            object.position.set(x * radius, y * radius, z * radius);

            // Look at center (Vector3(0,0,0))
            const vector = object.position.clone().normalize();
            object.lookAt(vector.multiplyScalar(2)); // Look AWAY from center? Or TO center?
            // CSS3D lookAt usually orients the Z axis.
            // We want the image front to face OUTWARDS.
            // The position is (x,y,z). If we look at (0,0,0), the back faces us.
            // So we look at (2x, 2y, 2z).

            this.group.add(object);
            this.objects.push(object);
        }
    }

    updateLayout() {
        if (this.camera && this.renderer) {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        }
    }

    animate() {
        this.rafId = requestAnimationFrame(() => this.animate());

        // Smooth Rotation
        this.currentRotation.x += (this.targetRotation.x - this.currentRotation.x) * 0.1;
        this.currentRotation.y += (this.targetRotation.y - this.currentRotation.y) * 0.1;

        if (this.group) {
            this.group.rotation.y = this.currentRotation.x; // Rotate Sphere Y
            this.group.rotation.x = this.currentRotation.y;
        }

        this.renderer.render(this.scene, this.camera);
    }

    onGesture(data, screenX, screenY) {
        if (data.isStrictPointing) {
            // On first frame of pointing (re-entry), capture the starting state
            if (!this.wasStrictPointing) {
                // Save current rotation as the base
                this.baseRotation.x = this.targetRotation.x;
                this.baseRotation.y = this.targetRotation.y;
                // Save starting mouse position
                this.dragStartMouse.x = screenX;
                this.dragStartMouse.y = screenY;
                this.isDragging = true;
            }

            // Calculate delta from drag START position (not last frame)
            const dx = screenX - this.dragStartMouse.x;
            const dy = screenY - this.dragStartMouse.y;

            // Sensitivity
            const speed = 0.005;

            // Target = Base + Delta (absolute from start of drag)
            this.targetRotation.x = this.baseRotation.x + dx * speed;
            this.targetRotation.y = this.baseRotation.y + dy * speed;

            this.lastMouse.x = screenX;
            this.lastMouse.y = screenY;

            // If stable (not moving much), check for hover and pinch
            if (Math.abs(dx) < 30 && Math.abs(dy) < 30) {
                this.context.setCursorScale(1);
                this.checkHover(data, screenX, screenY);
            } else {
                this.context.setCursorScale(0.8);
                this.resetHover();
            }
        } else {
            this.isDragging = false;
            this.context.setCursorScale(1);
            this.resetHover();
        }

        // Update tracking flag
        this.wasStrictPointing = data.isStrictPointing;
    }

    checkHover(data, x, y) {
        this.context.app.cursor.style.display = 'none';
        const el = document.elementFromPoint(x, y);
        this.context.app.cursor.style.display = 'flex';

        const item = el?.closest('.sphere-item');
        if (item) {
            // Visual feedback on item
            if (this.hoverTarget !== item) {
                this.hoverTarget = item;
                // Reset styles
                this.objects.forEach(o => o.element.querySelector('img').style.border = 'none');
                item.querySelector('img').style.border = '2px solid #646cff';
            }

            // Pinch-to-Select: If thumb and index finger touch, select immediately
            const pinchDist = data?.pinchDistance || 1;
            if (pinchDist < 0.06) {
                // Pinching! Enter detail view
                this.context.enterDetailView(item);
                this.resetHover();
            } else {
                // Show visual feedback based on how close to pinching
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
        if (this.objects) this.objects.forEach(o => o.element.querySelector('img').style.border = 'none');
    }
}
