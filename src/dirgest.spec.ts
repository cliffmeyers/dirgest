import * as fs from 'fs';
import * as path from 'path';
import AJV  from 'ajv';

import { dirgest } from './dirgest';

describe('dirgest', () => {
    it('should work', (done) => {
        dirgest(path.resolve(__dirname, './__mocks__'), 'sha1', (err, hashes) => {
            console.log('error!', err)
            console.log(JSON.stringify(hashes, null, 2));
            done();
        });
    });
    it('should validate json', () => {
        const ajv = new AJV();
        const schema = JSON.parse(fs.readFileSync(path.resolve(__dirname, './__mocks__/dir-hash.schema.json')).toString());
        const valid8 = ajv.compile(schema);
        console.log(valid8({ hash: 'foo', files: {}}));
    });
});