// src/utils/supabase.util.ts

import { supabase, supabaseAdmin } from '../config/database.config';
import { logger } from './logger.util';

export class SupabaseUtil {
  static async testConnection(): Promise<boolean> {
    try {
      const { data, error } = await supabase.from('assistant_chat_details').select('id').limit(1);
      if (error) {
        logger.error('Supabase connection test failed:', error);
        return false;
      }
      logger.info('Supabase connection successful');
      return true;
    } catch (error) {
      logger.error('Supabase connection error:', error);
      return false;
    }
  }

  static getClient(useAdmin = false) {
    if (useAdmin && supabaseAdmin) {
      return supabaseAdmin;
    }
    return supabase;
  }
}

export { supabase, supabaseAdmin };
