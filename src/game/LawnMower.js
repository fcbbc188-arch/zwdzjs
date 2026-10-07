import * as THREE from 'three';
import { soundManager } from '../audio/SoundManager.js';
import { GRID_ROWS, GRID_COLS, CELL_WIDTH, CELL_DEPTH, LAWN_ORIGIN_X, LAWN_ORIGIN_Z } from './Constants.js';

export class LawnMowerManager {
  constructor(scene, particleSystem) {
    this.scene = scene;
    this.particleSystem = particleSystem;
    this.mowers = [];

    this.initMowers();
  }

  createMowerMesh() {
    const root = new THREE.Group();
    root.name = 'lawn_mower';

    // Red chassis body
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0xdc2626,
      roughness: 0.3,
      metalness: 0.2
    });
    const bodyGeom = new THREE.BoxGeometry(0.9, 0.35, 0.8);
    const body = new THREE.Mesh(bodyGeom, bodyMat);
    body.position.y = 0.25;
    body.castShadow = true;
    root.add(body);

    // Engine block
    const engineMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.4,
      metalness: 0.8
    });
    const engine = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.3, 10), engineMat);
    engine.position.set(-0.1, 0.45, 0);
    engine.castShadow = true;
    root.add(engine);

    // Front spinning cutter cylinder
    const bladeGroup = new THREE.Group();
    bladeGroup.position.set(0.48, 0.2, 0);
    const bladeGeom = new THREE.CylinderGeometry(0.16, 0.16, 0.75, 8);
    bladeGeom.rotateX(Math.PI / 2);
    const bladeMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.2 });
    const blade = new THREE.Mesh(bladeGeom, bladeMat);
    blade.castShadow = true;
    bladeGroup.add(blade);
    root.add(bladeGroup);

    // Rubber Wheels (4)
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.9 });
    const wheelGeom = new THREE.CylinderGeometry(0.16, 0.16, 0.12, 12);
    wheelGeom.rotateX(Math.PI / 2);

    [-0.35, 0.35].forEach(x => {
      [-0.45, 0.45].forEach(z => {
        const wheel = new THREE.Mesh(wheelGeom, wheelMat);
        wheel.position.set(x, 0.16, z);
        wheel.castShadow = true;
        root.add(wheel);
      });
    });

    // Handlebar
    const handleMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.7 });
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.1, 6), handleMat);
    handle.position.set(-0.6, 0.6, 0);
    handle.rotation.z = 0.75;
    root.add(handle);

    root.userData = { bladeGroup };
    return root;
  }

  initMowers() {
    this.clear();
    for (let r = 0; r < GRID_ROWS; r++) {
      const mesh = this.createMowerMesh();
      mesh.position.set(
        LAWN_ORIGIN_X - CELL_WIDTH * 0.9,
        0,
        LAWN_ORIGIN_Z + r * CELL_DEPTH
      );
      this.scene.add(mesh);

      this.mowers.push({
        row: r,
        mesh,
        active: false,
        exhausted: false,
        speed: 0
      });
    }
  }

  update(delta, zombies) {
    const maxX = LAWN_ORIGIN_X + GRID_COLS * CELL_WIDTH + 4.0;

    for (let i = this.mowers.length - 1; i >= 0; i--) {
      const m = this.mowers[i];
      if (m.exhausted) continue;

      if (!m.active) {
        // Check if any zombie in this row has breached the lawn perimeter
        for (const z of zombies) {
          if (!z.isAlive || z.row !== m.row) continue;
          if (z.root.position.x <= LAWN_ORIGIN_X - 0.2) {
            // Trigger lawnmower!
            m.active = true;
            m.speed = 12.0;
            soundManager.playLawnMower();
            break;
          }
        }
      } else {
        // Roll forward
        m.mesh.position.x += m.speed * delta;
        if (m.mesh.userData.bladeGroup) {
          m.mesh.userData.bladeGroup.rotation.z += 25.0 * delta;
        }

        // Mow down all zombies in row
        for (const z of zombies) {
          if (!z.isAlive || z.row !== m.row) continue;
          if (Math.abs(z.root.position.x - m.mesh.position.x) < 1.2) {
            z.takeDamage(99999); // Instant crush
            this.particleSystem.emitFleshSplat(z.root.position);
          }
        }

        // Out of bounds
        if (m.mesh.position.x >= maxX) {
          m.exhausted = true;
          this.scene.remove(m.mesh);
        }
      }
    }
  }

  clear() {
    for (const m of this.mowers) {
      this.scene.remove(m.mesh);
    }
    this.mowers = [];
  }
}
