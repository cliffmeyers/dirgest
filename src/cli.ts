#!/usr/bin/env node

import { Dirgest } from './dirgest';

const dirPath = process.argv[2];
const method = process.argv[3]

new Dirgest(method || undefined)
    .dirgest(dirPath)
    .then(result => {
        console.log(JSON.stringify(result, null, 4));
    });