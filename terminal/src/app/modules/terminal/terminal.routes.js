import express from 'express';
import TerminalController from './terminal.controller.js';

const router = express.Router();

router.post('/create-request', TerminalController.createRequest);

export default router;
