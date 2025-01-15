import ex, { json } from 'express';
import { setupProjectsController } from './controller_projects';
import { setupDatabase } from './datasource';
import { configDotenv } from 'dotenv';
import { setupFilesController } from './controller_files';

configDotenv();
setupDatabase();

export const app = ex();
app.use(json());

setupProjectsController(app);
setupFilesController(app);

app.listen(process.env.SERVER_PORT, () => {
    console.log("Server started!")
});