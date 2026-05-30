import express from 'express';
import { postUpdate, getTeamUpdates, deleteUpdate } from '../controllers/updateController.js';
import { verifyToken, verifyTeamLead } from '../middleware/auth.js';

const router = express.Router();

router.post('/', verifyToken, verifyTeamLead, postUpdate);
router.get('/:teamId', getTeamUpdates);
router.delete('/:id', verifyToken, deleteUpdate);

export default router;
