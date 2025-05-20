import ex from 'express';
import { app as _app } from './app';
import { ProjectEntity } from './entities/ProjectEntity';
import { FileEntity } from './entities/FileEntity';
import {v7 as uuid} from 'uuid';
import mime from 'mime';
import multer from 'multer';
import fs from 'fs';
import { auth } from './auth';

export function setupFilesController(app: typeof _app) {
    app.get('/api/projects/:ownerId/:projectId/files', auth("explorer", "codesync"), async (req, res) => {
        const { ownerId, projectId } = req.params;

        const project = await ProjectEntity.findOneBy({id: `${ownerId}/${projectId}`});
        if (project === null) {
            res.status(404).end();
            return;
        }

        const files = await FileEntity.find({where: {
            project: {
                id: ownerId + '/' + projectId
            }
        }});
        if (files.length === 0) {
            console.error('Didnt find a single file for project', project);
        }
        res.json(files);
    });

    app.post('/api/projects/:ownerId/:projectId/files', auth("codesync"), async (req, res) => {
        const { ownerId, projectId } = req.params;
        const { files } = req.body;
        if (files === undefined) {
            res.json({
                error: 'Files not specified.'
            });
            return;
        }

        // Check if project exists
        const project = await ProjectEntity.findOneBy({id: `${ownerId}/${projectId}`});
        if (project === null) {
            res.status(404).end();
            return;
        }

        const result: FileEntity[] = [];
        
        for (const path of (files as string[])) {
            const name = path.includes('/') ? path.substring(path.lastIndexOf('/') + 1) : path;

            // Check if file already exists
            const existing = await FileEntity.findOneBy({path, project: { id: ownerId + '/' + projectId }});
            if (existing) {
                result.push(existing);
                return;
            }

            const file = new FileEntity();
            file.id = uuid();
            file.project = project;
            file.name = name;
            file.path = path;
            file.last_modified = 0;
            result.push(file);
        }

        await FileEntity.save(result);
        res.json(result);
    });

    // File uploading
    app.post('/api/projects/:ownerId/:projectId/files/:fileId/content', auth("codesync"), multer().single('binary'), async (req, res) => {
        const { ownerId, projectId, fileId } = req.params;
        const { last_modified } = req.body;
        const binary = req.file;

        // Check if binary file is provided
        if (binary === undefined) {
            res.status(400).json({ error: "Binary data not provided." });
            return;
        }

        // Check if file exists on the server
        const file = await FileEntity.findOneBy({id: fileId, project: { id: ownerId + '/' + projectId }});
        if (file === null) {
            res.status(404).json({ error: "File not found." });
            return;
        }

        const directoryPath = `${__dirname}/storage`;

        if (!fs.existsSync(directoryPath)) {
            fs.mkdirSync(directoryPath);
        }
        
        const destination = `${directoryPath}/${fileId}.bin`;
        fs.writeFileSync(destination, binary.buffer as Buffer);

        file.is_uploaded = true;
        file.is_deleted = false;
        file.size = binary.size;
        file.last_modified = last_modified;

        await file.save();

        res.json(file);
    });

    // File preview
    app.get(`/api/projects/:ownerId/:projectId/files/:fileId/view`, auth("explorer", "codesync"), async (req, res) => {
        const { ownerId, projectId, fileId } = req.params;
        const file = await FileEntity.findOneBy({id: fileId, project: { id: ownerId + '/' + projectId }});

        if (file === null) {
            res.status(404).json({ error: "File not found." });
            return;
        }

        const directoryPath = `${__dirname}/storage`;
        const destination = `${directoryPath}/${fileId}.bin`;
        if (!fs.existsSync(directoryPath) || !fs.existsSync(destination)) {
            res.status(404).json({ error: "File not found." });
            return;
        }

        const extIndex = file.name.lastIndexOf('.');
        if (extIndex !== -1) {
            const ext = file.name.substring(extIndex + 1).toLowerCase();
            const type = mime.lookup(ext);
            if (type) {
                res.setHeader("Content-Type", type);
            }
        }

        res.setHeader("Content-Disposition", `inline; filename="content"`);
        
        console.log("Sent file download.");
        res.sendFile(destination);
    });

    // File downloading
    app.get(`/api/projects/:ownerId/:projectId/files/:fileId/content`, auth("explorer", "codesync"), async (req, res) => {
        const { ownerId, projectId, fileId } = req.params;
        const file = await FileEntity.findOneBy({id: fileId, project: { id: ownerId + '/' + projectId }});

        if (file === null) {
            res.status(404).json({ error: "File not found." });
            return;
        }

        const directoryPath = `${__dirname}/storage`;
        const destination = `${directoryPath}/${fileId}.bin`;
        if (!fs.existsSync(directoryPath) || !fs.existsSync(destination)) {
            res.status(404).json({ error: "File not found." });
            return;
        }
        
        console.log("Sent file download.");
        res.sendFile(destination);
    });

    // File deleting
    app.delete(`/api/projects/:ownerId/:projectId/files/:fileId`, auth("codesync"), async (req, res) => {
        const { ownerId, projectId, fileId } = req.params;
        const file = await FileEntity.findOneBy({id: fileId, project: { id: ownerId + '/' + projectId }});

        if (file === null) {
            res.status(404).json({ error: "File not found." });
            return;
        }

        file.last_modified = Date.now();
        file.is_deleted = true;
        file.size = 0;
        await file.save();

        const directoryPath = `${__dirname}/storage`;
        const destination = `${directoryPath}/${fileId}.bin`;
        if (fs.existsSync(directoryPath) && fs.existsSync(destination)) {
            fs.rmSync(destination);
        }

        res.status(200).json({
            message: "File deleted."
        });
    });
}