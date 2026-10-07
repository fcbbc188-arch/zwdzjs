import * as THREE from 'three';

/**
 * ZombieModelFactory creates realistic humanoid 3D zombie models.
 * Features realistic proportions, rotting flesh PBR shaders,
 * hierarchical skeleton pivots for walk cycles, biting, and damage dismemberment.
 */
export class ZombieModelFactory {
  static materials = {
    skin: new THREE.MeshStandardMaterial({
      color: 0x7a8b71, // Sickly rotting olive-grey skin
      roughness: 0.75,
      metalness: 0.05
    }),
    darkSkin: new THREE.MeshStandardMaterial({
      color: 0x54634c,
      roughness: 0.8,
      metalness: 0.0
    }),
    suitBrown: new THREE.MeshStandardMaterial({
      color: 0x4a3b32, // Tattered brown business suit
      roughness: 0.85,
      metalness: 0.0
    }),
    pantsBlue: new THREE.MeshStandardMaterial({
      color: 0x2b3d52, // Decayed denim trousers
      roughness: 0.9,
      metalness: 0.0
    }),
    shirtWhite: new THREE.MeshStandardMaterial({
      color: 0xd4cfc9, // Yellowed, stained dress shirt
      roughness: 0.8,
      metalness: 0.0
    }),
    tieRed: new THREE.MeshStandardMaterial({
      color: 0x8b2522, // Tattered red tie
      roughness: 0.7,
      metalness: 0.0
    }),
    shoesBlack: new THREE.MeshStandardMaterial({
      color: 0x222222,
      roughness: 0.6,
      metalness: 0.1
    }),
    eyeGlow: new THREE.MeshStandardMaterial({
      color: 0xfef08a,
      emissive: 0xeab308,
      emissiveIntensity: 0.6,
      roughness: 0.2
    }),
    gargantuarSkin: new THREE.MeshStandardMaterial({
      color: 0x596b52,
      roughness: 0.8,
      metalness: 0.05
    })
  };

