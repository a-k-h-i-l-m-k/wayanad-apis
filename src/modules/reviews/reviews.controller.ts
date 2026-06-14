import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../configs/prisma';
import { BadRequestError, NotFoundError, UnauthorizedError } from '../../utils/errors';

export class ReviewsController {
  /**
   * GET /reviews?approved=true
   * Public: list approved (visible) reviews for homepage.
   * Admin: list all reviews (approved + unapproved).
   */
  public getAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const isAdmin = req.user?.role?.name === 'ADMIN';
      const showAll = req.query.all === 'true' && isAdmin;

      const where: any = showAll ? {} : { approved: true };

      const reviews = await prisma.review.findMany({
        where,
        include: {
          guest: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          booking: {
            select: { id: true, bookingReference: true },
          },
        },
        orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }],
      });

      res.status(200).json({ status: 'success', data: reviews });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /reviews/my
   * Authenticated guest: list their own reviews (by matching email in guest table).
   */
  public getMine = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userEmail = req.user!.email;

      const guest = await prisma.guest.findUnique({ where: { email: userEmail } });
      if (!guest) {
        return res.status(200).json({ status: 'success', data: [] });
      }

      const reviews = await prisma.review.findMany({
        where: { guestId: guest.id },
        include: {
          booking: { select: { id: true, bookingReference: true } },
        },
        orderBy: { createdAt: 'desc' },
      });

      res.status(200).json({ status: 'success', data: reviews });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /reviews
   * Authenticated guest: submit a review (linked to a booking if provided).
   */
  public create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userEmail = req.user!.email;
      const { rating, review, bookingId } = req.body;

      if (!rating || !review) {
        throw new BadRequestError('Rating and review text are required');
      }
      if (rating < 1 || rating > 5) {
        throw new BadRequestError('Rating must be between 1 and 5');
      }

      // Find or create guest record for this user
      let guest = await prisma.guest.findUnique({ where: { email: userEmail } });
      if (!guest) {
        // Create a guest profile from the user data
        const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
        if (!user) throw new NotFoundError('User not found');
        // Generate a unique guest code
        const guestCode = `G-${Date.now()}`;
        guest = await prisma.guest.create({
          data: {
            guestCode,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            phone: user.phone || undefined,
          },
        });
      }

      // Validate bookingId belongs to this guest
      if (bookingId) {
        const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
        if (!booking || booking.guestId !== guest.id) {
          throw new BadRequestError('Invalid booking ID');
        }
      }

      const created = await prisma.review.create({
        data: {
          guestId: guest.id,
          bookingId: bookingId || undefined,
          rating,
          review,
          approved: false, // requires admin approval
        },
      });

      res.status(201).json({
        status: 'success',
        message: 'Review submitted. It will appear after admin approval.',
        data: created,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * PATCH /reviews/:id
   * Owner: edit own review (only text/rating, resets approved to false).
   * Admin: can also toggle approved/featured.
   */
  public update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const isAdmin = req.user?.role?.name === 'ADMIN';
      const userEmail = req.user!.email;

      const review = await prisma.review.findUnique({
        where: { id },
        include: { guest: true },
      });
      if (!review) throw new NotFoundError('Review not found');

      // Non-admins can only edit their own review
      if (!isAdmin && review.guest.email !== userEmail) {
        throw new UnauthorizedError('You can only edit your own reviews');
      }

      const updateData: any = {};

      if (req.body.rating !== undefined) updateData.rating = req.body.rating;
      if (req.body.review !== undefined) {
        updateData.review = req.body.review;
        // Reset approval when content changes (only for non-admins)
        if (!isAdmin) updateData.approved = false;
      }

      // Admin-only fields
      if (isAdmin) {
        if (req.body.approved !== undefined) updateData.approved = req.body.approved;
        if (req.body.featured !== undefined) updateData.featured = req.body.featured;
      }

      const updated = await prisma.review.update({ where: { id }, data: updateData });
      res.status(200).json({ status: 'success', data: updated });
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /reviews/:id
   * Admin only: delete any review.
   */
  public delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const review = await prisma.review.findUnique({ where: { id } });
      if (!review) throw new NotFoundError('Review not found');

      await prisma.review.delete({ where: { id } });
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /reviews/bookings-for-review
   * Returns bookings for the current user that are checked-out and don't have a review yet.
   */
  public getBookingsForReview = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userEmail = req.user!.email;

      const guest = await prisma.guest.findUnique({ where: { email: userEmail } });
      if (!guest) return res.status(200).json({ status: 'success', data: [] });

      // Get all reviewed booking IDs for this guest
      const reviewedBookingIds = (
        await prisma.review.findMany({
          where: { guestId: guest.id, bookingId: { not: null } },
          select: { bookingId: true },
        })
      ).map((r) => r.bookingId);

      // Get eligible bookings (checked-out, not yet reviewed)
      const bookings = await prisma.booking.findMany({
        where: {
          guestId: guest.id,
          bookingStatus: 'CHECKED_OUT',
          id: { notIn: reviewedBookingIds.filter(Boolean) as string[] },
        },
        include: {
          bookingRooms: { include: { roomType: true } },
        },
        orderBy: { checkOut: 'desc' },
        take: 10,
      });

      res.status(200).json({ status: 'success', data: bookings });
    } catch (error) {
      next(error);
    }
  };
}
