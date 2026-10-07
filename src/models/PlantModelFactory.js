import * as THREE from 'three';

/**
 * PlantModelFactory creates high-fidelity, realistic 3D PBR plant models.
 * Includes natural materials, organic curves, and animation pivot nodes.
 */
export class PlantModelFactory {
  // Shared materials for performance and visual consistency
  static materials = {
    stemGreen: new THREE.MeshStandardMaterial({
      color: 0x3d8b37,
      roughness: 0.6,
      metalness: 0.05
    }),
    leafGreen: new THREE.MeshStandardMaterial({
      color: 0x4aa53e,
      roughness: 0.5,
      metalness: 0.05,
      side: THREE.DoubleSide
    }),
    darkGreen: new THREE.MeshStandardMaterial({
      color: 0x245821,
      roughness: 0.7,
      metalness: 0.0
    }),
    soilBrown: new THREE.MeshStandardMaterial({
      color: 0x4a2e18,
      roughness: 0.9,
      metalness: 0.0
    }),
    eyeWhite: new THREE.MeshStandardMaterial({
      color: 0xf3f4f6,
      roughness: 0.2,
      metalness: 0.0
    }),
    eyePupil: new THREE.MeshStandardMaterial({
      color: 0x111827,
      roughness: 0.1,
      metalness: 0.1
    })
  };

  /**
   * Helper to create leafy base
   */
  static createLeafBase() {
    const group = new THREE.Group();
    const leafGeom = new THREE.ConeGeometry(0.35, 0.9, 5);
    leafGeom.scale(1, 0.15, 2.0);
    leafGeom.rotateX(Math.PI / 2);

    for (let i = 0; i < 4; i++) {
      const angle = (i * Math.PI) / 2 + Math.PI / 4;
      const leaf = new THREE.Mesh(leafGeom, this.materials.leafGreen);
      leaf.position.set(Math.cos(angle) * 0.4, 0.05, Math.sin(angle) * 0.4);
      leaf.rotation.y = angle;
      leaf.rotation.x = 0.2;
      leaf.castShadow = true;
      group.add(leaf);
    }
    return group;
  }