  /**
   * Builds the base humanoid skeletal hierarchy
   */
  static createBaseHumanoid(scale = 1.0, isGargantuar = false) {
    const root = new THREE.Group();
    root.name = 'zombie_root';

    const skinMat = isGargantuar ? this.materials.gargantuarSkin : this.materials.skin;
    const suitMat = this.materials.suitBrown;
    const pantsMat = this.materials.pantsBlue;

    // Hips / Pelvis
    const hips = new THREE.Group();
    hips.position.y = 0.95 * scale;
    root.add(hips);

    const pelvisGeom = new THREE.BoxGeometry(0.38 * scale, 0.25 * scale, 0.26 * scale);
    const pelvis = new THREE.Mesh(pelvisGeom, pantsMat);
    pelvis.castShadow = true;
    hips.add(pelvis);

    // Torso / Spine
    const spine = new THREE.Group();
    spine.position.y = 0.15 * scale;
    hips.add(spine);

    const chestGeom = new THREE.BoxGeometry(0.48 * scale, 0.55 * scale, 0.3 * scale);
    const chest = new THREE.Mesh(chestGeom, suitMat);
    chest.position.y = 0.28 * scale;
    chest.castShadow = true;
    spine.add(chest);

    // Stained dress shirt collar & red tie
    const tieGeom = new THREE.ConeGeometry(0.06 * scale, 0.35 * scale, 4);
    tieGeom.scale(1, 1, 0.2);
    const tie = new THREE.Mesh(tieGeom, this.materials.tieRed);
    tie.position.set(0, 0.28 * scale, 0.16 * scale);
    spine.add(tie);

    // Neck & Head Pivot
    const neck = new THREE.Group();
    neck.position.y = 0.6 * scale;
    spine.add(neck);

    const headGroup = new THREE.Group();
    headGroup.name = 'headGroup';
    neck.add(headGroup);

    // Realistic cranium
    const headGeom = new THREE.BoxGeometry(0.34 * scale, 0.42 * scale, 0.36 * scale);
    const head = new THREE.Mesh(headGeom, skinMat);
    head.position.y = 0.22 * scale;
    head.castShadow = true;
    headGroup.add(head);

    // Hollow eye sockets & yellow glowing eyes
    const eyeGeom = new THREE.SphereGeometry(0.05 * scale, 8, 8);
    const eyeL = new THREE.Mesh(eyeGeom, this.materials.eyeGlow);
    eyeL.position.set(-0.09 * scale, 0.26 * scale, 0.19 * scale);
    const eyeR = eyeL.clone();
    eyeR.position.x = 0.09 * scale;
    headGroup.add(eyeL, eyeR);

    // Slack lower jaw (drooping mouth)
    const jawGeom = new THREE.BoxGeometry(0.26 * scale, 0.12 * scale, 0.24 * scale);
    const jaw = new THREE.Mesh(jawGeom, skinMat);
    jaw.position.set(0, 0.04 * scale, 0.06 * scale);
    jaw.castShadow = true;
    headGroup.add(jaw);

    // Left Arm Hierarchy (outstretched, zombie limp pose)
    const shoulderL = new THREE.Group();
    shoulderL.name = 'shoulderL';
    shoulderL.position.set(-0.32 * scale, 0.48 * scale, 0);
    spine.add(shoulderL);

    const armLGeom = new THREE.CylinderGeometry(0.07 * scale, 0.06 * scale, 0.4 * scale, 8);
    const upperArmL = new THREE.Mesh(armLGeom, suitMat);
    upperArmL.position.y = -0.2 * scale;
    upperArmL.castShadow = true;
    shoulderL.add(upperArmL);

    const elbowL = new THREE.Group();
    elbowL.position.y = -0.4 * scale;
    shoulderL.add(elbowL);

    const forearmLGeom = new THREE.CylinderGeometry(0.06 * scale, 0.05 * scale, 0.38 * scale, 8);
    const forearmL = new THREE.Mesh(forearmLGeom, skinMat);
    forearmL.position.y = -0.19 * scale;
    forearmL.castShadow = true;
    elbowL.add(forearmL);

    // Right Arm Hierarchy
    const shoulderR = new THREE.Group();
    shoulderR.name = 'shoulderR';
    shoulderR.position.set(0.32 * scale, 0.48 * scale, 0);
    spine.add(shoulderR);

    const upperArmR = new THREE.Mesh(armLGeom, suitMat);
    upperArmR.position.y = -0.2 * scale;
    upperArmR.castShadow = true;
    shoulderR.add(upperArmR);

    const elbowR = new THREE.Group();
    elbowR.position.y = -0.4 * scale;
    shoulderR.add(elbowR);

    const forearmR = new THREE.Mesh(forearmLGeom, skinMat);
    forearmR.position.y = -0.19 * scale;
    forearmR.castShadow = true;
    elbowR.add(forearmR);

    // Left Leg Hierarchy (hip -> knee -> foot)
    const hipL = new THREE.Group();
    hipL.name = 'hipL';
    hipL.position.set(-0.14 * scale, -0.12 * scale, 0);
    hips.add(hipL);

    const thighGeom = new THREE.CylinderGeometry(0.08 * scale, 0.07 * scale, 0.48 * scale, 8);
    const thighL = new THREE.Mesh(thighGeom, pantsMat);
    thighL.position.y = -0.24 * scale;
    thighL.castShadow = true;
    hipL.add(thighL);

    const kneeL = new THREE.Group();
    kneeL.position.y = -0.48 * scale;
    hipL.add(kneeL);

    const shinGeom = new THREE.CylinderGeometry(0.07 * scale, 0.06 * scale, 0.46 * scale, 8);
    const shinL = new THREE.Mesh(shinGeom, pantsMat);
    shinL.position.y = -0.23 * scale;
    shinL.castShadow = true;
    kneeL.add(shinL);

    const footGeom = new THREE.BoxGeometry(0.12 * scale, 0.1 * scale, 0.24 * scale);
    const footL = new THREE.Mesh(footGeom, this.materials.shoesBlack);
    footL.position.set(0, -0.46 * scale, 0.06 * scale);
    footL.castShadow = true;
    kneeL.add(footL);

    // Right Leg Hierarchy
    const hipR = new THREE.Group();
    hipR.name = 'hipR';
    hipR.position.set(0.14 * scale, -0.12 * scale, 0);
    hips.add(hipR);

    const thighR = new THREE.Mesh(thighGeom, pantsMat);
    thighR.position.y = -0.24 * scale;
    thighR.castShadow = true;
    hipR.add(thighR);

    const kneeR = new THREE.Group();
    kneeR.position.y = -0.48 * scale;
    hipR.add(kneeR);

    const shinR = new THREE.Mesh(shinGeom, pantsMat);
    shinR.position.y = -0.23 * scale;
    shinR.castShadow = true;
    kneeR.add(shinR);

    const footR = new THREE.Mesh(footGeom, this.materials.shoesBlack);
    footR.position.set(0, -0.46 * scale, 0.06 * scale);
    footR.castShadow = true;
    kneeR.add(footR);

    // Default zombie pose: arms stretched forward
    shoulderL.rotation.x = -Math.PI / 2.3;
    shoulderR.rotation.x = -Math.PI / 2.5;
    shoulderL.rotation.z = 0.15;
    shoulderR.rotation.z = -0.15;

    return {
      root,
      hips,
      spine,
      neck,
      headGroup,
      shoulderL,
      shoulderR,
      elbowL,
      elbowR,
      hipL,
      hipR,
      kneeL,
      kneeR,
      scale
    };
  }

