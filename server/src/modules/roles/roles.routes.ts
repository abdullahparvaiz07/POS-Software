import { Router } from 'express';
import roleController from './roles.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', roleController.getAllRoles);
router.get('/:id', roleController.getRoleById);

export default router;
