import fs from 'fs';
import { LocalUtils } from './LocalUtils';
import { LocalProject } from './LocalProject';

export class LocalFile {

    public readonly project: LocalProject;

    public readonly path;

    constructor(project: LocalProject, path: string) {
        this.project = project;
        this.path = path;
    }

    public get last_modified(): number {
        return Math.round(fs.lstatSync(this.project.path + '/' + this.path).mtimeMs);
    }

}