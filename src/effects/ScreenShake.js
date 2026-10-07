import * as THREE from 'three';

export class ScreenShake {
  constructor(camera) {
    this.camera = camera;
    this.initialPosition = new THREE.Vector3();
    this.intensity = 0;
    this.duration = 0;
    this.elapsed = 0;
    this.offset = new THREE.Vector3();
  }

  shake(intensity = 0.5, duration = 0.4) {
    this.intensity = Math.max(this.intensity, intensity);
    this.duration = Math.max(this.duration, duration);
    this.elapsed = 0;
  }

  update(delta) {
    if (this.intensity <= 0) {
      this.offset.set(0, 0, 0);
      return;
    }

    this.elapsed += delta;
    const progress = this.elapsed / this.duration;

    if (progress >= 1.0) {
      this.intensity = 0;
      this.duration = 0;
      this.offset.set(0, 0, 0);
    } else {
      const currentIntensity = this.intensity * (1.0 - progress);
      this.offset.set(
        (Math.random() - 0.5) * 2 * currentIntensity,
        (Math.random() - 0.5) * 2 * currentIntensity * 0.7,
        (Math.random() - 0.5) * 2 * currentIntensity
      );
    }
  }

  getOffset() {
    return this.offset;
  }
}
