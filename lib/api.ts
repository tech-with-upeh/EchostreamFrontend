import * as SecureStore from 'expo-secure-store';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL?.replace(/\/$/, '');
const ACCESS_TOKEN_KEY = 'echostream.access_token';
const REFRESH_TOKEN_KEY = 'echostream.refresh_token';

if (!BACKEND_URL) console.warn('EXPO_PUBLIC_BACKEND_URL is not configured. Add it to your .env file.');

export type TokenResponse = { access_token: string; refresh_token: string; token_type?: string };
export type RegisterResponse = Record<string, unknown>;

let accessToken: string | null = null;
let refreshToken: string | null = null;
let refreshPromise: Promise<TokenResponse> | null = null;

export function setAuthTokens(tokens: TokenResponse) {
  accessToken = tokens.access_token;
  refreshToken = tokens.refresh_token;
}

export async function persistAuthTokens(tokens: TokenResponse) {
  setAuthTokens(tokens);
  await Promise.all([
    SecureStore.setItemAsync(ACCESS_TOKEN_KEY, tokens.access_token),
    SecureStore.setItemAsync(REFRESH_TOKEN_KEY, tokens.refresh_token),
  ]);
}

export async function restoreAuthSession(): Promise<boolean> {
  try {
    const [storedAccess, storedRefresh] = await Promise.all([
      SecureStore.getItemAsync(ACCESS_TOKEN_KEY),
      SecureStore.getItemAsync(REFRESH_TOKEN_KEY),
    ]);
    if (!storedRefresh) return false;

    if (storedAccess) setAuthTokens({ access_token: storedAccess, refresh_token: storedRefresh });

    if (storedAccess) {
      try {
        await request('/users/me');
        return true;
      } catch (error) {
        if (!(error instanceof ApiError) || error.status !== 401) throw error;
      }
    }

    try {
      const tokens = await refreshSession(storedRefresh);
      await persistAuthTokens(tokens);
      return true;
    } catch {
      await clearPersistedAuthTokens();
      return false;
    }
  } catch {
    await clearPersistedAuthTokens();
    return false;
  }
}

export function getAccessToken() { return accessToken; }
export function getRefreshToken() { return refreshToken; }

export async function clearPersistedAuthTokens() {
  accessToken = null;
  refreshToken = null;
  await Promise.all([
    SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
    SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
  ]);
}

export function clearAuthTokens() {
  void clearPersistedAuthTokens();
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) { super(message); this.name = 'ApiError'; this.status = status; }
}

async function rawRequest<T>(path: string, options: RequestInit = {}, token?: string | null): Promise<T> {
  if (!BACKEND_URL) throw new ApiError('Backend URL is not configured.', 0);
  let response: Response;
  try {
    response = await fetch(`${BACKEND_URL}${path}`, {
      ...options,
      headers: { Accept: 'application/json', 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(options.headers ?? {}) },
    });
  } catch { throw new ApiError('Unable to reach EchoStream. Check your internet connection.', 0); }
  const contentType = response.headers.get('content-type') ?? '';
  const body = contentType.includes('application/json') ? await response.json().catch(() => null) : await response.text().catch(() => '');
  if (!response.ok) {
    const detail = body && typeof body === 'object' && 'detail' in body ? String((body as { detail?: unknown }).detail) : typeof body === 'string' && body ? body : 'Something went wrong. Please try again.';
    throw new ApiError(detail, response.status);
  }
  return body as T;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  try {
    return await rawRequest<T>(path, options, accessToken);
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 401 || !refreshToken || path === '/refresh' || path === '/login') throw error;
    if (!refreshPromise) {
      refreshPromise = refreshSession(refreshToken).finally(() => { refreshPromise = null; });
    }
    try {
      const tokens = await refreshPromise;
      await persistAuthTokens(tokens);
      return await rawRequest<T>(path, options, accessToken);
    } catch (refreshError) {
      await clearPersistedAuthTokens();
      throw refreshError;
    }
  }
}

export function login(email: string, password: string) { return request<TokenResponse>('/login', { method: 'POST', body: JSON.stringify({ email, password }) }); }

export function register(first_name: string, last_name: string, email: string, password: string) {
  return request<RegisterResponse>('/register', { method: 'POST', body: JSON.stringify({ first_name, last_name, email, password }) });
}

export function verifyEmailCode(email: string, code: string) {
  return request<TokenResponse & { status: string; message: string }>('/verify-email-code', { method: 'POST', body: JSON.stringify({ email, code }) });
}

export function resendVerification(email: string) {
  return request<{ status: string; message: string }>('/resend-verification', { method: 'POST', body: JSON.stringify({ email }) });
}

export function refreshSession(token: string) {
  return rawRequest<TokenResponse>('/refresh', { method: 'POST', body: JSON.stringify({ refresh_token: token }) }, null);
}

export function logout() {
  return request<{ status: string; message: string }>('/logout', { method: 'POST' });
}
