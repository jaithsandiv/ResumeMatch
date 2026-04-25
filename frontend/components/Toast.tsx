'use client';

import { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react';
import { X } from 'lucide-react';

type ToastType = 'success' | 'error';

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  success: (message: string) => void;
  error: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue>({
  success: () => {},
  error: () => {},
});

export function useToast() {
  return useContext(ToastContext);
}

let _nextId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const add = useCallback(
    (message: string, type: ToastType) => {
      const id = ++_nextId;
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => dismiss(id), 4000);
    },
    [dismiss]
  );

  const value = useMemo<ToastContextValue>(
    () => ({
      success: (message) => add(message, 'success'),
      error: (message) => add(message, 'error'),
    }),
    [add]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={[
              'pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-lg border shadow-xl',
              'bg-bg-elevated text-text-primary text-sm font-sans min-w-[16rem] max-w-sm',
              t.type === 'success' ? 'border-[#00E5A0]/30' : 'border-[#F06060]/30',
            ].join(' ')}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                t.type === 'success' ? 'bg-accent-green' : 'bg-accent-red'
              }`}
            />
            <span className="flex-1">{t.message}</span>
            <button
              onClick={() => dismiss(t.id)}
              className="text-text-muted hover:text-text-secondary transition-colors shrink-0"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
