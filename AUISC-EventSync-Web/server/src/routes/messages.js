import express from 'express';
import { sendTeamMessage, sendDirectMessage, getTeamMessages, getDirectMessages } from '../controllers/messageController.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

router.post('/team', verifyToken, sendTeamMessage);
router.post('/direct', verifyToken, sendDirectMessage);
router.get('/team/:teamId', getTeamMessages);
router.get('/direct/:userId', verifyToken, getDirectMessages);

export default router;
