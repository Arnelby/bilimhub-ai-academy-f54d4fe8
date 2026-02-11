// Shared input validation utilities for edge functions

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export function validationError(message: string): Response {
  return new Response(JSON.stringify({ error: message }), {
    status: 400,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

export function validateString(value: unknown, fieldName: string, maxLength = 5000): string | null {
  if (value === undefined || value === null) return null;
  if (typeof value !== 'string') return null;
  return value.slice(0, maxLength);
}

export function requireString(value: unknown, fieldName: string, maxLength = 5000): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${fieldName} is required and must be a non-empty string`);
  }
  return value.slice(0, maxLength);
}

export function validateLanguage(value: unknown): 'ru' | 'kg' | 'en' {
  if (value === 'ru' || value === 'kg' || value === 'en') return value;
  return 'ru';
}

export function validateNumber(value: unknown, fallback: number, min?: number, max?: number): number {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  if (min !== undefined && n < min) return min;
  if (max !== undefined && n > max) return max;
  return n;
}

export function validateMessages(messages: unknown, maxCount = 50, maxContentLength = 8000): Array<{ role: string; content: string }> {
  if (!Array.isArray(messages)) throw new Error('messages must be an array');
  if (messages.length === 0) throw new Error('messages must not be empty');
  if (messages.length > maxCount) throw new Error(`messages must not exceed ${maxCount} items`);
  
  return messages.map((msg, i) => {
    if (!msg || typeof msg !== 'object') throw new Error(`messages[${i}] must be an object`);
    const role = typeof msg.role === 'string' ? msg.role : 'user';
    if (!['user', 'assistant', 'system'].includes(role)) throw new Error(`messages[${i}].role must be user, assistant, or system`);
    const content = typeof msg.content === 'string' ? msg.content.slice(0, maxContentLength) : '';
    if (!content) throw new Error(`messages[${i}].content must be a non-empty string`);
    return { role, content };
  });
}

export function validateUUID(value: unknown, fieldName: string): string {
  if (typeof value !== 'string') throw new Error(`${fieldName} must be a string`);
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(value)) throw new Error(`${fieldName} must be a valid UUID`);
  return value;
}

export function validateArray(value: unknown, fieldName: string, maxLength = 100): unknown[] {
  if (!Array.isArray(value)) return [];
  return value.slice(0, maxLength);
}

export function validateObject(value: unknown, fieldName: string): Record<string, unknown> {
  if (value && typeof value === 'object' && !Array.isArray(value)) return value as Record<string, unknown>;
  return {};
}
