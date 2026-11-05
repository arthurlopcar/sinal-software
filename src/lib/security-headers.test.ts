import { describe, it, expect } from "vitest";
import { securityHeaders, withSecurityHeaders } from "./security-headers";

describe("securityHeaders", () => {
  it("is empty in development", () => {
    expect(securityHeaders(false)).toEqual({});
  });
  it("sets the required headers in production", () => {
    const h = securityHeaders(true);
    expect(h["Content-Security-Policy"]).toContain("frame-ancestors 'none'");
    expect(h["Content-Security-Policy"]).toContain("object-src 'none'");
    expect(h["Strict-Transport-Security"]).toMatch(/max-age=/);
    expect(h["X-Content-Type-Options"]).toBe("nosniff");
    expect(h["Referrer-Policy"]).toBeDefined();
    expect(h["Permissions-Policy"]).toBeDefined();
  });
});

describe("withSecurityHeaders", () => {
  it("keeps status and body and adds headers", async () => {
    const res = withSecurityHeaders(new Response("ok", { status: 201, headers: { "x-a": "1" } }), true);
    expect(res.status).toBe(201);
    expect(res.headers.get("x-a")).toBe("1");
    expect(res.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(await res.text()).toBe("ok");
  });
  it("returns the same response in development", () => {
    const r = new Response("ok");
    expect(withSecurityHeaders(r, false)).toBe(r);
  });
});
