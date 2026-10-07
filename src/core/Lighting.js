import * as THREE from 'three';

export class LightingManager {
  constructor(scene) {
    this.scene = scene;
    this.isNight = false;

    // 1. Hemisphere Light (Sky & Ground bounce)
    this.hemiLight = new THREE.HemisphereLight(0xe0f2fe, 0x166534, 0.9);
    this.hemiLight.position.set(0, 50, 0);
    this.scene.add(this.hemiLight);

    // 2. Ambient Light (fill)
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    this.scene.add(this.ambientLight);

    // 3. Main Directional Light (Sun / Moon)
    this.dirLight = new THREE.DirectionalLight(0xfffbeb, 1.8);
    this.dirLight.position.set(15, 25, 18);
    this.dirLight.castShadow = true;

    // High quality shadow configuration
    this.dirLight.shadow.mapSize.width = 2048;
    this.dirLight.shadow.mapSize.height = 2048;
    this.dirLight.shadow.camera.near = 0.5;
    this.dirLight.shadow.camera.far = 70;

    const d = 18;
    this.dirLight.shadow.camera.left = -d;
    this.dirLight.shadow.camera.right = d;
    this.dirLight.shadow.camera.top = d;
    this.dirLight.shadow.camera.bottom = -d;
    this.dirLight.shadow.bias = -0.0005;

    this.scene.add(this.dirLight);
  }

  setNight(isNight) {
    this.isNight = isNight;
    if (isNight) {
      // Eerie cool moonlight
      this.dirLight.color.setHex(0x93c5fd);
      this.dirLight.intensity = 0.8;
      this.dirLight.position.set(-15, 25, -12);

      this.hemiLight.color.setHex(0x1e1b4b);
      this.hemiLight.groundColor.setHex(0x090d16);
      this.hemiLight.intensity = 0.5;

      this.ambientLight.color.setHex(0x1e293b);
      this.ambientLight.intensity = 0.3;
    } else {
      // Warm bright sunny lawn
      this.dirLight.color.setHex(0xfffbeb);
      this.dirLight.intensity = 1.8;
      this.dirLight.position.set(15, 25, 18);

      this.hemiLight.color.setHex(0xe0f2fe);
      this.hemiLight.groundColor.setHex(0x166534);
      this.hemiLight.intensity = 0.9;

      this.ambientLight.color.setHex(0xffffff);
      this.ambientLight.intensity = 0.4;
    }
  }

  setShadowQuality(resolution, enabled = true) {
    this.dirLight.castShadow = enabled;
    if (enabled && resolution) {
      this.dirLight.shadow.mapSize.width = resolution;
      this.dirLight.shadow.mapSize.height = resolution;
      if (this.dirLight.shadow.map) {
        this.dirLight.shadow.map.dispose();
        this.dirLight.shadow.map = null;
      }
    }
  }
}
