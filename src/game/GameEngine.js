import * as THREE from 'three';
import { RendererManager } from '../core/Renderer.js';
import { CameraController } from '../core/Camera.js';
import { LightingManager } from '../core/Lighting.js';
import { EnvironmentFactory } from '../models/EnvironmentFactory.js';
import { GridManager } from './GridManager.js';
import { SunManager } from './SunManager.js';
import { Projectiles } from './Projectiles.js';
import { LawnMowerManager } from './LawnMower.js';
import { ParticleSystem } from '../effects/ParticleSystem.js';
import { ScreenShake } from '../effects/ScreenShake.js';
import { Plant } from './Plants.js';
import { Zombie } from './Zombies.js';
import { WaveManager } from './WaveManager.js';
import { PLANT_TYPES, LAWN_ORIGIN_X, CELL_WIDTH } from './Constants.js';
import { soundManager } from '../audio/SoundManager.js';

export class GameEngine {
  constructor(canvas, uiCallbacks) {
    this.canvas = canvas;
    this.ui = uiCallbacks;

    this.scene = new THREE.Scene();
    this.isNight = false;
    this.updateBackground();

    // Core Managers
    this.rendererManager = new RendererManager(this.canvas);
    this.cameraController = new CameraController(this.canvas);
    this.lightingManager = new LightingManager(this.scene);
    this.screenShake = new ScreenShake(this.cameraController.camera);
    this.particleSystem = new ParticleSystem(this.scene);

    // Environment
    this.environment = null;
    this.buildEnvironment(this.isNight);

    // Systems
    this.gridManager = new GridManager(this.scene);
    this.sunManager = new SunManager(this.scene, sun => {
      if (this.ui.onSunUpdate) this.ui.onSunUpdate(sun);
    });
    this.projectiles = new Projectiles(this.scene, this.particleSystem);
    this.lawnMowerManager = new LawnMowerManager(this.scene, this.particleSystem);

    // Game state collections
    this.plants = [];
    this.zombies = [];
    this.activeCard = null;
    this.isShovelActive = false;
    this.isPaused = false;
    this.gameOver = false;
    this.victory = false;

    // Raycaster for 3D interactions
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

    // Wave Manager
    this.waveManager = new WaveManager(
      (type, row) => this.spawnZombie(type, row),
      {
        onProgress: (p, cur, total) => this.ui.onWaveProgress && this.ui.onWaveProgress(p, cur, total),
        onAlert: text => this.ui.onWaveAlert && this.ui.onWaveAlert(text),
        onWin: () => this.handleVictory()
      }
    );

    // Setup events
    this.setupInputs();
    this.setupResize();

    // Time tracking
    this.lastFrameTime = performance.now();
  }

  updateBackground() {
    if (this.isNight) {
      this.scene.background = new THREE.Color(0x0a0f1d);
      this.scene.fog = new THREE.FogExp2(0x0a0f1d, 0.015);
    } else {
      this.scene.background = new THREE.Color(0x87ceeb);
      this.scene.fog = new THREE.FogExp2(0x87ceeb, 0.008);
    }
  }

  buildEnvironment(isNight) {
    if (this.environment) {
      this.scene.remove(this.environment);
    }
    this.environment = EnvironmentFactory.createEnvironment(isNight);
    this.scene.add(this.environment);
  }

  toggleDayNight() {
    this.isNight = !this.isNight;
    this.updateBackground();
    this.lightingManager.setNight(this.isNight);
    this.buildEnvironment(this.isNight);
    return this.isNight;
  }

  setQuality(level) {
    this.rendererManager.setQuality(level, this.lightingManager);
  }

