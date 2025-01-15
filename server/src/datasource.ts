import { DataSource } from "typeorm";
import { ProjectEntity } from "./entities/ProjectEntity";
import { FileEntity } from "./entities/FileEntity";

export function setupDatabase() {
    console.log('Host: ' + process.env.DATASOURCE_HOST);
    new DataSource({
        type: "mysql",
        host: process.env.DATASOURCE_HOST,
        port: 3306,
        username: process.env.DATASOURCE_USERNAME,
        password: process.env.DATASOURCE_PASSWORD,
        database: process.env.DATASOURCE_DATABASE,
        entities: [ProjectEntity, FileEntity]
    }).initialize().then(async ds => {
        await ds.synchronize();
        console.log('Data source has been initialized!')
    });
}