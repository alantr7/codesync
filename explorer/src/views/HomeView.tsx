import { useContext, useEffect, useState } from "react"
import type { ProjectListItem } from "../types/ProjectListItem";
import axios from 'axios';
import { HOST } from "../App";
import { AuthContext } from "../contexts/AuthContext";

export default function HomeView() {
    const [  projectsList, setProjectsList ] = useState<ProjectListItem[]>([]);
    const { token } = useContext(AuthContext);
    useEffect(() => {
        axios.get(`${HOST}/api/projects`, {
            headers: {
                "Authorization": "Bearer " + token
            }
        }).then(r => {
            setProjectsList(r.data as ProjectListItem[]);
        })
    }, []);

    return <div>
        <nav>
            <a href="/search">Search</a>
        </nav>
        <h2>Projects List</h2>
        <hr />
        {projectsList.map(project => <article key={project.id}>
            <a key={project.id} href={`/project/${project.id}`}>{project.id}</a> ({project.files_count || "?"} files)
        </article>)}
    </div>
}