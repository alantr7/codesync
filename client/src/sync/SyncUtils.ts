import chalk from "chalk";
import { CurrentProject } from "../app";
import { LocalUtils } from "../local/LocalUtils";
import { RemoteFile } from "../remote/RemoteFile";
import { RemoteProject } from "../remote/RemoteProject";
import { RemoteUtils } from "../remote/RemoteUtils";
import { arrayToDict } from "../utils";
import { Comparison, ComparisonResult } from "./Comparison";
import fs from 'fs';

export namespace SyncUtils {

    export async function compareFiles(): Promise<Comparison[]> {
        const remoteFiles = await (await CurrentProject.getRemote() as RemoteProject).getFiles() as RemoteFile[];

        const local = arrayToDict(CurrentProject.getLocal().getFiles(), f => f.path);
        const remote = arrayToDict(remoteFiles, f => f.path);

        const blacklist: string[] = [];
        const knownFiles = CurrentProject.getLocal().getKnownFiles();

        console.log(` Comparing ${Object.entries(local).length} local with ${Object.entries(remote).length} remote files...\n\n Status\t\tFile Path\n ------------------------------------------------------------------------`);

        const results: Comparison[] = [];
        for (const [path, file] of Object.entries(local)) {
            if (remote[path]) {
                results.push({
                    path,
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
                    result: ComparisonResult.UP_TO_DATE
                });
                continue;
            }

            if (local[path]) {
                results.push({
                    path,
                    result: file.last_modified === local[path].last_modified ? ComparisonResult.UP_TO_DATE
                        : file.last_modified + 1000 < local[path].last_modified ? ComparisonResult.REMOTE_OLD
                            : ComparisonResult.LOCAL_OLD
                });
            } else if (knownFiles.includes(path)) {
                results.push({
                    path,
                    result: ComparisonResult.LOCAL_DELETED
                });
            } else {
                results.push({
                    path,
                    result: ComparisonResult.REMOTE_NEW
                });
            }
        }

        CurrentProject.getLocal().setKnownFiles(knownFiles);
        return results;
    }

    export async function printDiff(comparison: Comparison[], skipUpToDate = false) {
        comparison.forEach(item => {
            if (skipUpToDate && item.result === ComparisonResult.UP_TO_DATE)
                return;

            const color = item.result === ComparisonResult.LOCAL_DELETED || item.result === ComparisonResult.REMOTE_DELETED ? chalk.bgRed.whiteBright
                : item.result === ComparisonResult.REMOTE_NEW ? chalk.greenBright
                    : item.result === ComparisonResult.REMOTE_OLD || item.result === ComparisonResult.LOCAL_NEW ? chalk.greenBright
                        : chalk.blueBright;
            console.log(' ' + color(Object.values(ComparisonResult)[item.result]) + "\t" + item.path);
        });

        console.log(chalk.yellowBright('\n There were ' + comparison.filter(r => r.result !== ComparisonResult.UP_TO_DATE).length + ' changes in total.'));
    }

