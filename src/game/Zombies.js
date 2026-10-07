import * as THREE from 'three';
import { ZOMBIE_TYPES, LAWN_ORIGIN_X, LAWN_ORIGIN_Z, CELL_WIDTH, CELL_DEPTH, GRID_COLS } from './Constants.js';
import { ZombieModelFactory } from '../models/ZombieModelFactory.js';
import { soundManager } from '../audio/SoundManager.js';

export class Zombie {
  constructor(type, row, scene, systems) {
    this.type = type;
    this.row = row;
    this.scene = scene;
    this.systems = systems; // { particleSystem, screenShake }

    this.hp = type.hp;
    this.maxHp = type.hp;
    this.armorHp = type.armorHp || 0;
    this.baseSpeed = type.speed || 0.35;
    this.currentSpeed = this.baseSpeed;
    this.attackDps = type.attackDps || 100;

    this.isAlive = true;
    this.state = 'walking'; // 'walking', 'running', 'vaulting', 'eating', 'dying'
    this.targetPlant = null;

    this.animTimer = Math.random() * 10;
    this.biteTimer = 0;
    this.frostTimer = 0;
    this.groanTimer = 3.0 + Math.random() * 8.0;

    // Pole vault special state
    if (type.id === 'pole_vault') {
      this.state = 'running';
      this.baseSpeed = type.runSpeed || 0.85;
      this.hasVaulted = false;
      this.vaultProgress = 0;
    }

    // Spawn on right side of lawn
    const spawnX = LAWN_ORIGIN_X + GRID_COLS * CELL_WIDTH + 1.8 + Math.random() * 1.5;
    const spawnZ = LAWN_ORIGIN_Z + row * CELL_DEPTH + (Math.random() - 0.5) * 0.3;

    this.root = this.createMesh(type.id);
    this.root.position.set(spawnX, 0, spawnZ);
    this.scene.add(this.root);

    this.bones = this.root.userData.bones;

    // Face left towards house
    this.root.rotation.y = -Math.PI / 2;
  }

  createMesh(id) {
    switch (id) {
      case 'normal':
        return ZombieModelFactory.createNormalZombie();
      case 'conehead':
        return ZombieModelFactory.createConeheadZombie();
      case 'buckethead':
        return ZombieModelFactory.createBucketheadZombie();
      case 'pole_vault':
        return ZombieModelFactory.createPoleVaultZombie();
      case 'flag':
        return ZombieModelFactory.createFlagZombie();
      case 'gargantuar':
        return ZombieModelFactory.createGargantuar();
      default:
        return ZombieModelFactory.createNormalZombie();
    }
  }

  hasArmor() {
    return this.armorHp > 0;
  }

  applyFrost(duration = 4.0) {
    this.frostTimer = duration;
  }

  takeDamage(amount) {
    if (!this.isAlive) return;

    if (this.armorHp > 0) {
      this.armorHp -= amount;
      if (this.armorHp <= 0) {
        // Armor destroyed feedback
        if (this.bones.coneArmor) {
          this.bones.headGroup.remove(this.bones.coneArmor);
          this.bones.coneArmor = null;
        }
        if (this.bones.bucketArmor) {
          this.bones.headGroup.remove(this.bones.bucketArmor);
          this.bones.bucketArmor = null;
        }
        soundManager.playMetalClang();
      }
      return;
    }

    this.hp -= amount;

    // Flash white on hit
    this.flashHit();

    if (this.hp <= 0) {
      this.die();
    }
  }

  flashHit() {
    if (this.flashTimeout) return;
    this.root.traverse(child => {
      if (child.isMesh && child.material && child.material.emissive) {
        child.material.emissiveIntensity += 0.5;
      }
    });
    this.flashTimeout = setTimeout(() => {
      this.root.traverse(child => {
        if (child.isMesh && child.material && child.material.emissive) {
          child.material.emissiveIntensity = Math.max(0, child.material.emissiveIntensity - 0.5);
        }
      });
      this.flashTimeout = null;
    }, 80);
  }

  die() {
    this.isAlive = false;
    this.state = 'dying';

    // Decapitation or collapse backwards
    if (Math.random() > 0.4 && this.bones.headGroup) {
      // Pop head off
      this.systems.particleSystem.emitFleshSplat(this.root.position);
      this.bones.headGroup.position.y += 0.5;
      this.bones.headGroup.rotation.z += 1.2;
    }

    // Collapse to ground
    let collapseProgress = 0;
    const collapseInterval = setInterval(() => {
      collapseProgress += 0.08;
      if (this.root && this.root.rotation) {
        this.root.rotation.x = collapseProgress * (Math.PI / 2);
        this.root.position.y = -collapseProgress * 0.4;
      }
      if (collapseProgress >= 1.0) {
        clearInterval(collapseInterval);
        setTimeout(() => {
          this.destroy();
        }, 800);
      }
    }, 30);
  }

