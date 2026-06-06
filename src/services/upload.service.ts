import { createClient } from '@supabase/supabase-js';
import { env } from '../configs/env';
import { BadRequestError } from '../utils/errors';

// Initialize Supabase Client with service role key for full admin bypass of RLS policies for file management
const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
  },
});

export class UploadService {
  /**
   * Uploads a file to Supabase Storage
   * @param file Express Multer File
   * @param bucketName The storage bucket (rooms, gallery, blogs, experiences, cms)
   * @param folderPath Optional folder path inside the bucket
   */
  public async uploadFile(
    file: Express.Multer.File,
    bucketName: 'rooms' | 'gallery' | 'blogs' | 'experiences' | 'cms',
    folderPath: string = ''
  ): Promise<{ url: string; path: string }> {
    if (!file) {
      throw new BadRequestError('No file provided for upload');
    }

    // Standardize file name to avoid collisions
    const fileExt = file.originalname.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
    const fullPath = folderPath ? `${folderPath}/${fileName}` : fileName;

    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(fullPath, file.buffer, {
        contentType: file.mimetype,
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Supabase Upload Error:', error);
      throw new BadRequestError(`Supabase Storage Upload failed: ${error.message}`);
    }

    // Retrieve public URL
    const { data: publicUrlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(data.path);

    return {
      url: publicUrlData.publicUrl,
      path: data.path,
    };
  }

  /**
   * Deletes a file from Supabase Storage
   * @param fileUrl The full public URL of the file
   * @param bucketName The storage bucket
   */
  public async deleteFile(
    fileUrl: string,
    bucketName: 'rooms' | 'gallery' | 'blogs' | 'experiences' | 'cms'
  ): Promise<void> {
    try {
      // Extract the path from the URL
      // E.g., https://xxx.supabase.co/storage/v1/object/public/bucketName/folder/file.jpg
      const urlParts = fileUrl.split(`/storage/v1/object/public/${bucketName}/`);
      if (urlParts.length < 2) {
        throw new BadRequestError('Invalid file URL structure for deletion');
      }

      const filePath = decodeURIComponent(urlParts[1]);

      const { error } = await supabase.storage
        .from(bucketName)
        .remove([filePath]);

      if (error) {
        throw new Error(error.message);
      }
    } catch (err: any) {
      console.error('Supabase Delete Error:', err);
      throw new BadRequestError(`Failed to delete media: ${err.message}`);
    }
  }
}