    export async function push() {
        const comparison = await compareFiles();
        printDiff(comparison, true);

        const toCreate: string[] = [];
        const toUpdate: string[] = [];
        const toDelete: string[] = [];

        const project = await CurrentProject.getRemote();
        // Todo: Optimize this. This is being called 2 times, here and in compare function!
        const remote = arrayToDict(await project?.getFiles() as RemoteFile[], f => f.path);

        for (const item of comparison) {
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

        console.log(chalk.yellowBright("\n Create queue: "));
        console.log(" " + (toCreate.length !== 0 ? toCreate.join('\n ') : chalk.gray('(empty)')));

        console.log(chalk.yellowBright("\n Upload queue: "));
        console.log(" " + (toUpdate.length !== 0 ? toUpdate.join('\n ') : chalk.gray('(empty)')));

        console.log(chalk.yellowBright("\n Delete queue: "));
        console.log(" " + (toDelete.length !== 0 ? toDelete.join('\n ') : chalk.gray('(empty)')));

        if (toUpdate.length !== 0 || toDelete.length !== 0)
            console.log();

        for (const item of toCreate) {
            const file = await project?.createFile(item) as RemoteFile;
            remote[item] = file;
        }

        for (const item of toUpdate) {
            const file = remote[item];
            await file.uploadFile(LocalUtils.getAbsolutePath(item));
        }

        for (const item of toDelete) {
            const file = remote[item];
            await file.deleteFile();
        }
    }

    export async function pushAll() {
        const comparison = await compareFiles();
        printDiff(comparison, true);

        const toCreate: string[] = [];
        const toUpdate: string[] = [];
        const toDelete: string[] = [];

        const project = await CurrentProject.getRemote();
        // Todo: Optimize this. This is being called 2 times, here and in compare function!
        const remote = arrayToDict(await project?.getFiles() as RemoteFile[], f => f.path);

        for (const item of comparison) {
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

        console.log(chalk.yellowBright("\n Create queue: "));
        console.log(" " + (toCreate.length !== 0 ? toCreate.join('\n ') : chalk.gray('(empty)')));

        console.log(chalk.yellowBright("\n Upload queue: "));
        console.log(" " + (toUpdate.length !== 0 ? toUpdate.join('\n ') : chalk.gray('(empty)')));

        console.log(chalk.yellowBright("\n Delete queue: "));
        console.log(" " + (toDelete.length !== 0 ? toDelete.join('\n ') : chalk.gray('(empty)')));

        if (toUpdate.length !== 0 || toDelete.length !== 0)
            console.log();

        for (const item of toCreate) {
            const file = await project?.createFile(item) as RemoteFile;
            remote[item] = file;
        }

        for (const item of toUpdate) {
            const file = remote[item];
            await file.uploadFile(LocalUtils.getAbsolutePath(item));
        }

        for (const item of toDelete) {
            const file = remote[item];
            await file.deleteFile();
        }
    }

    export async function fetch() {
        const comparison = await compareFiles();
        printDiff(comparison, true);

        const toDownload: string[] = [];
        const toDelete: string[] = [];

        const project = await CurrentProject.getRemote();
        // Todo: Optimize this. This is being called 2 times, here and in compare function!
        const remote = arrayToDict(await project?.getFiles() as RemoteFile[], f => f.path);

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

        console.log(chalk.yellowBright("\n Download queue: "));
        console.log(" " + (toDownload.length !== 0 ? toDownload.join('\n ') : chalk.gray('(empty)')));

        console.log(chalk.yellowBright("\n Delete queue: "));
        console.log(" " + (toDelete.length !== 0 ? toDelete.join('\n ') : chalk.gray('(empty)')));

        if (toDownload.length !== 0 || toDelete.length !== 0)
            console.log();

        for (const item of toDownload) {
            const file = remote[item];
            await file.downloadFile(LocalUtils.getAbsolutePath(item));
        }

        for (const item of toDelete) {
            const file = remote[item];
            const localFile = LocalUtils.getAbsolutePath(file.path);

            fs.rmSync(localFile);
        }
    }

    export async function fetchAll() {
        const comparison = await compareFiles();
        printDiff(comparison, true);

        const toDownload: string[] = [];
        const toDelete: string[] = [];

        const project = await CurrentProject.getRemote();
        // Todo: Optimize this. This is being called 2 times, here and in compare function!
        const remote = arrayToDict(await project?.getFiles() as RemoteFile[], f => f.path);

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

        console.log(chalk.yellowBright("\n Download queue: "));
        console.log(" " + (toDownload.length !== 0 ? toDownload.join('\n ') : chalk.gray('(empty)')));

        console.log(chalk.yellowBright("\n Delete queue: "));
        console.log(" " + (toDelete.length !== 0 ? toDelete.join('\n ') : chalk.gray('(empty)')));

        if (toDownload.length !== 0 || toDelete.length !== 0)
            console.log();

        for (const item of toDownload) {
            const file = remote[item];
            await file.downloadFile(LocalUtils.getAbsolutePath(item));
        }

        for (const item of toDelete) {
            const file = remote[item];
            const localFile = LocalUtils.getAbsolutePath(file.path);

            fs.rmSync(localFile);
        }
    }


}