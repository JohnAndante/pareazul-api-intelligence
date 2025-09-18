// src/repositories/base.repository.ts

import { supabase, supabaseAdmin } from '../config/database.config';
import { logger } from '../utils/logger.util';

export abstract class BaseRepository<T> {
    protected tableName: string;
    protected useAdmin: boolean;

    constructor(tableName: string, useAdmin: boolean = false) {
        this.tableName = tableName;
        this.useAdmin = useAdmin;
    }

    protected get client() {
        if (this.useAdmin && !supabaseAdmin) {
            throw new Error('Supabase admin client not configured');
        }
        return this.useAdmin ? supabaseAdmin! : supabase;
    }

    async findById(id: number): Promise<T | null> {
        try {
            const { data, error } = await this.client
                .from(this.tableName)
                .select('*')
                .eq('id', id)
                .single();

            if (error) {
                logger.error(`Error finding ${this.tableName} by id:`, error);
                return null;
            }

            return data as T;
        } catch (error) {
            logger.error(`Exception finding ${this.tableName} by id:`, error);
            return null;
        }
    }

    async findBy(filters: Record<string, unknown>): Promise<T[]> {
        try {
            let query = this.client.from(this.tableName).select('*');

            Object.entries(filters).forEach(([key, value]) => {
                query = query.eq(key, value);
            });

            const { data, error } = await query;

            if (error) {
                logger.error(`Error finding ${this.tableName} by filters:`, error);
                return [];
            }

            return data as T[];
        } catch (error) {
            logger.error(`Exception finding ${this.tableName} by filters:`, error);
            return [];
        }
    }

    async create(data: Partial<T>): Promise<T | null> {
        try {
            const { data: result, error } = await this.client
                .from(this.tableName)
                .insert(data)
                .select()
                .single();

            if (error) {
                logger.error(`Error creating ${this.tableName}:`, error);
                return null;
            }

            return result as T;
        } catch (error) {
            logger.error(`Exception creating ${this.tableName}:`, error);
            return null;
        }
    }

    async update(id: number, data: Partial<T>): Promise<T | null> {
        try {
            const { data: result, error } = await this.client
                .from(this.tableName)
                .update(data)
                .eq('id', id)
                .select()
                .single();

            if (error) {
                logger.error(`Error updating ${this.tableName}:`, error);
                return null;
            }

            return result as T;
        } catch (error) {
            logger.error(`Exception updating ${this.tableName}:`, error);
            return null;
        }
    }

    async delete(id: number): Promise<boolean> {
        try {
            const { error } = await this.client
                .from(this.tableName)
                .delete()
                .eq('id', id);

            if (error) {
                logger.error(`Error deleting ${this.tableName}:`, error);
                return false;
            }

            return true;
        } catch (error) {
            logger.error(`Exception deleting ${this.tableName}:`, error);
            return false;
        }
    }
}
