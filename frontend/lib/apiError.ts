import type { AxiosError } from 'axios';
import type { ToastContextValue } from '@/components/ui/Toast';

interface ToastShape {
  error: ToastContextValue['error'];
}

interface HandleApiErrorOptions {
  silent401?: boolean;
  fallback?: string;
}

export function handleApiError(
  error: unknown,
  toast: ToastShape,
  options: HandleApiErrorOptions = {}
): void {
  const err = error as AxiosError<{ detail?: string }>;
  const status = err.response?.status;

  if (!err.response) {
    toast.error('Unable to connect to server');
    return;
  }

  switch (status) {
    case 401:
      if (!options.silent401) {
        toast.error('Session expired — please log in again');
      }
      return;
    case 403:
      toast.error('Access denied');
      return;
    case 404:
      toast.error('Resource not found');
      return;
    case 500:
    case 502:
    case 503:
    case 504:
      toast.error('Server error — please try again');
      return;
    default: {
      const detail = err.response?.data?.detail;
      toast.error(detail ?? options.fallback ?? 'Request failed');
    }
  }
}
