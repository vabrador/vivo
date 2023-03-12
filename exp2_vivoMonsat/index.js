import * as vv from "./vivo/vivo.js";
import * as monsat from "./monsat/cart.js"

// Console Log
// -----------
const console_el = document.getElementById("vv_console");
function log(s) {
    // console_el.innerHtml = s + "<br>" + console_el.innerHtml;
    console_el.textContent = s + " - - - " + console_el.textContent;
}
const frame_console_el = document.getElementById("vv_frame_console");
function frame_log(s) {
    frame_console_el.textContent = s + " < - - " + frame_console_el.textContent;
}
function clear_frame_log(s) {
    frame_console_el.textContent = "";
}
log("index.js starting...");

log("Creating a new Vivo console...");
const Vivo = vv.Vivo;
let vivo = new Vivo();
log("Created Vivo console.");
vivo.set_log_func(log);
vivo.set_frame_log_funcs(frame_log, clear_frame_log);

// Load Cartridge
// --------------
vivo.load_cart(monsat.get_cartridge());

// Load Save Data
// --------------
let save_data = {};
vivo.load_save_data(save_data);

// Set up Input
// ------------
let browser_inputs = {};
let vivo_keymap = {
    "ArrowUp": "up",
    "ArrowDown": "down",
    "ArrowLeft": "left",
    "ArrowRight": "right",
    "z": "a",
    "x": "b"
}
window.onkeyup = function(e) {
    if (vivo_keymap[e.key]) { browser_inputs[vivo_keymap[e.key]] = false; }
}
window.onkeydown = function(e) {
    if (vivo_keymap[e.key]) { browser_inputs[vivo_keymap[e.key]] = true; }
}
log("Configured browser input.");

// Simulation Loop
// ---------------
const SIM_TARGET_FPS = 30;
const canvas = document.getElementById("vv_screen_canvas");
// log("Got screen canvas.");
const canvas_ctx = canvas.getContext("2d");
// log("Got canvas context.");
const canvas_data = canvas_ctx.getImageData(0, 0, vv.SCREEN_WIDTH, vv.SCREEN_HEIGHT);
// log("Got canvas_data.");
const canvas_data_u8arr = canvas_data.data;
log("Got canvas_data_u8arr.");
log("Initializing console sim loop.");
window.setInterval(() => {
    // Update "Hardware" Input
    // -----------------------
    vivo.set_inputs(browser_inputs);
    vivo.set_screen_buffer(canvas_data_u8arr);

    // Update Vivo "Hardware"
    // ----------------------
    vivo.step();

    // Copy screen buffer to canvas display
    // ------------------------------------
    canvas_ctx.putImageData(canvas_data, 0, 0);

}, Math.floor(1000. / SIM_TARGET_FPS));
