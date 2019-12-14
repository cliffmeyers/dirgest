import path from 'path';
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
        it('should return empty string for empty dir', (done) => {
            const v = new Volume();
            v.mkdirSync('/empty');

            const dirgest = new Dirgest('sha1', v as any);
            dirgest.dirgest('/empty', (err, hashes) => {
                expect(hashes?.hash).toBe('');
                expect(hashes?.files).toBeDefined();
                const keys = Object.keys(hashes?.files || {});
                expect(keys.length).toBe(0);
                done();
            });
        });
        it('should generate digests for basic directory contents', (done) => {
            const mockfs = {
                'a.js': 'foo',
                'b.js': 'bar'
            };
            vol.fromJSON(mockfs);

            const dirgest = new Dirgest('sha1', vol as any);
            dirgest.dirgest('.', (err, hashes) => {
                expect(hashes).toBeDefined();
                if (hashes) {
                    expect(hashes.hash).toMatch(SHA1);
                    expect(hashes.files).toBeTruthy();
                    if (hashes.files) {
                        const keys = Object.keys(hashes.files);
                        expect(keys.length).toBe(2);
                        expect(hashes.files[keys[0]]).toMatch(SHA1);
                        expect(hashes.files[keys[1]]).toMatch(SHA1);
                    }
                }
                done();
            });
        });
        it('generate different digest when adding empty file', (done) => {
            let mockfs: any = {
                'a.js': 'foo'
            };
            vol.fromJSON(mockfs);

            // doesn't take long for callbacks to get ugly
            const dirgest = new Dirgest('sha1', vol as any);
            dirgest.dirgest('.', (err, hashes) => {
                const hash1 = hashes && hashes.hash;
                
                mockfs['b.js'] = '';
                vol.fromJSON(mockfs);
                
                dirgest.dirgest('.', (err, hashes) => {
                    const hash2 = hashes && hashes.hash;
                    expect(hash1).not.toBe(hash2);
                    done();
                });
            });
        })
    });
});