import fs from 'fs';
import { MetaDirectory } from '../app';
import { LocalFile } from './LocalFile';
import { LocalUtils } from './LocalUtils';
import { CodeSync } from '../app/App';

export class LocalProject {

    public readonly id: string;

    public readonly path: string;

    constructor(path: string) {
        const meta = JSON.parse(fs.readFileSync(`${MetaDirectory}/project.json`).toString());
        this.id = meta.id;
        this.path = path;

        CodeSync.saveProject(this);
    }

    getKnownFiles(): string[] {
        const meta = JSON.parse(fs.readFileSync(`${MetaDirectory}/knownfiles.json`).toString());
        return meta;
    }

    setKnownFiles(files: string[]) {
        fs.writeFileSync(`${MetaDirectory}/knownfiles.json`, JSON.stringify(files));
    }

    getIgnorePatterns(): string[] {
        return JSON.parse(fs.readFileSync(`${MetaDirectory}/ignore.json`).toString());
    }

    setIgnorePatterns(patterns: string[]) {
        fs.writeFileSync(`${MetaDirectory}/knownfiles.json`, JSON.stringify(patterns));
    }

    getFiles(ignorePatterns: string[] = this.getIgnorePatterns()): LocalFile[] {
        return LocalUtils.getFiles(ignorePatterns);
    }

}