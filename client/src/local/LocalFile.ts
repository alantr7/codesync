import fs from 'fs';
import { LocalUtils } from './LocalUtils';

export class LocalFile {

    public readonly path;

    constructor(path: string) {
        this.path = path;
    }

    public get last_modified(): number {
        return Math.round(fs.lstatSync(LocalUtils.getAbsolutePath(this.path)).mtimeMs);
    }

}