import chalk from "chalk";
import { CurrentProject } from "../app";
import { LocalUtils } from "../local/LocalUtils";
import { RemoteFile } from "../remote/RemoteFile";
import { RemoteProject } from "../remote/RemoteProject";
import { RemoteUtils } from "../remote/RemoteUtils";
import { arrayToDict, arrayToGroups } from "../utils";
import { Comparison, ComparisonResult } from "./Comparison";
import fs from 'fs';
import { Project } from "../app/Project";
import { CodeSync } from "../app/App";
import asTable from "as-table";
import { LocalFile } from "../local/LocalFile";
import { PromiseManager } from "../managers/PromiseManager";

export namespace SyncUtils {

    export async function compareFiles(projects: Project[]): Promise<Comparison[]> {
        const resultsFlat: Comparison[] = [];

        const filesPerProject: Record<string, [Record<string, LocalFile>, Record<string, RemoteFile>]> = {};

        let localFilesCount = 0;
        let remoteFilesCount = 0;

        for (const project of projects) {            
            const local = arrayToDict(project.getLocal().getFiles(), f => f.path);
            const remoteFiles = await (await project.getRemote() as RemoteProject).getFiles() as RemoteFile[];
            const remote = arrayToDict(remoteFiles, f => f.path);

            filesPerProject[project.getLocal().id] = [local, remote];
            localFilesCount += Object.keys(local).length;
            remoteFilesCount += Object.keys(remote).length;
        }

        console.log(`\n Comparing ${localFilesCount} local with ${remoteFilesCount} remote files...\n`);

        for (const project of projects) {
            const blacklist: string[] = [];
            const knownFiles = project.getLocal().getKnownFiles();

            const local = filesPerProject[project.getLocal().id][0];
            const remote = filesPerProject[project.getLocal().id][1];

            const results: Comparison[] = [];
            for (const [path, file] of Object.entries(local)) {
                if (remote[path]) {
                    results.push({
                        path,
                        project,
                        result: file.last_modified === remote[path].last_modified ? ComparisonResult.UP_TO_DATE
                            : file.last_modified + 1000 < remote[path].last_modified
                                ? remote[path].is_deleted ? ComparisonResult.REMOTE_DELETED
                                    : ComparisonResult.LOCAL_OLD
                                : ComparisonResult.REMOTE_OLD
                    });
                    blacklist.push(path);
                } else {
                    results.push({
                        path,
                        project,
                        result: ComparisonResult.LOCAL_NEW
                    });
                }

                if (!knownFiles.includes(path)) {
                    knownFiles.push(path);
                }
            }

            for (const [path, file] of Object.entries(remote)) {
                if (blacklist.includes(path))
                    continue;

                if (file.is_deleted && local[path] === undefined && knownFiles.includes(path)) {
                    results.push({
                        path,
                        project,
                        result: ComparisonResult.UP_TO_DATE
                    });
                    continue;
                }

                if (local[path]) {
                    results.push({
                        path,
                        project,
                        result: file.last_modified === local[path].last_modified ? ComparisonResult.UP_TO_DATE
                            : file.last_modified + 1000 < local[path].last_modified ? ComparisonResult.REMOTE_OLD
                                : ComparisonResult.LOCAL_OLD
                    });
                } else if (knownFiles.includes(path)) {
                    results.push({
                        path,
                        project,
                        result: ComparisonResult.LOCAL_DELETED
                    });
                } else {
                    results.push({
                        path,
                        project,
                        result: ComparisonResult.REMOTE_NEW
                    });
                }
            }

            resultsFlat.push(...results);
            project.getLocal().setKnownFiles(knownFiles);
        }
        return resultsFlat;
    }

    export async function printDiff(comparison: Comparison[], displayProjectColumn = false, skipUpToDate = false) {
        const rows: string[][] = [];
        comparison.forEach(item => {
            if (skipUpToDate && item.result === ComparisonResult.UP_TO_DATE)
                return;

            const color = item.result === ComparisonResult.LOCAL_DELETED || item.result === ComparisonResult.REMOTE_DELETED ? chalk.bgRed.whiteBright
                : item.result === ComparisonResult.REMOTE_NEW ? chalk.greenBright
                    : item.result === ComparisonResult.REMOTE_OLD || item.result === ComparisonResult.LOCAL_NEW ? chalk.greenBright
                        : chalk.blueBright;
            
            const row: string[] = [];
            row.push(color(Object.values(ComparisonResult)[item.result]));
            if (displayProjectColumn) {
                row.push(item.project.getLocal().getName());
            }
            row.push(item.path);

            rows.push(row);
        });

        const mapper: (item: string[]) => any = displayProjectColumn
            ? row => ({ " Status": " " + row[0], Project: row[1], "File Path": row[2] })
            : row => ({ " Status": " " + row[0], "File Path": row[1] });

        console.log(asTable(rows.map(mapper)));
        console.log(chalk.yellowBright('\n There were ' + comparison.filter(r => r.result !== ComparisonResult.UP_TO_DATE).length + ' changes in total.'));
    }

