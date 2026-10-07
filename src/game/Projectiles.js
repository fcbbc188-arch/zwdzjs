import * as THREE from 'three';
import { soundManager } from '../audio/SoundManager.js';
import { GRID_COLS, CELL_WIDTH, LAWN_ORIGIN_X } from './Constants.js';

export class Projectiles {
  constructor(scene, particleSystem) {
    this.scene = scene;
    this.particleSystem = particleSystem;
    this.projectiles = [];

    // Shared Materials
    this.peaMat = new THREE.MeshStandardMaterial({
      color: 0x48bb78,
      roughness: 0.3,
      metalness: 0.1,
      emissive: 0x166534,
      emissiveIntensity: 0.2
    });

    this.snowPeaMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      roughness: 0.1,
      metalness: 0.3,
      emissive: 0x0284c7,
      emissiveIntensity: 0.6,
      transparent: true,
      opacity: 0.95
    });

    this.peaGeom = new THREE.SphereGeometry(0.18, 12, 12);
  }

  spawnPea(originPos, row, isSnow = false) {
    const mat = isSnow ? this.snowPeaMat : this.peaMat;
    const mesh = new THREE.Mesh(this.peaGeom, mat);
    mesh.position.copy(originPos);
    mesh.position.x += 0.7; // Emerge right at shooter's snout
    mesh.position.y += 1.15; // Muzzle height
    mesh.castShadow = true;
    this.scene.add(mesh);

    if (isSnow) {
      soundManager.playIceShoot();
    } else {
      soundManager.playShoot();
    }

    this.projectiles.push({
      mesh,
      row,
      isSnow,
      speed: 12.0, // units per second
      damage: 20,
      active: true
    });
  }

  update(delta, zombies) {
    const maxX = LAWN_ORIGIN_X + GRID_COLS * CELL_WIDTH + 4.0;

    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];

      p.mesh.position.x += p.speed * delta;
      p.mesh.rotation.z -= 15.0 * delta;

      // Check collision with zombies in the same row
      let collided = false;
      for (const z of zombies) {
        if (!z.isAlive || z.row !== p.row) continue;

        // Collision radius check along X axis
        const dist = Math.abs(p.mesh.position.x - z.root.position.x);
        if (dist < 0.65 && p.mesh.position.x <= z.root.position.x + 0.3) {
          // Hit zombie!
          collided = true;
          this.handleHit(p, z);
          break;
        }
      }

      // Out of bounds or collided
      if (collided || p.mesh.position.x >= maxX) {
        this.scene.remove(p.mesh);
        this.projectiles.splice(i, 1);
      }
    }
  }

  handleHit(projectile, zombie) {
    const hitPos = projectile.mesh.position.clone();

    if (zombie.hasArmor()) {
      soundManager.playMetalClang();
      this.particleSystem.emitMetalSparks(hitPos);
    } else {
      soundManager.playSplat();
      this.particleSystem.emitFleshSplat(hitPos);
    }

    if (projectile.isSnow) {
      this.particleSystem.emitFrostMist(hitPos);
      zombie.applyFrost(4.0);
    }

    zombie.takeDamage(projectile.damage);
  }

  clear() {
    for (const p of this.projectiles) {
      this.scene.remove(p.mesh);
    }
    this.projectiles = [];
  }
}