  update(delta, plants) {
    if (!this.isAlive) return;

    this.animTimer += delta;

    // Frost slow effect
    if (this.frostTimer > 0) {
      this.frostTimer -= delta;
      this.currentSpeed = this.baseSpeed * 0.5;
    } else {
      this.currentSpeed = this.baseSpeed;
    }

    // Periodic groan sound
    this.groanTimer -= delta;
    if (this.groanTimer <= 0) {
      if (Math.random() < 0.4) soundManager.playZombieGroan();
      this.groanTimer = 8.0 + Math.random() * 12.0;
    }

    // 1. Pole Vault State Machine
    if (this.state === 'running') {
      // Check if near first plant
      const nearbyPlant = plants.find(
        p => p.isAlive && p.row === this.row && Math.abs(p.worldPos.x - this.root.position.x) < 1.4
      );

      if (nearbyPlant && !this.hasVaulted) {
        this.state = 'vaulting';
        this.vaultProgress = 0;
        this.vaultStartX = this.root.position.x;
        this.vaultTargetX = nearbyPlant.worldPos.x - 0.8;
      } else {
        // Fast sprint walk cycle
        this.root.position.x -= this.currentSpeed * delta;
        this.animateWalk(delta, 10.0);
      }
    } else if (this.state === 'vaulting') {
      this.vaultProgress += delta * 1.6;
      const t = this.vaultProgress;

      if (t >= 1.0) {
        this.state = 'walking';
        this.hasVaulted = true;
        this.baseSpeed = this.type.walkSpeed || 0.35;
        this.root.position.x = this.vaultTargetX;
        this.root.position.y = 0;
        if (this.bones.pole) this.bones.pole.visible = false; // Discard pole
      } else {
        this.root.position.x = THREE.MathUtils.lerp(this.vaultStartX, this.vaultTargetX, t);
        this.root.position.y = Math.sin(t * Math.PI) * 2.2; // High jump arc
        this.root.rotation.z = Math.sin(t * Math.PI) * 0.5;
      }
    } else if (this.state === 'walking') {
      // Check collision with plant in front
      const plantToEat = plants.find(
        p =>
          p.isAlive &&
          p.row === this.row &&
          this.root.position.x > p.worldPos.x &&
          this.root.position.x - p.worldPos.x < 0.65
      );

      if (plantToEat) {
        this.state = 'eating';
        this.targetPlant = plantToEat;
      } else {
        this.root.position.x -= this.currentSpeed * delta;
        const walkFreq = this.type.id === 'gargantuar' ? 3.0 : 4.5;
        this.animateWalk(delta, walkFreq);
      }
    } else if (this.state === 'eating') {
      if (!this.targetPlant || !this.targetPlant.isAlive) {
        this.state = 'walking';
        this.targetPlant = null;
        return;
      }

      // Eating animation
      this.animateEat(delta);

      // Deal DPS to plant
      this.biteTimer += delta;
      if (this.biteTimer >= 0.35) {
        this.biteTimer = 0;
        soundManager.playBite();

        if (this.type.id === 'gargantuar') {
          // Smash attack
          this.systems.screenShake.shake(0.5, 0.3);
          this.targetPlant.takeDamage(this.attackDps);
        } else {
          this.targetPlant.takeDamage(this.attackDps * 0.35);
        }

        this.systems.particleSystem.emitFleshSplat(this.targetPlant.worldPos);
      }
    }
  }

  animateWalk(delta, freq) {
    const b = this.bones;
    if (!b) return;

    const angle = Math.sin(this.animTimer * freq);

    // Legs
    b.hipL.rotation.x = angle * 0.45;
    b.hipR.rotation.x = -angle * 0.45;
    b.kneeL.rotation.x = Math.max(0, -angle) * 0.5;
    b.kneeR.rotation.x = Math.max(0, angle) * 0.5;

    // Torso sway
    b.spine.rotation.z = Math.sin(this.animTimer * freq * 0.5) * 0.08;
    b.headGroup.rotation.x = Math.sin(this.animTimer * freq) * 0.05;

    // Gargantuar club raise
    if (b.club) {
      b.shoulderR.rotation.x = -Math.PI / 2.8 + Math.sin(this.animTimer * freq) * 0.15;
    }
  }

  animateEat(delta) {
    const b = this.bones;
    if (!b) return;

    // Bending down chomping
    b.spine.rotation.x = -0.25;
    b.headGroup.rotation.x = 0.2 + Math.sin(this.animTimer * 12.0) * 0.15;

    if (b.club) {
      // Gargantuar raises club high and slams
      b.shoulderR.rotation.x = -Math.PI / 1.5 + Math.sin(this.animTimer * 5.0) * 0.6;
    }
  }

  destroy() {
    this.isAlive = false;
    this.scene.remove(this.root);
  }
}
