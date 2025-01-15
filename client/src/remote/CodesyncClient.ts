import { RemoteProject } from "./RemoteProject";
import { RemoteUtils } from "./RemoteUtils";

export async function getProject(id: string): Promise<RemoteProject | undefined> {
    return RemoteUtils.getProject(id);
}