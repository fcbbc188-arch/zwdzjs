import * as THREE from 'three';
import { GRAPHICS_PRESETS } from '../game/Constants.js';

export class RendererManager {
  constructor(canvas) {
    this.canvas = canvas;

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance',
      stencil: false,
      depth: true
    });

    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    // Realistic Tone Mapping & Color Management
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    // Soft Shadow Maps
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;

    this.currentPreset = 'HIGH';
  }

  setQuality(presetKey, lightingManager) {
    const preset = GRAPHICS_PRESETS[presetKey];
    if (!preset) return;
    this.currentPreset = presetKey;

    this.renderer.setPixelRatio(preset.dpr);
    this.renderer.shadowMap.enabled = preset.shadows;

    if (lightingManager) {
      lightingManager.setShadowQuality(preset.shadowMapSize, preset.shadows);
    }
  }

  onResize(width, height) {
    this.renderer.setSize(width, height);
  }

  render(scene, camera) {
    this.renderer.render(scene, camera);
  }
}
