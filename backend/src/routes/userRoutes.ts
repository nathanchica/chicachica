import { Router } from 'express';

import { createUser, getAllUsers, getUser, updateUserStatus } from '../controllers/userController.js';

const router = Router();

router.post('/users', createUser);
router.get('/users', getAllUsers);
router.get('/users/:id', getUser);
router.patch('/users/:id/status', updateUserStatus);

export default router;
