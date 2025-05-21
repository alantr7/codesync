import { AppDirectory } from "../app"
import fs from 'fs';

export type ConfigProps = {
    authtoken: string,
}

export namespace Config {
    
    const DefaultConfig: ConfigProps = {
        authtoken: ""
    }
    
    let configPath: string;
    let config: ConfigProps;
    export function setupConfig() {
        const dataPath = `${AppDirectory}/data`;
        if (!fs.existsSync(dataPath))
            fs.mkdirSync(dataPath);
    
        configPath = `${dataPath}/config.json`;
        if (!fs.existsSync(configPath)) {
            config = { ...DefaultConfig };
            saveConfig();
        } else {
            config = { ...DefaultConfig, ...JSON.parse(fs.readFileSync(configPath).toString()) }
        }
    }

    export function set<K extends keyof ConfigProps>(key: K, value: ConfigProps[K]) {
        config[key] = value;
        saveConfig();
    }
    
    function saveConfig() {
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    }

}