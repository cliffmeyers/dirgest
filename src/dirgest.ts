// Copyright 2011 Mark Cavage <mcavage@gmail.com> All rights reserved.
// Copyright 2019 Cliff Meyers <cliff.meyers@gmail> All rights reserved.

import crypto from 'crypto';
import fs from 'fs';

import { DirHash } from './dir-hash';

interface Filter {
  shouldDigest(path: string, isDir: boolean): boolean;
}

export class Dirgest {
  private _method: string;
  private _filesystem: typeof fs;

  constructor(method: string = 'sha1', filesystem?: typeof fs) {
    const hashes = crypto.getHashes();
    if (!hashes.includes(method)) {
      throw new Error(`unsupported method: ${method}, must be one of: ${hashes.join(' ')}`);
    }
    this._method = method;
    this._filesystem = filesystem || fs;
  }

  dirgest(root: string, filter?: Filter): Promise<DirHash> {
    if (!root || typeof root !== 'string') {
      throw new TypeError('root is required (string)');
    }

    return new Promise((resolve, reject) => {
      const hashes: any = {};

      this._filesystem.readdir(root, { withFileTypes: true }, (err, files) => {
        if (err) {
          return reject(err);
        }

        if (files.length === 0) {
          resolve({ hash: '', files: {} });
        }

        let hashed = 0;

        files.forEach(async dirent => {
          const { name } = dirent;
          const currentPath = root + '/' + name;

          if (dirent.isDirectory()) {
            const hash = await this.dirgest(currentPath);
            hashes[name] = hash;
            if (++hashed >= files.length) {
              resolve(this._summarize(hashes));
            }
          } else if (dirent.isFile()) {
            this._filesystem.readFile(currentPath, 'utf8', (errRead, data) => {
              if (errRead) {
                reject(errRead);
              }

              const hash = crypto.createHash(this._method);
              hash.update(data);
              hashes[name] = hash.digest('hex');

              if (++hashed >= files.length) {
                resolve(this._summarize(hashes));
              }
            });
          } else {
            console.error('Skipping hash of %s', name);
            if (++hashed > files.length) {
              resolve(this._summarize(hashes));
            }
          }
        });
      });
    });
  }

  _summarize(hashes: any) {
    const keys = Object.keys(hashes);
    keys.sort();

    const obj: DirHash = {
      files: hashes,
      hash: ''
    };
    const hash = crypto.createHash(this._method);
    for (let i = 0; i < keys.length; i++) {
      if (typeof hashes[keys[i]] === 'string') {
        hash.update(hashes[keys[i]]);
      } else if (typeof hashes[keys[i]] === 'object') {
        hash.update(hashes[keys[i]].hash);
      } else {
        console.error('Unknown type found in hash: ' + typeof hashes[keys[i]]);
      }
    }

    obj.hash = hash.digest('hex');
    return obj;
  }
}
