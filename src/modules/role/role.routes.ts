import { Router } from 'express';
import { RoleController } from './role.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/role.middleware';

const router = Router();
const controller = new RoleController();

// All role management endpoints require authentication and the ROLE_MANAGE permission
router.use(authMiddleware);
router.use(requirePermission('roles:manage'));

router.post('/', controller.create);
router.get('/', controller.list);
router.patch('/:id', controller.update);
router.delete('/:id', controller.delete);
router.put('/:id/permissions', controller.setPermissions);

export default router;
