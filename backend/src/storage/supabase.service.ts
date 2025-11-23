// src/storage/supabase.service.ts
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private supabase: SupabaseClient;

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
      console.warn('[SupabaseService] Missing Supabase URL or Key env vars. Uploads will fail.');
    } else if (!isServiceRole) {
      console.warn('[SupabaseService] Non service-role key detected. RLS may block writes.');
    }
    this.supabase = createClient(url, key);
  }

  async uploadFile(file: Express.Multer.File, folder: string, bucketName: string): Promise<string> {
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
}