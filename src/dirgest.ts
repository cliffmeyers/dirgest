// Copyright 2011 Mark Cavage <mcavage@gmail.com> All rights reserved.
// Copyright 2019 Cliff Meyers <cliff.meyers@gmail> All rights reserved.

import crypto from 'crypto';
import fs from 'fs';
// import * as path from 'path';

import { DirHash } from './dir-hash';

interface Callback {
    (err: any, dirgest?: DirHash) :void
}

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
  
  dirgest(root: string, callback: Callback, filter?: Filter) {
    if (!root || typeof(root) !== 'string') {
      throw new TypeError('root is required (string)');
    }
    if (!callback || typeof(callback) !== 'function') {
      throw new TypeError('callback is required (function)');
    }
  
    const hashes: any = {};
  
    this._filesystem.readdir(root, (err, files) => {
      if (err) return callback(err);
  
      if (files.length === 0) {
        return callback(undefined, {hash: '', files: {}});
      }
  
      let hashed = 0;
      files.forEach((f) => {
        const currentPath = root + '/' + f;
        this._filesystem.stat(currentPath, (errStat, stats) => {
          if (errStat) return callback(errStat);
  
          // TODO: get proper relative path from root
          /*
          const isDir = stats.isDirectory();
          console.log(root, currentPath);
          const relativePath = path.relative(root, currentPath);
          console.log(relativePath);
          */
  
          if (stats.isDirectory()) {
            return this.dirgest(currentPath, (errDirgest, hash) => {
              if (errDirgest) return hash;
  
              hashes[f] = hash;
              if (++hashed >= files.length) {
                return callback(undefined, this._summarize(hashes));
              }
            });
          } else if (stats.isFile()) {
            this._filesystem.readFile(currentPath, 'utf8', (errRead, data) => {
              if (errRead) return callback(errRead);
  
              const hash = crypto.createHash(this._method);
              hash.update(data);
              hashes[f] = hash.digest('hex');
  
              if (++hashed >= files.length) {
                return callback(undefined, this._summarize(hashes));
              }
            });
          } else {
            console.error('Skipping hash of %s', f);
            if (++hashed > files.length) {
              return callback(undefined, this._summarize(hashes));
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
        hash: '',
    };
    const hash = crypto.createHash(this._method);
    for (let i = 0; i < keys.length; i++) {
      if (typeof(hashes[keys[i]]) === 'string') {
        hash.update(hashes[keys[i]]);
      } else if (typeof(hashes[keys[i]]) === 'object') {
        hash.update(hashes[keys[i]].hash);
      } else {
        console.error('Unknown type found in hash: ' + typeof(hashes[keys[i]]));
      }
    }
  
    obj.hash = hash.digest('hex');
    return obj;
  }

}
