import { PLANT_TYPES } from '../game/Constants.js';
import { soundManager } from '../audio/SoundManager.js';

export class HUD {
  constructor(engine) {
    this.engine = engine;
    this.cardCooldowns = {};
    this.initElements();
    this.initCards();
    this.setupListeners();
    this.startCooldownLoop();
  }

  initElements() {
    this.sunValueEl = document.getElementById('sun-value');
    this.cardDeckEl = document.getElementById('card-deck');
    this.waveFillEl = document.getElementById('wave-fill');
    this.waveTextEl = document.getElementById('wave-text');
    this.waveBannerEl = document.getElementById('wave-banner');
    this.shovelBtn = document.getElementById('shovel-btn');

    this.btnCam = document.getElementById('btn-cam');
    this.btnNight = document.getElementById('btn-night');
    this.btnSound = document.getElementById('btn-sound');
    this.btnQuality = document.getElementById('btn-quality');
    this.btnHelp = document.getElementById('btn-help');

    this.modalGameOver = document.getElementById('modal-game-over');
    this.modalTitle = document.getElementById('modal-title');
    this.modalDesc = document.getElementById('modal-desc');
    this.btnRestart = document.getElementById('btn-restart');

    this.modalHelp = document.getElementById('modal-help');
    this.btnCloseHelp = document.getElementById('btn-close-help');
  }

  initCards() {
    this.cardDeckEl.innerHTML = '';

    const plantKeys = [
      'SUNFLOWER',
      'PEASHOOTER',
      'SNOW_PEA',
      'WALLNUT',
      'POTATO_MINE',
      'CHOMPER',
      'CHERRY_BOMB'
    ];

    plantKeys.forEach((key, index) => {
      const plant = PLANT_TYPES[key];
      this.cardCooldowns[key] = {
        cooldown: plant.cooldown,
        current: 0 // ready initially
      };

      const card = document.createElement('div');
      card.className = 'plant-card';
      card.dataset.key = key;
      card.dataset.cost = plant.cost;

      card.innerHTML = `
        <div class="card-cooldown-overlay"></div>
        <div class="card-icon">${plant.icon}</div>
        <div class="card-name">${plant.name}</div>
        <div class="card-cost">☀️${plant.cost}</div>
        <div class="card-keyhint">${index + 1}</div>
      `;

      card.addEventListener('click', () => {
        if (card.classList.contains('disabled')) return;
        this.selectCard(key);
      });

      this.cardDeckEl.appendChild(card);
    });
  }

  setupListeners() {
    // Shovel
    this.shovelBtn.addEventListener('click', () => {
      const active = this.engine.toggleShovel();
      this.shovelBtn.classList.toggle('active', active);
      this.clearCardSelection();
    });

    // Camera preset cycle
    this.btnCam.addEventListener('click', () => {
      const mode = this.engine.cameraController.cycleMode();
      const labels = { classic: '经典全景', portrait: '纵向长轴', cinematic: '特写动作', topDown: '战术俯视' };
      this.btnCam.title = `切换视角 (${labels[mode] || mode})`;
    });

    // Day / Night toggle
    this.btnNight.addEventListener('click', () => {
      const isNight = this.engine.toggleDayNight();
      this.btnNight.textContent = isNight ? '🌙' : '☀️';
      this.btnNight.title = isNight ? '夜间墓地' : '日间草坪';
    });

    // Sound toggle
    this.btnSound.addEventListener('click', () => {
      const muted = soundManager.toggleMute();
      this.btnSound.textContent = muted ? '🔇' : '🔊';
      this.btnSound.title = muted ? '已静音' : '音效开启';
    });

    // Graphics Quality
    const qualityPresets = ['HIGH', 'MEDIUM', 'LOW'];
    let qIdx = 0;
    this.btnQuality.addEventListener('click', () => {
      qIdx = (qIdx + 1) % qualityPresets.length;
      const q = qualityPresets[qIdx];
      this.engine.setQuality(q);
      const labels = { HIGH: '画质: 高', MEDIUM: '画质: 中', LOW: '画质: 低' };
      this.btnQuality.textContent = labels[q];
    });

    // Help Modal
    this.btnHelp.addEventListener('click', () => {
      this.modalHelp.classList.remove('hidden');
    });
    this.btnCloseHelp.addEventListener('click', () => {
      this.modalHelp.classList.add('hidden');
    });

    // Restart
    this.btnRestart.addEventListener('click', () => {
      this.modalGameOver.classList.add('hidden');
      this.engine.restart();
    });

    // Keyboard shortcuts (1 - 7 to select cards, S for shovel, C for camera, N for night)
    window.addEventListener('keydown', e => {
      const plantKeys = [
        'SUNFLOWER',
        'PEASHOOTER',
        'SNOW_PEA',
        'WALLNUT',
        'POTATO_MINE',
        'CHOMPER',
        'CHERRY_BOMB'
      ];
      const num = parseInt(e.key);
      if (num >= 1 && num <= 7) {
        const key = plantKeys[num - 1];
        const cardEl = this.cardDeckEl.querySelector(`[data-key="${key}"]`);
        if (cardEl && !cardEl.classList.contains('disabled')) {
          this.selectCard(key);
        }
      } else if (e.key.toLowerCase() === 's') {
        this.shovelBtn.click();
      } else if (e.key.toLowerCase() === 'c') {
        this.btnCam.click();
      } else if (e.key.toLowerCase() === 'n') {
        this.btnNight.click();
      }
    });
  }

