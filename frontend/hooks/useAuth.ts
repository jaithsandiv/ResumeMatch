import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { setToken, clearToken, getUser } from '@/lib/auth';

interface AuthUser {
  id: string;
  email: string;
  full_name: string;
  role: string;
}

export function useAuth() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(() => getUser());

  async function login(email: string, password: string): Promise<void> {
    setError(null);
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      setToken(data.access_token);
      setUser(getUser());
      router.push('/profile');
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      const message = detail ?? 'Login failed';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }

  async function register(name: string, email: string, password: string): Promise<void> {
    setError(null);
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', { name, email, password });
      setToken(data.access_token);
      setUser(getUser());
      router.push('/profile');
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      const message = detail ?? 'Registration failed';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }

  function logout(): void {
    clearToken();
    setUser(null);
    router.push('/auth/login');
  }

  return { login, register, logout, user, loading, error };
}
