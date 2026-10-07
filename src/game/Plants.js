import * as THREE from 'three';
import { PLANT_TYPES, CELL_WIDTH, CELL_DEPTH } from './Constants.js';
import { PlantModelFactory } from '../models/PlantModelFactory.js';
import { soundManager } from '../audio/SoundManager.js';

export class Plant {
  constructor(type, row, col, worldPos, scene, systems) {
    this.type = type;
    this.row = row;
    this.col = col;
    this.worldPos = worldPos.clone();
    this.scene = scene;
    this.systems = systems; // { projectiles, sunManager, particleSystem, screenShake }

    this.maxHp = type.hp;
    this.hp = type.hp;
    this.isAlive = true;
    this.timer = 0;
    this.state = 'idle';

    // Build 3D mesh
    this.mesh = this.createMesh(type.id);
    this.mesh.position.copy(this.worldPos);

    // Orientation: Face right towards zombies (+X)
    if (type.id === 'peashooter' || type.id === 'snow_pea') {
      this.mesh.rotation.y = Math.PI / 2; // Face right towards incoming zombies (+X)
    } else if (type.id === 'chomper') {
      this.mesh.rotation.y = Math.PI / 2; // Mouth faces zombies
    } else if (type.id === 'potato_mine') {
      this.mesh.rotation.y = Math.PI / 2.5;
    } else if (type.id === 'wallnut') {
      this.mesh.rotation.y = Math.PI / 3;
    } else if (type.id === 'sunflower') {
      this.mesh.rotation.y = 0.25;
    }

    this.scene.add(this.mesh);

    // Initial soil dust
    this.systems.particleSystem.emitDirtPuff(this.worldPos);
    soundManager.playPlant();

    // Type-specific initial timers
    if (type.id === 'sunflower') {
      this.produceTimer = 7.0; // first sun
      this.produceInterval = 22.0;
    } else if (type.id === 'peashooter' || type.id === 'snow_pea') {
      this.shootCooldown = 0.5; // ready shortly after planting
    } else if (type.id === 'potato_mine') {
      this.state = 'arming';
      this.armTimer = type.armTime || 12.0;
    } else if (type.id === 'chomper') {
      this.state = 'ready';
      this.chewTimer = 0;
    } else if (type.id === 'cherry_bomb') {
      this.fuseTimer = type.fuseTime || 1.2;
      this.state = 'fuse';
    }
  }

  createMesh(id) {
    switch (id) {
      case 'sunflower':
        return PlantModelFactory.createSunflower();
      case 'peashooter':
        return PlantModelFactory.createPeashooter();
      case 'snow_pea':
        return PlantModelFactory.createSnowPea();
      case 'wallnut':
        return PlantModelFactory.createWallnut();
      case 'potato_mine':
        return PlantModelFactory.createPotatoMine();
      case 'chomper':
        return PlantModelFactory.createChomper();
      case 'cherry_bomb':
        return PlantModelFactory.createCherryBomb();
      default:
        return PlantModelFactory.createPeashooter();
    }
  }

  takeDamage(amount) {
    this.hp -= amount;
    // Damage feedback for wallnut
    if (this.type.id === 'wallnut') {
      const uData = this.mesh.userData;
      if (this.hp <= this.maxHp * 0.66 && uData.crack1) {
        uData.crack1.visible = true;
      }
      if (this.hp <= this.maxHp * 0.33 && uData.crack2) {
        uData.crack2.visible = true;
      }
    }

    if (this.hp <= 0) {
      this.destroy();
    }
  }

