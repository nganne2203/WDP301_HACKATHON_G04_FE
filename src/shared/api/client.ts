import { notifySessionExpired } from '@/lib/authEvents';

import type { ApiErrorResponse, ApiSuccessResponse } from './types';

// ============================================================
// API Client Configuration
// ============================================================

function normalizeApiBaseUrl(baseUrl: string): string {
  const trimmed = baseUrl.replace(/\/+$/, '');
  return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
}

export const API_BASE_URL = normalizeApiBaseUrl(import.meta.env.VITE_API_BASE_URL);

// ============================================================
// Token Management
// ============================================================

const TOKEN_KEYS = {
  ACCESS: 'seal_access_token',
  REFRESH: 'seal_refresh_token',
} as const;

export function getAccessToken(): string | null {
  return localStorage.getItem(TOKEN_KEYS.ACCESS);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(TOKEN_KEYS.REFRESH);
}

export function setTokens(accessToken: string, refreshToken: string): void {
  localStorage.setItem(TOKEN_KEYS.ACCESS, accessToken);
  localStorage.setItem(TOKEN_KEYS.REFRESH, refreshToken);
}

export function clearTokens(): void {
  localStorage.removeItem(TOKEN_KEYS.ACCESS);
  localStorage.removeItem(TOKEN_KEYS.REFRESH);
}

// ============================================================
// API Error class
// ============================================================

export class ApiError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly errors: string[];

  constructor(response: ApiErrorResponse, statusCode: number) {
    super(response.message);
    this.name = 'ApiError';
    this.code = response.code;
    this.statusCode = statusCode;
    this.errors = response.errors || [];
  }

  /** Returns the first error detail, or the message */
  get firstError(): string {
    return this.errors[0] || this.message;
  }
}

// ============================================================
// Fetch wrapper
// ============================================================

let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

function subscribeTokenRefresh(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

function onTokenRefreshed(newToken: string) {
  refreshSubscribers.forEach((cb) => cb(newToken));
  refreshSubscribers = [];
}

async function attemptTokenRefresh(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      clearTokens();
      return null;
    }

    const json = (await response.json()) as ApiSuccessResponse<{
      user: unknown;
      tokens: { accessToken: string; refreshToken: string };
    }>;

    const { accessToken, refreshToken: newRefreshToken } = json.data.tokens;
    setTokens(accessToken, newRefreshToken);
    return accessToken;
  } catch {
    clearTokens();
    return null;
  }
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  params?: Record<string, string | number | boolean | Array<string | number | boolean> | undefined | null>;
  /** If false, skip sending auth header. Default true. */
  auth?: boolean;
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {}
): Promise<ApiSuccessResponse<T>> {
  const { body, params, auth = true, headers: extraHeaders, ...fetchOptions } = options;

  // Build URL with query params
  let url = `${API_BASE_URL}${path}`;
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach((item) => {
          if (item !== undefined && item !== null && item !== '') {
            searchParams.append(key, String(item));
          }
        });
        return;
      }

      if (value !== undefined && value !== null && value !== '') {
        searchParams.set(key, String(value));
      }
    });
    const qs = searchParams.toString();
    if (qs) url += `?${qs}`;
  }

  // Build headers
  const headers: Record<string, string> = {
    ...(extraHeaders as Record<string, string>),
  };

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  if (auth) {
    const token = getAccessToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const response = await fetch(url, {
    ...fetchOptions,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  // Handle token expired - try refresh once
  if (response.status === 401 && auth) {
    const errorJson = (await response.clone().json().catch(() => null)) as ApiErrorResponse | null;

    if (errorJson?.code === 'TOKEN_EXPIRED') {
      if (!isRefreshing) {
        isRefreshing = true;
        const newToken = await attemptTokenRefresh();
        isRefreshing = false;

        if (newToken) {
          onTokenRefreshed(newToken);
          // Retry the original request with the new token
          headers['Authorization'] = `Bearer ${newToken}`;
          const retryResponse = await fetch(url, {
            ...fetchOptions,
            headers,
            body: body !== undefined ? JSON.stringify(body) : undefined,
          });

          if (!retryResponse.ok) {
            const retryError = (await retryResponse.json()) as ApiErrorResponse;
            throw new ApiError(retryError, retryResponse.status);
          }

          return (await retryResponse.json()) as ApiSuccessResponse<T>;
        } else {
          // Refresh failed - let React state/router move the user to login.
          clearTokens();
          notifySessionExpired();
          throw new ApiError(
            { success: false, code: 'SESSION_EXPIRED', message: 'Session expired', errors: [] },
            401
          );
        }
      } else {
        // Another request is already refreshing the token, wait for it
        return new Promise<ApiSuccessResponse<T>>((resolve, reject) => {
          subscribeTokenRefresh(async (newToken) => {
            try {
              headers['Authorization'] = `Bearer ${newToken}`;
              const retryResponse = await fetch(url, {
                ...fetchOptions,
                headers,
                body: body !== undefined ? JSON.stringify(body) : undefined,
              });

              if (!retryResponse.ok) {
                const retryError = (await retryResponse.json()) as ApiErrorResponse;
                reject(new ApiError(retryError, retryResponse.status));
                return;
              }

              resolve((await retryResponse.json()) as ApiSuccessResponse<T>);
            } catch (err) {
              reject(err);
            }
          });
        });
      }
    }
  }

  if (!response.ok) {
    const errorJson = (await response.json().catch(() => ({
      success: false,
      code: 'UNKNOWN_ERROR',
      message: 'An unexpected error occurred',
      errors: [],
    }))) as ApiErrorResponse;

    throw new ApiError(errorJson, response.status);
  }

  return (await response.json()) as ApiSuccessResponse<T>;
}

// ============================================================
// Convenience methods
// ============================================================

export const api = {
  get: <T>(path: string, options?: RequestOptions) =>
    apiRequest<T>(path, { ...options, method: 'GET' }),

  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    apiRequest<T>(path, { ...options, method: 'POST', body }),

  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    apiRequest<T>(path, { ...options, method: 'PATCH', body }),

  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    apiRequest<T>(path, { ...options, method: 'PUT', body }),

  delete: <T>(path: string, options?: RequestOptions) =>
    apiRequest<T>(path, { ...options, method: 'DELETE' }),
};

