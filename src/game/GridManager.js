import * as THREE from 'three';
import { GRID_ROWS, GRID_COLS, CELL_WIDTH, CELL_DEPTH, LAWN_ORIGIN_X, LAWN_ORIGIN_Z } from './Constants.js';

export class GridManager {
  constructor(scene) {
    this.scene = scene;
    this.grid = [];

    // Initialize 2D grid
    for (let r = 0; r < GRID_ROWS; r++) {
      this.grid[r] = [];
      for (let c = 0; c < GRID_COLS; c++) {
        this.grid[r][c] = {
          row: r,
          col: c,
          x: LAWN_ORIGIN_X + c * CELL_WIDTH,
          z: LAWN_ORIGIN_Z + r * CELL_DEPTH,
          plant: null
        };
      }
    }

    // 3D Grid Hover Cursor / Indicator
    const cursorGeom = new THREE.PlaneGeometry(CELL_WIDTH * 0.95, CELL_DEPTH * 0.95);
    cursorGeom.rotateX(-Math.PI / 2);
    this.cursorMat = new THREE.MeshBasicMaterial({
      color: 0x4ade80,
      transparent: true,
      opacity: 0.45,
      side: THREE.DoubleSide
    });
    this.cursorMesh = new THREE.Mesh(cursorGeom, this.cursorMat);
    this.cursorMesh.position.y = 0.02;
    this.cursorMesh.visible = false;
    this.scene.add(this.cursorMesh);
  }

  getCell(row, col) {
    if (row < 0 || row >= GRID_ROWS || col < 0 || col >= GRID_COLS) return null;
    return this.grid[row][col];
  }

  getCellPosition(row, col) {
    const cell = this.getCell(row, col);
    if (!cell) return null;
    return new THREE.Vector3(cell.x, 0, cell.z);
  }

  worldToCell(worldX, worldZ) {
    const col = Math.round((worldX - LAWN_ORIGIN_X) / CELL_WIDTH);
    const row = Math.round((worldZ - LAWN_ORIGIN_Z) / CELL_DEPTH);

    if (row >= 0 && row < GRID_ROWS && col >= 0 && col < GRID_COLS) {
      return { row, col };
    }
    return null;
  }

  isOccupied(row, col) {
    const cell = this.getCell(row, col);
    return cell ? cell.plant !== null : true;
  }

  setPlant(row, col, plant) {
    const cell = this.getCell(row, col);
    if (cell) cell.plant = plant;
  }

  removePlant(row, col) {
    const cell = this.getCell(row, col);
    if (cell) {
      const p = cell.plant;
      cell.plant = null;
      return p;
    }
    return null;
  }

  updateCursor(row, col, isValid = true) {
    if (row === null || col === null) {
      this.cursorMesh.visible = false;
      return;
    }

    const cell = this.getCell(row, col);
    if (!cell) {
      this.cursorMesh.visible = false;
      return;
    }

    this.cursorMesh.visible = true;
    this.cursorMesh.position.set(cell.x, 0.02, cell.z);
    this.cursorMat.color.setHex(isValid ? 0x22c55e : 0xef4444);
  }

  hideCursor() {
    this.cursorMesh.visible = false;
  }
}
