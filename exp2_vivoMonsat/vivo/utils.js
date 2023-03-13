
// Clear

/** Removes all keys from the object. */
export function clear(obj) {
    for (var key in obj) {
        obj[key] = undefined;
    }
}

// Clone

/** Deep clone. Object, Array, and primitives. */
export function clone(obj) {
    let cloned = {};
    if (typeof obj == "object") {
        if (Array.isArray(obj)) { // Special case for arrays to keep Array methods
            cloned = [];
        } else {
            cloned = {};
        }
        for (var key in obj) {
            cloned[key] = clone(obj[key]);
        }
    } else { // Assume a primitive.
        cloned = obj;
    }
    return cloned;
}

// Merge

/** Merges other on top of obj. If other contains the same key, it overwrites. No cloning occurs. Returns obj. */
export function merge_into(obj, other) {
    for (var key in other) {
        obj[key] = other[key];
    }
    return obj;
}

// Require

export function req_arr(obj, name) {
    if (obj[name] === undefined || obj[name] === null) {
        obj[name] = [];
    }
    return obj[name];
}

export function req_obj(obj, name) {
    if (obj[name] === undefined || obj[name] === null) {
        obj[name] = {};
    }
    return obj[name];
}

export function req(obj, name, default_val) {
    if (obj[name] === undefined || obj[name] === null) {
        obj[name] = default_val;
    }
    return obj[name];
}
