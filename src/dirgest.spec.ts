import { vol, Volume } from 'memfs';

import { Dirgest } from './dirgest';

const METHOD = 'sha1';
const SHA1 = new RegExp(/[0-9a-f]{40}/);

describe('Dirgest', () => {
    beforeEach(() => {
        vol.reset();
    })
    describe('constructor', () => {
        it('should throw on invalid hash method', () => {
            expect(() => new Dirgest('bogus')).toThrow(/unsupported method/);
        });
    });
    describe('dirgest', () => {
        it('should return empty string for empty dir', async () => {
            const v = new Volume();
            v.mkdirSync('/empty');

            const dirgest = new Dirgest('sha1', v as any);
            const hashes = await dirgest.dirgest('/empty');
            expect(hashes.hash).toBe('');
            expect(Object.keys(hashes.files).length).toBe(0);
        });
        it('should generate digests for basic directory contents', async () => {
            const mockfs = {
                'a.js': 'foo',
                'b.js': 'bar'
            };
            vol.fromJSON(mockfs);

            const dirgest = new Dirgest('sha1', vol as any);
            const hashes = await dirgest.dirgest('.');
            expect(hashes.hash).toMatch(SHA1);
            expect(hashes.files).toBeTruthy();
            const keys = Object.keys(hashes.files);
            expect(keys.length).toBe(2);
            expect(hashes.files[keys[0]]).toMatch(SHA1);
            expect(hashes.files[keys[1]]).toMatch(SHA1);
        });
        it('generate different digest when adding empty file', async () => {
            let mockfs: any = {
                'a.js': 'foo'
            };
            vol.fromJSON(mockfs);
            const dirgest = new Dirgest('sha1', vol as any);
            const hash1 = await dirgest.dirgest('.');
            
            mockfs['b.js'] = '';
            vol.fromJSON(mockfs);
            const hash2 = await dirgest.dirgest('.');
            
            expect(hash1.hash).not.toBe(hash2.hash);
        })
    });
});