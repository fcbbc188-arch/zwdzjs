import * as THREE from 'three';

export class ParticleSystem {
  constructor(scene) {
    this.scene = scene;
    this.particles = [];
    this.maxParticles = 500;
  }

  // Generic particle emitter
  emit(options) {
    const {
      position,
      count = 10,
      color = 0x22c55e,
      size = 0.15,
      speed = 2.5,
      lifetime = 0.6,
      gravity = -9.8,
      spread = 1.0,
      glow = false
    } = options;

    for (let i = 0; i < count; i++) {
      if (this.particles.length >= this.maxParticles) {
        const oldest = this.particles.shift();
        this.scene.remove(oldest.mesh);
        oldest.mesh.geometry.dispose();
      }

      const geom = new THREE.DodecahedronGeometry(size * (0.6 + Math.random() * 0.8), 0);
      const mat = new THREE.MeshStandardMaterial({
        color: color,
        roughness: 0.3,
        metalness: glow ? 0.8 : 0.1,
        emissive: glow ? color : 0x000000,
        emissiveIntensity: glow ? 0.6 : 0,
        transparent: true,
        opacity: 0.95
      });

      const mesh = new THREE.Mesh(geom, mat);
      mesh.position.copy(position);

      const theta = Math.random() * Math.PI * 2;
      const phi = (Math.random() - 0.2) * Math.PI * 0.5; // upward bias
      const vel = new THREE.Vector3(
        Math.cos(theta) * Math.cos(phi) * speed * spread * (0.5 + Math.random() * 0.5),
        Math.sin(phi) * speed * (0.8 + Math.random() * 0.5),
        Math.sin(theta) * Math.cos(phi) * speed * spread * (0.5 + Math.random() * 0.5)
      );

      this.scene.add(mesh);
      this.particles.push({
        mesh,
        vel,
        gravity,
        life: lifetime,
        maxLife: lifetime,
        rotSpeed: new THREE.Vector3(
          (Math.random() - 0.5) * 10,
          (Math.random() - 0.5) * 10,
          (Math.random() - 0.5) * 10
        )
      });
    }
  }

  // Splat impact against zombie
  emitFleshSplat(pos) {
    this.emit({
      position: pos,
      count: 12,
      color: 0x4a7c28, // Zombie decaying bile/green juice
      size: 0.08,
      speed: 3.0,
      lifetime: 0.45,
      gravity: -12
    });
  }

  // Metal sparks hitting bucket
  emitMetalSparks(pos) {
    this.emit({
      position: pos,
      count: 16,
      color: 0xffd700,
      size: 0.05,
      speed: 4.5,
      lifetime: 0.3,
      gravity: -15,
      glow: true
    });
  }

  // Frost mist hitting with snow pea
  emitFrostMist(pos) {
    this.emit({
      position: pos,
      count: 14,
      color: 0x67e8f9,
      size: 0.09,
      speed: 2.0,
      lifetime: 0.55,
      gravity: -2,
      glow: true
    });
  }

  // Dirt puff when plant is placed or zombie rises
  emitDirtPuff(pos) {
    this.emit({
      position: pos,
      count: 12,
      color: 0x5c4033,
      size: 0.12,
      speed: 2.2,
      lifetime: 0.5,
      gravity: -6
    });
  }

  // Massive explosion fireball & smoke
  emitExplosion(pos, radius = 3) {
    // Fire core
    this.emit({
      position: pos,
      count: 35,
      color: 0xff3b00,
      size: 0.35,
      speed: 8.0,
      lifetime: 0.7,
      gravity: -4,
      glow: true
    });
    // Orange embers
    this.emit({
      position: pos,
      count: 30,
      color: 0xffa500,
      size: 0.2,
      speed: 6.5,
      lifetime: 0.85,
      gravity: -8,
      glow: true
    });
    // Dark shockwave smoke
    this.emit({
      position: pos,
      count: 25,
      color: 0x262626,
      size: 0.4,
      speed: 4.0,
      lifetime: 1.0,
      gravity: 1.5 // drifts upward
    });
  }

  update(delta) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= delta;

      if (p.life <= 0) {
        this.scene.remove(p.mesh);
        p.mesh.geometry.dispose();
        if (p.mesh.material.dispose) p.mesh.material.dispose();
        this.particles.splice(i, 1);
        continue;
      }

      // Physics
      p.vel.y += p.gravity * delta;
      p.mesh.position.addScaledVector(p.vel, delta);

      // Bounce on ground
      if (p.mesh.position.y < 0.05) {
        p.mesh.position.y = 0.05;
        p.vel.y = -p.vel.y * 0.35;
        p.vel.x *= 0.6;
        p.vel.z *= 0.6;
      }

      // Rotation
      p.mesh.rotation.x += p.rotSpeed.x * delta;
      p.mesh.rotation.y += p.rotSpeed.y * delta;
      p.mesh.rotation.z += p.rotSpeed.z * delta;

      // Fade out
      const progress = p.life / p.maxLife;
      p.mesh.material.opacity = progress;
      p.mesh.scale.setScalar(Math.max(0.01, progress));
    }
  }

  clear() {
    for (const p of this.particles) {
      this.scene.remove(p.mesh);
      p.mesh.geometry.dispose();
    }
    this.particles = [];
  }
}
