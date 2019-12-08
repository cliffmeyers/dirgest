import * as path from 'path';

import { dirgest } from './dirgest';

describe('dirgest', () => {
    it('should work', (done) => {
        dirgest(path.resolve(__dirname, './__mocks__'), 'sha1', (err, hashes) => {
            console.log('error!', err)
            console.log(JSON.stringify(hashes, null, 2));
            done();
        });
    });
});