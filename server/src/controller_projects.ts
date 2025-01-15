import ex from 'express';
import { app as _app } from './app';
import { ProjectEntity } from './entities/ProjectEntity';
import { FileEntity } from './entities/FileEntity';
import fs from 'fs';

export function setupProjectsController(app: typeof _app) {
    app.get(`/api/projects`, (req, res) => {
        res.json([
            {
                "id": "alantr7/elderverse-core",
                "name": "elderverse-core",
                "link": "https://codesync.myqualia.net/alantr7/elderverse-core.project",
                "date_created": new Date(),
                "files_count": 721,
                "disk_size": 1098549012,
                "disk_size_formatted": "43,9KB",
                "owned_by": "alantr7"
            }
        ]);
    });

    app.post(`/api/projects`, (req, res) => {
        const { name } = req.body;
        const project = Object.assign(new ProjectEntity(), {
            id: "alantr7/" + name,
            name,
            date_created: new Date()
        });

        ProjectEntity.save(project);
        res.json(project);
    });

    app.delete(`/api/projects/:ownerId/:projectLocalId`, async (req, res) => {
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