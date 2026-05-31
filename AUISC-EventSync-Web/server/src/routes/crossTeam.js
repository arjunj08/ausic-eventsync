import express from 'express';
import { submitRequest, getRequests, approveRequest } from '../controllers/crossTeamController.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

router.post('/', verifyToken, submitRequest);
router.get('/', verifyToken, getRequests);
router.patch('/:id/approve', verifyToken, approveRequest);

export default router;
