// src/storage/storage.module.ts
import { Module, Global } from '@nestjs/common';
import { SupabaseService } from './supabase.service';

@Global() // Make it global so you don't have to import it everywhere
@Module({
  providers: [SupabaseService],
  exports: [SupabaseService],
})
export class StorageModule {}