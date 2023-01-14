
// ===================================
// STATE
// ===================================

const LVC_SCREEN_WIDTH = 128;
const LVC_SCREEN_HEIGHT = 128;

const lvvConsoleElm = document.getElementById("lvvConsoleElm");
const lvvScreenCnv = document.getElementById("lvvScreenCnv");
const lvvScreenCtx = lvvScreenCnv.getContext("2d");

const lvdb = {};
lvdb.sprites = {};
lvdb.rawAssets = {};

// ===================================
// FUNCTIONS
// ===================================

// General
// ==================

function lvfLog(msg_str) {
    lvvConsoleElm.innerHTML = msg_str + "<br>" + lvvConsoleElm.innerHTML;
}

function lvfTry(do_func) {
    try { do_func(); }
    catch (error) { lvfLog(error); }
}

// Input
// ==================
class Button { constructor() {
    this.isPressed = false;
    this.justPressed = false;
    this.justReleased = false;
}}
class Input { constructor() {
    this.up = new Button(); this.down = new Button();
    this.left = new Button(); this.right = new Button();
    this.a = new Button(); this.b = new Button();
    this.c = new Button();
}}
const lvvInput = new Input();
function lvfUpdateInput() {
    const keycodes = [ "ArrowUp", "ArrowDown", "ArrowLeft",
        "ArrowRight", "z", "x", "c" ];
    const buttons = [ lvvInput.up, lvvInput.down, lvvInput.left,
        lvvInput.right, lvvInput.a, lvvInput.b, lvvInput.c ];
    for (let i = 0; i < keycodes.length; i++) {
        var kc = keycodes[i];
        var b = buttons[i];
        if (lvvKeys[kc]) {
            if (b.isPressed) {
                b.justPressed = false;
            } else /* !b.isPressed */ {
                b.justPressed = true;
                b.isPressed = true;
                lvfLog("Just pressed " + kc);
            }
        }
        else /* !lvvKeys[kc] */ {
            if (b.isPressed) {
                b.isPressed = false;
                b.justReleased = true;
            }
            else /* !b.isPressed */ {
                // lvfLog("no longer just released");
                b.justReleased = false;
            }
        }
    }
}
const lvvKeys = {};
window.onkeyup = function(e) {
    lvvKeys[e.key] = false;
}
window.onkeydown = function(e) {
    lvvKeys[e.key] = true;
}

// Execution
// ==================

function lvfRunCart(cartUpdate_func) {
    let screen_imgDat = lvvScreenCtx.getImageData(0, 0, LVC_SCREEN_WIDTH, LVC_SCREEN_HEIGHT);
    let screen_u8Arr = screen_imgDat.data;
    let time = 0;

    const updateFrame = () => {
        var dt = 16 * 0.001;
        time += dt;

        lvfUpdateInput();

        cartUpdate_func(time, dt, screen_u8Arr)
        lvvScreenCtx.putImageData(screen_imgDat, 0, 0);
    }

    // lvfLog("Starting updateFrame loop.");
    setInterval(() => updateFrame(), 16);
}

// Pixels
// ==================

function lvfLoadSprite(name, imgSrc_pathStr) {
    lvfTry(() => {
        var sprite = new Image();
        sprite.onload = function () {
            lvfTry(() => {
                let canvas = document.createElement('canvas');
                let context = canvas.getContext('2d');
                let img = sprite;
                canvas.width = img.width;
                canvas.height = img.height;
                context.drawImage(img, 0, 0);

                // naturalWidth, naturalHeight ?
                var imgData = context.getImageData(0, 0, img.width, img.height);

                // Store into the sprite database.
                sprite = {}
                sprite.data = imgData;
                sprite.width = img.width;
                sprite.height = img.height;
                lvdb.sprites[name] = sprite;

                canvas.remove();
                lvfLog("Loaded " + imgSrc_pathStr);
            });
        }
        lvfLog("Trying to load " + imgSrc_pathStr);
        sprite.src = imgSrc_pathStr;
    });
}

function lvfGetSprite(name) {
    if (name in lvdb.sprites) {
        return lvdb.sprites[name];
    } else {
        return null;
    }
}

