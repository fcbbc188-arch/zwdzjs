import * as THREE from 'three';
import { soundManager } from '../audio/SoundManager.js';
import { GRID_ROWS, GRID_COLS, CELL_WIDTH, CELL_DEPTH, LAWN_ORIGIN_X, LAWN_ORIGIN_Z } from './Constants.js';

export class SunManager {
  constructor(scene, onSunChange) {
    this.scene = scene;
    this.onSunChange = onSunChange;
    this.suns = [];
    this.currentSun = 150;
    this.skyTimer = 4.0; // first sun drops soon
    this.skyInterval = 8.5;

    // Shared 3D Sun Material
    this.sunCoreMat = new THREE.MeshStandardMaterial({
      color: 0xfde047,
      emissive: 0xf59e0b,
      emissiveIntensity: 0.9,
      roughness: 0.2,
      metalness: 0.1
    });

    this.sunRayMat = new THREE.MeshStandardMaterial({
      color: 0xfbbf24,
      emissive: 0xd97706,
      emissiveIntensity: 0.6,
      roughness: 0.4,
      transparent: true,
      opacity: 0.85
    });

    if (this.onSunChange) this.onSunChange(this.currentSun);
  }

  createSunMesh() {
    const group = new THREE.Group();
    group.name = 'sun_token';

    // Glowing core sphere
    const coreGeom = new THREE.SphereGeometry(0.38, 16, 16);
    const core = new THREE.Mesh(coreGeom, this.sunCoreMat);
    group.add(core);

    // Corona rays
    const rayGeom = new THREE.TorusGeometry(0.5, 0.08, 6, 16);
    const rays = new THREE.Mesh(rayGeom, this.sunRayMat);
    group.add(rays);

    const pointLight = new THREE.PointLight(0xfef08a, 1.2, 3.5);
    pointLight.position.set(0, 0, 0);
    group.add(pointLight);

    group.userData = { rays, core, pointLight };
    return group;
  }

  // Spawn sun falling naturally from sky
  spawnSkySun() {
    const mesh = this.createSunMesh();
    const randCol = Math.floor(Math.random() * GRID_COLS);
    const randRow = Math.floor(Math.random() * GRID_ROWS);

    const targetX = LAWN_ORIGIN_X + randCol * CELL_WIDTH + (Math.random() - 0.5) * 1.0;
    const targetZ = LAWN_ORIGIN_Z + randRow * CELL_DEPTH + (Math.random() - 0.5) * 1.0;
    const targetY = 0.6;

    mesh.position.set(targetX, 14.0, targetZ);
    this.scene.add(mesh);

    this.suns.push({
      mesh,
      state: 'falling',
      targetY,
      velY: -4.5,
      life: 14.0,
      collected: false,
      value: 25
    });
  }

  // Spawn sun popped out from sunflower
  spawnPlantSun(originPos) {
    const mesh = this.createSunMesh();
    mesh.position.copy(originPos);
    mesh.position.y += 0.5;
    this.scene.add(mesh);

    const angle = Math.random() * Math.PI * 2;
    const distance = 0.5 + Math.random() * 0.6;
    const targetX = originPos.x + Math.cos(angle) * distance;
    const targetZ = originPos.z + Math.sin(angle) * distance;

    this.suns.push({
      mesh,
      state: 'popping',
      origin: originPos.clone(),
      target: new THREE.Vector3(targetX, 0.6, targetZ),
      popProgress: 0,
      life: 16.0,
      collected: false,
      value: 25
    });
  }

  collectSun(sunItem) {
    if (sunItem.collected) return;
    sunItem.collected = true;
    sunItem.state = 'collecting';
    sunItem.collectProgress = 0;
    sunItem.startPos = sunItem.mesh.position.clone();

    this.currentSun += sunItem.value;
    if (this.onSunChange) this.onSunChange(this.currentSun);
    soundManager.playSun();
  }

  addSun(amount) {
    this.currentSun += amount;
    if (this.onSunChange) this.onSunChange(this.currentSun);
  }

  spendSun(amount) {
    if (this.currentSun >= amount) {
      this.currentSun -= amount;
      if (this.onSunChange) this.onSunChange(this.currentSun);
      return true;
    }
    return false;
  }

  update(delta, camera) {
    // Sky drop timer
    this.skyTimer -= delta;
    if (this.skyTimer <= 0) {
      this.spawnSkySun();
      this.skyInterval = Math.max(6.5, this.skyInterval - 0.05);
      this.skyTimer = this.skyInterval;
    }

    for (let i = this.suns.length - 1; i >= 0; i--) {
      const sun = this.suns[i];
      const mesh = sun.mesh;

      // Rotate rays for sparkle
      if (mesh.userData.rays) {
        mesh.userData.rays.rotation.z += 2.0 * delta;
        mesh.userData.rays.rotation.x += 1.0 * delta;
      }

      if (sun.state === 'falling') {
        mesh.position.y += sun.velY * delta;
        if (mesh.position.y <= sun.targetY) {
          mesh.position.y = sun.targetY;
          sun.state = 'idle';
          sun.bouncePhase = 0;
        }
      } else if (sun.state === 'popping') {
        sun.popProgress += delta * 1.8;
        if (sun.popProgress >= 1.0) {
          mesh.position.copy(sun.target);
          sun.state = 'idle';
          sun.bouncePhase = 0;
        } else {
          const t = sun.popProgress;
          mesh.position.lerpVectors(sun.origin, sun.target, t);
          // Parabolic arc jump
          mesh.position.y = 0.6 + Math.sin(t * Math.PI) * 1.5;
        }
      } else if (sun.state === 'idle') {
        sun.life -= delta;
        sun.bouncePhase = (sun.bouncePhase || 0) + delta * 3.5;
        mesh.position.y = 0.6 + Math.sin(sun.bouncePhase) * 0.08;

        if (sun.life <= 0) {
          this.removeSun(i);
          continue;
        }
      } else if (sun.state === 'collecting') {
        sun.collectProgress += delta * 2.8;
        if (sun.collectProgress >= 1.0) {
          this.removeSun(i);
          continue;
        }

        // Float upwards and shrink towards screen HUD
        const t = sun.collectProgress;
        const targetPos = new THREE.Vector3(
          camera.position.x - 2.5,
          camera.position.y + 1.5,
          camera.position.z - 3.0
        );
        mesh.position.lerpVectors(sun.startPos, targetPos, t);
        const scale = 1.0 - t * 0.8;
        mesh.scale.setScalar(scale);
      }
    }
  }

  removeSun(index) {
    const sun = this.suns[index];
    this.scene.remove(sun.mesh);
    this.suns.splice(index, 1);
  }

  getClickableMeshes() {
    return this.suns.filter(s => !s.collected).map(s => s.mesh);
  }

  getSunByMesh(mesh) {
    return this.suns.find(s => s.mesh === mesh || s.mesh.children.includes(mesh));
  }

  clear() {
    for (const sun of this.suns) {
      this.scene.remove(sun.mesh);
    }
    this.suns = [];
  }
}
