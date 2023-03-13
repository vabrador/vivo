

export class Actor {
    load(res, entity_def) {
        if (entity_def["actor"] === undefined) {
            res.log("Missing 'actor' in entity_def");
            return;
        }
        for (var key in actor_def) {
            this[key] = actor_def[key];
        }
    }
}