  update(delta, zombies) {
    if (!this.isAlive) return;

    this.timer += delta;

    // Breathing / gentle sway animation
    const sway = Math.sin(this.timer * 3.0) * 0.05;
    if (this.type.id === 'sunflower') {
      const uData = this.mesh.userData;
      if (uData.headPivot) {
        uData.headPivot.rotation.z = sway;
      }

      this.produceTimer -= delta;
      if (this.produceTimer <= 0) {
        this.systems.sunManager.spawnPlantSun(this.worldPos);
        this.produceTimer = this.produceInterval;
      }
    } else if (this.type.id === 'peashooter' || this.type.id === 'snow_pea') {
      const uData = this.mesh.userData;
      if (uData.headPivot) {
        uData.headPivot.rotation.z = sway * 0.5;
      }

      this.shootCooldown -= delta;
      // Check if zombies exist in this row ahead of the plant
      const hasZombieAhead = zombies.some(
        z => z.isAlive && z.row === this.row && z.root.position.x > this.worldPos.x
      );

      if (hasZombieAhead && this.shootCooldown <= 0) {
        this.shootCooldown = this.type.attackRate || 1.4;
        const isSnow = this.type.id === 'snow_pea';
        this.systems.projectiles.spawnPea(this.worldPos, this.row, isSnow);

        // Recoil head backwards briefly along local Z axis
        if (uData.headPivot) {
          uData.headPivot.position.z = -0.15;
          setTimeout(() => {
            if (uData.headPivot) uData.headPivot.position.z = 0;
          }, 120);
        }
      }
    } else if (this.type.id === 'potato_mine') {
      const uData = this.mesh.userData;
      if (this.state === 'arming') {
        this.armTimer -= delta;
        if (this.armTimer <= 0) {
          this.state = 'armed';
          // Unearth animation
          if (uData.tuberPivot) uData.tuberPivot.position.y = 0.28;
          this.systems.particleSystem.emitDirtPuff(this.worldPos);
        }
      } else if (this.state === 'armed') {
        // Flash antenna
        if (uData.bulbMat) {
          const blink = Math.sin(this.timer * 12.0) > 0;
          uData.bulbMat.emissiveIntensity = blink ? 1.5 : 0.2;
        }

        // Check if zombie stepped on it
        const victim = zombies.find(
          z => z.isAlive && z.row === this.row && Math.abs(z.root.position.x - this.worldPos.x) < 0.65
        );
        if (victim) {
          this.explodePotatoMine(zombies);
        }
      }
    } else if (this.type.id === 'chomper') {
      const uData = this.mesh.userData;
      if (this.state === 'ready') {
        // Check for zombie within bite range (0.4 to 1.8 units ahead)
        const target = zombies.find(
          z =>
            z.isAlive &&
            z.row === this.row &&
            z.root.position.x > this.worldPos.x &&
            z.root.position.x < this.worldPos.x + 1.8
        );

        if (target) {
          // Snap!
          this.state = 'chewing';
          this.chewTimer = this.type.chewTime || 15.0;
          soundManager.playChomp();

          if (target.type.id === 'gargantuar') {
            target.takeDamage(400); // Big bite
          } else {
            target.takeDamage(9999); // Instant swallow
          }
          this.systems.particleSystem.emitFleshSplat(target.root.position);
        }
      } else if (this.state === 'chewing') {
        this.chewTimer -= delta;
        // Chewing mouth animation
        if (uData.upperJawPivot && uData.lowerJawPivot) {
          const chompAnim = Math.sin(this.timer * 6.0) * 0.15;
          uData.upperJawPivot.rotation.x = chompAnim;
          uData.lowerJawPivot.rotation.x = -chompAnim;
        }

        if (this.chewTimer <= 0) {
          this.state = 'ready';
          if (uData.upperJawPivot) uData.upperJawPivot.rotation.x = 0;
          if (uData.lowerJawPivot) uData.lowerJawPivot.rotation.x = 0;
        }
      }
    } else if (this.type.id === 'cherry_bomb') {
      this.fuseTimer -= delta;
      // Swell up before explosion
      const progress = 1.0 - Math.max(0, this.fuseTimer) / (this.type.fuseTime || 1.2);
      const scale = 1.0 + progress * 0.6;
      this.mesh.scale.set(scale, scale, scale);

      const uData = this.mesh.userData;
      if (uData.cherryMat) {
        uData.cherryMat.emissiveIntensity = 0.2 + progress * 1.5;
      }

      if (this.fuseTimer <= 0) {
        this.explodeCherryBomb(zombies);
      }
    }
  }

  explodePotatoMine(zombies) {
    soundManager.playExplosion();
    this.systems.screenShake.shake(0.6, 0.4);
    this.systems.particleSystem.emitExplosion(this.worldPos, 2.0);

    // Damage all zombies within 1.5 radius
    for (const z of zombies) {
      if (!z.isAlive) continue;
      const d = this.worldPos.distanceTo(z.root.position);
      if (d < 1.6) {
        z.takeDamage(this.type.damage || 1800);
      }
    }
    this.destroy();
  }

  explodeCherryBomb(zombies) {
    soundManager.playExplosion();
    this.systems.screenShake.shake(1.0, 0.6);
    this.systems.particleSystem.emitExplosion(this.worldPos, 4.0);

    // 3x3 cells AoE (approx 3.6 units radius)
    const blastRadius = CELL_WIDTH * 1.6;
    for (const z of zombies) {
      if (!z.isAlive) continue;
      const d = this.worldPos.distanceTo(z.root.position);
      if (d <= blastRadius) {
        z.takeDamage(this.type.damage || 1800);
        this.systems.particleSystem.emitFleshSplat(z.root.position);
      }
    }
    this.destroy();
  }

  destroy() {
    this.isAlive = false;
    this.scene.remove(this.mesh);
  }
}
