import { RemoteFile } from "./RemoteFile";
import { RemoteResponse, RemoteUtils } from "./RemoteUtils";

export class RemoteProject {
    
    constructor(public readonly id: string) {
    }

    async getFiles(): RemoteResponse<RemoteFile[]> {
        return await RemoteUtils.getFiles(this.id);
    }

    async createFiles(paths: string[]): RemoteResponse<RemoteFile[]> {
        return await RemoteUtils.createFile(this.id, paths);
    }

    async delete(): RemoteResponse<any> {
        return await RemoteUtils.deleteProject(this.id);
    }

}