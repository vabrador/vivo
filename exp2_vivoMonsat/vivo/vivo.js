import * as X from "./utils.js";
import { ScreenOps } from "./screen.js";

export const SCREEN_WIDTH = 128;
export const SCREEN_HEIGHT = 128;
export const CONSOLE_FPS = 30; // Assumed step() rate.
export const CONSOLE_TIMESTEP = 1. / CONSOLE_FPS;

/** Vivo console implementation. */
export class Vivo {
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
    #ent_id = 1

    constructor() {
        this.reset();
    }
    
    reset() {
        this.#screen_u8arr = new Uint8Array(SCREEN_WIDTH * SCREEN_HEIGHT);
        this.#mem = {};
        this.#world = {
            "entities": {},
            "render_cmds": [],
        };
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
    try(func) {
        try { return func(); }
        catch (e) { this.log("Error: " + e); }
    }
    try_frame(func) {
        try { return func(); }
        catch (e) { this.log_frame("Error: " + e); }
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
                if (this.#inputs[key]) {
                    this.log_frame("KEY DOWN: " + key);
                }
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
        this.#render_cmds();
        this.log_frame("Clearing render commands.");
        X.clear(this.#world.render_cmds);
        
        this.#time += this.#time_step;
    }
    #prepare_resources() {
        let res = {};
        res.time = this.#time;
        res.dt = CONSOLE_TIMESTEP;
        res.log = (s) => this.log("[Cart] " + s);
        res.log_frame = (s) => this.log_frame("[Cart] " + s);
        res.try = (f) => this.try(f);
        res.try_frame = (f) => this.try_frame(f);
        res.inputs = this.#inputs;
        res.assets = this.#assets;
        res.load_sprite = (n, p) => this.load_sprite(n, p);
        res.spawn_from_json = (p, o) => this.spawn_from_json(p, o);
        return res;
    }
    #render_clear() {
        this.log_frame("Clearing screen");
        ScreenOps.clear(this.#screen_u8arr, [128, 255, 64, 255]);
    }
    #render_cmds() {
        const world = this.#world;
        const render_cmds = world["render_cmds"];
        this.log_frame("render_cmds length " + render_cmds?.length);
        if (render_cmds === undefined || render_cmds === null) {
            this.log_frame("render_cmds is null/undefined");
        }
        else {
            let render_cmd_count = 0;
            let unrenderable_count = 0;
            for (let key in render_cmds) {
                let cmd = render_cmds[key];
                if (cmd.type == "sprite") {
                    // cmd: type, sprite_handle, pos
                    let sprite_hdl = cmd.sprite_handle;
                    // this.log_frame("sprite_handle is " + sprite_hdl);
                    if (!is_ready(sprite_hdl)) { this.log_frame("sprite_handle not ready"); continue; }
                    // this.log_frame("handle deets " + JSON.stringify(hdl));
                    let sprite = this.#assets.sprites[sprite_hdl];
                    // this.log_frame("sprite assets is " + JSON.stringify(this.#assets.sprites));
                    // this.log_frame("sprite is " + (JSON.stringify(sprite) || sprite));
                    if (!is_ready(sprite)) { this.log_frame("sprite not ready"); continue; }
                    let pos = cmd.pos;
                    if (!is_ready(pos)) { this.log_frame("pos not ready"); continue; }
                    pos = [Math.floor(pos[0]), Math.floor(pos[1])];

                    let opt_slice = cmd.slice;
                    try {
                        if (opt_slice === undefined) {
                            // Render the whole sprite.
                            this.#render_sprite(sprite, pos);
                        } else {
                            // Render the defined slice.
                            this.#render_sprite(sprite, pos, opt_slice);
                        }
                    }
                    catch (e) {
                        this.log_frame("Render sprite error: " + e);
                    }
                    
                    render_cmd_count += 1;
                }
                else {
                    unrenderable_count += 1;
                }
            }
            this.log_frame("Processed " + render_cmd_count + " render cmds.");
            this.log_frame(`${unrenderable_count} cmds were unrenderable.`);
        }
        // -----
        // this.log_frame("Rendering world.");
        // // const world = this.#world;
        // let ent_count = 0;
        // for (var key in world) {
        //     const val = world[key];
        //     if (key == "entities") {
        //         const entities = val;
        //         for (var ent_name in entities) {
        //             let ent = entities[ent_name];
        //             ent_count += 1;
        //             var sprite_hdl = ent.sprite;
        //             var sprite = this.#assets.sprites[sprite_hdl];
        //             if (sprite === undefined) { continue; }
        //             if (sprite.loading) { continue; }
        //             if (sprite.error !== undefined) {
        //                 this.log_frame("Sprite " + ent_name + " err: " + sprite.error);
        //                 continue;
        //             }