  setupResize() {
    window.addEventListener('resize', () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      this.cameraController.onResize(w, h);
      this.rendererManager.onResize(w, h);
    });
  }

  setupInputs() {
    const getPointerCoords = e => {
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      const rect = this.canvas.getBoundingClientRect();
      return {
        x: ((clientX - rect.left) / rect.width) * 2 - 1,
        y: -((clientY - rect.top) / rect.height) * 2 + 1,
        clientX,
        clientY
      };
    };

    const handlePointerMove = e => {
      const coords = getPointerCoords(e);
      this.mouse.set(coords.x, coords.y);

      // Check sun hover
      this.raycaster.setFromCamera(this.mouse, this.cameraController.camera);

      // Magnet sun pickup on mobile or mouse hover
      const sunMeshes = this.sunManager.getClickableMeshes();
      if (sunMeshes.length > 0) {
        const sunHits = this.raycaster.intersectObjects(sunMeshes, true);
        if (sunHits.length > 0) {
          const hitSun = this.sunManager.getSunByMesh(sunHits[0].object);
          if (hitSun) this.sunManager.collectSun(hitSun);
        }
      }

      // Grid placement preview
      if (this.activeCard || this.isShovelActive) {
        const intersectionPoint = new THREE.Vector3();
        if (this.raycaster.ray.intersectPlane(this.groundPlane, intersectionPoint)) {
          const cell = this.gridManager.worldToCell(intersectionPoint.x, intersectionPoint.z);
          if (cell) {
            const isOcc = this.gridManager.isOccupied(cell.row, cell.col);
            const isValid = this.isShovelActive ? isOcc : !isOcc;
            this.gridManager.updateCursor(cell.row, cell.col, isValid);
          } else {
            this.gridManager.hideCursor();
          }
        }
      } else {
        this.gridManager.hideCursor();
      }
    };

    const handlePointerDown = e => {
      soundManager.init(); // User gesture unlocks Web Audio
      soundManager.resume();

      if (e.button === 2) return; // Right click for orbit camera

      const coords = getPointerCoords(e);
      this.mouse.set(coords.x, coords.y);
      this.raycaster.setFromCamera(this.mouse, this.cameraController.camera);

      // 1. Try to click suns
      const sunMeshes = this.sunManager.getClickableMeshes();
      if (sunMeshes.length > 0) {
        const sunHits = this.raycaster.intersectObjects(sunMeshes, true);
        if (sunHits.length > 0) {
          const hitSun = this.sunManager.getSunByMesh(sunHits[0].object);
          if (hitSun) {
            this.sunManager.collectSun(hitSun);
            return;
          }
        }
      }

      // 2. Try to plant or shovel on grid
      const intersectionPoint = new THREE.Vector3();
      if (this.raycaster.ray.intersectPlane(this.groundPlane, intersectionPoint)) {
        const cell = this.gridManager.worldToCell(intersectionPoint.x, intersectionPoint.z);
        if (!cell) return;

        if (this.isShovelActive) {
          const plant = this.gridManager.removePlant(cell.row, cell.col);
          if (plant) {
            plant.destroy();
            const pIdx = this.plants.indexOf(plant);
            if (pIdx !== -1) this.plants.splice(pIdx, 1);
            this.particleSystem.emitDirtPuff(plant.worldPos);
          }
          this.isShovelActive = false;
          this.gridManager.hideCursor();
          if (this.ui.onShovelChange) this.ui.onShovelChange(false);
          return;
        }

        if (this.activeCard) {
          const plantType = PLANT_TYPES[this.activeCard];
          if (plantType && !this.gridManager.isOccupied(cell.row, cell.col)) {
            if (this.sunManager.spendSun(plantType.cost)) {
              const cellPos = this.gridManager.getCellPosition(cell.row, cell.col);
              const plant = new Plant(plantType, cell.row, cell.col, cellPos, this.scene, {
                projectiles: this.projectiles,
                sunManager: this.sunManager,
                particleSystem: this.particleSystem,
                screenShake: this.screenShake
              });

              this.gridManager.setPlant(cell.row, cell.col, plant);
              this.plants.push(plant);

              if (this.ui.onPlantPlaced) this.ui.onPlantPlaced(this.activeCard);
              this.activeCard = null;
              this.gridManager.hideCursor();
            }
          }
        }
      }
    };

    this.canvas.addEventListener('mousemove', handlePointerMove);
    this.canvas.addEventListener('mousedown', handlePointerDown);
    this.canvas.addEventListener('touchmove', handlePointerMove, { passive: true });
    this.canvas.addEventListener('touchstart', handlePointerDown, { passive: true });
  }

  selectCard(cardKey) {
    this.isShovelActive = false;
    if (this.ui.onShovelChange) this.ui.onShovelChange(false);

    if (this.activeCard === cardKey) {
      this.activeCard = null;
      this.gridManager.hideCursor();
    } else {
      this.activeCard = cardKey;
    }
  }

  toggleShovel() {
    this.activeCard = null;
    this.isShovelActive = !this.isShovelActive;
    if (!this.isShovelActive) {
      this.gridManager.hideCursor();
    }
    return this.isShovelActive;
  }

  spawnZombie(zombieType, row) {
    const zombie = new Zombie(zombieType, row, this.scene, {
      particleSystem: this.particleSystem,
      screenShake: this.screenShake
    });
    this.zombies.push(zombie);
  }

  handleVictory() {
    this.victory = true;
    soundManager.playWin();
    if (this.ui.onGameOver) this.ui.onGameOver(true);
  }

  handleDefeat() {
    this.gameOver = true;
    soundManager.playLose();
    if (this.ui.onGameOver) this.ui.onGameOver(false);
  }

  restart() {
    // Clear plants
    for (const p of this.plants) {
      p.destroy();
      this.gridManager.removePlant(p.row, p.col);
    }
    this.plants = [];

    // Clear zombies
    for (const z of this.zombies) {
      z.destroy();
    }
    this.zombies = [];

    // Reset systems
    this.projectiles.clear();
    this.particleSystem.clear();
    this.sunManager.clear();
    this.sunManager.currentSun = 150;
    if (this.ui.onSunUpdate) this.ui.onSunUpdate(150);

    this.lawnMowerManager.initMowers();

    // Reset waves
    this.waveManager = new WaveManager(
      (type, row) => this.spawnZombie(type, row),
      {
        onProgress: (p, cur, total) => this.ui.onWaveProgress && this.ui.onWaveProgress(p, cur, total),
        onAlert: text => this.ui.onWaveAlert && this.ui.onWaveAlert(text),
        onWin: () => this.handleVictory()
      }
    );

    this.gameOver = false;
    this.victory = false;
    this.isPaused = false;
    this.activeCard = null;
    this.isShovelActive = false;
    this.gridManager.hideCursor();
  }

  start() {
    this.lastFrameTime = performance.now();
    this.animate();
  }

  animate = () => {
    requestAnimationFrame(this.animate);

    const now = performance.now();
    const delta = Math.min((now - this.lastFrameTime) / 1000, 0.1);
    this.lastFrameTime = now;

    if (!this.isPaused && !this.gameOver) {
      // 1. Update Screen Shake & Camera
      this.screenShake.update(delta);
      this.cameraController.update(delta, this.screenShake.getOffset());

      // 2. Update Systems
      this.particleSystem.update(delta);
      this.sunManager.update(delta, this.cameraController.camera);
      this.projectiles.update(delta, this.zombies);
      this.lawnMowerManager.update(delta, this.zombies);

      // 3. Update Plants
      for (let i = this.plants.length - 1; i >= 0; i--) {
        const plant = this.plants[i];
        if (!plant.isAlive) {
          this.gridManager.removePlant(plant.row, plant.col);
          this.plants.splice(i, 1);
          continue;
        }
        plant.update(delta, this.zombies);
      }

      // 4. Update Zombies & Check Game Over
      for (let i = this.zombies.length - 1; i >= 0; i--) {
        const zombie = this.zombies[i];
        if (!zombie.isAlive) {
          this.zombies.splice(i, 1);
          continue;
        }

        zombie.update(delta, this.plants);

        // Check if zombie breached defense without lawn mower
        if (zombie.root.position.x <= LAWN_ORIGIN_X - CELL_WIDTH * 1.5) {
          this.handleDefeat();
          break;
        }
      }

      // 5. Update Wave progression
      if (!this.gameOver) {
        this.waveManager.update(delta, this.zombies.length);
      }
    }

    // Render Scene
    this.rendererManager.render(this.scene, this.cameraController.camera);
  };
}
