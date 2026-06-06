import { Router } from 'express';
import authRoutes from '../modules/auth/auth.routes';
import usersRoutes from '../modules/users/users.routes';
import guestsRoutes from '../modules/guests/guests.routes';
import roomTypesRoutes from '../modules/room-types/room-types.routes';
import roomsRoutes from '../modules/rooms/rooms.routes';
import bookingsRoutes from '../modules/bookings/bookings.routes';
import availabilityRoutes from '../modules/availability/availability.routes';
import pricingRoutes from '../modules/pricing/pricing.routes';
import reportsRoutes from '../modules/reports/reports.routes';
import mediaRoutes from '../modules/gallery/media.routes';
import operationsRoutes from '../modules/operations/operations.routes';

const router = Router();

// Mount all modules
router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/guests', guestsRoutes);
router.use('/room-types', roomTypesRoutes);
router.use('/rooms', roomsRoutes);
router.use('/bookings', bookingsRoutes);
router.use('/availability', availabilityRoutes);
router.use('/pricing', pricingRoutes);
router.use('/reports', reportsRoutes);
router.use('/media', mediaRoutes);
router.use('/operations', operationsRoutes);

export default router;
