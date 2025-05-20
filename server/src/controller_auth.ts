import { app as _app } from './app';
import { authenticate } from './auth';

export function setupAuthController(app: typeof _app) {
    app.post('/auth', async (req, res) => {
        const { password } = req.body;
        const token = authenticate(password);

        if (token) {
            res.status(200).send({token});
        } else {
            res.sendStatus(403);
        }
    });
}