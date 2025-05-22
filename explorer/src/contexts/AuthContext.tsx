import React, { useState } from "react";
import { HOST } from "../App";
import axios from "axios";

type AuthContextProps = {
    token?: string,
    axios: Axios.AxiosInstance,
    setToken(token: string): void,
    isAuthenticated: boolean,
};
export const AuthContext = React.createContext<AuthContextProps>({
    isAuthenticated: false,
    setToken(){},
    axios: axios
});

export function AuthContextProvider(props: any) {
    const [ token, setToken ] = useState<string | undefined>(window.localStorage.getItem("authtoken") || undefined);
    const page = location.pathname;

    const context: AuthContextProps = {
        token,
        setToken,
        isAuthenticated: token !== undefined,
        axios: token !== undefined ? axios.create({headers: {
            Authorization: "Bearer " + token
        }}) : axios
    }

    const handleSignIn = (e: any) => {
        e.preventDefault();

        const username = prompt("Enter the username:");
        if (username === null) return;

        const password = prompt("Enter the password:");
        if (password === null) return;

        axios.post(`${HOST}/auth`, {username, password}).then(r => {
            const token = (r.data as any).token as string;
            window.localStorage.setItem("authtoken", token);

            document.location.reload();
        }).catch(e => alert(JSON.stringify(e)));
    }

    return <AuthContext.Provider value={context}>
        {(context.isAuthenticated || page === "/auth") && props.children}
        {!context.isAuthenticated && page !== "/auth" && <h3>You are not authenticated. <a href="#" onClick={handleSignIn}>Login</a></h3>}
    </AuthContext.Provider>
}