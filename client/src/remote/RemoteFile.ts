import { RemoteResponse, RemoteUtils } from "./RemoteUtils";

export class RemoteFile {
    
    constructor(
        public readonly projectId: string,
        public readonly id: string,
        public readonly path: string,
        public readonly is_uploaded: boolean,
        public readonly is_deleted: boolean,
        public readonly last_modified: number,
    ) {}

    async uploadFile(localPath: string): RemoteResponse<RemoteFile> {
        return await RemoteUtils.uploadFile(this.projectId, this.id, localPath);
    }

    async downloadFile(destination: string): RemoteResponse<RemoteFile> {
        return await RemoteUtils.downloadFile(this.projectId, this.id, destination, this.last_modified);
    }

    async deleteFile(): RemoteResponse<any> {
        return await RemoteUtils.deleteFile(this.projectId, this.id);
    }

}