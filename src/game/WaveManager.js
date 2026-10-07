import { ZOMBIE_TYPES, GRID_ROWS } from './Constants.js';
import { soundManager } from '../audio/SoundManager.js';

export class WaveManager {
  constructor(spawnZombieCallback, uiCallbacks) {
    this.spawnZombie = spawnZombieCallback;
    this.ui = uiCallbacks; // { onProgress, onAlert, onWin }

    this.totalWaves = 5;
    this.currentWave = 0;
    this.waveTimer = 10.0; // initial calm before first zombie
    this.spawningQueue = [];
    this.isSpawning = false;
    this.waveInProgress = true;
    this.allWavesSpawned = false;
  }

  update(delta, activeZombiesCount) {
    if (this.allWavesSpawned) {
      if (activeZombiesCount === 0 && this.waveInProgress) {
        this.waveInProgress = false;
        if (this.ui.onWin) this.ui.onWin();
      }
      return;
    }

    // Process spawning queue
    if (this.spawningQueue.length > 0) {
      this.spawnDelay = (this.spawnDelay || 0) - delta;
      if (this.spawnDelay <= 0) {
        const item = this.spawningQueue.shift();
        const randRow = Math.floor(Math.random() * GRID_ROWS);
        this.spawnZombie(item.type, randRow);
        this.spawnDelay = item.delay || 1.2;
      }
      return;
    }

    // Wave countdown timer
    this.waveTimer -= delta;

    // Trigger next wave either when timer expires OR all zombies from current wave are defeated (after min delay)
    if (this.waveTimer <= 0 || (this.currentWave > 0 && activeZombiesCount === 0 && this.waveTimer < 18.0)) {
      this.startNextWave();
    }

    // Update UI progress
    const baseProgress = (this.currentWave / this.totalWaves) * 100;
    if (this.ui.onProgress) {
      this.ui.onProgress(baseProgress, this.currentWave, this.totalWaves);
    }
  }

  startNextWave() {
    this.currentWave++;

    if (this.currentWave === 3) {
      // Huge Wave 1
      soundManager.playWaveAlert();
      if (this.ui.onAlert) this.ui.onAlert('一大波僵尸正在逼近！');
    } else if (this.currentWave === 5) {
      // Final Wave
      soundManager.playWaveAlert();
      if (this.ui.onAlert) this.ui.onAlert('最后一波！决战时刻！');
    }

    this.generateWaveZombies(this.currentWave);

    if (this.currentWave >= this.totalWaves) {
      this.allWavesSpawned = true;
    } else {
      this.waveTimer = 32.0; // time before next wave
    }
  }

  generateWaveZombies(waveIndex) {
    const queue = [];

    switch (waveIndex) {
      case 1:
        // Warmup: 3 normal zombies
        queue.push({ type: ZOMBIE_TYPES.NORMAL, delay: 2.0 });
        queue.push({ type: ZOMBIE_TYPES.NORMAL, delay: 5.0 });
        queue.push({ type: ZOMBIE_TYPES.NORMAL, delay: 4.0 });
        break;

      case 2:
        // Reinforced: Normal + Conehead
        queue.push({ type: ZOMBIE_TYPES.NORMAL, delay: 2.0 });
        queue.push({ type: ZOMBIE_TYPES.CONEHEAD, delay: 4.0 });
        queue.push({ type: ZOMBIE_TYPES.NORMAL, delay: 3.0 });
        queue.push({ type: ZOMBIE_TYPES.CONEHEAD, delay: 3.5 });
        break;

      case 3:
        // Huge Wave: Flag zombie + Pole Vault + Conehead horde
        queue.push({ type: ZOMBIE_TYPES.FLAG, delay: 1.0 });
        queue.push({ type: ZOMBIE_TYPES.NORMAL, delay: 1.2 });
        queue.push({ type: ZOMBIE_TYPES.POLE_VAULT, delay: 1.5 });
        queue.push({ type: ZOMBIE_TYPES.CONEHEAD, delay: 1.0 });
        queue.push({ type: ZOMBIE_TYPES.NORMAL, delay: 1.2 });
        queue.push({ type: ZOMBIE_TYPES.CONEHEAD, delay: 1.5 });
        break;

      case 4:
        // Heavy Armor: Bucketheads + Pole Vaulters
        queue.push({ type: ZOMBIE_TYPES.NORMAL, delay: 1.0 });
        queue.push({ type: ZOMBIE_TYPES.BUCKETHEAD, delay: 2.5 });
        queue.push({ type: ZOMBIE_TYPES.POLE_VAULT, delay: 2.0 });
        queue.push({ type: ZOMBIE_TYPES.CONEHEAD, delay: 1.5 });
        queue.push({ type: ZOMBIE_TYPES.BUCKETHEAD, delay: 2.0 });
        break;

      case 5:
        // Final Wave: Boss Gargantuar + Bucketheads + Flag Zombie + All types
        queue.push({ type: ZOMBIE_TYPES.FLAG, delay: 0.8 });
        queue.push({ type: ZOMBIE_TYPES.GARGANTUAR, delay: 2.0 }); // BOSS!
        queue.push({ type: ZOMBIE_TYPES.BUCKETHEAD, delay: 1.2 });
        queue.push({ type: ZOMBIE_TYPES.POLE_VAULT, delay: 1.5 });
        queue.push({ type: ZOMBIE_TYPES.CONEHEAD, delay: 1.0 });
        queue.push({ type: ZOMBIE_TYPES.BUCKETHEAD, delay: 1.5 });
        queue.push({ type: ZOMBIE_TYPES.NORMAL, delay: 0.8 });
        queue.push({ type: ZOMBIE_TYPES.NORMAL, delay: 0.8 });
        break;
    }

    this.spawningQueue = queue;
    this.spawnDelay = 1.0;
  }
}
