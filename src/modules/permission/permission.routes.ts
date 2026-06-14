import { Router } from 'express';
import { PermissionController } from './permission.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/role.middleware';

const router = Router();
const controller = new PermissionController();

// Only admins (ROLE_MANAGE or PERMISSION_VIEW) can read permissions – adjust as needed
router.use(authMiddleware);
router.use(requirePermission('permissions:read'));

router.get('/', controller.list);

export default router;
