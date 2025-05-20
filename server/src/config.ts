import fs from 'fs';
import crypto from 'crypto';

type ConfigProps = {
    authtoken: string,
    explorer_password: string,
    max_file_size: number,
}

const DEFAULT_CONFIG: ConfigProps = {
    authtoken: "",
    explorer_password: "1234",
    max_file_size: 1024 * 1024 * 32
}

export let config: ConfigProps;
export function setupConfig() {
    // If config does not exist, then create a default one
    if (!fs.existsSync('./config.json')) {
        config = { ...DEFAULT_CONFIG };
        config.authtoken = generateAuthToken();

        fs.writeFileSync('./config.json', JSON.stringify(config, null, 2));
    } else {
        config = {
            ...DEFAULT_CONFIG,
            ...JSON.parse(fs.readFileSync('./config.json').toString())
        }
    }

    console.log(`Authtoken: ${config.authtoken}`);
    console.log(`Explorer Password: ${config.explorer_password}`);
}

function generateAuthToken() {
  return crypto.randomBytes(32)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}