import fs from 'fs';
import { User, users } from './auth';

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

export let config: ConfigProps;
export function setupConfig() {
    // If config does not exist, then create a default one
    if (!fs.existsSync('./config.json')) {
        config = { ...DEFAULT_CONFIG };
        fs.writeFileSync('./config.json', JSON.stringify(config, null, 2));
    } else {
        config = {
            ...DEFAULT_CONFIG,
            ...JSON.parse(fs.readFileSync('./config.json').toString())
        }
    }

    config.users.forEach(user => users[user.username] = user);
}