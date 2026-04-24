const TOKEN_KEY = 'rm_token';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_KEY, token);
  document.cookie = `${TOKEN_KEY}=${token}; path=/; SameSite=Lax; Max-Age=604800`;
}

export function clearToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
  document.cookie = `${TOKEN_KEY}=; path=/; SameSite=Lax; Max-Age=0`;
}

interface JWTPayload {
  id: string;
  email: string;
  full_name: string;
  role: string;
}

export function getUser(): JWTPayload | null {
  const token = getToken();
  if (!token) return null;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = parts[1];
    // Pad base64 string to a multiple of 4
    const padded = payload + '='.repeat((4 - (payload.length % 4)) % 4);
    const decoded = JSON.parse(atob(padded));
    return {
      id: decoded.id ?? decoded.sub ?? '',
      email: decoded.email ?? '',
      full_name: decoded.full_name ?? '',
      role: decoded.role ?? 'user',
    };
  } catch {
    return null;
  }
}

export function isAdmin(): boolean {
  return getUser()?.role === 'admin';
}