// sprite { data { [], length }, width, height }
function lvfDrawSprite(screen_u8Arr, sprite, x, y) {
    if (!sprite) { return; }

    // lvfLog("sprite data length is " + sprite.data.data.length);
    // lvfLog("sprite num pixels is " + sprite.data.data.length / 4);
    // lvfLog("sprite is " + sprite.width + " x " + sprite.height);

    let data = sprite.data.data;
    let cnv = screen_u8Arr;
    // spr_xx = 0;
    for (let spr_k = 0; spr_k < data.length; spr_k += 4) {
        let spr_x = Math.floor((spr_k / 4) % sprite.width); // pxi % 16
        let spr_y = Math.floor((spr_k / 4) / sprite.width);

        let scr_x = x + spr_x;
        let scr_y = y+ spr_y;
        let scr_k = (scr_y*LVC_SCREEN_WIDTH + scr_x) * 4;

        let spr_r = data[spr_k + 0];
        let spr_g = data[spr_k + 1];
        let spr_b = data[spr_k + 2];
        let spr_a = data[spr_k + 3]; // TODO: blend w alpha
        spr_a = spr_a/255.;

        // lvfLog("sprite pixel green is " + spr_g);
        // blend w alpha
        let cnv_r = cnv[scr_k + 0];
        let cnv_g = cnv[scr_k + 1];
        let cnv_b = cnv[scr_k + 2];
        // cnv_a = cnv[scr_k + 3];

        cnv[scr_k + 0] = cnv_r + (spr_r - cnv_r)*spr_a;
        cnv[scr_k + 1] = cnv_g + (spr_g - cnv_g)*spr_a;
        cnv[scr_k + 2] = cnv_b + (spr_b - cnv_b)*spr_a;
        cnv[scr_k + 3] = 255;
    }
}

// Raw Assets
// ==================

function lvfLoadRawAsset(name, obj) {
    lvfStoreRawAsset(name, obj);
}
function lvfStoreRawAsset(name, obj) {
    lvdb.rawAssets[name] = obj;
}

function lvfGetRawAsset(name) {
    if (name in lvdb.rawAssets) {
        return lvdb.rawAssets[name];
    } else {
        return null;
    }
}

// Strings
// ==================

// Returns a string array split on any of the split options 
function lvfStrSplit(str, splitOptArr) {
    let res = []
    
    let buf = str
    while (buf.length > 0) {
        // Get next index in buffer for all split opts.
        let idcs = []
        let soi = 0;
        for (let splitOpt of splitOptArr) {
            let mi = buf.indexOf(splitOpt);
            idcs.push([mi, soi]);
            soi += 1;
        }

        // Order idcs like -1, -1, 2, 6 ...
        // Then cut off -1s.
        // lvfLog("start idcs " + idcs);
        idcs.sort((a, b) => a[0] - b[0]).reverse();
        let n1Idx = idcs.findIndex(el => el[0] == -1);
        // lvfLog("reversed pre-n1 idcs " + idcs);
        if (n1Idx != -1) {
            // lvfLog("n1Idx " + n1Idx);
            idcs = idcs.slice(0, n1Idx);
        }
        idcs = idcs.reverse();
        // lvfLog("now idcs " + idcs);

        // Get idx and len of match.
        let firstIdx = -1;
        let matchOpt = "";
        if (idcs.length > 0) {
            firstIdx = idcs[0][0];
            matchOpt = splitOptArr[idcs[0][1]];
        }

        // Add substring, remove from buffer.
        if (firstIdx == -1) {
            // No more splits in buffer.
            // Append rest of buffer as entry.
            // lvfLog("pushing rest of buf, '" + buf + "'");
            res.push(buf);
            buf = "";
        } else {
            // Use firstIdx to add substr, shorten buf.
            let substr = buf.slice(0, firstIdx);
            res.push(substr);
            // lvfLog("Pushed substr '" + substr + "' of total buf '" + buf + "'");
            buf = buf.slice(firstIdx + matchOpt.length);
        }
    }

    return res;
}

// ===================================
// DEBUG
// ===================================

lvfLog("lib.js has been loaded.")

export {
  lvfLog,
  lvfLoadSprite,
  lvfStrSplit,
  lvfStoreRawAsset,
  lvfGetSprite,
  lvfGetRawAsset,
  LVC_SCREEN_WIDTH,
  LVC_SCREEN_HEIGHT,
  lvfDrawSprite,
  lvfRunCart
};