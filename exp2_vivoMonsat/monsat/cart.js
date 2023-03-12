
import * as X from "./utils.js"

// const CART_ROOT = "../monsat";
const avipath = "monsat/sprites/actor_avi.png";

export function get_cartridge() {
    return new Monsat();
}

class Monsat {
    exec(res, mem, world) {
        if (mem.player === undefined) {
            let sprite_handle = res.load_sprite("actor_avi", avipath);
            mem.player = {
                "name": "player",
                "pos": [50, 50],
                "sprite": sprite_handle,
            };
            X.reqObj(world, "entities");
            world.entities.player = mem.player;
        }

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
