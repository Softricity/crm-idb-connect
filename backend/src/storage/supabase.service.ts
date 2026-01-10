// src/storage/supabase.service.ts
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private supabase: SupabaseClient;
  private configured: boolean;

  constructor() {
    const url =
      process.env.SUPABASE_URL ||
      process.env.NEXT_PUBLIC_SUPABASE_URL ||
      '';
    // Prefer service role key (bypasses RLS for server-side ops); fallback to anon for read-only
    const key =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_SERVICE_KEY ||
      process.env.SUPABASE_ANON_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      '';

    

    const isServiceRole = /service-role/.test(key);
    // Diagnostics: never log full key; only length & type.
    // eslint-disable-next-line no-console
    console.log('[SupabaseService:init]', {
      urlPresent: !!url,
      keyPresent: !!key,
      keyLength: key ? key.length : 0,
      isServiceRole,
      usedEnvKeys: {
        SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        SUPABASE_SERVICE_KEY: !!process.env.SUPABASE_SERVICE_KEY,
        SUPABASE_ANON_KEY: !!process.env.SUPABASE_ANON_KEY,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      },
    });

    if (!url || !key) {
      // Keep client but mark as not configured so uploads throw clear errors later
      // eslint-disable-next-line no-console
      console.warn('[SupabaseService] Missing Supabase URL or Key env vars. Uploads will fail.');
      this.configured = false;
      this.supabase = createClient(url || '', key || '');
      return;
    }

    if (!isServiceRole) {
      // eslint-disable-next-line no-console
      console.warn('[SupabaseService] Non service-role key detected. RLS may block writes.');
    }

    this.supabase = createClient(url, key);
    this.configured = true;
  }

  async uploadFile(file: Express.Multer.File, folder: string, bucketName: string): Promise<string> {
    if (!this.configured) {
      throw new InternalServerErrorException('Supabase storage not configured. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY on the server.');
    }

    // Create a unique file path: folder/timestamp-filename
    const fileName = `${Date.now()}-${file.originalname.replace(/\s/g, '_')}`;
    const filePath = `${folder}/${fileName}`;

    const { data, error } = await this.supabase.storage
      .from(bucketName)
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: true,
      });

    if (error) {
      // eslint-disable-next-line no-console
      console.error('[SupabaseService] Upload error', { bucketName, filePath, error });
      throw new InternalServerErrorException(
        `Upload to ${bucketName} failed: ${error.message}`,
      );
    }

    const { data: publicUrlData } = this.supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);

    return publicUrlData.publicUrl;
  }

  async removeFileByUrl(fileUrl: string): Promise<boolean> {
    try {
      if (!fileUrl) return false;
      // Expect public URL like: https://<supabase>/storage/v1/object/public/<bucket>/<path>
      const url = new URL(fileUrl);
      const parts = url.pathname.split('/').filter(Boolean);
      // find 'object' segment then 'public' then bucket
      const objectIndex = parts.findIndex(p => p === 'object');
      if (objectIndex === -1) {
        // fallback: try last two parts as bucket + path
        const maybeBucket = parts[parts.length - 2];
        const maybePath = parts.slice(parts.length - 1).join('/');
        const { error } = await this.supabase.storage.from(maybeBucket).remove([maybePath]);
        return !error;
      }

      // path after /object/public/<bucket>/<filePath>
      const bucket = parts[objectIndex + 2];
      const filePath = parts.slice(objectIndex + 3).join('/');
      const { error } = await this.supabase.storage.from(bucket).remove([filePath]);
      if (error) {
        // eslint-disable-next-line no-console
        console.error('[SupabaseService] removeFileByUrl error', error);
        return false;
      }
      return true;
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[SupabaseService] removeFileByUrl failed', err);
      return false;
    }
  }
}