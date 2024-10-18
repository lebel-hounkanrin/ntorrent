'use strict';

import crypto from 'crypto';

let id = null;
const genId = () => {
    if (!id) {
        id = Buffer.alloc(20);
        Buffer.from('-AT0001-').copy(id, 0);
        crypto.randomBytes(12).copy(id, 8);
    }
    return id;
};


export {genId}