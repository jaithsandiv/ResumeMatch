'use client';

import { createContext, useCallback, useMemo, useState, ReactNode } from 'react';
import { CheckCircle2, XCircle, Info, AlertTriangle, X } from 'lucide-react';

export type ToastVariant = 'success' | 'error' | 'info' | 'warning';

export interface ToastItem {
  id: number;
  message: string;
  variant: ToastVariant;
}

export interface ToastContextValue {
  push: (message: string, variant: ToastVariant) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
  warning: (message: string) => void;
}

export const ToastContext = createContext<ToastContextValue | null>(null);

const VARIANT_CLASS: Record<ToastVariant, string> = {
  success: 'border-accent-green/40 shadow-glow-green',
  error: 'border-accent-red/40',
  info: 'border-accent-blue/40 shadow-glow-blue',
  warning: 'border-accent-amber/40',
};

const VARIANT_ICON_COLOR: Record<ToastVariant, string> = {
  success: 'text-accent-green',
  error: 'text-accent-red',
  info: 'text-accent-blue',
  warning: 'text-accent-amber',
};

const VARIANT_ICON: Record<ToastVariant, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
  warning: AlertTriangle,
};

let _nextId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (message: string, variant: ToastVariant) => {
      const id = ++_nextId;
      setToasts((prev) => [...prev, { id, message, variant }]);
      setTimeout(() => dismiss(id), 3500);
    },
    [dismiss]
  );

  const value = useMemo<ToastContextValue>(
    () => ({
      push,
      success: (m) => push(m, 'success'),
      error: (m) => push(m, 'error'),
      info: (m) => push(m, 'info'),
      warning: (m) => push(m, 'warning'),
    }),
    [push]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 pointer-events-none max-w-[calc(100vw-2.5rem)]">
        {toasts.map((t) => {
          const Icon = VARIANT_ICON[t.variant];
          return (
            <div
              key={t.id}
              role="status"
              className={`pointer-events-auto flex items-start gap-3 glass-surface border rounded-xl px-4 py-3 text-sm shadow-elevated min-w-[18rem] max-w-md animate-fade-in-up ${VARIANT_CLASS[t.variant]}`}
            >
              <Icon className={`w-4.5 h-4.5 shrink-0 mt-px ${VARIANT_ICON_COLOR[t.variant]}`} />
              <span className="flex-1 text-text-primary leading-snug">{t.message}</span>
              <button
                aria-label="Dismiss"
                onClick={() => dismiss(t.id)}
                className="text-text-muted hover:text-text-primary transition-colors shrink-0 mt-px -mr-1 p-0.5 rounded hover:bg-bg-elevated"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
