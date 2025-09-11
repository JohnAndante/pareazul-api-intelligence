// src/repositories/base.repository.ts

import { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '../utils/supabase.util';
import { logger } from '../utils/logger.util';

export interface QueryOptions {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
  filters?: Record<string, any>;
}

export interface QueryResult<T> {
  data: T[];
  count?: number;
  error?: string;
}

export abstract class BaseRepository<T = any> {
  protected client: SupabaseClient;
  protected abstract tableName: string;

  constructor() {
    this.client = supabase;
  }

  /**
   * Buscar todos os registros com opções de filtro
   */
  async findAll(options: QueryOptions = {}): Promise<QueryResult<T>> {
    try {
      let query = this.client.from(this.tableName).select('*', { count: 'exact' });

      // Aplicar filtros
      if (options.filters) {
        Object.entries(options.filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            query = query.eq(key, value);
          }
        });
      }

      // Aplicar ordenação
      if (options.orderBy) {
        query = query.order(options.orderBy, {
          ascending: options.orderDirection !== 'desc',
        });
      }

      // Aplicar limite e offset
      if (options.limit) {
        query = query.limit(options.limit);
      }
      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
      }

      const { data, error, count } = await query;

      if (error) {
        logger.error(`Repository findAll error in ${this.tableName}:`, error);
        return { data: [], error: error.message };
      }

      return { data: data || [], count: count || 0 };
    } catch (error) {
      logger.error(`Repository findAll exception in ${this.tableName}:`, error);
      return { data: [], error: 'Database operation failed' };
    }
  }

  /**
   * Buscar por ID
   */
  async findById(id: string): Promise<T | null> {
    try {
      const { data, error } = await this.client
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        logger.error(`Repository findById error in ${this.tableName}:`, error);
        return null;
      }

      return data;
    } catch (error) {
      logger.error(`Repository findById exception in ${this.tableName}:`, error);
      return null;
    }
  }

  /**
   * Buscar um registro por filtros
   */
  async findOne(filters: Record<string, any>): Promise<T | null> {
    try {
      let query = this.client.from(this.tableName).select('*');

      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query = query.eq(key, value);
        }
      });

      const { data, error } = await query.single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows found
          return null;
        }
        logger.error(`Repository findOne error in ${this.tableName}:`, error);
        return null;
      }

      return data;
    } catch (error) {
      logger.error(`Repository findOne exception in ${this.tableName}:`, error);
      return null;
    }
  }

  /**
   * Criar novo registro
   */
  async create(data: Partial<T>): Promise<T | null> {
    try {
      const { data: result, error } = await this.client
        .from(this.tableName)
        .insert(data)
        .select()
        .single();

      if (error) {
        logger.error(`Repository create error in ${this.tableName}:`, error);
        return null;
      }

      return result;
    } catch (error) {
      logger.error(`Repository create exception in ${this.tableName}:`, error);
      return null;
    }
  }

  /**
   * Atualizar registro por ID
   */
  async update(id: string, data: Partial<T>): Promise<T | null> {
    try {
      const { data: result, error } = await this.client
        .from(this.tableName)
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        logger.error(`Repository update error in ${this.tableName}:`, error);
        return null;
      }

      return result;
    } catch (error) {
      logger.error(`Repository update exception in ${this.tableName}:`, error);
      return null;
    }
  }

  /**
   * Deletar registro por ID
   */
  async delete(id: string): Promise<boolean> {
    try {
      const { error } = await this.client.from(this.tableName).delete().eq('id', id);

      if (error) {
        logger.error(`Repository delete error in ${this.tableName}:`, error);
        return false;
      }

      return true;
    } catch (error) {
      logger.error(`Repository delete exception in ${this.tableName}:`, error);
      return false;
    }
  }

  /**
   * Contar registros com filtros
   */
  async count(filters: Record<string, any> = {}): Promise<number> {
    try {
      let query = this.client.from(this.tableName).select('*', { count: 'exact', head: true });

      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query = query.eq(key, value);
        }
      });

      const { count, error } = await query;

      if (error) {
        logger.error(`Repository count error in ${this.tableName}:`, error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      logger.error(`Repository count exception in ${this.tableName}:`, error);
      return 0;
    }
  }

  /**
   * Verificar se registro existe
   */
  async exists(filters: Record<string, any>): Promise<boolean> {
    const count = await this.count(filters);
    return count > 0;
  }

  /**
   * Operação de upsert (insert ou update)
   */
  async upsert(data: Partial<T>, conflictColumns: string[] = ['id']): Promise<T | null> {
    try {
      const { data: result, error } = await this.client
        .from(this.tableName)
        .upsert(data, { onConflict: conflictColumns.join(',') })
        .select()
        .single();

      if (error) {
        logger.error(`Repository upsert error in ${this.tableName}:`, error);
        return null;
      }

      return result;
    } catch (error) {
      logger.error(`Repository upsert exception in ${this.tableName}:`, error);
      return null;
    }
  }
}
