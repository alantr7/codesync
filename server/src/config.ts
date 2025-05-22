import fs from 'fs';
import { generateToken, User, users } from './auth';

type ConfigProps = {
    max_file_size: number,
    secret: string,
    users: User[]
}

const DEFAULT_CONFIG: ConfigProps = {
    max_file_size: 1024 * 1024 * 32,
    secret: "",
    users: []
}

export let config: ConfigProps = { ...DEFAULT_CONFIG };
export function setupConfig() {
    // If config does not exist, then create a default one
    if (!fs.existsSync('./config.json')) {
        saveConfig();
    } else {
        config = {
            ...config,
            ...JSON.parse(fs.readFileSync('./config.json').toString())
        }
    }

    config.users.forEach(user => {
        // Generate authtoken if it's empty
        if (typeof user.authtoken !== 'string' || user.authtoken.length === 0) {
            user.authtoken = generateToken(32);
            saveConfig();
        }

        users[user.username] = user;
    });
}

export function saveConfig() {
    fs.writeFileSync('./config.json', JSON.stringify(config, null, 2));
}