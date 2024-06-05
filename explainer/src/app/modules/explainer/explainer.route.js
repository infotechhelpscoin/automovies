import express from 'express';
import multer from 'multer';
import ExplainerController from './explainer.controllers.js';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

router.post('/upload', upload.fields([{ name: 'video', maxCount: 1 }, { name: 'transcription', maxCount: 1 }]), ExplainerController.addExplainerRequest);

export default router;
