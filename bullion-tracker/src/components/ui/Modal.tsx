'use client';

import { ReactNode, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button } from './Button';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
}

export function Modal({ isOpen, onClose, title, children, className }: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        style={{ zIndex: 50 }}
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center" style={{ zIndex: 51, pointerEvents: 'none' }}>
        <div
          className={cn(
            'relative bg-background-card rounded-xl shadow-2xl',
            'max-h-[90vh] overflow-y-auto',
            'w-full max-w-2xl m-4',
            'border border-border',
            className
          )}
          style={{ pointerEvents: 'auto' }}
        >
          {/* Header */}
          {title && (
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-2xl font-semibold text-text-primary">{title}</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-text-secondary hover:text-text-primary"
              >
                ✕
              </Button>
            </div>
          )}

          {/* Content */}
          <div className="p-6">{children}</div>
        </div>
      </div>
    </>
  );
}
