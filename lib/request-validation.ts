/**
 * Request Validation
 * 
 * Basic validation for API requests before forwarding to Django.
 */

const MAX_STRING_LENGTH = 1000;

function isValidString(value: unknown): value is string {
    return typeof value === 'string' && value.length <= MAX_STRING_LENGTH;
}

function isValidNumber(value: unknown): value is number {
    return typeof value === 'number' && !isNaN(value) && isFinite(value);
}

export function validateRequestBody(endpoint: string, body: unknown): { success: true; data: unknown } | { success: false; error: string } {
    if (!body || typeof body !== 'object') {
        return { success: false, error: 'Request body must be an object' };
    }
    
    const obj = body as Record<string, unknown>;
    
    if (endpoint.includes('auth/login')) {
        if (!isValidString(obj.username)) return { success: false, error: 'Invalid username' };
        if (!isValidString(obj.password)) return { success: false, error: 'Invalid password' };
    }
    
    if (endpoint.includes('students')) {
        if (obj.first_name !== undefined && !isValidString(obj.first_name)) return { success: false, error: 'Invalid first_name' };
        if (obj.last_name !== undefined && !isValidString(obj.last_name)) return { success: false, error: 'Invalid last_name' };
        if (obj.email !== undefined && obj.email !== '' && !isValidString(obj.email)) return { success: false, error: 'Invalid email' };
    }
    
    if (endpoint.includes('fees') || endpoint.includes('payments')) {
        if (obj.amount !== undefined && !isValidNumber(obj.amount)) return { success: false, error: 'Invalid amount' };
        if (obj.class_id !== undefined && !isValidString(obj.class_id)) return { success: false, error: 'Invalid class_id' };
    }
    
    if (endpoint.includes('scores') || endpoint.includes('attendance')) {
        if (obj.records !== undefined && !Array.isArray(obj.records)) return { success: false, error: 'Invalid records' };
    }
    
    return { success: true, data: body };
}