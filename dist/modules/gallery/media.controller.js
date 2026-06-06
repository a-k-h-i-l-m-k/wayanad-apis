"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MediaController = void 0;
const upload_service_1 = require("../../services/upload.service");
const prisma_1 = require("../../configs/prisma");
const errors_1 = require("../../utils/errors");
const query_1 = require("../../utils/query");
class MediaController {
    uploadService = new upload_service_1.UploadService();
    upload = async (req, res, next) => {
        try {
            const file = req.file;
            const { category = 'GALLERY', altText } = req.body;
            if (!file) {
                throw new errors_1.BadRequestError('No file uploaded');
            }
            // Map API category to Supabase bucket
            // Buckets: rooms, gallery, blogs, experiences, cms
            const bucketMap = {
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
            const media = await prisma_1.prisma.media.create({
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
        }
        catch (error) {
            next(error);
        }
    };
    getAll = async (req, res, next) => {
        try {
            const parsed = (0, query_1.parseQueryParams)(req.query, ['category', 'type']);
            const where = { ...parsed.filters };
            if (parsed.search) {
                where.altText = { contains: parsed.search, mode: 'insensitive' };
            }
            const [items, total] = await Promise.all([
                prisma_1.prisma.media.findMany({
                    where,
                    skip: parsed.skip,
                    take: parsed.limit,
                    orderBy: { [parsed.sortBy]: parsed.sortOrder },
                }),
                prisma_1.prisma.media.count({ where }),
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
    delete = async (req, res, next) => {
        try {
            const { id } = req.params;
            const media = await prisma_1.prisma.media.findUnique({
                where: { id },
            });
            if (!media) {
                throw new errors_1.NotFoundError('Media asset not found');
            }
            const bucketMap = {
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
            await prisma_1.prisma.media.delete({
                where: { id },
            });
            res.status(204).json({
                status: 'success',
                data: null,
            });
        }
        catch (error) {
            next(error);
        }
    };
}
exports.MediaController = MediaController;
