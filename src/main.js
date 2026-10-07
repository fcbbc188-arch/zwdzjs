import { GameEngine } from './game/GameEngine.js';
import { HUD } from './ui/HUD.js';

function init() {
  const canvas = document.getElementById('game-canvas');
  if (!canvas) {
    console.error('Canvas element not found');
    return;
  }

  // Callbacks bridging GameEngine events to HUD
  const uiBridge = {
    onSunUpdate: null,
    onWaveProgress: null,
    onWaveAlert: null,
    onPlantPlaced: null,
    onShovelChange: null,
    onGameOver: null
  };

  const engine = new GameEngine(canvas, uiBridge);
  const hud = new HUD(engine);

  // Wire callbacks
  uiBridge.onSunUpdate = sun => hud.updateSun(sun);
  uiBridge.onWaveProgress = (p, cur, total) => hud.updateWave(p, cur, total);
  uiBridge.onWaveAlert = text => hud.showWaveAlert(text);
  uiBridge.onPlantPlaced = cardKey => hud.onPlantPlaced(cardKey);
  uiBridge.onShovelChange = active => {
    hud.shovelBtn.classList.toggle('active', active);
  };
  uiBridge.onGameOver = isWin => hud.showGameOver(isWin);

  // Start engine loop
  engine.start();

  // Initial sun HUD sync
  hud.updateSun(engine.sunManager.currentSun);
}

// Safely handle both cases: DOM already loaded or loading
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
