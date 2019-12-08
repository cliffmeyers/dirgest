import path from 'path';
import { vol } from 'memfs';

import { Dirgest } from './dirgest';

describe('Dirgest', () => {
    describe('constructor', () => {
        it('should throw on invalid hash method', () => {
            expect(() => new Dirgest('bogus')).toThrow(/unsupported method/);
        });
    });
    it('should work', (done) => {
        const mockfs = {
            'a.js': 'foo',
            'b.js': 'bar'
        };
        vol.fromJSON(mockfs);

        const dirgest = new Dirgest('sha1', vol as any);
        dirgest.dirgest('.', (err, hashes) => {
            console.log('error!', err)
            console.log(JSON.stringify(hashes, null, 2));
            done();
        });
    });
});