// API client. Auth lives in httpOnly cookies set by the backend, so no token
// is ever read or stored here. Writes carry the CSRF token, and an expired
// access token is refreshed once, transparently.

const BASE = '/api';
const CSRF_COOKIE = 'csrf_token';
const UNSAFE = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

export class ApiError extends Error {
  constructor(message, { status, code, details } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

function readCookie(name) {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

async function csrfToken() {
  let token = readCookie(CSRF_COOKIE);
  if (!token) {
    // Any API response sets the cookie; this endpoint exists just for that
    await fetch(`${BASE}/auth/csrf`, { credentials: 'include' });
    token = readCookie(CSRF_COOKIE);
  }
  return token;
}

async function send(method, path, body) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (UNSAFE.has(method)) headers['X-CSRF-Token'] = (await csrfToken()) ?? '';
  return fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    credentials: 'include',
  });
}

async function parse(res) {
  const data = await res.json().catch(() => null);
  if (res.ok) return data;
  const error = data?.error ?? {};
  throw new ApiError(error.message || data?.message || 'Request failed', {
    status: res.status,
    code: error.code,
    details: error.details,
  });
}

// One refresh at a time, shared by every request that hit an expired token
let refreshing = null;

export function refreshSession() {
  refreshing ??= send('POST', '/auth/refresh')
    .then(async (res) => {
      if (res.ok) return true;
      const data = await res.json().catch(() => null);
      // Another tab rotated the cookie a moment ago; the new one is already ours
      return data?.error?.code === 'REFRESH_RACE';
    })
    .catch(() => false)
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
}

async function request(method, path, body) {
  let res = await send(method, path, body);

  if (res.status === 401 && !path.startsWith('/auth/refresh')) {
    const data = await res.clone().json().catch(() => null);
    if (data?.error?.code === 'AUTH_TOKEN_EXPIRED' && (await refreshSession())) {
      res = await send(method, path, body);
    }
  }

  // A protected call that still fails means the session is gone. Auth
  // endpoints report their own errors (wrong password etc.).
  if (res.status === 401 && !path.startsWith('/auth/')) {
    window.dispatchEvent(new CustomEvent('auth:unauthorized'));
  }
  return parse(res);
}

export const get = (path) => request('GET', path);
export const post = (path, body = {}) => request('POST', path, body);
export const put = (path, body = {}) => request('PUT', path, body);
export const patch = (path, body = {}) => request('PATCH', path, body);
export const del = (path) => request('DELETE', path);
