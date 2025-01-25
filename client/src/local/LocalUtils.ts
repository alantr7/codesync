import fs from 'fs';
import { ProjectDirectory, MetaDirectory } from '../app';
import { CommandExecutor } from '../commands/CommandExecutor';
import { RemoteUtils } from '../remote/RemoteUtils';
import chalk from 'chalk';
import { LocalFile } from './LocalFile';
import { glob } from 'glob';
import { CodeSync } from '../app/App';
import asTable from 'as-table';

export namespace LocalUtils {

    export async function initializeProject() {
        if (fs.existsSync(MetaDirectory)) {
            if (fs.existsSync(`${MetaDirectory}/project.json`)) {
                console.log(chalk.redBright(` Project is already initialized!`));
                return;
            }
        }

        const name = await CommandExecutor.question(" Enter project name: ");
        const data = {
            id: "alantr7/" + name,
            name,
            remote: `${process.env.REMOTE_BASE_URL}/alantr/${name}`
        }

        if (!fs.existsSync(MetaDirectory)) {
            fs.mkdirSync(MetaDirectory);
        }
        fs.writeFileSync(`${MetaDirectory}/project.json`, JSON.stringify(data));
        fs.writeFileSync(`${MetaDirectory}/ignore.json`, '[]');
        fs.writeFileSync(`${MetaDirectory}/filemap.json`, '{}');
        fs.writeFileSync(`${MetaDirectory}/knownfiles.json`, '[]');

        await RemoteUtils.createProject(name);

        console.log();
        console.log(" Project initialized!\nRemote URL: " + chalk.greenBright(data.remote));
    }

    export function printLocalPrograms() {
        const projects = CodeSync.getLocalProjects();
        console.log(asTable(projects.map(proj => ({" Id": " " + proj.id, Name: proj.name, Path: proj.path}))));
    }

    export function getFiles(ignorePatterns: string[]): LocalFile[] {
        return glob.globSync("**", {
            ignore: [...ignorePatterns, ".codesync/**", "**/node_modules/**"],
            nodir: true
        }).map(path => new LocalFile(path));
    }

    export function getAbsolutePath(path: string) {
        return ProjectDirectory + '/' + path;
    }

}