  /**
   * 1. Sunflower (向日葵)
   */
  static createSunflower() {
    const root = new THREE.Group();
    root.name = 'sunflower';

    // Base leaves
    root.add(this.createLeafBase());

    // Stem with slight organic curve
    const stemCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0.05, 0.6, -0.05),
      new THREE.Vector3(0, 1.2, 0)
    ]);
    const stemGeom = new THREE.TubeGeometry(stemCurve, 12, 0.08, 8, false);
    const stem = new THREE.Mesh(stemGeom, this.materials.stemGreen);
    stem.castShadow = true;
    root.add(stem);

    // Stem leaves
    const stemLeafGeom = new THREE.ConeGeometry(0.2, 0.6, 4);
    stemLeafGeom.scale(1, 0.2, 2.2);
    const stemLeaf1 = new THREE.Mesh(stemLeafGeom, this.materials.leafGreen);
    stemLeaf1.position.set(-0.2, 0.6, 0);
    stemLeaf1.rotation.set(0.3, 0, 1.2);
    stemLeaf1.castShadow = true;
    root.add(stemLeaf1);

    // Head pivot (for breathing/swaying animations)
    const headPivot = new THREE.Group();
    headPivot.position.set(0, 1.2, 0);
    root.add(headPivot);

    // Flower back sepals
    const sepalGeom = new THREE.CylinderGeometry(0.35, 0.2, 0.15, 8);
    const sepal = new THREE.Mesh(sepalGeom, this.materials.darkGreen);
    sepal.rotation.x = Math.PI / 2;
    sepal.position.z = -0.1;
    headPivot.add(sepal);

    // Center seed disc with warm golden brown PBR
    const centerGeom = new THREE.CylinderGeometry(0.48, 0.48, 0.12, 24);
    const centerMat = new THREE.MeshStandardMaterial({
      color: 0x5a3411,
      roughness: 0.85,
      metalness: 0.1
    });
    const centerDisc = new THREE.Mesh(centerGeom, centerMat);
    centerDisc.rotation.x = Math.PI / 2;
    centerDisc.castShadow = true;
    headPivot.add(centerDisc);

    // Inner glowing ring
    const ringGeom = new THREE.TorusGeometry(0.42, 0.06, 8, 24);
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      roughness: 0.4,
      emissive: 0xd97706,
      emissiveIntensity: 0.4
    });
    const ring = new THREE.Mesh(ringGeom, ringMat);
    ring.position.z = 0.06;
    headPivot.add(ring);

    // Expressive face features
    const eyeGeom = new THREE.SphereGeometry(0.06, 12, 12);
    const eyeL = new THREE.Mesh(eyeGeom, this.materials.eyePupil);
    eyeL.position.set(-0.16, 0.08, 0.08);
    eyeL.scale.set(0.7, 1.3, 0.4);
    const eyeR = eyeL.clone();
    eyeR.position.x = 0.16;
    headPivot.add(eyeL, eyeR);

    // Smiling mouth
    const mouthGeom = new THREE.TorusGeometry(0.12, 0.025, 6, 12, Math.PI);
    const mouthMat = new THREE.MeshBasicMaterial({ color: 0x1f1f1f });
    const mouth = new THREE.Mesh(mouthGeom, mouthMat);
    mouth.position.set(0, -0.1, 0.08);
    mouth.rotation.x = Math.PI;
    headPivot.add(mouth);

    // Double ring of golden petals
    const petalGeom = new THREE.ConeGeometry(0.16, 0.55, 6);
    petalGeom.scale(1, 0.2, 1.8);
    const petalMat = new THREE.MeshStandardMaterial({
      color: 0xfbbf24,
      roughness: 0.4,
      metalness: 0.05,
      emissive: 0xb45309,
      emissiveIntensity: 0.15
    });

    const petalCount = 16;
    for (let i = 0; i < petalCount; i++) {
      const angle = (i / petalCount) * Math.PI * 2;
      const petal = new THREE.Mesh(petalGeom, petalMat);
      petal.position.set(Math.cos(angle) * 0.58, Math.sin(angle) * 0.58, -0.02);
      petal.rotation.z = angle - Math.PI / 2;
      petal.rotation.x = -0.15;
      petal.castShadow = true;
      headPivot.add(petal);

      // Inner layer offset
      if (i % 2 === 0) {
        const innerPetal = petal.clone();
        innerPetal.position.set(Math.cos(angle + 0.2) * 0.48, Math.sin(angle + 0.2) * 0.48, 0.02);
        innerPetal.scale.set(0.85, 0.85, 0.85);
        headPivot.add(innerPetal);
      }
    }

    root.userData = { headPivot, ringMat };
    return root;
  }

  /**
   * 2. Peashooter (豌豆射手)
   */
  static createPeashooter() {
    const root = new THREE.Group();
    root.name = 'peashooter';

    root.add(this.createLeafBase());

    // Stem
    const stemCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0.05, 0.55, -0.08),
      new THREE.Vector3(0, 1.15, 0)
    ]);
    const stemGeom = new THREE.TubeGeometry(stemCurve, 12, 0.09, 8, false);
    const stem = new THREE.Mesh(stemGeom, this.materials.stemGreen);
    stem.castShadow = true;
    root.add(stem);

    // Head pivot for recoil and aiming
    const headPivot = new THREE.Group();
    headPivot.position.set(0, 1.15, 0);
    root.add(headPivot);

    // Bulbous head
    const headGeom = new THREE.SphereGeometry(0.44, 20, 20);
    const headMat = new THREE.MeshStandardMaterial({
      color: 0x48bb78,
      roughness: 0.35,
      metalness: 0.05
    });
    const headMesh = new THREE.Mesh(headGeom, headMat);
    headMesh.scale.set(1.0, 1.05, 1.1);
    headMesh.castShadow = true;
    headPivot.add(headMesh);

    // Cannon snout
    const snoutGeom = new THREE.CylinderGeometry(0.18, 0.22, 0.5, 16);
    const snoutMesh = new THREE.Mesh(snoutGeom, headMat);
    snoutMesh.rotation.x = Math.PI / 2;
    snoutMesh.position.set(0, 0, 0.55);
    snoutMesh.castShadow = true;
    headPivot.add(snoutMesh);

    // Muzzle rim
    const muzzleRimGeom = new THREE.TorusGeometry(0.2, 0.05, 8, 16);
    const muzzleRim = new THREE.Mesh(muzzleRimGeom, this.materials.darkGreen);
    muzzleRim.position.set(0, 0, 0.78);
    headPivot.add(muzzleRim);

    // Dark mouth interior hole
    const mouthHoleGeom = new THREE.CircleGeometry(0.16, 16);
    const mouthHoleMat = new THREE.MeshBasicMaterial({ color: 0x051b04 });
    const mouthHole = new THREE.Mesh(mouthHoleGeom, mouthHoleMat);
    mouthHole.position.set(0, 0, 0.79);
    headPivot.add(mouthHole);

    // Back cowl leaf
    const cowlGeom = new THREE.ConeGeometry(0.25, 0.6, 6);
    cowlGeom.scale(1, 0.3, 1.8);
    const cowl = new THREE.Mesh(cowlGeom, this.materials.leafGreen);
    cowl.position.set(0, 0.15, -0.45);
    cowl.rotation.set(-0.8, 0, 0);
    cowl.castShadow = true;
    headPivot.add(cowl);

    // Eyes
    const eyeGeom = new THREE.SphereGeometry(0.1, 12, 12);
    const eyeL = new THREE.Mesh(eyeGeom, this.materials.eyeWhite);
    eyeL.position.set(-0.25, 0.18, 0.3);
    eyeL.scale.set(0.8, 1.2, 0.7);

    const pupilGeom = new THREE.SphereGeometry(0.05, 10, 10);
    const pupilL = new THREE.Mesh(pupilGeom, this.materials.eyePupil);
    pupilL.position.set(-0.27, 0.18, 0.36);
    pupilL.scale.set(0.8, 1.2, 0.4);

    const eyeR = eyeL.clone();
    eyeR.position.x = 0.25;
    const pupilR = pupilL.clone();
    pupilR.position.x = 0.27;

    headPivot.add(eyeL, pupilL, eyeR, pupilR);

    root.userData = { headPivot, snoutMesh };
    return root;
  }

  /**
   * 3. Snow Pea (寒冰射手)
   */
  static createSnowPea() {
    const root = new THREE.Group();
    root.name = 'snow_pea';

    root.add(this.createLeafBase());

    const iceMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      roughness: 0.15,
      metalness: 0.2,
      emissive: 0x0284c7,
      emissiveIntensity: 0.3,
      transparent: true,
      opacity: 0.95
    });

    const stemCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0.04, 0.55, -0.06),
      new THREE.Vector3(0, 1.15, 0)
    ]);
    const stemGeom = new THREE.TubeGeometry(stemCurve, 12, 0.09, 8, false);
    const stem = new THREE.Mesh(stemGeom, iceMat);
    stem.castShadow = true;
    root.add(stem);

    const headPivot = new THREE.Group();
    headPivot.position.set(0, 1.15, 0);
    root.add(headPivot);

    const headGeom = new THREE.SphereGeometry(0.44, 20, 20);
    const headMesh = new THREE.Mesh(headGeom, iceMat);
    headMesh.scale.set(1.0, 1.05, 1.1);
    headMesh.castShadow = true;
    headPivot.add(headMesh);

    const snoutGeom = new THREE.CylinderGeometry(0.18, 0.22, 0.5, 16);
    const snoutMesh = new THREE.Mesh(snoutGeom, iceMat);
    snoutMesh.rotation.x = Math.PI / 2;
    snoutMesh.position.set(0, 0, 0.55);
    snoutMesh.castShadow = true;
    headPivot.add(snoutMesh);

    const muzzleRimGeom = new THREE.TorusGeometry(0.2, 0.05, 8, 16);
    const muzzleRimMat = new THREE.MeshStandardMaterial({
      color: 0x7dd3fc,
      roughness: 0.1,
      metalness: 0.4,
      emissive: 0x38bdf8,
      emissiveIntensity: 0.5
    });
    const muzzleRim = new THREE.Mesh(muzzleRimGeom, muzzleRimMat);
    muzzleRim.position.set(0, 0, 0.78);
    headPivot.add(muzzleRim);

    // Frost icicle crystals behind head
    const icicleGeom = new THREE.ConeGeometry(0.1, 0.55, 5);
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI - Math.PI / 2;
      const icicle = new THREE.Mesh(icicleGeom, muzzleRimMat);
      icicle.position.set(Math.cos(angle) * 0.3, 0.2 + Math.sin(angle) * 0.2, -0.4);
      icicle.rotation.set(-1.1, 0, angle * 0.6);
      headPivot.add(icicle);
    }

    // Eyes
    const eyeGeom = new THREE.SphereGeometry(0.1, 12, 12);
    const eyeL = new THREE.Mesh(eyeGeom, this.materials.eyeWhite);
    eyeL.position.set(-0.25, 0.18, 0.3);
    eyeL.scale.set(0.8, 1.2, 0.7);

    const pupilGeom = new THREE.SphereGeometry(0.05, 10, 10);
    const pupilMat = new THREE.MeshStandardMaterial({ color: 0x0369a1 });
    const pupilL = new THREE.Mesh(pupilGeom, pupilMat);
    pupilL.position.set(-0.27, 0.18, 0.36);

    const eyeR = eyeL.clone();
    eyeR.position.x = 0.25;
    const pupilR = pupilL.clone();
    pupilR.position.x = 0.27;

    headPivot.add(eyeL, pupilL, eyeR, pupilR);

    root.userData = { headPivot, snoutMesh };
    return root;
  }

  /**
   * 4. Wall-nut (坚果墙) with 3 damage stages
   */
  static createWallnut() {
    const root = new THREE.Group();
    root.name = 'wallnut';

    const nutMat = new THREE.MeshStandardMaterial({
      color: 0x925f38,
      roughness: 0.85,
      metalness: 0.05
    });

    // Body: organic ovoid shape
    const bodyGeom = new THREE.SphereGeometry(0.65, 20, 20);
    bodyGeom.scale(0.85, 1.35, 0.85);

    const body = new THREE.Mesh(bodyGeom, nutMat);
    body.position.y = 0.88;
    body.castShadow = true;
    root.add(body);

    // Eyes
    const eyeGeom = new THREE.SphereGeometry(0.12, 12, 12);
    const eyeL = new THREE.Mesh(eyeGeom, this.materials.eyeWhite);
    eyeL.position.set(-0.22, 1.1, 0.45);
    eyeL.scale.set(0.7, 1.1, 0.5);

    const pupilGeom = new THREE.SphereGeometry(0.06, 10, 10);
    const pupilL = new THREE.Mesh(pupilGeom, this.materials.eyePupil);
    pupilL.position.set(-0.22, 1.08, 0.52);

    const eyeR = eyeL.clone();
    eyeR.position.x = 0.22;
    const pupilR = pupilL.clone();
    pupilR.position.x = 0.22;

    root.add(eyeL, pupilL, eyeR, pupilR);

    // Suture ridge around the shell
    const ridgeGeom = new THREE.TorusGeometry(0.68, 0.03, 6, 24);
    ridgeGeom.scale(0.85, 1.35, 0.85);
    const ridgeMat = new THREE.MeshStandardMaterial({ color: 0x6e4120, roughness: 0.9 });
    const ridge = new THREE.Mesh(ridgeGeom, ridgeMat);
    ridge.position.y = 0.88;
    ridge.rotation.y = Math.PI / 2;
    root.add(ridge);

    // Damage crack overlays (hidden initially)
    const crackMat = new THREE.MeshBasicMaterial({ color: 0x261408 });
    const crack1Geom = new THREE.BoxGeometry(0.03, 0.5, 0.03);
    const crack1 = new THREE.Mesh(crack1Geom, crackMat);
    crack1.position.set(0.28, 0.9, 0.45);
    crack1.rotation.set(0.2, 0.1, 0.6);
    crack1.visible = false;

    const crack2 = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.7, 0.04), crackMat);
    crack2.position.set(-0.25, 0.75, 0.42);
    crack2.rotation.set(-0.3, -0.2, -0.5);
    crack2.visible = false;

    root.add(crack1, crack2);

    root.userData = { body, eyeL, eyeR, crack1, crack2, nutMat };
    return root;
  }

  /**
   * 5. Potato Mine (土豆地雷)
   */
  static createPotatoMine() {
    const root = new THREE.Group();
    root.name = 'potato_mine';

    // Soil mound
    const moundGeom = new THREE.ConeGeometry(0.7, 0.25, 12);
    const mound = new THREE.Mesh(moundGeom, this.materials.soilBrown);
    mound.position.y = 0.1;
    mound.castShadow = true;
    root.add(mound);

    // Potato body
    const tuberPivot = new THREE.Group();
    tuberPivot.position.y = 0.05; // starts subterranean
    root.add(tuberPivot);

    const potatoGeom = new THREE.SphereGeometry(0.42, 16, 16);
    potatoGeom.scale(1.2, 0.8, 1.0);
    const potatoMat = new THREE.MeshStandardMaterial({
      color: 0xc49a45,
      roughness: 0.8,
      metalness: 0.0
    });
    const potato = new THREE.Mesh(potatoGeom, potatoMat);
    potato.position.y = 0.25;
    potato.castShadow = true;
    tuberPivot.add(potato);

    // Eyes
    const eyeGeom = new THREE.SphereGeometry(0.07, 10, 10);
    const eyeL = new THREE.Mesh(eyeGeom, this.materials.eyePupil);
    eyeL.position.set(-0.16, 0.32, 0.35);
    const eyeR = eyeL.clone();
    eyeR.position.x = 0.16;
    tuberPivot.add(eyeL, eyeR);

    // Flashing antenna post & blinking bulb
    const antennaPostGeom = new THREE.CylinderGeometry(0.025, 0.025, 0.35, 6);
    const antennaMat = new THREE.MeshStandardMaterial({ color: 0x4b5563, metalness: 0.8 });
    const antennaPost = new THREE.Mesh(antennaPostGeom, antennaMat);
    antennaPost.position.set(0, 0.55, 0);
    tuberPivot.add(antennaPost);

    const bulbGeom = new THREE.SphereGeometry(0.12, 12, 12);
    const bulbMat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      emissive: 0xff0000,
      emissiveIntensity: 0.8,
      roughness: 0.2
    });
    const bulb = new THREE.Mesh(bulbGeom, bulbMat);
    bulb.position.set(0, 0.75, 0);
    tuberPivot.add(bulb);

    root.userData = { tuberPivot, bulbMat, bulb };
    return root;
  }

  /**
   * 6. Chomper (大嘴花)
   */
  static createChomper() {
    const root = new THREE.Group();
    root.name = 'chomper';

    root.add(this.createLeafBase());

    // Thick purple gnarled stem
    const chomperStemMat = new THREE.MeshStandardMaterial({
      color: 0x7c3aed,
      roughness: 0.6,
      metalness: 0.05
    });
    const stemGeom = new THREE.CylinderGeometry(0.12, 0.18, 0.9, 10);
    const stem = new THREE.Mesh(stemGeom, chomperStemMat);
    stem.position.y = 0.45;
    stem.castShadow = true;
    root.add(stem);

    // Head base / neck
    const headPivot = new THREE.Group();
    headPivot.position.set(0, 0.9, 0);
    root.add(headPivot);

    // Upper Jaw
    const upperJawPivot = new THREE.Group();
    upperJawPivot.position.set(0, 0.1, -0.2);
    headPivot.add(upperJawPivot);

    const upperGeom = new THREE.SphereGeometry(0.55, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2);
    upperGeom.scale(0.9, 0.8, 1.2);
    upperGeom.rotateX(-Math.PI / 2);
    const chomperSkinMat = new THREE.MeshStandardMaterial({
      color: 0x9333ea,
      roughness: 0.5,
      metalness: 0.1
    });
    const upperJaw = new THREE.Mesh(upperGeom, chomperSkinMat);
    upperJaw.castShadow = true;
    upperJawPivot.add(upperJaw);

    // Lower Jaw
    const lowerJawPivot = new THREE.Group();
    lowerJawPivot.position.set(0, -0.1, -0.2);
    headPivot.add(lowerJawPivot);

    const lowerGeom = new THREE.SphereGeometry(0.55, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2);
    lowerGeom.scale(0.9, 0.8, 1.2);
    lowerGeom.rotateX(Math.PI / 2);
    const lowerJaw = new THREE.Mesh(lowerGeom, chomperSkinMat);
    lowerJaw.castShadow = true;
    lowerJawPivot.add(lowerJaw);

    // Teeth
    const toothGeom = new THREE.ConeGeometry(0.06, 0.22, 5);
    const toothMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 });

    for (let i = 0; i < 6; i++) {
      const angle = (i / 5) * Math.PI - Math.PI / 2;
      const tUpper = new THREE.Mesh(toothGeom, toothMat);
      tUpper.position.set(Math.cos(angle) * 0.38, -0.05, 0.45 + Math.sin(angle) * 0.15);
      tUpper.rotation.x = Math.PI;
      upperJawPivot.add(tUpper);

      const tLower = new THREE.Mesh(toothGeom, toothMat);
      tLower.position.set(Math.cos(angle) * 0.38, 0.05, 0.45 + Math.sin(angle) * 0.15);
      lowerJawPivot.add(tLower);
    }

    // Lips rim
    const lipMat = new THREE.MeshStandardMaterial({ color: 0xec4899, roughness: 0.4 });
    const lipUpperGeom = new THREE.TorusGeometry(0.42, 0.06, 6, 16, Math.PI);
    const lipUpper = new THREE.Mesh(lipUpperGeom, lipMat);
    lipUpper.position.set(0, 0, 0.5);
    upperJawPivot.add(lipUpper);

    root.userData = { headPivot, upperJawPivot, lowerJawPivot };
    return root;
  }

  /**
   * 7. Cherry Bomb (樱桃炸弹)
   */
  static createCherryBomb() {
    const root = new THREE.Group();
    root.name = 'cherry_bomb';

    const cherryMat = new THREE.MeshStandardMaterial({
      color: 0xdc2626,
      roughness: 0.25,
      metalness: 0.15,
      emissive: 0x991b1b,
      emissiveIntensity: 0.2
    });

    const cherryGeom = new THREE.SphereGeometry(0.42, 18, 18);

    // Left cherry
    const cherryL = new THREE.Mesh(cherryGeom, cherryMat);
    cherryL.position.set(-0.35, 0.45, 0);
    cherryL.castShadow = true;
    root.add(cherryL);

    // Right cherry
    const cherryR = new THREE.Mesh(cherryGeom, cherryMat);
    cherryR.position.set(0.35, 0.48, 0);
    cherryR.castShadow = true;
    root.add(cherryR);

    // Angry eyes on cherries
    const eyeGeom = new THREE.SphereGeometry(0.08, 8, 8);
    const browGeom = new THREE.BoxGeometry(0.18, 0.04, 0.04);
    const browMat = new THREE.MeshBasicMaterial({ color: 0x000000 });

    [-0.35, 0.35].forEach((cx, idx) => {
      const e1 = new THREE.Mesh(eyeGeom, this.materials.eyePupil);
      e1.position.set(cx - 0.12, 0.52, 0.35);
      const e2 = new THREE.Mesh(eyeGeom, this.materials.eyePupil);
      e2.position.set(cx + 0.12, 0.52, 0.35);
      const brow = new THREE.Mesh(browGeom, browMat);
      brow.position.set(cx, 0.62, 0.37);
      brow.rotation.z = idx === 0 ? 0.25 : -0.25;
      root.add(e1, e2, brow);
    });

    // Stems joined in a 'V'
    const stemL = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, 0.7, 6),
      this.materials.stemGreen
    );
    stemL.position.set(-0.18, 0.85, 0);
    stemL.rotation.z = -0.55;

    const stemR = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, 0.7, 6),
      this.materials.stemGreen
    );
    stemR.position.set(0.18, 0.85, 0);
    stemR.rotation.z = 0.55;

    root.add(stemL, stemR);

    // Burning fuse spark on top
    const fuseGeom = new THREE.SphereGeometry(0.1, 10, 10);
    const fuseMat = new THREE.MeshStandardMaterial({
      color: 0xfbbf24,
      emissive: 0xff4500,
      emissiveIntensity: 1.0
    });
    const fuse = new THREE.Mesh(fuseGeom, fuseMat);
    fuse.position.set(0, 1.25, 0);
    root.add(fuse);

    root.userData = { cherryL, cherryR, fuse, cherryMat };
    return root;
  }
}
