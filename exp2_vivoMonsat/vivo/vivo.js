
import { ScreenOps } from "./screen.js";

export const SCREEN_WIDTH = 128;
export const SCREEN_HEIGHT = 128;
export const CONSOLE_FPS = 30; // Assumed step() rate.
export const CONSOLE_TIMESTEP = 1. / CONSOLE_FPS;

/** Vivo console implementation. */
class Vivo {
    #log_data = "";
    inner_log_func = function(s) { this.#log_data += s + "\n"; };
    #log_frame_data = "";
    #log_frame_func = function(s) { this.#log_frame_data = s + " <- " + this.#log_frame_data; }
    #log_frame_clear_func = function() { this.#log_frame_data = ""; }
    #cart = null
    #save_data = {}
    #inputs = {
        "up": false, "down": false, "left": false, "right": false,
        "a": false, "b": false,
        "start": false, "select": false,
    }
    #screen_u8arr = null
    #time_step = 1. / CONSOLE_FPS;
    #time = 0.
    #mem = {}
    #world = {}
    #assets = {}

    constructor() {
        this.reset();
    }
    
    reset() {
        this.#screen_u8arr = new Uint8Array(SCREEN_WIDTH * SCREEN_HEIGHT);
        this.#mem = {};
        this.#world = {};
        this.#assets = {
            "sprites": {}
        };
    }
    set_log_func(log_func) {
        this.inner_log_func = log_func;
        this.log("Set log function.");
    }
    set_frame_log_funcs(frame_log_func, frame_log_clear_func) {
        this.#log_frame_func = frame_log_func;
        this.#log_frame_clear_func = frame_log_clear_func;
        this.log("Set frame log functions.");
    }
    /** Logs using the set log function. */
    log(s) {
        this.inner_log_func(s);
    }
    log_frame(s) {
        this.#log_frame_func(s);
    }
    log_frame_clear() {
        this.#log_frame_clear_func();
    }
    load_cart(cartridge) {
        this.#cart = cartridge;
        this.log("Loaded cartridge.");
    }
    /** Sets the current save data. */
    load_save_data(save_data) {
        this.#save_data = save_data;
        this.log("Loaded save data.");
    }
    /** Sets the hardware input state. See Vivo.#inputs for valid keys. */
    set_inputs(inputs) {
        for (var key in inputs) {
            if (this.#inputs[key] === undefined) {
                this.log("Invalid input key: " + key);
            } else {
                this.#inputs[key] = inputs[key];
            }
        }
        // this.log("Updated input state.");
    }
    set_screen_buffer(screen_buffer_u8arr) { 
        this.#screen_u8arr = screen_buffer_u8arr;
        this.log_frame("Set screen buffer.");
    }
    /** Main update function. Call at CONSOLE_FPS rate (30) for real-time. */
    step() {
        this.log_frame_clear();
        this.log_frame("(Frame start)");

        let res = this.#prepare_resources();
        this.log_frame("Calling cart.exec()");
        try {
            this.#cart.exec(res, this.#mem, this.#world);
        }
        catch (e) {
            this.log_frame("Cart exec exception: " + e);
        }
        this.log_frame("cart.exec() finished.");
        this.#render_clear();
        this.#render_world();
        
        this.#time += this.#time_step;
    }
    #prepare_resources() {
        let res = {};
        res.time = this.#time;
        res.dt = CONSOLE_TIMESTEP;
        res.log = (s) => this.log("[Cart] " + s);
        res.log_frame = (s) => this.log_frame("[Cart] " + s);
        res.inputs = this.#inputs;
        res.assets = this.#assets;
        res.load_sprite = (n, p) => this.load_sprite(n, p);
        return res;
    }
    #render_clear() {
        this.log_frame("Clearing screen");
        ScreenOps.clear(this.#screen_u8arr, [128, 255, 64, 255]);
    }
    #render_world() {
        this.log_frame("Rendering world.");
        const world = this.#world;
        let ent_count = 0;
        for (var key in world) {
            const val = world[key];
            if (key == "entities") {
                const entities = val;
                for (var ent_name in entities) {
                    let ent = entities[ent_name];
                    ent_count += 1;
                    var sprite_hdl = ent.sprite;
                    var sprite = this.#assets.sprites[sprite_hdl];
                    if (sprite === undefined) { continue; }
                    if (sprite.loading) { continue; }
                    if (sprite.error !== undefined) {
                        this.log_frame("Sprite " + ent_name + " err: " + sprite.error);
                        continue;
                    }

                    var pos = ent.pos || [0, 0];
                    pos = [Math.floor(pos[0]), Math.floor(pos[1])]
                    // this.log_frame("Sprite pos will be " + pos);
                    try {
                        this.#render_sprite(sprite, pos);
                    }
                    catch (e) {
                        this.log_frame("render failed: " + e);
                    }
                }
            }
        }
        this.log_frame("Processed " + ent_count + " world entities.");
    }
    load_sprite(name, path) {
        let img = new Image();
        img.onload = () => {
            this.log("Got onload");
            let canvas = document.createElement('canvas');
            let context = canvas.getContext('2d');
            canvas.width = img.width;
            canvas.height = img.height;
            context.drawImage(img, 0, 0);
            var data = context.getImageData(0, 0, img.width, img.height);
            this.log("got data");
    
            // Store into the sprite database.
            let sprite = {};
            sprite.loading = false;
            sprite.data = data;
            sprite.width = img.width;
            sprite.height = img.height;
            sprite.status = "OK";
            this.log("prepped sprite");
            this.#assets.sprites[name] = sprite;
    
            // canvas.remove();
            this.log("Loaded " + path);
        };
        img.onabort = (e) => {
            this.log("sprite aborted: " + e);
        };
        img.onerror = (e) => {
            this.log("sprite error: " + e);
            let sprite = {};
            sprite.loading = false;
            sprite.data = null;
            sprite.status = "ERR";
            sprite.error = e;
            this.log("sprite error: " + e);
            this.#assets.sprites[name] = sprite;
        };
        this.log("Trying to load " + path);
        let sprite = { "loading": true };
        this.#assets.sprites[name] = sprite;
        img.src = path;
        this.log("Set img src");
    
        return name;
    }
    #render_sprite(sprite, pos) {
        // for (var key in sprite) {
        //     this.log_frame("sprite key " + key + " is " + sprite[key]);
        // }
        // this.log_frame("sprite data is " + sprite.data);
        // this.log_frame("sprite data length is " + sprite.data.data.length);
        // this.log_frame("sprite num pixels is " + sprite.data.data.length / 4);
        // this.log_frame("sprite is " + sprite.width + " x " + sprite.height);

        let data = sprite.data.data;
        let cnv = this.#screen_u8arr;
        const x = pos[0]; const y = pos[1];
        // spr_xx = 0;
        for (let spr_k = 0; spr_k < data.length; spr_k += 4) {
            let spr_x = Math.floor((spr_k / 4) % sprite.width); // pxi % 16
            let spr_y = Math.floor((spr_k / 4) / sprite.width);

            let scr_x = x + spr_x;
            let scr_y = y+ spr_y;
            let scr_k = (scr_y*SCREEN_WIDTH + scr_x) * 4;

            let spr_r = data[spr_k + 0];
            let spr_g = data[spr_k + 1];
            let spr_b = data[spr_k + 2];
            let spr_a = data[spr_k + 3]; // TODO: blend w alpha
            spr_a = spr_a/255.;

            // this.log_frame("sprite pixel green is " + spr_g);
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
}

export { Vivo }
