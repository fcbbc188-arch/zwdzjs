import * as THREE from 'three';
import { GRID_ROWS, GRID_COLS, CELL_WIDTH, CELL_DEPTH, LAWN_ORIGIN_X, LAWN_ORIGIN_Z } from '../game/Constants.js';

export class EnvironmentFactory {
  static createEnvironment(isNight = false) {
    const root = new THREE.Group();
    root.name = 'environment';

    // 1. Manicured Grass Lawn (5 rows x 9 cols with alternating mowing stripes)
    const lawnGroup = new THREE.Group();
    lawnGroup.name = 'lawn_grid';

    const grassMatDark = new THREE.MeshStandardMaterial({
      color: isNight ? 0x1e3a1f : 0x438d2f,
      roughness: 0.85,
      metalness: 0.05
    });

    const grassMatLight = new THREE.MeshStandardMaterial({
      color: isNight ? 0x274a28 : 0x56a63c,
      roughness: 0.85,
      metalness: 0.05
    });

    const cellGeom = new THREE.BoxGeometry(CELL_WIDTH * 0.98, 0.2, CELL_DEPTH * 0.98);

    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        const isStripe = (r + c) % 2 === 0;
        const cellMesh = new THREE.Mesh(cellGeom, isStripe ? grassMatLight : grassMatDark);
        cellMesh.position.set(
          LAWN_ORIGIN_X + c * CELL_WIDTH,
          -0.1,
          LAWN_ORIGIN_Z + r * CELL_DEPTH
        );
        cellMesh.receiveShadow = true;
        lawnGroup.add(cellMesh);
      }
    }
    root.add(lawnGroup);

    // 2. Stone Curb / Border around the lawn
    const curbMat = new THREE.MeshStandardMaterial({
      color: isNight ? 0x334155 : 0x64748b,
      roughness: 0.9,
      metalness: 0.1
    });

    // Top & Bottom curbs
    const curbHGeom = new THREE.BoxGeometry(GRID_COLS * CELL_WIDTH + 1.0, 0.3, 0.4);
    const curbTop = new THREE.Mesh(curbHGeom, curbMat);
    curbTop.position.set(0, -0.05, LAWN_ORIGIN_Z - CELL_DEPTH / 2 - 0.2);
    curbTop.receiveShadow = true;
    root.add(curbTop);

    const curbBottom = new THREE.Mesh(curbHGeom, curbMat);
    curbBottom.position.set(0, -0.05, LAWN_ORIGIN_Z + (GRID_ROWS - 0.5) * CELL_DEPTH + 0.2);
    curbBottom.receiveShadow = true;
    root.add(curbBottom);

    // 3. Patio / Veranda on the left (Home defense line)
    const patioMat = new THREE.MeshStandardMaterial({
      color: isNight ? 0x3e2723 : 0x8d6e63,
      roughness: 0.8,
      metalness: 0.1
    });
    const patioGeom = new THREE.BoxGeometry(4.0, 0.22, GRID_ROWS * CELL_DEPTH + 1.2);
    const patio = new THREE.Mesh(patioGeom, patioMat);
    patio.position.set(LAWN_ORIGIN_X - CELL_WIDTH / 2 - 2.0, -0.09, 0);
    patio.receiveShadow = true;
    root.add(patio);

    // 4. House wall on the far left
    const wallMat = new THREE.MeshStandardMaterial({
      color: isNight ? 0x1e293b : 0xe2e8f0,
      roughness: 0.9
    });
    const wallGeom = new THREE.BoxGeometry(0.6, 6.0, GRID_ROWS * CELL_DEPTH + 6.0);
    const wall = new THREE.Mesh(wallGeom, wallMat);
    wall.position.set(LAWN_ORIGIN_X - CELL_WIDTH / 2 - 4.2, 2.9, 0);
    wall.receiveShadow = true;
    root.add(wall);

    // 5. Right Sidewalk (Zombie arrival street)
    const streetMat = new THREE.MeshStandardMaterial({
      color: isNight ? 0x18181b : 0x52525b,
      roughness: 0.95
    });
    const streetGeom = new THREE.BoxGeometry(8.0, 0.18, GRID_ROWS * CELL_DEPTH + 3.0);
    const street = new THREE.Mesh(streetGeom, streetMat);
    street.position.set(LAWN_ORIGIN_X + GRID_COLS * CELL_WIDTH + 2.0, -0.11, 0);
    street.receiveShadow = true;
    root.add(street);

    // 6. Wooden Picket Fence along top boundary
    const fenceMat = new THREE.MeshStandardMaterial({
      color: isNight ? 0x475569 : 0xf8fafc,
      roughness: 0.7
    });
    const fencePicketGeom = new THREE.BoxGeometry(0.2, 1.8, 0.05);
    const fenceRailGeom = new THREE.BoxGeometry(GRID_COLS * CELL_WIDTH + 6.0, 0.12, 0.06);

    const fenceGroup = new THREE.Group();
    const railTop = new THREE.Mesh(fenceRailGeom, fenceMat);
    railTop.position.set(0, 1.2, LAWN_ORIGIN_Z - CELL_DEPTH / 2 - 0.5);
    const railBottom = railTop.clone();
    railBottom.position.y = 0.5;
    fenceGroup.add(railTop, railBottom);

    const picketCount = 36;
    const startX = -(GRID_COLS * CELL_WIDTH) / 2 - 2.5;
    const stepX = (GRID_COLS * CELL_WIDTH + 5.0) / picketCount;
    for (let i = 0; i <= picketCount; i++) {
      const picket = new THREE.Mesh(fencePicketGeom, fenceMat);
      picket.position.set(startX + i * stepX, 0.85, LAWN_ORIGIN_Z - CELL_DEPTH / 2 - 0.5);
      picket.castShadow = true;
      fenceGroup.add(picket);
    }
    root.add(fenceGroup);

    // 7. Night Mode Gravestones
    if (isNight) {
      const graveMat = new THREE.MeshStandardMaterial({
        color: 0x475569,
        roughness: 0.95,
        metalness: 0.1
      });
      const graveGeom = new THREE.BoxGeometry(0.6, 1.2, 0.25);

      // Random gravestones along zombie spawn lane
      const gravePositions = [
        { c: 7, r: 1 },
        { c: 8, r: 3 },
        { c: 6, r: 4 }
      ];
      gravePositions.forEach(pos => {
        const grave = new THREE.Mesh(graveGeom, graveMat);
        grave.position.set(
          LAWN_ORIGIN_X + pos.c * CELL_WIDTH,
          0.5,
          LAWN_ORIGIN_Z + pos.r * CELL_DEPTH
        );
        grave.rotation.y = (Math.random() - 0.5) * 0.4;
        grave.castShadow = true;
        grave.receiveShadow = true;
        root.add(grave);
      });
    }

    // 8. Ground extension for infinite horizon look
    const horizonMat = new THREE.MeshStandardMaterial({
      color: isNight ? 0x0f172a : 0x2e6b20,
      roughness: 0.95
    });
    const horizonGeom = new THREE.PlaneGeometry(120, 120);
    const horizon = new THREE.Mesh(horizonGeom, horizonMat);
    horizon.rotation.x = -Math.PI / 2;
    horizon.position.y = -0.15;
    horizon.receiveShadow = true;
    root.add(horizon);

    return root;
  }
}
