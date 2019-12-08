import * as path from 'path';

import { vol } from 'memfs';

import { makeDirgest } from './dirgest';

describe('dirgest', () => {
    it('should work', (done) => {
        const mockfs = {
            'a.js': 'foo',
            'b.js': 'bar'
        };
        vol.fromJSON(mockfs);

        const dirgest = makeDirgest(vol as any);

        dirgest('.', 'sha1', (err, hashes) => {
            console.log('error!', err)
            console.log(JSON.stringify(hashes, null, 2));
            done();
        });
    });
});