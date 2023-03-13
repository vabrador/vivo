
import * as X from "./utils.js";
import * as Sys from "./systems.js";
// import { Actor } from "./actor.js";

// import * as avi_def from "./actors/avi.json";

// var json = 

// const CART_ROOT = "../monsat";
const avipath = "monsat/sprites/actor_avi.png";
const CART_ROOT = "monsat/";
// Sys.asset_root_path = CART_ROOT;

export function get_cartridge() {
    return new Monsat();
}

class Monsat {
    exec(res, mem, world) {
        // Initialize systems.
        if (mem.systems === undefined) {
            mem.systems = [];
            mem.asset_root_path = CART_ROOT;

            mem.systems.push(
                Sys.update_player,
                Sys.update_sprite_handles,
                Sys.update_camera,
                Sys.update_sprite_render_cmds,
            );
        }
        // Run systems.
        for (var key in mem.systems) {
            var system = mem.systems[key];
            try {
                system(res, mem, world);
            } catch (e) {
                res.log_frame("Failed to run system " + system.name + ": " + e);
            }
        }

        // Initialize player.
        if (mem.player_id === undefined) {
            // let sprite_handle = res.load_sprite("actor_avi", CART_ROOT + "sprites/actor_avi.png");
            
            // res.log("calling SPAWN");
            mem.player_id = res.spawn_from_json(CART_ROOT + "json/avi.json", (spawned_id, world) => {
                let ent = X.merge_into(world.entities[spawned_id], {
                    "pos": [40, 20]
                });
                res.log("SPAWNED: " + JSON.stringify(ent));
            });

            // res.load_json(,
            //     json => {
            //         mem.player = X.merge_into(X.clone(resp.components), {
            //             "loading": false,
            //             "pos": [40, 20],
            //             "sprite": sprite_handle,
            //         });
            //     }, err => {
            //         res.log("Failed to load json at " + load_path);
            //         mem.player = {
            //             "loading": false,
            //             "error": err,
            //         };
            //     }
            // );
            
        }
        // X.req_obj(world, "entities");
        // world.entities.player = mem.player;

        return;
        let dt = res.dt;
        let speed = 36;
        let dir = X.req(mem, "dir", 1);
        let pos = mem.player.pos;
        pos[1] += dir * speed * dt;
        if (pos[1] > 80) { mem.dir = -1; }
        if (pos[1] < 20) { mem.dir = 1; }
        res.log_frame("dir is " + dir);
    }
}
