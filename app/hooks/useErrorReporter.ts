/**
 * @file 前端错误收集 Hook
 * @description 自动收集前端错误并上报到服务器
 * @module hooks/useErrorReporter
 * @author YYC
 * @version 1.0.0
 * @created 2026-02-22
 */

'use client';

import { useEffect, useCallback } from 'react';

interface ErrorReporterOptions {
  enabled?: boolean;
  onError?: (error: Error, context: any) => void;
}

interface ErrorReport {
  message: string;
  code?: string;
  stack?: string;
  details?: any;
  timestamp: string;
  userAgent?: string;
  url?: string;
  userId?: number;
  level: 'error' | 'warn' | 'info';
}

export function useErrorReporter(options: ErrorReporterOptions = {}) {
  const { enabled = true, onError } = options;

  const reportError = useCallback(async (
    error: Error | string,
    details?: any,
    level: 'error' | 'warn' | 'info' = 'error'
  ) => {
    const errorMessage = typeof error === 'string' ? error : error.message;
    const errorStack = error instanceof Error ? error.stack : undefined;

    const report: ErrorReport = {
      message: errorMessage,
      stack: errorStack,
      details,
      timestamp: new Date().toISOString(),
      userAgent: typeof window !== 'undefined' ? navigator.userAgent : undefined,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      level
    };

    if (onError) {
      const err = typeof error === 'string' ? new Error(error) : error;
      onError(err, details);
    }

    if (typeof window !== 'undefined' && enabled) {
      try {
        await fetch('/api/error-report', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(report)
        });
      } catch (e) {
        console.error('Failed to report error:', e);
      }
    }

    if (process.env.NODE_ENV !== 'production') {
      console.error('[Error Reporter]', error, details);
    }
  }, [enabled, onError]);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return undefined;

    const handleGlobalError = (event: ErrorEvent) => {
      reportError(
        new Error(event.message),
        {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        },
        'error'
      );
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const error = event.reason instanceof Error 
        ? event.reason 
        : new Error(String(event.reason));
      
      reportError(error, { type: 'unhandled_rejection' }, 'error');
    };

    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleGlobalError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [enabled, reportError]);

  const reportWarning = useCallback((message: string, details?: any) => {
    return reportError(message, details, 'warn');
  }, [reportError]);

  const reportInfo = useCallback((message: string, details?: any) => {
    return reportError(message, details, 'info');
  }, [reportError]);

  return {
    reportError,
    reportWarning,
    reportInfo
  };
}

export default useErrorReporter;
