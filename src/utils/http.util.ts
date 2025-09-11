// src/utils/http.util.ts

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { logger } from './logger.util';

export interface HttpClientConfig {
  baseURL?: string;
  timeout?: number;
  headers?: Record<string, string>;
  retries?: number;
  retryDelay?: number;
}

export class HttpUtil {
  private client: AxiosInstance;
  private retries: number;
  private retryDelay: number;

  constructor(config: HttpClientConfig = {}) {
    this.retries = config.retries || 3;
    this.retryDelay = config.retryDelay || 1000;

    this.client = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Pareazul-Assistant-Server/1.0',
        ...config.headers,
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.client.interceptors.request.use(
      config => {
        logger.debug(`HTTP Request: ${config.method?.toUpperCase()} ${config.url}`, {
          headers: config.headers,
          data: config.data,
        });
        return config;
      },
      error => {
        logger.error('HTTP Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      response => {
        logger.debug(`HTTP Response: ${response.status} ${response.config.url}`, {
          status: response.status,
          headers: response.headers,
          data: response.data,
        });
        return response;
      },
      async error => {
        const config = error.config;

        // Retry logic
        if (config && !config._retry && this.shouldRetry(error)) {
          config._retry = true;
          config._retryCount = (config._retryCount || 0) + 1;

          if (config._retryCount <= this.retries) {
            logger.warn(
              `HTTP Retry attempt ${config._retryCount}/${this.retries} for ${config.url}`
            );

            await this.delay(this.retryDelay * config._retryCount);
            return this.client(config);
          }
        }

        logger.error('HTTP Response Error:', {
          url: error.config?.url,
          method: error.config?.method,
          status: error.response?.status,
          message: error.message,
          data: error.response?.data,
        });

        return Promise.reject(error);
      }
    );
  }

  private shouldRetry(error: any): boolean {
    // Retry on network errors or 5xx status codes
    return (
      !error.response ||
      error.code === 'ECONNRESET' ||
      error.code === 'ENOTFOUND' ||
      error.code === 'ECONNREFUSED' ||
      (error.response.status >= 500 && error.response.status < 600)
    );
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // HTTP Methods
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.get(url, config);
  }

  async post<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> {
    return this.client.post(url, data, config);
  }

  async put<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> {
    return this.client.put(url, data, config);
  }

  async patch<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> {
    return this.client.patch(url, data, config);
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.delete(url, config);
  }

  // Utility methods
  setAuthToken(token: string): void {
    this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  setApiKey(key: string, headerName: string = 'X-API-Key'): void {
    this.client.defaults.headers.common[headerName] = key;
  }

  removeAuth(): void {
    delete this.client.defaults.headers.common['Authorization'];
  }
}

// Default instance for general use
export const httpClient = new HttpUtil();

// Factory for creating specialized clients
export const createHttpClient = (config: HttpClientConfig): HttpUtil => {
  return new HttpUtil(config);
};
