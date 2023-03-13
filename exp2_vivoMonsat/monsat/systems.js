import * as X from "./utils.js";

export function update_player(res, mem, world) {
    const player_id = mem.player_id;
    if (player_id === undefined || world.entities[player_id].loading) { return; }

    const player = world.entities[player_id];
    const inp = res.inputs;

    // Walking

    let walk_dir = null;
    const player_speed = 70;
    if (inp.down) { walk_dir = "down"; }
    else if (inp.up) { walk_dir = "up"; }
    else if (inp.left) { walk_dir = "left"; }
    else if (inp.right) { walk_dir = "right"; }
    const move_amount = player_speed * res.dt;
    const move_axis = walk_dir == "down" || walk_dir == "up" ? 1 : 0;
    const move_sign = walk_dir == "up" || walk_dir == "left" ? -1 : 1;
    if (walk_dir != null) {
        player.pos[move_axis] = player.pos[move_axis] + move_sign * move_amount;
    }

    // Animation

    let last_dir = mem.player_last_dir;
    if (last_dir === undefined) { mem.player_last_dir = last_dir = "down"; }
    if (walk_dir != null) { last_dir = walk_dir; }
    mem.player_last_dir = last_dir;

    let state = "idle";
    if (inp.up || inp.down || inp.left || inp.right) {
        state = "walk";
    }
    let anim = state + "_" + last_dir;
    // res.log_frame("anim: " + anim);
    
    player.animator.animation = anim;

    // Finish

    world.entities[player_id] = player;
}

/** Turns sprite strings into sprite handles by passing them to Vivo.load_sprite. */
export function update_sprite_handles(res, mem, world) {
    for (const key in world.entities) {
        const ent = world.entities[key];
        if (typeof(ent.sprite) == "string" && ent.sprite.endsWith(".png")) {
            res.log("Trying to load sprite path " + ent.sprite);
            let sprite_handle = res.load_sprite("actor_avi", mem.asset_root_path + ent.sprite);
            // ent.sprite = sprite_handle;
            world.entities[key].sprite = ent.sprite = sprite_handle;
        }
    }
}

export function update_camera(res, mem, world) {
    const cam_ent = mem.camera_ent;
    // if (cam_ent === undefined) {
    //     // Init camera.
    //     cam_ent = 
    // }
}

export function update_sprite_render_cmds(res, mem, world) {
    let render_cmd_count = 0;
    for (const ent_name in world.entities) {
        const ent = world.entities[ent_name];
        if (ent["spritesheet"]) {
            let anchor = ent.anchor || [0, 0];
            let sheet = ent.spritesheet;
            let cell = [0, 0];
            let animator = ent.animator;
            let animations = ent.animations || {};
            if (animator !== undefined) {
                cell = animator.cell;
                if (animator.playing) {
                    var anim = animations[animator.animation];
                    if (anim === undefined) {
                        res.log_frame("Can't animate, missing animation " + animator.animation);
                    } else {
                        animator.time += res.dt;
                        const frame_count = anim.frames.length;
                        const step_interval = 1. / animator.cells_per_sec * anim.speed;
                        res.log_frame("sheet.cols " + sheet.cols);
                        res.log_frame("frame_count " + frame_count);
                        if (animator.time >= step_interval) {
                            animator.time -= step_interval;
                            animator.frame += 1;
                        }
                        if (animator.frame >= frame_count) {
                            animator.frame = animator.frame % frame_count;
                        }
                        cell = animator.cell = [
                            Math.floor(anim.frames[animator.frame] % sheet.cols),
                            Math.floor(anim.frames[animator.frame] / sheet.cols)
                        ];
                        res.log_frame("CELL " + JSON.stringify(cell));
                        res.log_frame("FRAME " + animator.frame);
                    }
                }
                res.log_frame("animator time " + Math.floor(animator.time));
                res.log_frame("animator cell " + JSON.stringify(cell));
            }
            let slice = [
                cell[0] * sheet.cell_width, cell[1] * sheet.cell_height,
                sheet.cell_width, sheet.cell_height
            ];
            world.render_cmds[ent_name + "::sprite_slice"] = {
                "type": "sprite",
                "sprite_handle": ent.sprite,
                "pos": X.arr_sub(ent.pos, anchor),
                "slice": slice,
            }
        } else if (ent["sprite"]) {
            world.render_cmds[ent_name + "::sprite"] = {
                "type": "sprite",
                "sprite_handle": ent.sprite,
                "pos": ent.pos
            };
        }
        // res.log_frame("ent is " + JSON.stringify(ent));
        // Plain sprite.
        render_cmd_count += 1;
    }
    res.log_frame(`Added ${render_cmd_count} render commands for sprites.`);
}
