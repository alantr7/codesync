import fs from 'fs';
import { AppDirectory, ProjectDirectory } from '../app';
import { LocalProjectInfo } from './LocalProjectInfo';
import { LocalProject } from '../local/LocalProject';

export namespace CodeSync {

    const dataDirectory = `${AppDirectory}/data`;
    if (!fs.existsSync(dataDirectory)) { fs.mkdirSync(dataDirectory); }

    export function getLocalProjects(): LocalProjectInfo[] {
        if (!fs.existsSync(`${dataDirectory}/projects.json`))
            return [];

        return (JSON.parse(fs.readFileSync(`${dataDirectory}/projects.json`).toString()) as any[]).map(info => new LocalProjectInfo(info.id, info.name, info.path));
    }

    export function setLocalProjects(projects: LocalProjectInfo[]) {
        fs.writeFileSync(`${dataDirectory}/projects.json`, JSON.stringify(projects));
    }

    export function saveProject(project: LocalProject) {
        const list = getLocalProjects();
        if (list.find(p => p.id === project.id)) {
            return;
        }

        list.push({
            id: project.id,
            name: project.id.substring('alantr7/'.length),
            path: project.path
        });
        setLocalProjects(list);
    }

    export function getRemoteProjects() {
        return null;
    }

}