        //             var pos = ent.pos || [0, 0];
        //             pos = [Math.floor(pos[0]), Math.floor(pos[1])]
        //             // this.log_frame("Sprite pos will be " + pos);
        //             try {
        //                 this.#render_sprite(sprite, pos);
        //             }
        //             catch (e) {
        //                 this.log_frame("render failed: " + e);
        //             }
        //         }
        //     }
        // }
        // this.log_frame("Processed " + ent_count + " world entities.");
    }
    /** Provide path and an onspawned func(spawned_id, world).
     * The entity is spawned as loading immediately and its ID is returned. */
    spawn_from_json(path, onspawned) {
        this.log("loading player JSON at " + path);
        let ent_id = this.#ent_id;
        this.#ent_id += 1;
        this.#world.entities[ent_id] = { "loading": true };
        this.log("calling try_frame");
        this.try_frame(() => {
            this.log("About to call FETCH");
            // this.log("loading player JSON at " + path);
            // let load_path = CART_ROOT + "json/avi.json";
            fetch(path)
            .then(resp => { return resp.json(); }, rej => { this.log("rejected json: " + rej); })
            .then(json => {
                let name = json.name;
                if (json.spawn_type == "unique") {}
                else { this.log("NYI spawn_type: " + json.spawn_type); }
                let entity = X.merge_into(X.clone(json.components), {
                    "name": name,
                    "loading": false,
                });
                this.#world.entities[ent_id] = entity;
                this.log("spawned entity");
                onspawned(ent_id, this.#world);
            }, rej => { this.log("failed to spawn entity: " + rej); })
            .catch(err => {
                this.log("Failed to load json at " + load_path);
                let entity = {
                    "loading": false,
                    "error": err,
                };
                this.#world.entities[ent_id] = entity;
            });
            this.log("called fetch");
        });
        return ent_id;
    }
    load_sprite(name, path) {
        let img = new Image();
        img.onload = (_ev) => {
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
            this.log("Loaded " + path + " as name " + name);
        };
        img.onabort = (ev) => {
            this.log("sprite aborted: " + ev);
        };
        img.onerror = (_ev, _src, _lineno, _colno, err) => {
            this.log("sprite Image onerror called");
            let sprite = {};
            sprite.loading = false;
            sprite.data = null;
            sprite.status = "ERR";
            sprite.error = e;
            // this.log("sprite error: " + e);
            this.#assets.sprites[name] = sprite;
        };
        this.log("Trying to load " + path);
        let sprite = { "loading": true };
        this.#assets.sprites[name] = sprite;
        img.src = path;
        this.log("Set img src");
    
        return name;
    }
    /** sprite { data: ImageData }; pos: [x, y];
     * opt_slice: [x, y, w, h] || undefined */
    #render_sprite(sprite, pos, opt_slice) {
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

        let data_sliced = data;
        let ox = 0; let oy = 0;
        let ow = sprite.width; let oh = sprite.height;
        if (opt_slice !== undefined) {
            ox = opt_slice[0]; oy = opt_slice[1];
            ow = opt_slice[2]; oh = opt_slice[3];
            const osize = ow * oh * 4;
            data_sliced = new Uint8Array(osize);
            for (let sk = 0; sk < data_sliced.length; sk += 4) {
                let sx = Math.floor((sk / 4) % ow);
                let sy = Math.floor((sk / 4) / ow);
                let spr_x = ox + sx;
                let spr_y = oy + sy;
                let spr_k = (spr_y*sprite.width + spr_x) * 4;

                data_sliced[sk + 0] = data[spr_k + 0];
                data_sliced[sk + 1] = data[spr_k + 1];
                data_sliced[sk + 2] = data[spr_k + 2];
                data_sliced[sk + 3] = data[spr_k + 3];
            }
        }
        
        for (let spr_k = 0; spr_k < data_sliced.length; spr_k += 4) {
            let spr_x = Math.floor((spr_k / 4) % ow); // pxi % 16
            let spr_y = Math.floor((spr_k / 4) / ow);

            let scr_x = x + spr_x;
            let scr_y = y + spr_y;
            let scr_k = (scr_y*SCREEN_WIDTH + scr_x) * 4;

            let spr_r = data_sliced[spr_k + 0];
            let spr_g = data_sliced[spr_k + 1];
            let spr_b = data_sliced[spr_k + 2];
            let spr_a = data_sliced[spr_k + 3]; // TODO: blend w alpha
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

/** Checks whether the argument lacks a "loading" property or if it's set to false.
 * Will also return false if the asset is undefined or null.
 * Will also return false if a non-null/undefined "error" property exists. */
function is_ready(asset) {
    if (asset === undefined) { return false; }
    if (asset === null) { return false; }
    if (asset["loading"] == true) { return false; }
    if (!(asset["error"] === undefined || asset["error"] === null)) { return false; }
    return true;
}
