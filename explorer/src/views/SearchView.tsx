import { useCallback, useContext, useRef, useState } from "react"
import type { ProjectFile } from "../types/ProjectFile";
import { HOST } from "../App";
import type { ProjectListItem } from "../types/ProjectListItem";
import { matchPath } from "../utils/searchUtils";
import { getPreviewMode } from "../utils/previewables";
import { AuthContext } from "../contexts/AuthContext";

const STATUS_READY      = "Ready";
const STATUS_PROJ_LIST  = "Updating projects list...";
const STATUS_PROGRESS_F = "Searching project ({idx}/{count})...";

const STATUS_FAILED_PROJ_LIST = "Failed: Could not fetch project list!";

type ProjectFileSearchResult = ProjectFile & {
    project_id: string,
    preview_mode: string,
}
export default function SearchView() {
    const [query, setQuery] = useState<string>("");
    const [status, setStatus] = useState(STATUS_READY);
    const [isSearching, setSearching] = useState(false);
    const {axios} = useContext(AuthContext);
    const [hasError, setHasError] = useState(false);
    const [results, setResults] = useState<ProjectFileSearchResult[]>([]);
    const ref = useRef<HTMLInputElement>(null);

    const handleSearch = useCallback(() => {
        if (ref.current === null || isSearching)
            return;

        const query = ref.current.value as string;
        setQuery(query);
        setSearching(true);
        setResults([]);

        setStatus(STATUS_PROJ_LIST);

        axios.get(`${HOST}/api/projects/alantr7`).then(async r => {
            const projects = r.data as ProjectListItem[];
            let idx = 0;
            for (const project of projects) {
                setStatus(STATUS_PROGRESS_F.replace("{idx}", (idx + 1).toString()).replace("{count}", (projects.length).toString()));
                idx++;

                try {
                    const r = await axios.get(`${HOST}/api/projects/${project.id}/files`);
                    const files = r.data as ProjectFile[];

                    const matches = files.filter(file => matchPath(file.path, query)).map(f => ({
                        ...f,
                        project_id: project.id,
                        preview_mode: getPreviewMode(f.name)
                    }));
                    if (matches.length !== 0) {
                        setResults(results => [...results, ...matches]);
                    }
                } catch {}
            }

            setSearching(false);
            setStatus(STATUS_READY);
        }).catch(() => {
            setHasError(true);
            setStatus(STATUS_FAILED_PROJ_LIST);
        });
    }, [ ref, isSearching ]);

    return <div>
        <nav>
            <a href="/">View Projects</a>
        </nav>
        <h2>File Search</h2>
        <input placeholder="File name..." ref={ref} />
        <button onClick={handleSearch}>Search</button>

        <hr />
        <h4>Status: {status}</h4>
        {hasError && <h3>There was an error!</h3>}
        Results for: '{query}'

        <table>
            <thead>
                <tr>
                    <th id="colIcon"></th>
                    <th>Name</th>
                    <th>Location</th>
                </tr>
            </thead>
            <tbody>
                {results.map(file => <tr key={file.id}>
                    <td>
                        <img src={file.preview_mode === "BINARY" ? "/icon-binary.png" : "/icon-preview.png"} width={20} height={20} />
                    </td>
                    <td>
                        {file.preview_mode === "BINARY" && file.name}
                        {file.preview_mode !== "BINARY" && <a href={`${HOST}/api/projects/${file.project_id}/files/${file.id}/view?token=${file.access_token}`} target="_blank">{file.name}</a>}
                    </td>
                    <td><small>{file.project_id}</small>/{file.path}</td>
                </tr>)}
            </tbody>
        </table>
    </div>
}