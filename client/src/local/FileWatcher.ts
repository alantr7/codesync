import chalk from "chalk";
import { Project } from "../app/Project";
import { LocalFile } from "./LocalFile";
import { RemoteProject } from "../remote/RemoteProject";
import { RemoteFile } from "../remote/RemoteFile";
import { arrayToDict } from "../utils";
import { SyncUtils } from "../sync/SyncUtils";
import { resetConsole } from "../app";

export class FileWatcher {

    private project: Project;

    private directories: string[] = [];

    private fileDates: Record<string, number> = {};

    constructor(project: Project) {
        this.project = project;
        this.resetFiles();
    }

    async watch() {
        await SyncUtils.push([this.project]);

        resetConsole();
        console.log(" " + chalk.yellowBright("File watcher initiated. Waiting for changes...\n Last push was done at: " + new Date().toLocaleTimeString()));
        this.tick();
    }

    private resetFiles() {
        const files = this.project.getLocal().getFiles();
        for (const file of files) {
            this.fileDates[file.path] = file.last_modified;
        }
    }

    async tick() {
        const files = this.project.getLocal().getFiles();
        const changed: LocalFile[] = [];
        for (const file of files) {
            if (this.fileDates[file.path] === undefined || (this.fileDates[file.path] !== file.last_modified)) {
                changed.push(file);
            }
        }

        if (changed.length !== 0) {
            console.log(" Found changes in: " + changed.map(f => chalk.greenBright(
                f.path.includes('\\') ? f.path.substring(f.path.lastIndexOf('\\') + 1) : f.path)).join(', ') + "\n");
            await SyncUtils.push([this.project]);

            this.resetFiles();

            resetConsole();
            console.log(" " + chalk.yellowBright("File watcher initiated. Waiting for changes...\n Last push was done at: " + new Date().toLocaleTimeString()));
        }

        setTimeout(async () => await this.tick(), 5000);
    }

}