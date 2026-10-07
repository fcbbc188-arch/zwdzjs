export const GRID_ROWS = 5;
export const GRID_COLS = 9;
export const CELL_WIDTH = 2.4;
export const CELL_DEPTH = 2.4;

export const LAWN_ORIGIN_X = -(GRID_COLS * CELL_WIDTH) / 2 + CELL_WIDTH / 2; // -9.6
export const LAWN_ORIGIN_Z = -(GRID_ROWS * CELL_DEPTH) / 2 + CELL_DEPTH / 2; // -4.8

export const PLANT_TYPES = {
  SUNFLOWER: {
    id: 'sunflower',
    name: '向日葵',
    nameEn: 'Sunflower',
    cost: 50,
    cooldown: 7.5,
    hp: 300,
    icon: '🌻',
    desc: '生产额外的阳光，支撑你的植物大军。'
  },
  PEASHOOTER: {
    id: 'peashooter',
    name: '豌豆射手',
    nameEn: 'Peashooter',
    cost: 100,
    cooldown: 7.5,
    hp: 300,
    attackRate: 1.4,
    damage: 20,
    icon: '🌱',
    desc: '向正前方射击坚硬的豌豆子弹。'
  },
  SNOW_PEA: {
    id: 'snow_pea',
    name: '寒冰射手',
    nameEn: 'Snow Pea',
    cost: 175,
    cooldown: 7.5,
    hp: 300,
    attackRate: 1.4,
    damage: 20,
    slowDuration: 4.0,
    icon: '❄️',
    desc: '发射寒冰豌豆，伤害并大幅减缓僵尸速度。'
  },
  WALLNUT: {
    id: 'wallnut',
    name: '坚果墙',
    nameEn: 'Wall-nut',
    cost: 50,
    cooldown: 25.0,
    hp: 4000,
    icon: '🌰',
    desc: '坚硬如岩石的外壳，能长时间阻挡僵尸进攻。'
  },
  POTATO_MINE: {
    id: 'potato_mine',
    name: '土豆地雷',
    nameEn: 'Potato Mine',
    cost: 25,
    cooldown: 20.0,
    hp: 300,
    armTime: 12.0,
    damage: 1800,
    icon: '🥔',
    desc: '需要时间破土蓄力，僵尸踩中瞬间发生粉碎性爆炸。'
  },
  CHOMPER: {
    id: 'chomper',
    name: '大嘴花',
    nameEn: 'Chomper',
    cost: 150,
    cooldown: 10.0,
    hp: 400,
    chewTime: 15.0,
    icon: '🪴',
    desc: '能一口吞掉前方的普通与路障丧尸，吞咽时处于脆弱状态。'
  },
  CHERRY_BOMB: {
    id: 'cherry_bomb',
    name: '樱桃炸弹',
    nameEn: 'Cherry Bomb',
    cost: 150,
    cooldown: 35.0,
    hp: 500,
    fuseTime: 1.2,
    damage: 1800,
    icon: '🍒',
    desc: '点燃引信自爆，对以自身为中心的 3x3 范围造成毁灭性打击。'
  }
};

export const ZOMBIE_TYPES = {
  NORMAL: {
    id: 'normal',
    name: '普通丧尸',
    nameEn: 'Zombie',
    hp: 200,
    speed: 0.35,
    attackDps: 100,
    score: 100
  },
  CONEHEAD: {
    id: 'conehead',
    name: '路障丧尸',
    nameEn: 'Conehead Zombie',
    hp: 200,
    armorHp: 370,
    speed: 0.35,
    attackDps: 100,
    score: 200
  },
  BUCKETHEAD: {
    id: 'buckethead',
    name: '铁桶丧尸',
    nameEn: 'Buckethead Zombie',
    hp: 200,
    armorHp: 1100,
    speed: 0.35,
    attackDps: 100,
    score: 350
  },
  POLE_VAULT: {
    id: 'pole_vault',
    name: '撑杆跳丧尸',
    nameEn: 'Pole Vaulting Zombie',
    hp: 340,
    runSpeed: 0.85,
    walkSpeed: 0.35,
    attackDps: 100,
    score: 300
  },
  FLAG: {
    id: 'flag',
    name: '摇旗丧尸',
    nameEn: 'Flag Zombie',
    hp: 240,
    speed: 0.5,
    attackDps: 100,
    score: 250
  },
  GARGANTUAR: {
    id: 'gargantuar',
    name: '巨型丧尸',
    nameEn: 'Gargantuar',
    hp: 3000,
    speed: 0.22,
    attackDps: 500, // Smashes plants instantly
    smashCooldown: 2.2,
    score: 1000
  }
};

export const GRAPHICS_PRESETS = {
  LOW: {
    name: '低画质 (极速)',
    shadows: false,
    particles: 'minimal',
    dpr: 1.0,
    antialias: false
  },
  MEDIUM: {
    name: '中画质 (流畅)',
    shadows: true,
    shadowMapSize: 1024,
    particles: 'normal',
    dpr: Math.min(window.devicePixelRatio || 1, 1.5),
    antialias: true
  },
  HIGH: {
    name: '高画质 (极致)',
    shadows: true,
    shadowMapSize: 2048,
    particles: 'high',
    dpr: Math.min(window.devicePixelRatio || 1, 2.0),
    antialias: true
  }
};
