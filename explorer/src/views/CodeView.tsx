import { useContext, useEffect, useRef, useState } from "react";
import "../assets/prism.css";
import { AuthContext } from "../contexts/AuthContext";
import { useParams } from "react-router-dom";
import { HOST } from "../App";
import "../assets/prism.js";

export default function CodeView() {
    const {ownerId, projectId, fileId} = useParams();
    const [content, setContent] = useState("");
    const { axios } = useContext(AuthContext);
    const ref = useRef<HTMLElement>(null);
    useEffect(() => {
        axios.get(`${HOST}/api/projects/${ownerId}/${projectId}/files/${fileId}/view`).then(r => {
            setContent(r.data as string);
        })
    }, []);
    useEffect(() => {
        // @ts-ignore
        Prism.highlightAll();
    }, [content]);
    return <div>
        <pre>
            <code className="language-java" ref={ref}>
                {content}
            </code>
        </pre>
    </div>
}