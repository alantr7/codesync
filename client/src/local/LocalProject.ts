import fs from 'fs';
import { LocalFile } from './LocalFile';
import { LocalUtils } from './LocalUtils';
import { CodeSync } from '../app/App';

export class LocalProject {

    public readonly id: string;

    public readonly path: string;

    private metaDirectory: string;

    constructor(path: string) {
        const meta = JSON.parse(fs.readFileSync(`${path}/.codesync/project.json`).toString());
        this.metaDirectory = `${path}/.codesync`;
        this.id = meta.id;
        this.path = path;

        CodeSync.saveProject(this);
    }

    getName(): string {
        return this.id.substring(1 + this.id.indexOf('/'));
    }

    getKnownFiles(): string[] {
        const meta = JSON.parse(fs.readFileSync(`${this.metaDirectory}/knownfiles.json`).toString());
        return meta;
    }

    setKnownFiles(files: string[]) {
        fs.writeFileSync(`${this.metaDirectory}/knownfiles.json`, JSON.stringify(files));
    }

    getIgnorePatterns(): string[] {
        return JSON.parse(fs.readFileSync(`${this.metaDirectory}/ignore.json`).toString());
    }

    setIgnorePatterns(patterns: string[]) {
        fs.writeFileSync(`${this.metaDirectory}/knownfiles.json`, JSON.stringify(patterns));
    }

    getFiles(ignorePatterns: string[] = this.getIgnorePatterns()): LocalFile[] {
        return LocalUtils.getFiles(this, this.path, ignorePatterns);
    }

}