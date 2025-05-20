import { useCallback, useEffect, useState } from "react"
import type { ProjectFile } from "../types/ProjectFile";
import { HOST } from "../App";
import { useParams } from "react-router-dom";
import axios from 'axios';
import type { ProjectFolder } from "../types/ProjectFolder";
import { formatSize } from "../utils/formatSize";
import { getPreviewMode, type PREVIEW_MODES } from "../utils/previewables";

type ProjectViewProjectFile = ProjectFile & {
    preview_mode: PREVIEW_MODES,
}
export default function ProjectView() {
    const { ownerId, projectId } = useParams();
    const [isLoading, setLoading] = useState(true);
    const [files, setFiles] = useState<ProjectViewProjectFile[]>([]);
    const [currentDirectory, setCurrentDirectory] = useState("/");
    const [directoryList, setDirectoryList] = useState<ProjectFolder[]>([]);
    const [fileList, setFileList] = useState<ProjectViewProjectFile[]>([]);

    useEffect(() => {
        axios.get(`${HOST}/api/projects/${ownerId}/${projectId}/files`).then(r => {
            setFiles((r.data as ProjectFile[]).map(file => ({
                ...file,
                preview_mode: getPreviewMode(file.name)
            })));
            setLoading(false);
        });
    }, []);

    const updatePath = useCallback(() => {
        const hash = document.location.hash;
        if (hash.length < 2) {
            setCurrentDirectory("");
        } else {
            const uri = hash.startsWith("#/") ? hash.substring(1) : `/${hash.substring(1)}`;
            const cd = decodeURI(uri);
            setCurrentDirectory(cd);
        }
    }, [document.location.hash]);

    useEffect(() => {
        updatePath();
    }, [document.location.hash]);

    useEffect(() => {
        // Find directories in the current folder
        setDirectoryList(() => {
            const list: Record<string, ProjectFolder> = {};
            files.filter(file => {
                const initial_slash = `/${file.path}`;
                return initial_slash.startsWith(currentDirectory) && initial_slash.substring(currentDirectory.length + 1).indexOf('/') !== -1;
            }).forEach(file => {
                const relativePath = file.path.substring(currentDirectory.length);
                const folderName = relativePath.substring(0, relativePath.indexOf('/'));

                if (!list[folderName])
                    list[folderName] = {
                        name: folderName,
                        items_count: 0
                    }

                list[folderName].items_count++;
            });

            return Object.values(list);
        });

        // Check if file belongs to the current folder
        setFileList(files.filter(file => {
            const initial_slash = `/${file.path}`;
            return initial_slash.startsWith(currentDirectory) && initial_slash.substring(currentDirectory.length + 1).indexOf('/') === -1;
        }));
    }, [files, currentDirectory]);

    const parentPath = currentDirectory === '' ? null : currentDirectory.substring(0, currentDirectory.lastIndexOf('/'));

    return <div>
        <nav>
            <a href="/">View projects</a>&nbsp;
            <a href="/search">Search</a>
        </nav>
        <h2>{ownerId}/<small>{projectId}</small></h2>
        Directory: {currentDirectory || "/"}
        <hr />
        {isLoading && <p>Loading files...</p>}
        <table>
            <thead>
                <tr>
                    <th id="colIcon"></th>
                    <th id="colName">Name</th>
                    <th id="colSize">Actions</th>
                    <th id="colSize">Size</th>
                    <th id="colLastModified">Last Modified</th>
                    <th id="colLastModifier">Modified By</th>
                </tr>
            </thead>
            <tbody>
                {parentPath !== null && <tr>
                    <td></td>
                    <td><a href={`#${parentPath}`}>..</a></td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td></td>
                </tr>}
                {directoryList.map(directory => <tr>
                    <td><img src="/icon-folder.png" width={20} height={20} /></td>
                    <td><a href={`#${currentDirectory}/${directory.name}`}>{directory.name}</a></td>
                    <td></td>
                    <td>{directory.items_count} items</td>
                    <td></td>
                    <td></td>
                </tr>)}
                {fileList.map(file => <tr>
                    <td>
                        <img src={file.preview_mode === "BINARY" ? "/icon-binary.png" : "/icon-preview.png"} width={20} height={20} />
                    </td>
                    <td>
                        {file.preview_mode === "BINARY" && file.name}
                        {file.preview_mode !== "BINARY" && <a href={`/view/${file.preview_mode}/${file.id}`} target="_blank">{file.name}</a>}
                    </td>
                    <td>
                        <a href="#">Download</a>
                    </td>
                    <td>{formatSize(file.size)}</td>
                    <td>{new Date(parseInt(file.last_modified)).toLocaleString()}</td>
                    <td>Linux Mint (PC)</td>
                </tr>)}
            </tbody>
        </table>
    </div>
}