    interface ProjectQueue {
        project: Project,
        remoteFiles: Record<string, RemoteFile>,
        toCreate: string[],
        toUpdate: string[],
        toDownload: string[],
        toDelete: string[]
    };
    export async function push(projects: Project[]) {
        const comparisonMessy = await compareFiles(projects);
        printDiff(comparisonMessy, projects.length > 0 && projects[0].getLocal().id !== CurrentProject.getLocal()?.id, true);

        const comparisonsPerProject = arrayToGroups(comparisonMessy, c => c.project.getLocal().id);
        const queuesPerProject: Record<string, ProjectQueue> = {};

        for (const project of projects) {
            const toCreate: string[] = [];
            const toUpdate: string[] = [];
            const toDelete: string[] = [];
            const remoteFiles = await (await project.getRemote())?.getFiles() || [];

            for (const item of comparisonsPerProject[project.getLocal().id]) {
                const result = item.result;
                if (result === ComparisonResult.UP_TO_DATE)
                    continue;

                if (result === ComparisonResult.LOCAL_DELETED) {
                    toDelete.push(item.path);
                    continue;
                }

                if (result === ComparisonResult.LOCAL_NEW) {
                    toCreate.push(item.path);
                    toUpdate.push(item.path);
                }

                if (result === ComparisonResult.REMOTE_OLD || result === ComparisonResult.REMOTE_DELETED) {
                    toUpdate.push(item.path);
                }
            }

            queuesPerProject[project.getLocal().id] = {
                project, toCreate, toUpdate, toDelete, toDownload: [], remoteFiles: arrayToDict(remoteFiles, f => f.path)
            };
        }

        const queueFlat = Object.values(queuesPerProject).flat();
        const toCreate = queueFlat.map(q => q.toCreate).flat();
        const toUpdate = queueFlat.map(q => q.toUpdate).flat();
        const toDelete = queueFlat.map(q => q.toDelete).flat();

        console.log(chalk.yellowBright("\n Create queue: "));
        console.log(" " + (toCreate.length !== 0 ? toCreate.join('\n ') : chalk.gray('(empty)')));

        console.log(chalk.yellowBright("\n Upload queue: "));
        console.log(" " + (toUpdate.length !== 0 ? toUpdate.join('\n ') : chalk.gray('(empty)')));

        console.log(chalk.yellowBright("\n Delete queue: "));
        console.log(" " + (toDelete.length !== 0 ? toDelete.join('\n ') : chalk.gray('(empty)')));

        if (toUpdate.length !== 0 || toDelete.length !== 0)
            console.log();

        // Create files
        for (const queue of queueFlat) {
            const remoteProject = await queue.project.getRemote();
            if (queue.toCreate.length === 0) continue;

            const newFiles = await remoteProject?.createFiles(queue.toCreate);
            newFiles?.forEach(file => queue.remoteFiles[file.path] = file);
        }

        // Update files
        const updateManager = new PromiseManager(5);
        for (const queue of queueFlat) {
            for (const item of queue.toUpdate) {
                const file = queue.remoteFiles[item];
                updateManager.queue(() => file.uploadFile(queue.project.path + '/' + item));
            }
        }
        await updateManager.perform();

        for (const queue of queueFlat) {
            for (const item of queue.toDelete) {
                await queue.remoteFiles[item].deleteFile();
            }
        }
    }

    export async function fetch(projects: Project[]) {
        const comparisonMessy = await compareFiles(projects);
        printDiff(comparisonMessy, projects.length > 0 && projects[0].getLocal().id !== CurrentProject.getLocal()?.id, true);

        const comparisonsPerProject = arrayToGroups(comparisonMessy, c => c.project.getLocal().id);
        const queuesPerProject: Record<string, ProjectQueue> = {};

        for (const project of projects) {
            const toDelete: string[] = [];
            const toDownload: string[] = [];
            const comparison = comparisonsPerProject[project.getLocal().id];

            for (const item of comparison) {
                const result = item.result;
                if (result === ComparisonResult.UP_TO_DATE)
                    continue;

                if (result === ComparisonResult.REMOTE_DELETED) {
                    toDelete.push(item.path);
                    continue;
                }

                if (result === ComparisonResult.REMOTE_NEW) {
                    toDownload.push(item.path);
                }

                if (result === ComparisonResult.LOCAL_OLD || result === ComparisonResult.LOCAL_DELETED) {
                    toDownload.push(item.path);
                }
            }

            queuesPerProject[project.getLocal().id] = {
                project: project,
                remoteFiles: arrayToDict((await (await project.getRemote())?.getFiles()) as RemoteFile[], f => f.path),
                toCreate: [], toUpdate: [],
                toDelete, toDownload
            }
        }

        const queueFlat = Object.values(queuesPerProject).flat();
        const toDownload = queueFlat.map(q => q.toDownload).flat();
        const toDelete = queueFlat.map(q => q.toDelete).flat();

        console.log(chalk.yellowBright("\n Download queue: "));
        console.log(" " + (toDownload.length !== 0 ? toDownload.join('\n ') : chalk.gray('(empty)')));

        console.log(chalk.yellowBright("\n Delete queue: "));
        console.log(" " + (toDelete.length !== 0 ? toDelete.join('\n ') : chalk.gray('(empty)')));

        if (toDownload.length !== 0 || toDelete.length !== 0)
            console.log();

        // Update files
        const updateManager = new PromiseManager(5);
        for (const queue of queueFlat) {
            for (const item of queue.toDownload) {
                const file = queue.remoteFiles[item];
                updateManager.queue(() => file.downloadFile(queue.project.path + '/' + item));
            }
        }
        await updateManager.perform();

        for (const queue of queueFlat) {
            for (const item of queue.toDelete) {
                const localFile = queue.project.path + '\\' + item;
                fs.rmSync(localFile);
            }
        }
    }

}