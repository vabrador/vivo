
/** Screen u8arr operations. */
class ScreenOps {
    static clear(u8arr, rgba_u8) {
        for (var p = 0; p < u8arr.length; p += 4) {
            u8arr[p + 0] = rgba_u8[0];
            u8arr[p + 1] = rgba_u8[1];
            u8arr[p + 2] = rgba_u8[2];
            u8arr[p + 3] = rgba_u8[3];
        }
    }
}

export {
    ScreenOps
}
