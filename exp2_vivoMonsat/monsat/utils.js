
// Require

export function reqArr(obj, name) {
    if (obj[name] === undefined || obj[name] === null) {
        obj[name] = [];
    }
    return obj[name];
}

export function reqObj(obj, name) {
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
