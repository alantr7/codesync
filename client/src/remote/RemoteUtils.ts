import axios from "axios";
import { RemoteProject } from "./RemoteProject";
import { RemoteFile } from "./RemoteFile";
import { Mapper } from "./Mapper";
import fs from 'fs';
import path from 'path';
import chalk from "chalk";

export namespace RemoteUtils {

    const api = axios.create({
        baseURL: process.env.REMOTE_BASE_URL + '/api',
        headers: {
            "Content-Type": "application/json"
        }
    });

    api.interceptors.request.use(config => {
        if (config.responseType !== "stream") {
            console.log(chalk.gray(` ${config.baseURL}/${config.url}, Data: ${config.data && JSON.stringify(config.data) || '{}'}`));
        } else {
            console.log(chalk.gray(` ${config.url}, Data: File`));
        }
        return config;
    });

    api.interceptors.response.use(config => {
        if ((config.data as any).error) {
            console.error(`Axios ERROR: ${(config.data as any).error}`);
        } else if (config.config.responseType !== "stream") {
            // console.log(`Axios response: ${JSON.stringify(config.data)}`);
        }
        return config;
    });

    export async function getProjects(): RemoteResponse<RemoteProject[]> {
        const response = await api.get('projects');
        return (response.data as any[]).map(d => new RemoteProject(d.id));
    }

    export async function getProject(id: string): RemoteResponse<RemoteProject> {
        return new RemoteProject(id);
    }

    export async function createProject(name: string): RemoteResponse<RemoteProject> {
        const response = await api.post('projects', { name });
        return Mapper.map(response.data, Mapper.RemoteProjectMapper);
    }

    export async function deleteProject(projectId: string): RemoteResponse<any> {
        await api.delete('projects/' + projectId);
    }

    export async function getFiles(projectId: string): RemoteResponse<RemoteFile[]> {
        const response = await api.get(`projects/${projectId}/files`);
        return (response.data as any[]).map(d => Mapper.map(d, Mapper.RemoteFileMapper(projectId)));
    }

    export async function createFile(projectId: string, paths: string[]): RemoteResponse<RemoteFile[]> {
        const response = await api.post(`projects/${projectId}/files`, { files: paths });
        return (response.data as any[]).map(file => Mapper.map(file, Mapper.RemoteFileMapper(projectId)));
    }

    export async function uploadFile(projectId: string, fileId: string, localPath: string): RemoteResponse<RemoteFile> {
        const formData = new FormData();
        formData.append("binary", await fs.openAsBlob(localPath));
        formData.append("last_modified", (fs.lstatSync(localPath).mtime.getTime()).toString());

        const response = await api.post(`projects/${projectId}/files/${fileId}/content`, formData, {
            headers: {
                "Content-Type": "application/form-data"
            }
        });
        return Mapper.map(response.data, Mapper.RemoteFileMapper(projectId));
    }

    export async function downloadFile(projectId: string, fileId: string, destination_raw: string, last_modified: number): RemoteResponse<any> {
        const response = await api.get(`projects/${projectId}/files/${fileId}/content`, { headers: undefined, responseType: "stream" });
        const data = response.data as any;

        const destination = destination_raw.replace(/\\/g, '/');

        const directories = path.dirname(destination);
        if (!fs.existsSync(directories)) {
            fs.mkdirSync(directories, { recursive: true });
        }

        const writer = fs.createWriteStream(destination);
        data.pipe(writer);

        writer.on("finish", () => {
            try {
                fs.utimesSync(destination, fs.lstatSync(destination).atime, last_modified / 1000);
            } catch (e) {
                console.error(e);
            }
        })
    }

    export async function deleteFile(projectId: string, fileId: string): RemoteResponse<any> {
        const response = await api.delete(`projects/${projectId}/files/${fileId}`);
        return response.data;
    }

    RemoteUtils.createFile = withExceptionHandler(RemoteUtils.createFile);
    RemoteUtils.createProject = withExceptionHandler(RemoteUtils.createProject);
    RemoteUtils.deleteProject = withExceptionHandler(RemoteUtils.deleteProject);
    RemoteUtils.getFiles = withExceptionHandler(RemoteUtils.getFiles);
    RemoteUtils.getProject = withExceptionHandler(RemoteUtils.getProject);
    RemoteUtils.getProjects = withExceptionHandler(RemoteUtils.getProjects);
    RemoteUtils.uploadFile = withExceptionHandler(RemoteUtils.uploadFile);
    RemoteUtils.downloadFile = withExceptionHandler(RemoteUtils.downloadFile);
    RemoteUtils.deleteFile = withExceptionHandler(RemoteUtils.deleteFile);

    function withExceptionHandler<T>(fun: (...data: any) => RemoteResponse<T>): (...data: any) => RemoteResponse<T> {
        return async (...data) => {
            try {
                return await fun(...data);
            } catch (e: any) {
                if (e.response?.data?.error) {
                    console.log(chalk.redBright(" " + e.response.data.error + " (" + e.response.status + ")"));
                    return Promise.resolve(undefined);
                }
                console.log(chalk.redBright(' There was an error in HTTP request!'));
                return Promise.resolve(undefined);
            }
        };
    }

}

export type RemoteResponse<T> = Promise<T | undefined>;