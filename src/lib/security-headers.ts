const SUPABASE_HOSTS = "https://*.supabase.co wss://*.supabase.co";
// Lovable hosts are for the cloud auth (Google sign-in) used by the app; confirm after the first production test.
const LOVABLE_HOSTS = "https://*.lovable.dev https://*.lovable.app";

// 'unsafe-inline' in script-src is required while TanStack Start inlines its hydration scripts without a nonce.
export const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  "img-src 'self' data: blob:",
  `connect-src 'self' ${SUPABASE_HOSTS} ${LOVABLE_HOSTS}`,
  "object-src 'none'",
  "base-uri 'self'",
  "frame-ancestors 'none'",
].join("; ");

/** Security headers for production responses. Dev is skipped so Vite HMR keeps working. */
export function securityHeaders(production: boolean): Record<string, string> {
  if (!production) return {};
  return {
    "Content-Security-Policy": CSP,
    "Strict-Transport-Security": "max-age=63072000; includeSubDomains",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()",
  };
}

export function withSecurityHeaders(response: Response, production: boolean): Response {
  const extra = securityHeaders(production);
  if (Object.keys(extra).length === 0) return response;
  const headers = new Headers(response.headers);
  for (const [k, v] of Object.entries(extra)) headers.set(k, v);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}
