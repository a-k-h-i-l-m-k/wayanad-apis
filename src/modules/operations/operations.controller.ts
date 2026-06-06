import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../configs/prisma';
import { parseQueryParams, formatPaginatedResponse } from '../../utils/query';
import { NotFoundError, BadRequestError } from '../../utils/errors';
import { logAudit } from '../../utils/audit';

export class OperationsController {
  // ==========================================
  // EXPERIENCES CRUD & BOOKINGS
  // ==========================================
  public getExperiences = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const items = await prisma.experience.findMany({
        orderBy: { name: 'asc' },
      });
      res.status(200).json({
        status: 'success',
        data: items.map((i: any) => ({ ...i, price: Number(i.price) })),
      });
    } catch (error) {
      next(error);
    }
  };

  public getExperienceById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const item = await prisma.experience.findUnique({ where: { id } });
      if (!item) throw new NotFoundError('Experience not found');
      res.status(200).json({
        status: 'success',
        data: { ...item, price: Number(item.price) },
      });
    } catch (error) {
      next(error);
    }
  };

  public createExperience = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const item = await prisma.experience.create({ data: req.body });
      res.status(201).json({ status: 'success', data: item });
    } catch (error) {
      next(error);
    }
  };

  public updateExperience = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const item = await prisma.experience.update({ where: { id }, data: req.body });
      res.status(200).json({ status: 'success', data: item });
    } catch (error) {
      next(error);
    }
  };

  public deleteExperience = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      await prisma.experience.delete({ where: { id } });
      res.status(204).json({ status: 'success', data: null });
    } catch (error) {
      next(error);
    }
  };

  public bookExperience = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { bookingId, experienceId, participants } = req.body;

      const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
      if (!booking) throw new NotFoundError('Resort Booking not found');

      const exp = await prisma.experience.findUnique({ where: { id: experienceId } });
      if (!exp || exp.status !== 'ACTIVE') throw new NotFoundError('Active experience not found');

      if (participants > exp.capacity) {
        throw new BadRequestError(`Number of participants exceeds max capacity of ${exp.capacity}`);
      }

      const totalAmount = Number(exp.price) * participants;

      const expBooking = await prisma.experienceBooking.create({
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
    } catch (error) {
      next(error);
    }
  };

  // ==========================================
  // DINING MENU CRUD
  // ==========================================
  public getMenuCategories = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const items = await prisma.menuCategory.findMany({
        include: { menuItems: true },
        orderBy: { name: 'asc' },
      });
      res.status(200).json({ status: 'success', data: items });
    } catch (error) {
      next(error);
    }
  };

  public createMenuCategory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const item = await prisma.menuCategory.create({ data: req.body });
      res.status(201).json({ status: 'success', data: item });
    } catch (error) {
      next(error);
    }
  };

  public getMenuItems = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const items = await prisma.menuItem.findMany({
        include: { category: true },
        orderBy: { name: 'asc' },
      });
      res.status(200).json({
        status: 'success',
        data: items.map((i: any) => ({ ...i, price: Number(i.price) })),
      });
    } catch (error) {
      next(error);
    }
  };

  public createMenuItem = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const item = await prisma.menuItem.create({ data: req.body });
      res.status(201).json({ status: 'success', data: item });
    } catch (error) {
      next(error);
    }
  };

  public updateMenuItem = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const item = await prisma.menuItem.update({ where: { id }, data: req.body });
      res.status(200).json({ status: 'success', data: item });
    } catch (error) {
      next(error);
    }
  };

  public deleteMenuItem = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      await prisma.menuItem.delete({ where: { id } });
      res.status(204).json({ status: 'success', data: null });
    } catch (error) {
      next(error);
    }
  };

  // ==========================================
  // BLOGS CRUD
  // ==========================================
  public getBlogs = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = parseQueryParams(req.query, ['status']);
      const where: any = { ...parsed.filters };

      if (parsed.search) {
        where.OR = [
          { title: { contains: parsed.search, mode: 'insensitive' } },
          { excerpt: { contains: parsed.search, mode: 'insensitive' } },
        ];
      }

      const [items, total] = await Promise.all([
        prisma.blog.findMany({
          where,
          skip: parsed.skip,
          take: parsed.limit,
          orderBy: { [parsed.sortBy]: parsed.sortOrder },
        }),
        prisma.blog.count({ where }),
      ]);

      res.status(200).json({
        status: 'success',
        data: formatPaginatedResponse(items, total, parsed),
      });
    } catch (error) {
      next(error);
    }
  };

  public getBlogById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const item = await prisma.blog.findUnique({ where: { id } });
      if (!item) throw new NotFoundError('Blog not found');
      res.status(200).json({ status: 'success', data: item });
    } catch (error) {
      next(error);
    }
  };

  public createBlog = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req.body;
      const item = await prisma.blog.create({
        data: {
          ...data,
          publishedAt: data.status === 'PUBLISHED' ? new Date() : null,
        },
      });
      res.status(201).json({ status: 'success', data: item });
    } catch (error) {
      next(error);
    }
  };

  public updateBlog = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const data = req.body;
      
      if (data.status === 'PUBLISHED') {
        data.publishedAt = new Date();
      }

      const item = await prisma.blog.update({ where: { id }, data });
      res.status(200).json({ status: 'success', data: item });
    } catch (error) {
      next(error);
    }
  };

  public deleteBlog = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      await prisma.blog.delete({ where: { id } });
      res.status(204).json({ status: 'success', data: null });
    } catch (error) {
      next(error);
    }
  };

  // ==========================================
  // REVIEWS CRUD & MODERATION
  // ==========================================
  public getReviews = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = parseQueryParams(req.query, ['approved', 'featured']);
      const where = { ...parsed.filters };
      
      const items = await prisma.review.findMany({
        where,
        include: { guest: true },
        orderBy: { createdAt: 'desc' },
      });

      res.status(200).json({ status: 'success', data: items });
    } catch (error) {
      next(error);
    }
  };

  public createReview = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const item = await prisma.review.create({ data: req.body });
      res.status(201).json({ status: 'success', data: item });
    } catch (error) {
      next(error);
    }
  };

  public approveReview = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const item = await prisma.review.update({
        where: { id },
        data: { approved: true },
      });
      res.status(200).json({ status: 'success', data: item });
    } catch (error) {
      next(error);
    }
  };

  public featureReview = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { featured } = req.body;
      const item = await prisma.review.update({
        where: { id },
        data: { featured: Boolean(featured) },
      });
      res.status(200).json({ status: 'success', data: item });
    } catch (error) {
      next(error);
    }
  };

  // ==========================================
  // OFFERS CRUD
  // ==========================================
  public getOffers = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const items = await prisma.offer.findMany({
        orderBy: { startDate: 'asc' },
      });
      res.status(200).json({
        status: 'success',
        data: items.map((i: any) => ({ ...i, discountValue: Number(i.discountValue) })),
      });
    } catch (error) {
      next(error);
    }
  };

  public createOffer = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req.body;
      const item = await prisma.offer.create({
        data: {
          ...data,
          startDate: new Date(data.startDate),
          endDate: new Date(data.endDate),
        },
      });
      res.status(201).json({ status: 'success', data: item });
    } catch (error) {
      next(error);
    }
  };

  public updateOffer = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const data = req.body;

      if (data.startDate) data.startDate = new Date(data.startDate);
      if (data.endDate) data.endDate = new Date(data.endDate);

      const item = await prisma.offer.update({ where: { id }, data });
      res.status(200).json({ status: 'success', data: item });
    } catch (error) {
      next(error);
    }
  };

  public deleteOffer = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      await prisma.offer.delete({ where: { id } });
      res.status(204).json({ status: 'success', data: null });
    } catch (error) {
      next(error);
    }
  };

  // ==========================================
  // CMS SECTIONS CRUD
  // ==========================================
  public getCmsSections = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { page } = req.query;
      const where = page ? { page: String(page) } : {};
      
      const items = await prisma.cmsSection.findMany({
        where,
        orderBy: { displayOrder: 'asc' },
      });
      res.status(200).json({ status: 'success', data: items });
    } catch (error) {
      next(error);
    }
  };

  public getCmsSectionByKey = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { key } = req.params;
      const item = await prisma.cmsSection.findUnique({ where: { sectionKey: key } });
      if (!item) throw new NotFoundError('CMS section key not found');
      res.status(200).json({ status: 'success', data: item });
    } catch (error) {
      next(error);
    }
  };

  public updateCmsSection = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const oldCms = await prisma.cmsSection.findUnique({ where: { id } });

      const item = await prisma.cmsSection.update({
        where: { id },
        data: req.body,
      });

      await logAudit({
        userId: req.user?.id,
        action: 'UPDATE_CMS',
        module: 'CMS',
        recordId: id,
        oldData: oldCms,
        newData: item,
      });

      res.status(200).json({ status: 'success', data: item });
    } catch (error) {
      next(error);
    }
  };

  // ==========================================
  // SYSTEM SETTINGS
  // ==========================================
  public getSettings = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const settings = await prisma.setting.findFirst();
      if (!settings) throw new NotFoundError('System settings not initialized');
      res.status(200).json({ status: 'success', data: settings });
    } catch (error) {
      next(error);
    }
  };

  public updateSettings = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const settings = await prisma.setting.findFirst();
      if (!settings) throw new NotFoundError('System settings not initialized');

      const updated = await prisma.setting.update({
        where: { id: settings.id },
        data: req.body,
      });

      await logAudit({
        userId: req.user?.id,
        action: 'UPDATE_SETTINGS',
        module: 'SETTINGS',
        recordId: settings.id,
        oldData: settings,
        newData: updated,
      });

      res.status(200).json({ status: 'success', data: updated });
    } catch (error) {
      next(error);
    }
  };

  // ==========================================
  // CONTACT ENQUIRIES CRUD
  // ==========================================
  public createEnquiry = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const item = await prisma.contactEnquiry.create({ data: req.body });
      
      // Notify admin
      await prisma.notification.create({
        data: {
          type: 'ENQUIRY_RECEIVED',
          title: 'New Guest Enquiry',
          message: `Received contact enquiry from ${item.name} (${item.email}).`,
        },
      });

      res.status(201).json({ status: 'success', data: item });
    } catch (error) {
      next(error);
    }
  };

  public getEnquiries = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = parseQueryParams(req.query, ['status']);
      const where = { ...parsed.filters };

      const [items, total] = await Promise.all([
        prisma.contactEnquiry.findMany({
          where,
          skip: parsed.skip,
          take: parsed.limit,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.contactEnquiry.count({ where }),
      ]);

      res.status(200).json({
        status: 'success',
        data: formatPaginatedResponse(items, total, parsed),
      });
    } catch (error) {
      next(error);
    }
  };

  public updateEnquiry = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const item = await prisma.contactEnquiry.update({
        where: { id },
        data: req.body,
      });
      res.status(200).json({ status: 'success', data: item });
    } catch (error) {
      next(error);
    }
  };

  // ==========================================
  // NOTIFICATIONS
  // ==========================================
  public getNotifications = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const items = await prisma.notification.findMany({
        orderBy: { createdAt: 'desc' },
      });
      res.status(200).json({ status: 'success', data: items });
    } catch (error) {
      next(error);
    }
  };

  public markNotificationAsRead = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const item = await prisma.notification.update({
        where: { id },
        data: { read: true },
      });
      res.status(200).json({ status: 'success', data: item });
    } catch (error) {
      next(error);
    }
  };

  // ==========================================
  // AUDIT LOGS
  // ==========================================
  public getAuditLogs = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = parseQueryParams(req.query, ['module', 'action']);
      const where = { ...parsed.filters };

      const [items, total] = await Promise.all([
        prisma.auditLog.findMany({
          where,
          include: { user: { select: { firstName: true, lastName: true, email: true } } },
          skip: parsed.skip,
          take: parsed.limit,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.auditLog.count({ where }),
      ]);

      res.status(200).json({
        status: 'success',
        data: formatPaginatedResponse(items, total, parsed),
      });
    } catch (error) {
      next(error);
    }
  };
}
