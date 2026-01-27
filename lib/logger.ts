/**
 * Production-Safe Logger
 * 
 * Centralized logging utility that:
 * - Only logs in development
 * - Prevents sensitive data from leaking to production logs
 * - Provides structured logging for error tracking
 */

const isDev = process.env.NODE_ENV === 'development';

interface LogContext {
    [key: string]: any;
}

/**
 * Log info messages (development only)
 */
export function logInfo(message: string, context?: LogContext): void {
    if (isDev) {
        console.log(`[INFO] ${message}`, context ? context : '');
    }
}

/**
 * Log debug messages (development only)
 */
export function logDebug(message: string, context?: LogContext): void {
    if (isDev) {
        console.log(`[DEBUG] ${message}`, context ? context : '');
    }
}

/**
 * Log warning messages (always, but sanitized in production)
 */
export function logWarn(message: string, context?: LogContext): void {
    const sanitized = isDev ? context : sanitizeContext(context);
    console.warn(`[WARN] ${message}`, sanitized ? sanitized : '');
}

/**
 * Log error messages (always, but sanitized in production)
 * For production, consider integrating with error tracking service (Sentry, etc.)
 */
export function logError(message: string, error?: Error | unknown, context?: LogContext): void {
    const sanitized = isDev ? context : sanitizeContext(context);
    
    // In production, you could send to error tracking service here
    // e.g., Sentry.captureException(error, { extra: sanitized });
    
    console.error(`[ERROR] ${message}`, {
        error: error instanceof Error ? {
            message: error.message,
            stack: isDev ? error.stack : undefined,
            name: error.name
        } : error,
        ...sanitized
    });
}

/**
 * Remove sensitive fields from context before logging
 */
function sanitizeContext(context?: LogContext): LogContext | undefined {
    if (!context) return undefined;
    
    const sensitiveFields = [
        'password', 'password_hash', 'token', 'secret', 
        'authorization', 'cookie', 'session', 'api_key',
        'access_token', 'refresh_token', 'service_role_key'
    ];
    
    const sanitized: LogContext = {};
    
    for (const [key, value] of Object.entries(context)) {
        const lowerKey = key.toLowerCase();
        if (sensitiveFields.some(field => lowerKey.includes(field))) {
            sanitized[key] = '[REDACTED]';
        } else if (typeof value === 'object' && value !== null) {
            sanitized[key] = sanitizeContext(value as LogContext);
        } else {
            sanitized[key] = value;
        }
    }
    
    return sanitized;
}

/**
 * API route logger - logs request metadata
 */
export function logApiRequest(
    method: string, 
    path: string, 
    status: number, 
    duration?: number
): void {
    if (isDev) {
        console.log(`[API] ${method} ${path} - ${status} ${duration ? `(${duration}ms)` : ''}`);
    }
}
