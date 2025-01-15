#!/usr/bin/env node
import { configDotenv } from "dotenv";
import chalk from "chalk";

configDotenv({path: __dirname + "/.env"});
export const AppDirectory =__dirname;
export const ProjectDirectory = process.cwd();
export const MetaDirectory = `${ProjectDirectory}/.codesync`;

import { CommandExecutor } from "./commands/CommandExecutor";
import { RemoteUtils } from "./remote/RemoteUtils";
import { LocalProject } from "./local/LocalProject";
import { RemoteProject } from "./remote/RemoteProject";
import { Project } from "./app/Project";

export const CurrentProject = new Project(ProjectDirectory);

const args = process.argv;
args.splice(0, 2);

console.clear();
console.log(chalk.bgBlueBright.whiteBright('\n CodeSync ') + chalk.bgMagenta.white(' v1.0.0                             '));

console.log(`\n Working directory: ` + chalk.blueBright(`${ProjectDirectory}`));
console.log(` Base URL: ` + chalk.blueBright(process.env.REMOTE_BASE_URL).replace('http://', '').replace('https://', '') + '\n');
CommandExecutor.execute(args).then();