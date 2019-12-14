import { vol, Volume } from 'memfs';

import { Dirgest } from './dirgest';

const METHOD = 'sha1';
const SHA1 = new RegExp(/[0-9a-f]{40}/);

describe('Dirgest', () => {
  beforeEach(() => {
    vol.reset();
  });
  describe('constructor', () => {
    it('should throw on invalid hash method', () => {
      expect(() => new Dirgest('bogus')).toThrow(/unsupported method/);
    });
  });
  describe('dirgest', () => {
    it('should return empty string for empty dir', async () => {
      vol.mkdirSync('/empty');

      const dirgest = new Dirgest('sha1', vol as any);
      const hashes = await dirgest.dirgest('/empty');
      expect(hashes.hash).toBe('');
      expect(Object.keys(hashes.files).length).toBe(0);
    });
    it('should generate digests for basic directory contents', async () => {
      const mockfs = {
        '/a/1.js': 'foo',
        '/a/2.js': 'bar'
      };
      vol.fromJSON(mockfs);

      const dirgest = new Dirgest('sha1', vol as any);
      const hashes = await dirgest.dirgest('/a');
      expect(hashes.hash).toMatch(SHA1);
      expect(hashes.files).toBeTruthy();
      const keys = Object.keys(hashes.files);
      expect(keys.length).toBe(2);
      expect(hashes.files[keys[0]]).toMatch(SHA1);
      expect(hashes.files[keys[1]]).toMatch(SHA1);
    });
    it('generate different digest when adding empty file', async () => {
      let mockfs: any = {
        '/a/1.js': 'foo'
      };
      vol.fromJSON(mockfs);
      const dirgest = new Dirgest('sha1', vol as any);
      const hash1 = await dirgest.dirgest('/a');

      mockfs['/a/2.js'] = '';
      vol.fromJSON(mockfs);
      const hash2 = await dirgest.dirgest('/a');

      expect(hash1.hash).not.toBe(hash2.hash);
    });
    it('should gracefully skip a symlink', async () => {
      vol.fromJSON({
        '/real/1.js': 'foo'
      });
      vol.symlinkSync('/real', '/fake');
      const dirgest = new Dirgest('sha1', vol as any);
      const hash = await dirgest.dirgest('/');
      expect(Object.keys(hash.files).length).toBe(1);
    })
    it('should reject on invalid dir', async () => {
      vol.fromJSON({
        '/valid/1.js': ''
      });
      const dirgest = new Dirgest('sha1', vol as any);
      await expect(dirgest.dirgest('/invalid')).rejects.toThrow();
    });
  });
});
