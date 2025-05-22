import ex from 'express';
import { app as _app } from './app';
import { ProjectEntity } from './entities/ProjectEntity';
import { FileEntity } from './entities/FileEntity';
import fs from 'fs';
import { auth } from './auth';

export function setupProjectsController(app: typeof _app) {
    app.get(`/api/projects`, auth("explorer", "codesync"), async (req, res) => {
        const projects = await ProjectEntity.findBy({owner_id: req.user});
        res.json(projects);
    });

    app.post(`/api/projects`, auth("codesync"), (req, res) => {
        const { name } = req.body;
        const project = Object.assign(new ProjectEntity(), {
            id: req.user + "/" + name,
            name,
            owner_id: req.user,
            date_created: new Date(),
        });

        ProjectEntity.save(project);
        res.json(project);
    });

    app.delete(`/api/projects/:ownerId/:projectLocalId`, auth("codesync"), async (req, res) => {
        const { ownerId, projectLocalId } = req.params;
        const projectId = ownerId + '/' + projectLocalId;

        const project = await ProjectEntity.findOneBy({ id: projectId });

        if (project === null) {
            res.status(404).json({error: "Project not found."});
            return;
        }

        const storagePath = `${__dirname}/storage`;
        const files = await FileEntity.findBy({ project: { id: projectId } });
        for (const file of files) {
            if (fs.existsSync(`${storagePath}/${file.id}.bin`)) {
                fs.rmSync(`${storagePath}/${file.id}.bin`);   
            }

            await file.remove();
        }
        
        await project.remove();
        res.status(200).json({
            message: "Project deleted."
        });
    });
}