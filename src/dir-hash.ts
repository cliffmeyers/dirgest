export interface DirHash {
    hash: string;
    files: {
      [key: string]: DirHash
    }
}