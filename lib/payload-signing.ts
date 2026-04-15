/**
 * Payload Signing
 * 
 * HMAC signing for sensitive API requests to ensure integrity.
 * Used for bursary, payroll, and other financial operations.
 */

const getSecret = (): string => {
    const secret = process.env.PAYLOAD_SIGNING_SECRET;
    if (!secret) {
        return '';
    }
    return secret;
};

export function signPayload(payload: string): string {
    const secret = getSecret();
    if (!secret) return '';
    
    const crypto = require('crypto');
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(payload);
    return hmac.digest('hex');
}

export function verifySignature(payload: string, signature: string): boolean {
    const secret = getSecret();
    if (!secret || !signature) return false;
    
    const expected = signPayload(payload);
    if (!expected) return false;
    
    try {
        const crypto = require('crypto');
        const sigBuffer = Buffer.from(signature, 'hex');
        const expBuffer = Buffer.from(expected, 'hex');
        return crypto.timingSafeEqual(sigBuffer, expBuffer);
    } catch {
        return false;
    }
}

export const SENSITIVE_ENDPOINTS = [
    'bursary/payments',
    'bursary/salary',
    'users/staff',
    'admin/impersonate',
];

export function requiresSigning(path: string): boolean {
    return SENSITIVE_ENDPOINTS.some(endpoint => path.includes(endpoint));
}