  /**
   * 1. Normal Zombie (普通丧尸)
   */
  static createNormalZombie() {
    const bones = this.createBaseHumanoid(1.0);
    bones.root.name = 'normal_zombie';
    bones.root.userData = { bones };
    return bones.root;
  }

  /**
   * 2. Conehead Zombie (路障丧尸)
   */
  static createConeheadZombie() {
    const bones = this.createBaseHumanoid(1.0);
    bones.root.name = 'conehead_zombie';

    // Traffic cone
    const coneGroup = new THREE.Group();
    coneGroup.name = 'cone_armor';
    coneGroup.position.set(0, 0.44, 0.02);

    // Orange cone body
    const coneMat = new THREE.MeshStandardMaterial({
      color: 0xf97316,
      roughness: 0.35,
      metalness: 0.1
    });
    const coneBody = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.55, 12), coneMat);
    coneBody.position.y = 0.28;
    coneBody.castShadow = true;
    coneGroup.add(coneBody);

    // White reflective band
    const bandMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.2,
      metalness: 0.2
    });
    const band = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 0.14, 12), bandMat);
    band.position.y = 0.24;
    coneGroup.add(band);

    // Square base of cone
    const base = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.04, 0.42), coneMat);
    base.position.y = 0.02;
    coneGroup.add(base);

    // Attach to head
    coneGroup.rotation.z = 0.12;
    bones.headGroup.add(coneGroup);
    bones.coneArmor = coneGroup;

    bones.root.userData = { bones };
    return bones.root;
  }

  /**
   * 3. Buckethead Zombie (铁桶丧尸)
   */
  static createBucketheadZombie() {
    const bones = this.createBaseHumanoid(1.0);
    bones.root.name = 'buckethead_zombie';

    // Metal Bucket
    const bucketGroup = new THREE.Group();
    bucketGroup.name = 'bucket_armor';
    bucketGroup.position.set(0, 0.38, 0.02);

    const metalMat = new THREE.MeshStandardMaterial({
      color: 0x9ca3af,
      roughness: 0.25,
      metalness: 0.85
    });

    // Inverted tapered cylinder
    const bucketGeom = new THREE.CylinderGeometry(0.26, 0.22, 0.42, 16, 1, true);
    const bucket = new THREE.Mesh(bucketGeom, metalMat);
    bucket.position.y = 0.16;
    bucket.castShadow = true;
    bucketGroup.add(bucket);

    // Top lid
    const lidGeom = new THREE.CircleGeometry(0.26, 16);
    const lid = new THREE.Mesh(lidGeom, metalMat);
    lid.rotation.x = -Math.PI / 2;
    lid.position.y = 0.37;
    bucketGroup.add(lid);

    // Bucket handle
    const handleGeom = new THREE.TorusGeometry(0.27, 0.02, 6, 16, Math.PI);
    const handle = new THREE.Mesh(handleGeom, metalMat);
    handle.position.set(0, 0.2, 0);
    handle.rotation.x = 0.4;
    bucketGroup.add(handle);

    bucketGroup.rotation.x = -0.1;
    bones.headGroup.add(bucketGroup);
    bones.bucketArmor = bucketGroup;

    bones.root.userData = { bones };
    return bones.root;
  }

  /**
   * 4. Pole Vaulting Zombie (撑杆跳丧尸)
   */
  static createPoleVaultZombie() {
    const bones = this.createBaseHumanoid(1.0);
    bones.root.name = 'pole_vault_zombie';

    // Athletic pole
    const poleGroup = new THREE.Group();
    poleGroup.name = 'vault_pole';

    const poleMat = new THREE.MeshStandardMaterial({
      color: 0xe0e7ff,
      roughness: 0.3,
      metalness: 0.3
    });
    const poleGeom = new THREE.CylinderGeometry(0.04, 0.04, 3.6, 10);
    const poleMesh = new THREE.Mesh(poleGeom, poleMat);
    poleMesh.position.set(0, 0, 0.8);
    poleMesh.rotation.x = Math.PI / 2;
    poleMesh.castShadow = true;
    poleGroup.add(poleMesh);

    bones.root.add(poleGroup);
    bones.pole = poleGroup;

    bones.root.userData = { bones };
    return bones.root;
  }

  /**
   * 5. Flag Zombie (摇旗丧尸)
   */
  static createFlagZombie() {
    const bones = this.createBaseHumanoid(1.0);
    bones.root.name = 'flag_zombie';

    // Flag staff & brain banner
    const flagGroup = new THREE.Group();
    flagGroup.name = 'flag_prop';

    const staffMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.8 });
    const staff = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 2.4, 8), staffMat);
    staff.position.y = 1.0;
    staff.castShadow = true;
    flagGroup.add(staff);

    // Tattered cloth banner with brain symbol
    const clothMat = new THREE.MeshStandardMaterial({
      color: 0x991b1b,
      roughness: 0.9,
      side: THREE.DoubleSide
    });
    const clothGeom = new THREE.PlaneGeometry(0.8, 0.5);
    const cloth = new THREE.Mesh(clothGeom, clothMat);
    cloth.position.set(0.42, 1.8, 0);
    flagGroup.add(cloth);

    bones.shoulderR.add(flagGroup);
    bones.flag = flagGroup;

    bones.root.userData = { bones };
    return bones.root;
  }

  /**
   * 6. Gargantuar (巨型丧尸)
   */
  static createGargantuar() {
    const bones = this.createBaseHumanoid(2.1, true);
    bones.root.name = 'gargantuar';

    // Massive Telephone Pole Bludgeon Club
    const clubGroup = new THREE.Group();
    clubGroup.name = 'gargantuar_club';

    const poleMat = new THREE.MeshStandardMaterial({
      color: 0x3e2723,
      roughness: 0.9,
      metalness: 0.05
    });
    const clubGeom = new THREE.CylinderGeometry(0.22, 0.28, 4.2, 10);
    const clubMesh = new THREE.Mesh(clubGeom, poleMat);
    clubMesh.position.set(0, 0, 1.2);
    clubMesh.rotation.x = Math.PI / 2.2;
    clubMesh.castShadow = true;
    clubGroup.add(clubMesh);

    // Metal band wrap around pole
    const bandMat = new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.8 });
    const band1 = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.15, 10), bandMat);
    band1.position.set(0, 0, 2.0);
    band1.rotation.x = Math.PI / 2.2;
    clubGroup.add(band1);

    bones.shoulderR.add(clubGroup);
    bones.club = clubGroup;

    bones.root.userData = { bones };
    return bones.root;
  }
}
