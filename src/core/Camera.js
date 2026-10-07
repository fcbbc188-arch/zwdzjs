import * as THREE from 'three';

export class CameraController {
  constructor(canvas) {
    this.canvas = canvas;

    // Perspective Camera
    this.camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      200
    );

    // Target look-at
    this.target = new THREE.Vector3(0, 0, 0);

    // Camera presets
    this.presets = {
      // Classic angled lawn view (PC & Landscape mobile)
      classic: {
        pos: new THREE.Vector3(0, 14.5, 13.5),
        target: new THREE.Vector3(0, 0, -0.5)
      },
      // Longitudinal perspective for portrait screens (looks down lanes from house to zombies)
      portrait: {
        pos: new THREE.Vector3(-19.0, 22.0, 0),
        target: new THREE.Vector3(2.5, 0, 0)
      },
      // Close-up cinematic action view
      cinematic: {
        pos: new THREE.Vector3(-3.0, 8.5, 8.5),
        target: new THREE.Vector3(1.0, 0.5, 0)
      },
      // Top-down tactical 2.5D view
      topDown: {
        pos: new THREE.Vector3(0, 22.0, 0.1),
        target: new THREE.Vector3(0, 0, 0)
      }
    };

    this.currentMode = 'classic';
    this.desiredPos = this.presets.classic.pos.clone();
    this.desiredTarget = this.presets.classic.target.clone();
    this.camera.position.copy(this.desiredPos);
    this.camera.lookAt(this.desiredTarget);

    // Touch / Mouse interactive orbital offset
    this.orbitOffset = new THREE.Vector2(0, 0);
    this.isDragging = false;
    this.previousPointer = { x: 0, y: 0 };

    this.checkOrientation();

    this.setupControls();
  }

  setupControls() {
    const onPointerDown = e => {
      // Only drag if using right mouse button OR single touch in non-UI zone
      if (e.button === 2 || (e.touches && e.touches.length === 1)) {
        this.isDragging = true;
        const pt = e.touches ? e.touches[0] : e;
        this.previousPointer = { x: pt.clientX, y: pt.clientY };
      }
    };

    const onPointerMove = e => {
      if (!this.isDragging) return;
      const pt = e.touches ? e.touches[0] : e;
      const deltaX = pt.clientX - this.previousPointer.x;
      const deltaY = pt.clientY - this.previousPointer.y;

      this.orbitOffset.x = THREE.MathUtils.clamp(this.orbitOffset.x + deltaX * 0.005, -0.6, 0.6);
      this.orbitOffset.y = THREE.MathUtils.clamp(this.orbitOffset.y + deltaY * 0.005, -0.4, 0.4);

      this.previousPointer = { x: pt.clientX, y: pt.clientY };
    };

    const onPointerUp = () => {
      this.isDragging = false;
    };

    this.canvas.addEventListener('mousedown', onPointerDown);
    window.addEventListener('mousemove', onPointerMove);
    window.addEventListener('mouseup', onPointerUp);

    this.canvas.addEventListener('touchstart', onPointerDown, { passive: true });
    window.addEventListener('touchmove', onPointerMove, { passive: true });
    window.addEventListener('touchend', onPointerUp);

    // Disable context menu on canvas for right-click rotate
    this.canvas.addEventListener('contextmenu', e => e.preventDefault());
  }

  getAspectScaleFactor() {
    const aspect = this.camera.aspect;
    const refAspect = 1.6;
    if (aspect < refAspect) {
      // In vertical/portrait screens, pull camera back proportionally
      // so the horizontal span of the lawn is never clipped
      return Math.min(refAspect / Math.max(aspect, 0.4), 2.85);
    }
    return 1.0;
  }

  checkOrientation() {
    const isPortrait = window.innerHeight > window.innerWidth;
    if (this.prevIsPortrait === undefined) {
      this.prevIsPortrait = isPortrait;
      if (isPortrait) {
        this.setPreset('portrait');
      }
      return;
    }

    if (this.prevIsPortrait !== isPortrait) {
      this.prevIsPortrait = isPortrait;
      if (isPortrait && this.currentMode === 'classic') {
        this.setPreset('portrait');
      } else if (!isPortrait && this.currentMode === 'portrait') {
        this.setPreset('classic');
      }
    }
  }

  setPreset(name) {
    if (!this.presets[name]) return;
    this.currentMode = name;
    this.desiredPos.copy(this.presets[name].pos);
    this.desiredTarget.copy(this.presets[name].target);
    if (this.orbitOffset) this.orbitOffset.set(0, 0);
  }

  cycleMode() {
    const modes = ['classic', 'portrait', 'cinematic', 'topDown'];
    const idx = (modes.indexOf(this.currentMode) + 1) % modes.length;
    this.setPreset(modes[idx]);
    return modes[idx];
  }

  update(delta, screenShakeOffset) {
    this.checkOrientation();

    const scaleFactor = this.getAspectScaleFactor();

    // Scale position dynamically based on aspect ratio
    const scaledPos = this.desiredPos.clone();
    const scaledTarget = this.desiredTarget.clone();

    if (this.currentMode === 'classic' || this.currentMode === 'topDown') {
      scaledPos.y *= scaleFactor;
      scaledPos.z *= scaleFactor;
    } else if (this.currentMode === 'portrait') {
      scaledPos.x = -19.0 - (scaleFactor - 1.0) * 8.0;
      scaledPos.y = 22.0 + (scaleFactor - 1.0) * 8.0;
    } else if (this.currentMode === 'cinematic') {
      scaledPos.multiplyScalar(Math.min(scaleFactor, 1.4));
    }

    // Smooth lerp to desired position & target
    const lerpSpeed = 4.0 * delta;
    this.camera.position.lerp(scaledPos, lerpSpeed);
    this.target.lerp(scaledTarget, lerpSpeed);

    // Apply orbit adjustments
    const currentPos = this.camera.position.clone();
    currentPos.x += this.orbitOffset.x * 6.0;
    currentPos.z += this.orbitOffset.y * 6.0;

    // Apply screen shake
    if (screenShakeOffset) {
      currentPos.add(screenShakeOffset);
    }

    this.camera.position.copy(currentPos);
    this.camera.lookAt(this.target);
  }

  onResize(width, height) {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.checkOrientation();
  }
}
