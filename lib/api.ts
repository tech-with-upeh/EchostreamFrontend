const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL?.replace(/\/$/, '');

if (!BACKEND_URL) {
  console.warn('EXPO_PUBLIC_BACKEND_URL is not configured. Add it to your .env file.');
}

export type TokenResponse = {
  access_token: string;
  refresh_token: string;
  token_type?: string;
};

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  if (!BACKEND_URL) {
    throw new ApiError('Backend URL is not configured.', 0);
  }

  let response: Response;

  try {
    response = await fetch(`${BACKEND_URL}${path}`, {
      ...options,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...(options.headers ?? {}),
      },
    });
  } catch {
    throw new ApiError('Unable to reach EchoStream. Check your internet connection.', 0);
  }

  const contentType = response.headers.get('content-type') ?? '';
  const body = contentType.includes('application/json')
    ? await response.json().catch(() => null)
    : await response.text().catch(() => '');

  if (!response.ok) {
    const detail =
      body && typeof body === 'object' && 'detail' in body
        ? String((body as { detail?: unknown }).detail)
        : typeof body === 'string' && body
          ? body
          : 'Something went wrong. Please try again.';

    throw new ApiError(detail, response.status);
  }

  return body as T;
}

export function login(email: string, password: string) {
  return request<TokenResponse>('/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}
