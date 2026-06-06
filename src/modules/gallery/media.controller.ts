import { Request, Response, NextFunction } from 'express';
import { UploadService } from '../../services/upload.service';
import { prisma } from '../../configs/prisma';
import { BadRequestError, NotFoundError } from '../../utils/errors';
import { parseQueryParams, formatPaginatedResponse } from '../../utils/query';

export class MediaController {
  private uploadService = new UploadService();

  public upload = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const file = req.file;
      const { category = 'GALLERY', altText } = req.body;

      if (!file) {
        throw new BadRequestError('No file uploaded');
      }

      // Map API category to Supabase bucket
      // Buckets: rooms, gallery, blogs, experiences, cms
      const bucketMap: Record<string, 'rooms' | 'gallery' | 'blogs' | 'experiences' | 'cms'> = {
        ROOMS: 'rooms',
        GALLERY: 'gallery',
        BLOGS: 'blogs',
        EXPERIENCES: 'experiences',
        CMS: 'cms',
      };

      const bucket = bucketMap[String(category).toUpperCase()] || 'gallery';

      // 1. Upload to Supabase Storage
      const uploadResult = await this.uploadService.uploadFile(file, bucket);

      // 2. Save metadata in PostgreSQL
      const fileType = file.mimetype.startsWith('video/') ? 'VIDEO' : 'IMAGE';
      const media = await prisma.media.create({
        data: {
          type: fileType,
          url: uploadResult.url,
          category: String(category).toUpperCase(),
          altText: altText || file.originalname,
        },
      });

      res.status(201).json({
        status: 'success',
        data: media,
      });
    } catch (error) {
      next(error);
    }
  };

  public getAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = parseQueryParams(req.query, ['category', 'type']);
      
      const where: any = { ...parsed.filters };

      if (parsed.search) {
        where.altText = { contains: parsed.search, mode: 'insensitive' };
      }

      const [items, total] = await Promise.all([
        prisma.media.findMany({
          where,
          skip: parsed.skip,
          take: parsed.limit,
          orderBy: { [parsed.sortBy]: parsed.sortOrder },
        }),
        prisma.media.count({ where }),
      ]);

      res.status(200).json({
        status: 'success',
        data: formatPaginatedResponse(items, total, parsed),
      });
    } catch (error) {
      next(error);
    }
  };

  public delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const media = await prisma.media.findUnique({
        where: { id },
      });

      if (!media) {
        throw new NotFoundError('Media asset not found');
      }

      const bucketMap: Record<string, 'rooms' | 'gallery' | 'blogs' | 'experiences' | 'cms'> = {
        ROOMS: 'rooms',
        GALLERY: 'gallery',
        BLOGS: 'blogs',
        EXPERIENCES: 'experiences',
        CMS: 'cms',
      };

      const bucket = bucketMap[media.category] || 'gallery';

      // 1. Delete from Supabase Storage
      await this.uploadService.deleteFile(media.url, bucket);

      // 2. Delete from PostgreSQL
      await prisma.media.delete({
        where: { id },
      });

      res.status(204).json({
        status: 'success',
        data: null,
      });
    } catch (error) {
      next(error);
    }
  };
}
