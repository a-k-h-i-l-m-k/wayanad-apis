"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OperationsController = void 0;
const prisma_1 = require("../../configs/prisma");
const query_1 = require("../../utils/query");
const errors_1 = require("../../utils/errors");
const audit_1 = require("../../utils/audit");
class OperationsController {
    // ==========================================
    // EXPERIENCES CRUD & BOOKINGS
    // ==========================================
    getExperiences = async (req, res, next) => {
        try {
            const items = await prisma_1.prisma.experience.findMany({
                orderBy: { name: 'asc' },
            });
            res.status(200).json({
                status: 'success',
                data: items.map((i) => ({ ...i, price: Number(i.price) })),
            });
        }
        catch (error) {
            next(error);
        }
    };
    getExperienceById = async (req, res, next) => {
        try {
            const { id } = req.params;
            const item = await prisma_1.prisma.experience.findUnique({ where: { id } });
            if (!item)
                throw new errors_1.NotFoundError('Experience not found');
            res.status(200).json({
                status: 'success',
                data: { ...item, price: Number(item.price) },
            });
        }
        catch (error) {
            next(error);
        }
    };
    createExperience = async (req, res, next) => {
        try {
            const item = await prisma_1.prisma.experience.create({ data: req.body });
            res.status(201).json({ status: 'success', data: item });
        }
        catch (error) {
            next(error);
        }
    };
    updateExperience = async (req, res, next) => {
        try {
            const { id } = req.params;
            const item = await prisma_1.prisma.experience.update({ where: { id }, data: req.body });
            res.status(200).json({ status: 'success', data: item });
        }
        catch (error) {
            next(error);
        }
    };
    deleteExperience = async (req, res, next) => {
        try {
            const { id } = req.params;
            await prisma_1.prisma.experience.delete({ where: { id } });
            res.status(204).json({ status: 'success', data: null });
        }
        catch (error) {
            next(error);
        }
    };
    bookExperience = async (req, res, next) => {
        try {
            const { bookingId, experienceId, participants } = req.body;
            const booking = await prisma_1.prisma.booking.findUnique({ where: { id: bookingId } });
            if (!booking)
                throw new errors_1.NotFoundError('Resort Booking not found');
            const exp = await prisma_1.prisma.experience.findUnique({ where: { id: experienceId } });
            if (!exp || exp.status !== 'ACTIVE')
                throw new errors_1.NotFoundError('Active experience not found');
            if (participants > exp.capacity) {
                throw new errors_1.BadRequestError(`Number of participants exceeds max capacity of ${exp.capacity}`);
            }
            const totalAmount = Number(exp.price) * participants;
            const expBooking = await prisma_1.prisma.experienceBooking.create({
                data: {
                    bookingId,
                    experienceId,
                    participants,
                    amount: totalAmount,
                },
            });
            res.status(201).json({
                status: 'success',
                data: expBooking,
            });
        }
        catch (error) {
            next(error);
        }
    };
    // ==========================================
    // DINING MENU CRUD
    // ==========================================
    getMenuCategories = async (req, res, next) => {
        try {
            const items = await prisma_1.prisma.menuCategory.findMany({
                include: { menuItems: true },
                orderBy: { name: 'asc' },
            });
            res.status(200).json({ status: 'success', data: items });
        }
        catch (error) {
            next(error);
        }
    };
    createMenuCategory = async (req, res, next) => {
        try {
            const item = await prisma_1.prisma.menuCategory.create({ data: req.body });
            res.status(201).json({ status: 'success', data: item });
        }
        catch (error) {
            next(error);
        }
    };
    getMenuItems = async (req, res, next) => {
        try {
            const items = await prisma_1.prisma.menuItem.findMany({
                include: { category: true },
                orderBy: { name: 'asc' },
            });
            res.status(200).json({
                status: 'success',
                data: items.map((i) => ({ ...i, price: Number(i.price) })),
            });
        }
        catch (error) {
            next(error);
        }
    };
    createMenuItem = async (req, res, next) => {
        try {
            const item = await prisma_1.prisma.menuItem.create({ data: req.body });
            res.status(201).json({ status: 'success', data: item });
        }
        catch (error) {
            next(error);
        }
    };
    updateMenuItem = async (req, res, next) => {
        try {
            const { id } = req.params;
            const item = await prisma_1.prisma.menuItem.update({ where: { id }, data: req.body });
            res.status(200).json({ status: 'success', data: item });
        }
        catch (error) {
            next(error);
        }
    };
    deleteMenuItem = async (req, res, next) => {
        try {
            const { id } = req.params;
            await prisma_1.prisma.menuItem.delete({ where: { id } });
            res.status(204).json({ status: 'success', data: null });
        }
        catch (error) {
            next(error);
        }
    };
    // ==========================================
    // BLOGS CRUD
    // ==========================================
    getBlogs = async (req, res, next) => {
        try {
            const parsed = (0, query_1.parseQueryParams)(req.query, ['status']);
            const where = { ...parsed.filters };
            if (parsed.search) {
                where.OR = [
                    { title: { contains: parsed.search, mode: 'insensitive' } },
                    { excerpt: { contains: parsed.search, mode: 'insensitive' } },
                ];
            }
            const [items, total] = await Promise.all([
                prisma_1.prisma.blog.findMany({
                    where,
                    skip: parsed.skip,
                    take: parsed.limit,
                    orderBy: { [parsed.sortBy]: parsed.sortOrder },
                }),
                prisma_1.prisma.blog.count({ where }),
            ]);
            res.status(200).json({
                status: 'success',
                data: (0, query_1.formatPaginatedResponse)(items, total, parsed),
            });
        }
        catch (error) {
            next(error);
        }
    };
    getBlogById = async (req, res, next) => {
        try {
            const { id } = req.params;
            const item = await prisma_1.prisma.blog.findUnique({ where: { id } });
            if (!item)
                throw new errors_1.NotFoundError('Blog not found');
            res.status(200).json({ status: 'success', data: item });
        }
        catch (error) {
            next(error);
        }
    };
    createBlog = async (req, res, next) => {
        try {
            const data = req.body;
            const item = await prisma_1.prisma.blog.create({
                data: {
                    ...data,
                    publishedAt: data.status === 'PUBLISHED' ? new Date() : null,
                },
            });
            res.status(201).json({ status: 'success', data: item });
        }
        catch (error) {
            next(error);
        }
    };
    updateBlog = async (req, res, next) => {
        try {
            const { id } = req.params;
            const data = req.body;
            if (data.status === 'PUBLISHED') {
                data.publishedAt = new Date();
            }
            const item = await prisma_1.prisma.blog.update({ where: { id }, data });
            res.status(200).json({ status: 'success', data: item });
        }
        catch (error) {
            next(error);
        }
    };
    deleteBlog = async (req, res, next) => {
        try {
            const { id } = req.params;
            await prisma_1.prisma.blog.delete({ where: { id } });
            res.status(204).json({ status: 'success', data: null });
        }
        catch (error) {
            next(error);
        }
    };
    // ==========================================
    // REVIEWS CRUD & MODERATION
    // ==========================================
    getReviews = async (req, res, next) => {
        try {
            const parsed = (0, query_1.parseQueryParams)(req.query, ['approved', 'featured']);
            const where = { ...parsed.filters };
            const items = await prisma_1.prisma.review.findMany({
                where,
                include: { guest: true },
                orderBy: { createdAt: 'desc' },
            });
            res.status(200).json({ status: 'success', data: items });
        }
        catch (error) {
            next(error);
        }
    };
    createReview = async (req, res, next) => {
        try {
            const item = await prisma_1.prisma.review.create({ data: req.body });
            res.status(201).json({ status: 'success', data: item });
        }
        catch (error) {
            next(error);
        }
    };
    approveReview = async (req, res, next) => {
        try {
            const { id } = req.params;
            const item = await prisma_1.prisma.review.update({
                where: { id },
                data: { approved: true },
            });
            res.status(200).json({ status: 'success', data: item });
        }
        catch (error) {
            next(error);
        }
    };
    featureReview = async (req, res, next) => {
        try {
            const { id } = req.params;
            const { featured } = req.body;
            const item = await prisma_1.prisma.review.update({
                where: { id },
                data: { featured: Boolean(featured) },
            });
            res.status(200).json({ status: 'success', data: item });
        }
        catch (error) {
            next(error);
        }
    };
    // ==========================================
    // OFFERS CRUD
    // ==========================================
    getOffers = async (req, res, next) => {
        try {
            const items = await prisma_1.prisma.offer.findMany({
                orderBy: { startDate: 'asc' },
            });
            res.status(200).json({
                status: 'success',
                data: items.map((i) => ({ ...i, discountValue: Number(i.discountValue) })),
            });
        }
        catch (error) {
            next(error);
        }
    };
    createOffer = async (req, res, next) => {
        try {
            const data = req.body;
            const item = await prisma_1.prisma.offer.create({
                data: {
                    ...data,
                    startDate: new Date(data.startDate),
                    endDate: new Date(data.endDate),
                },
            });
            res.status(201).json({ status: 'success', data: item });
        }
        catch (error) {
            next(error);
        }
    };
    updateOffer = async (req, res, next) => {
        try {
            const { id } = req.params;
            const data = req.body;
            if (data.startDate)
                data.startDate = new Date(data.startDate);
            if (data.endDate)
                data.endDate = new Date(data.endDate);
            const item = await prisma_1.prisma.offer.update({ where: { id }, data });
            res.status(200).json({ status: 'success', data: item });
        }
        catch (error) {
            next(error);
        }
    };
    deleteOffer = async (req, res, next) => {
        try {
            const { id } = req.params;
            await prisma_1.prisma.offer.delete({ where: { id } });
            res.status(204).json({ status: 'success', data: null });
        }
        catch (error) {
            next(error);
        }
    };
    // ==========================================
    // CMS SECTIONS CRUD
    // ==========================================
    getCmsSections = async (req, res, next) => {
        try {
            const { page } = req.query;
            const where = page ? { page: String(page) } : {};
            const items = await prisma_1.prisma.cmsSection.findMany({
                where,
                orderBy: { displayOrder: 'asc' },
            });
            res.status(200).json({ status: 'success', data: items });
        }
        catch (error) {
            next(error);
        }
    };
    getCmsSectionByKey = async (req, res, next) => {
        try {
            const { key } = req.params;
            const item = await prisma_1.prisma.cmsSection.findUnique({ where: { sectionKey: key } });
            if (!item)
                throw new errors_1.NotFoundError('CMS section key not found');
            res.status(200).json({ status: 'success', data: item });
        }
        catch (error) {
            next(error);
        }
    };
    updateCmsSection = async (req, res, next) => {
        try {
            const { id } = req.params;
            const oldCms = await prisma_1.prisma.cmsSection.findUnique({ where: { id } });
            const item = await prisma_1.prisma.cmsSection.update({
                where: { id },
                data: req.body,
            });
            await (0, audit_1.logAudit)({
                userId: req.user?.id,
                action: 'UPDATE_CMS',
                module: 'CMS',
                recordId: id,
                oldData: oldCms,
                newData: item,
            });
            res.status(200).json({ status: 'success', data: item });
        }
        catch (error) {
            next(error);
        }
    };
    // ==========================================
    // SYSTEM SETTINGS
    // ==========================================
    getSettings = async (req, res, next) => {
        try {
            const settings = await prisma_1.prisma.setting.findFirst();
            if (!settings)
                throw new errors_1.NotFoundError('System settings not initialized');
            res.status(200).json({ status: 'success', data: settings });
        }
        catch (error) {
            next(error);
        }
    };
    updateSettings = async (req, res, next) => {
        try {
            const settings = await prisma_1.prisma.setting.findFirst();
            if (!settings)
                throw new errors_1.NotFoundError('System settings not initialized');
            const updated = await prisma_1.prisma.setting.update({
                where: { id: settings.id },
                data: req.body,
            });
            await (0, audit_1.logAudit)({
                userId: req.user?.id,
                action: 'UPDATE_SETTINGS',
                module: 'SETTINGS',
                recordId: settings.id,
                oldData: settings,
                newData: updated,
            });
            res.status(200).json({ status: 'success', data: updated });
        }
        catch (error) {
            next(error);
        }
    };
    // ==========================================
    // CONTACT ENQUIRIES CRUD
    // ==========================================
    createEnquiry = async (req, res, next) => {
        try {
            const item = await prisma_1.prisma.contactEnquiry.create({ data: req.body });
            // Notify admin
            await prisma_1.prisma.notification.create({
                data: {
                    type: 'ENQUIRY_RECEIVED',
                    title: 'New Guest Enquiry',
                    message: `Received contact enquiry from ${item.name} (${item.email}).`,
                },
            });
            res.status(201).json({ status: 'success', data: item });
        }
        catch (error) {
            next(error);
        }
    };
    getEnquiries = async (req, res, next) => {
        try {
            const parsed = (0, query_1.parseQueryParams)(req.query, ['status']);
            const where = { ...parsed.filters };
            const [items, total] = await Promise.all([
                prisma_1.prisma.contactEnquiry.findMany({
                    where,
                    skip: parsed.skip,
                    take: parsed.limit,
                    orderBy: { createdAt: 'desc' },
                }),
                prisma_1.prisma.contactEnquiry.count({ where }),
            ]);
            res.status(200).json({
                status: 'success',
                data: (0, query_1.formatPaginatedResponse)(items, total, parsed),
            });
        }
        catch (error) {
            next(error);
        }
    };
    updateEnquiry = async (req, res, next) => {
        try {
            const { id } = req.params;
            const item = await prisma_1.prisma.contactEnquiry.update({
                where: { id },
                data: req.body,
            });
            res.status(200).json({ status: 'success', data: item });
        }
        catch (error) {
            next(error);
        }
    };
    // ==========================================
    // NOTIFICATIONS
    // ==========================================
    getNotifications = async (req, res, next) => {
        try {
            const items = await prisma_1.prisma.notification.findMany({
                orderBy: { createdAt: 'desc' },
            });
            res.status(200).json({ status: 'success', data: items });
        }
        catch (error) {
            next(error);
        }
    };
    markNotificationAsRead = async (req, res, next) => {
        try {
            const { id } = req.params;
            const item = await prisma_1.prisma.notification.update({
                where: { id },
                data: { read: true },
            });
            res.status(200).json({ status: 'success', data: item });
        }
        catch (error) {
            next(error);
        }
    };
    // ==========================================
    // AUDIT LOGS
    // ==========================================
    getAuditLogs = async (req, res, next) => {
        try {
            const parsed = (0, query_1.parseQueryParams)(req.query, ['module', 'action']);
            const where = { ...parsed.filters };
            const [items, total] = await Promise.all([
                prisma_1.prisma.auditLog.findMany({
                    where,
                    include: { user: { select: { firstName: true, lastName: true, email: true } } },
                    skip: parsed.skip,
                    take: parsed.limit,
                    orderBy: { createdAt: 'desc' },
                }),
                prisma_1.prisma.auditLog.count({ where }),
            ]);
            res.status(200).json({
                status: 'success',
                data: (0, query_1.formatPaginatedResponse)(items, total, parsed),
            });
        }
        catch (error) {
            next(error);
        }
    };
}
exports.OperationsController = OperationsController;
