import { LocalProject } from "../local/LocalProject";
import { RemoteProject } from "../remote/RemoteProject";
import { RemoteUtils } from "../remote/RemoteUtils";

export class Project {

    private local?: LocalProject;

    private remote?: RemoteProject;

    constructor(public readonly path: string) {
    }

    getLocal(): LocalProject {
        return this.local ? this.local : (this.local = new LocalProject(this.path));
    }

    async getRemote() {
        return this.remote ? this.remote : (this.remote = await RemoteUtils.getProject(this.getLocal().id));
    }

}