#!/usr/bin/env node
import { configDotenv } from "dotenv";
import chalk from "chalk";

export const AppDirectory =__dirname;
export const ProjectDirectory = process.cwd();
export const MetaDirectory = `${ProjectDirectory}/.codesync`;

configDotenv({path: __dirname + "/.env"});

import { Config } from "./app/Config";
const { setupConfig } = Config;
setupConfig();

import { CommandExecutor } from "./commands/CommandExecutor";
import { Project } from "./app/Project";

export const CurrentProject = new Project(ProjectDirectory);

const args = process.argv;
args.splice(0, 2);

export function resetConsole() {
    process.stdout.write('\x1Bc');
    console.log("\n" + chalk.blueBright(' CodeSync ') + chalk.greenBright('v1.0.0'));

    console.log(`\n Working directory: ` + chalk.blueBright(`${ProjectDirectory}`));
    console.log(` Base URL: ` + chalk.blueBright(process.env.REMOTE_BASE_URL).replace('http://', '').replace('https://', '') + '\n');
}

resetConsole();
CommandExecutor.execute(args).then();