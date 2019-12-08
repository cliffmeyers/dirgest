#!/usr/bin/env node

import { Dirgest } from './dirgest';
import { DirHash } from './dir-hash';

const dirPath = process.argv[2];
const method = process.argv[3]

new Dirgest(method || undefined)
    .dirgest(dirPath, (error: Error, result: DirHash | undefined) => {
        if (error) {
            console.error(error);
            process.exit(1);
        }
        console.log(JSON.stringify(result, null, 4));
    })