  selectCard(key) {
    this.shovelBtn.classList.remove('active');
    this.engine.selectCard(key);

    const cards = this.cardDeckEl.querySelectorAll('.plant-card');
    cards.forEach(card => {
      if (card.dataset.key === key && this.engine.activeCard === key) {
        card.classList.add('selected');
      } else {
        card.classList.remove('selected');
      }
    });
  }

  clearCardSelection() {
    const cards = this.cardDeckEl.querySelectorAll('.plant-card');
    cards.forEach(card => card.classList.remove('selected'));
  }

  onPlantPlaced(cardKey) {
    if (this.cardCooldowns[cardKey]) {
      this.cardCooldowns[cardKey].current = this.cardCooldowns[cardKey].cooldown;
    }
    this.clearCardSelection();
  }

  updateSun(amount) {
    this.sunValueEl.textContent = amount;
    this.updateCardAffordability(amount);
  }

  updateCardAffordability(currentSun) {
    const cards = this.cardDeckEl.querySelectorAll('.plant-card');
    cards.forEach(card => {
      const cost = parseInt(card.dataset.cost);
      const key = card.dataset.key;
      const cooling = this.cardCooldowns[key] && this.cardCooldowns[key].current > 0;

      if (currentSun < cost || cooling) {
        card.classList.add('disabled');
      } else {
        card.classList.remove('disabled');
      }
    });
  }

  updateWave(progress, currentWave, totalWaves) {
    this.waveFillEl.style.width = `${progress}%`;
    this.waveTextEl.textContent = `波次 ${currentWave} / ${totalWaves}`;
  }

  showWaveAlert(text) {
    this.waveBannerEl.textContent = text;
    this.waveBannerEl.classList.remove('hidden');
    this.waveBannerEl.classList.add('banner-pulse');

    setTimeout(() => {
      this.waveBannerEl.classList.add('hidden');
      this.waveBannerEl.classList.remove('banner-pulse');
    }, 3200);
  }

  showGameOver(isVictory) {
    this.modalGameOver.classList.remove('hidden');
    if (isVictory) {
      this.modalTitle.textContent = '🎉 胜利！庭院保卫成功！';
      this.modalTitle.style.color = '#22c55e';
      this.modalDesc.textContent = '你成功击溃了所有波次的丧尸军团与巨型丧尸！你的植物展现了非凡的实力！';
    } else {
      this.modalTitle.textContent = '💀 僵尸吃掉了你的脑子！';
      this.modalTitle.style.color = '#ef4444';
      this.modalDesc.textContent = '丧尸突破了最后防线。重整旗鼓，合理布置向日葵与高坚果再战一次吧！';
    }
  }

  startCooldownLoop() {
    let lastTime = performance.now();
    const tick = now => {
      const delta = (now - lastTime) / 1000;
      lastTime = now;

      Object.keys(this.cardCooldowns).forEach(key => {
        const cd = this.cardCooldowns[key];
        if (cd.current > 0) {
          cd.current = Math.max(0, cd.current - delta);
          const ratio = cd.current / cd.cooldown;
          const cardEl = this.cardDeckEl.querySelector(`[data-key="${key}"]`);
          if (cardEl) {
            const overlay = cardEl.querySelector('.card-cooldown-overlay');
            if (overlay) {
              overlay.style.height = `${ratio * 100}%`;
            }
          }
        }
      });

      this.updateCardAffordability(this.engine.sunManager.currentSun);
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
}
