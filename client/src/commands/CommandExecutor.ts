import chalk from "chalk";
import { CurrentProject } from "../app";
import readline from 'node:readline';
import { LocalUtils } from "../local/LocalUtils";
import { SyncUtils } from "../sync/SyncUtils";
import { CodeSync } from "../app/App";
import { Project } from "../app/Project";
import open from 'open';
import { FileWatcher } from "../local/FileWatcher";
import { Config } from "../app/Config";

export namespace CommandExecutor {

    export const scanner = readline.createInterface(process.stdin, process.stdout);

    const CommandsList: Record<string, string> = {
        "help": "Get list of commands with their descriptions",
        "init": "Initialize a project locally and remotely",
        "config": "Edit and inspect your CodeSync configuration",
        "overview": "Get basic information about the current project",
        "list [--diff]": "List files in the current project",
        "list-all [--diff]": "List files in all available local projects",
        "list-projects": "List all projects available locally",
        "push [--watch]": "Upload changes to the server",
        "push-all": "Upload changes of all local projects to the server",
        "fetch": "Download changes from the server",
        "fetch-all": "Download changes from the server for all projects available locally",
        "delete": "Delete data about this project both locally and on the server (This will not delete project files!)"
    };

    // Commands that do not require authtoken
    const LocalCommands = [
        "help", "config", "ignore"
    ];

    // Commands that require an initialized project
    const ProjectCommands = [
        "list", "list-all", "push", "overview", "push-all", "fetch", "fetch-all", "ignore", "delete"
    ];

    export async function question(question: string): Promise<string> {
        return new Promise((resolve, reject) => scanner.question(question, resolve));
    }

    export async function execute(args: string[]) {
        if (args.length === 0) {
            executeHelpCommand();
            console.error(chalk.redBright('\n No arguments provided!') + '\n');
            scanner.close();
            return;
        }

        const command = args[0];
        args.splice(0, 1);

        if (Config.config["host"].length === 0 && !LocalCommands.includes(command)) {
            console.error(chalk.redBright(` Please configure the 'host' before using this command.\n`));
            scanner.close();
            return;
        }

        if (Config.config["authtoken"].length === 0 && !LocalCommands.includes(command)) {
            console.error(chalk.redBright(` Please configure the 'authtoken' before using this command.\n`));
            scanner.close();
            return;
        }

        if (!LocalUtils.isProjectInitialized() && ProjectCommands.includes(command)) {
            console.error(chalk.redBright(` Project is not initialized.\n`));
            scanner.close();
            return;
        }

        switch (command) {
            case "help": executeHelpCommand(); break;
            case "init": await LocalUtils.initializeProject(); break;
            case "config": executeConfigCommand(args); break;
            case "list": await SyncUtils.printDiff(await SyncUtils.compareFiles([CurrentProject]), false, args.includes("--diff")); break;
            case "list-all": await SyncUtils.printDiff(await SyncUtils.compareFiles(CodeSync.getLocalProjects().map(l => new Project(l.path))), true, args.includes("--diff")); break;
            case "list-projects": LocalUtils.printLocalPrograms(); break;
            case "push": {
                if (args.length > 0 && args[0] === "--watch") {
                    new FileWatcher(CurrentProject).watch();
                } else {
                    console.log(args);
                    await SyncUtils.push([CurrentProject]);
                }
                break;
            }
            case "overview": LocalUtils.printProjectOverview(); break;
            case "push-all": await SyncUtils.push(CodeSync.getLocalProjects().map(l => new Project(l.path))); break;
            case "fetch": await SyncUtils.fetch([CurrentProject]); break;
            case "fetch-all": await SyncUtils.fetch(CodeSync.getLocalProjects().map(l => new Project(l.path))); break;
            case "ignore":
                console.log(chalk.yellowBright(" Opening ignore.json file.\n"));
                open(`${CurrentProject.path}\\.codesync\\ignore.json`);
                break;
            case "delete": await (await CurrentProject.getRemote())?.delete(); break;
            default:
                executeHelpCommand();
                console.log(chalk.redBright('\n Command not recognized.\n'));
        }

        scanner.close();
    }

    function executeHelpCommand() {
        for (const name in CommandsList) {
            console.log(" " + chalk.yellowBright(name) + ": " + CommandsList[name]);
        }
    }

    function executeConfigCommand(args: string[]) {
        if (args.length === 0) {
            console.error(chalk.redBright(` Usage: codesync config <key> [value]\n`));
            return;
        }

        const key = args[0];
        if (args.length === 1) {
            // @ts-ignore
            const value = Config.config[key];

            if (value === undefined) {
                console.error(chalk.redBright(` ${key} is not set.\n`));
                return;
            }

            console.log(` "${key}": ${chalk.blueBright(value)}\n`);
            return;
        }

        const value = args[1];
        // @ts-ignore
        Config.set(key, value);

        console.log(chalk.yellowBright(` Config value updated.\n`));
    }

}