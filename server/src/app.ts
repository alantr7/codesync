import ex, { json } from 'express';
import cors from 'cors';
import { setupProjectsController } from './controller_projects';
import { setupDatabase } from './datasource';
import { configDotenv } from 'dotenv';
import { setupFilesController } from './controller_files';
import { setupConfig } from './config';
import { auth } from './auth';
import { setupAuthController } from './controller_auth';

configDotenv();
setupConfig();
setupDatabase();

export const app = ex();
app.use(cors());
app.use(json());

setupProjectsController(app);
setupFilesController(app);
setupAuthController(app);

app.listen(process.env.SERVER_PORT, () => {
    console.log("Server started on port " + process.env.SERVER_PORT)
});