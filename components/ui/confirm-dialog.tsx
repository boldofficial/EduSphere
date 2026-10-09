'use client';

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AlertTriangle, Info } from 'lucide-react';
import { Button } from './button';

export interface ConfirmOptions {
  title: string;
  description?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Destructive actions get a red confirm button and a warning icon. */
  tone?: 'danger' | 'default';
}

type ConfirmFn = (options: ConfirmOptions | string) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

/**
 * Promise-based replacement for window.confirm:
 *   const confirm = useConfirm();
 *   if (!(await confirm({ title: 'Delete student?', tone: 'danger' }))) return;
 *   if (!(await confirm('Mark this ticket as resolved?'))) return;
 */
export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be used within a ConfirmProvider');
  return ctx;
}

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const resolver = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback<ConfirmFn>((opts) => {
    setOptions(typeof opts === 'string' ? { title: opts } : opts);
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  const close = useCallback((result: boolean) => {
    resolver.current?.(result);
    resolver.current = null;
    setOptions(null);
  }, []);

  useEffect(() => {
    if (!options) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [options, close]);

  const danger = options?.tone === 'danger';

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {options && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onClick={() => close(false)}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-dialog-title"
            className="w-full max-w-md rounded-card bg-white p-6 shadow-raised"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex gap-4">
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                  danger ? 'bg-danger-50 text-danger-600' : 'bg-brand-50 text-brand-600'
                }`}
              >
                {danger ? <AlertTriangle className="h-5 w-5" /> : <Info className="h-5 w-5" />}
              </span>
              <div className="min-w-0">
                <h2 id="confirm-dialog-title" className="text-base font-semibold text-gray-900">
                  {options.title}
                </h2>
                {options.description && (
                  <div className="mt-1 text-sm text-gray-600">{options.description}</div>
                )}
              </div>
            </div>
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button variant="secondary" onClick={() => close(false)}>
                {options.cancelLabel || 'Cancel'}
              </Button>
              <Button variant={danger ? 'danger' : 'primary'} onClick={() => close(true)} autoFocus>
                {options.confirmLabel || (danger ? 'Delete' : 'Confirm')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}
