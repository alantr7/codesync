import { RemoteFile } from "./RemoteFile";
import { RemoteProject } from "./RemoteProject";

export namespace Mapper {

    type ObjectMapper<T> = (object: any) => T;

    export const RemoteProjectMapper: ObjectMapper<RemoteProject> = object => Object.assign(new RemoteProject(object.id), {
    });

    export const RemoteFileMapper: (projectId: string) => ObjectMapper<RemoteFile> = projectId => {
        return object => Object.assign(new RemoteFile(projectId, object.id, object.path, object.is_uploaded, object.is_deleted, parseInt(object.last_modified)), {

        });
    }

    export function map<T>(data: any, mapper: ObjectMapper<T>) {
        return mapper(data);
    }

}