// import {
//   lvfLog,
//   lvfLoadSprite,
//   lvfStrSplit,
//   lvfStoreRawAsset,
//   lvfGetSprite,
//   lvfGetRawAsset,
//   LVC_SCREEN_WIDTH,
//   LVC_SCREEN_HEIGHT,
//   lvfDrawSprite,
//   lvfRunCart
// } from './lib.js';

// import * from './lib.js';

import * as vv from "./libvivo.js";

// =======================================
// STARTUP
// =======================================

vv.lvfLog("index.js initializing.");

// =======================================
// STATE
// =======================================

// const bufDat0 = new ImageData(LVC_SCREEN_WIDTH, LVC_SCREEN_HEIGHT);
// const bufDat1 = new ImageData(LVC_SCREEN_WIDTH, LVC_SCREEN_HEIGHT);

// =======================================
// FUNCTIONS
// =======================================

function cartridgeLoad() {
  vv.lvfLog("Loading cartridge!");
  vv.lvfLoadSprite("favicon", "favicon.ico");
  //lvfLoadSprite("bgtile01", "Usoo 8-VV4 BGTile01.png");
  //lvfLoadSprite("bgtile01", "https://cdn.glitch.global/30721794-7172-4803-bc25-7f007af96755/Usoo%208-VV4%20BGTile01.png?v=1671916367962");
  vv.lvfLoadSprite("bgtile01", "assets/uvv4_bgtile01.png");
  vv.lvfLoadSprite("fontvivo4", "assets/uvv4_fontvivo4.png");

  // Level tiles
  let levelTile_width = 12; // 12px
  let levelTile_rowLen = 12;
  let levelTilesStr_rows = [
    "  ,  ,  ,__,__,__;__,__,__,  ,  ,  ;",
    "  ,  ,  ,__,__,__;__,__,__,  ,  ,  ;",
    "  ,  ,  ,__,__,__;__,__,__,  ,  ,  ;",
    "  ,  ,  ,__,__,__;__,__,__,  ,  ,  ;",
    "  ,  ,  ,__,__,__;__,__,__,  ,  ,  ;",
    "  ,  ,  ,  ,  ,__;__,  ,  ,  ,  ,  ;",
    "  ,  ,  ,__,__,__;__,__,__,  ,  ,  ;",
    "  ,  ,  ,__,__,__;__,__,__,  ,  ,  ;",
    "  ,  ,  ,__,__,__;__,__,__,  ,  ,  ;",
    "  ,  ,  ,__,__,__;__,__,__,  ,  ,  ;",
    "  ,  ,  ,__,__,__;__,__,__,  ,  ,  ;",
    "  ,  ,  ,  ,  ,  ;  ,  ,  ,  ,  ,  ;",
  ];
  // Y is upward, so reverse rows.
  levelTilesStr_rows.reverse();
  // Convert to [row][col] api.
  let levelTiles = [];
  for (let r = 0; r < levelTilesStr_rows.length; r++) {
    let rowStr = levelTilesStr_rows[r];
    let cols = vv.lvfStrSplit(rowStr, [",", ";"]);
    levelTiles.push([]);
    for (let colStr of cols) {
      levelTiles[levelTiles.length - 1].push(colStr);
      // lvfLog("pushed col: '" + colStr + "'");
    }
  }
  // lvfLog("Processed level: " + levelTiles);

  // Parse cell keys.
  let parsedLevel = [];
  for (let r = 0; r < levelTiles.length; r++) {
    parsedLevel.push([]);
    for (let c = 0; c < levelTiles[r].length; c++) {
      let cellStr = levelTiles[r][c];
      let cell = levelParseCellStr(cellStr);
      parsedLevel[r].push(cell);
    }
    // lvfLog("Level row cells: " + JSON.stringify(parsedLevel[r]));
  }

  // Store.
  vv.lvfStoreRawAsset("level00", parsedLevel);
}

function levelParseCellStr(cellStr) {
  if (cellStr.length != 2) {
    vv.lvfLog("unexpected cell str length " + cellStr.length);
  }
  let c0 = cellStr.charAt(0);
  let c1 = cellStr.charAt(1);
  // lvfLog("cell string '" + cellStr + "'");

  let cell = {};
  let keys = [c0];
  if (c1 != c0) {
    keys.push(c1);
  }
  for (let charKey of keys) {
    if (charKey == " ") {
      // Void
      cell.void = true;
    } else if (charKey == "_") {
      // Ground
      cell.ground = true;
    } else {
      vv.lvfLog("UNRECOGNIZED TILE KEY: '" + charKey + "'");
    }
  }
  return cell;
}

function cartridgeUpdate(time, dt, screen_u8Arr) {
  try {
    // Random Background Pixels
    let red_n11 = Math.sin(2 * Math.PI * time);
    let red_u8 = (red_n11 * 0.5 + 0.5) * 255;
    let randf = () => {
      return Math.floor(Math.random() * 256);
    };
    let rand0_u8 = Math.floor(Math.random() * 256);
    let rand1_u8 = Math.floor(Math.random() * 256);
    let rand2_u8 = Math.floor(Math.random() * 256);
    for (let y = 0; y < 128; y++) {
      for (let x = 0; x < 128; x++) {
        screen_u8Arr[(y * 128 + x) * 4 + 0] = randf();
        screen_u8Arr[(y * 128 + x) * 4 + 1] = randf();
        screen_u8Arr[(y * 128 + x) * 4 + 2] = randf();
        screen_u8Arr[(y * 128 + x) * 4 + 3] = 255;
      }
    }

    let bgtile = vv.lvfGetSprite("bgtile01");

    // Draw level.
    let levelGrid = vv.lvfGetRawAsset("level00");
    let cellWidth = 12; // 12px
    let gridOrigin = { x: -7, y: 7 };
    for (let r = 0; r < levelGrid.length; r++) {
      let rows = levelGrid[r];
      for (let c = 0; c < rows.length; c++) {
        let cell = rows[c];

        // LVC_SCREEN_HEIGHT

        let pos = { x: c * 12, y: r * 12 };
        pos.y = vv.LVC_SCREEN_HEIGHT - pos.y - 12;

        pos = {
          x: gridOrigin.x + pos.x,
          y: gridOrigin.y + pos.y,
        };

        if (cell.ground == true) {
          vv.lvfDrawSprite(screen_u8Arr, bgtile, pos.x, pos.y);
        }
      }
    }

    // whatever else??
    
    // Draw font
    let font = vv.lvfGetSprite("fontvivo4");
    vv.lvfDrawSprite(screen_u8Arr, font, 0, 0);
    
  } catch (error) {
    vv.lvfLog(error);
  }
}

// =======================================
// EXECUTE CARTRIDGE
// =======================================
try {
  cartridgeLoad();

  vv.lvfRunCart(cartridgeUpdate);
} catch (error) {
  vv.lvfLog(error);
}
