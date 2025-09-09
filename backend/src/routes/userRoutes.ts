import { Router } from 'express';

import { UserController } from '../controllers/userController';

const router = Router();
const userController = new UserController();

router.post('/users', (req, res) => userController.createUser(req, res));
router.get('/users', (req, res) => userController.getAllUsers(req, res));
router.get('/users/:id', (req, res) => userController.getUser(req, res));
router.patch('/users/:id/status', (req, res) => userController.updateUserStatus(req, res));

export default router;
