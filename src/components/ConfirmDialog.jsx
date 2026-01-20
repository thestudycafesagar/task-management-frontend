'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { FiX, FiAlertTriangle } from 'react-icons/fi';
import { Button } from '@/components/ui/button';

/**
 * Confirm dialog component with modern styling
 */
export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  description,
  message, // Support both props
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger', // 'danger' or 'primary'
  isLoading = false,
}) {
  if (!isOpen) return null;

  const content = message || description; // Use message if provided, fallback to description

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={!isLoading ? onClose : undefined}
      />

      {/* Dialog */}
      <div className="relative bg-card rounded-xl shadow-float border border-border max-w-md w-full animate-fadeIn">
        {/* Header */}
        <div className="flex items-start justify-between p-6 pb-4">
          <div className="flex items-center gap-3">
            {variant === 'danger' && (
              <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                <FiAlertTriangle className="w-5 h-5 text-destructive" />
              </div>
            )}
            <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50 p-1 rounded-lg hover:bg-accent"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {content && (
          <div className="px-6 pb-6">
            <p className="text-muted-foreground">{content}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 px-6 pb-6">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1"
          >
            {cancelText}
          </Button>
          <Button
            variant={variant === 'danger' ? 'destructive' : 'default'}
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              confirmText
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
