import chalk from "chalk";
import { CurrentProject, MetaDirectory } from "../app";
import fs from 'fs';
import readline from 'node:readline';
import { RemoteUtils } from "../remote/RemoteUtils";
import { LocalUtils } from "../local/LocalUtils";
import { SyncUtils } from "../sync/SyncUtils";
import { glob } from "glob";
import { CodeSync } from "../app/App";

export namespace CommandExecutor {

    export const scanner = readline.createInterface(process.stdin, process.stdout);

    export async function question(question: string): Promise<string> {
        return new Promise((resolve, reject) => scanner.question(question, resolve));
    }

    export async function execute(args: string[]) {
        if (args.length === 0) {
            console.error('No arguments provided!');
            scanner.close();
            return;
        }

        const command = args[0];
        args.splice(0, 1);

        switch (command) {
            case "init": await LocalUtils.initializeProject(); break;
            case "list": await SyncUtils.printDiff(await SyncUtils.compareFiles()); break;
            case "list-projects": LocalUtils.printLocalPrograms(); break;
            case "push": await SyncUtils.push(); break;
            case "push-all": await SyncUtils.pushAll(); break;
            case "fetch": await SyncUtils.fetch(); break;
            case "fetch-all": await SyncUtils.fetchAll(); break;
            case "delete": await (await CurrentProject.getRemote())?.delete(); break;
            default: console.log(chalk.redBright(' Command not recognized.') + '\n Available commands: ' + chalk.yellow('init, list, push, fetch.'));
        }

        scanner.close();
    }



}