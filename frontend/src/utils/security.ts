/**
 * Utilities for enhancing security in the frontend
 */

/**
 * Sanitize user input to prevent XSS attacks
 * @param input The string input to sanitize
 * @returns Sanitized string
 */
export const sanitizeInput = (input: string): string => {
  if (!input) return input;
  
  // Basic sanitization - replace potentially harmful characters
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .trim();
};

/**
 * Recursively sanitize an object's string properties
 * @param obj Object to sanitize
 * @returns Sanitized object
 */
export const sanitizeObject = <T extends Record<string, any>>(obj: T): T => {
  const result = {} as T;
  
  Object.keys(obj).forEach(key => {
    const value = obj[key];
    
    if (typeof value === 'string') {
      result[key as keyof T] = sanitizeInput(value) as any;
    } else if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      result[key as keyof T] = sanitizeObject(value);
    } else {
      result[key as keyof T] = value;
    }
  });
  
  return result;
};

/**
 * Create a Content Security Policy object for HTTP headers
 */
export const createCSP = (options: {
  allowedImageSources?: string[];
  allowedConnectSources?: string[];
  allowedStyleSources?: string[];
  allowedScriptSources?: string[];
} = {}): string => {
  const {
    allowedImageSources = [],
    allowedConnectSources = [],
    allowedStyleSources = [],
    allowedScriptSources = []
  } = options;

  // Base sources that are always allowed
  const defaultImageSources = ["'self'", 'data:'];
  const defaultConnectSources = ["'self'"];
  const defaultStyleSources = ["'self'", "'unsafe-inline'"];
  const defaultScriptSources = ["'self'"];

  // Add Cloudinary as a default image source
  if (!allowedImageSources.includes('*.cloudinary.com')) {
    allowedImageSources.push('*.cloudinary.com');
  }

  // Create the CSP directives
  const directives = [
    `default-src 'self'`,
    `img-src ${[...defaultImageSources, ...allowedImageSources].join(' ')}`,
    `connect-src ${[...defaultConnectSources, ...allowedConnectSources].join(' ')}`,
    `style-src ${[...defaultStyleSources, ...allowedStyleSources].join(' ')}`,
    `script-src ${[...defaultScriptSources, ...allowedScriptSources].join(' ')}`,
    `font-src 'self' data:`,
    `object-src 'none'`,
    `media-src 'self'`,
    `frame-src 'self'`
  ];

  return directives.join('; ');
};

/**
 * Common security headers for React applications
 */
export const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin'
};

/**
 * Helper for consistent token storage
 */
export const tokenStorage = {
  getToken: (): string | null => {
    return localStorage.getItem('token');
  },
  
  setToken: (token: string): void => {
    localStorage.setItem('token', token);
  },
  
  removeToken: (): void => {
    localStorage.removeItem('token');
  },
  
  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('token');
  }
};

/**
 * Validate that a URL is safe (prevents javascript: URLs)
 * @param url URL to validate
 * @returns True if URL is safe
 */
export const isSafeUrl = (url: string): boolean => {
  if (!url) return false;
  
  try {
    const parsedUrl = new URL(url);
    return ['http:', 'https:'].includes(parsedUrl.protocol);
  } catch (error) {
    // If URL is invalid, assume it's a relative path and safe
    return !url.startsWith('javascript:') && !url.startsWith('data:');
  }
};

/**
 * Safely parse JSON with error handling
 * @param jsonString JSON string to parse
 * @param fallback Fallback value if parsing fails
 * @returns Parsed object or fallback
 */
export const safeJSONParse = <T>(jsonString: string, fallback: T): T => {
  try {
    return JSON.parse(jsonString) as T;
  } catch (error) {
    console.error('Failed to parse JSON:', error);
    return fallback;
  }
};