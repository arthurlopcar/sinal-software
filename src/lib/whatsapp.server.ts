import { createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";

export const MAX_WEBHOOK_BYTES = 256 * 1024;

/** Meta signs the raw body: header "sha256=<hex>" (HMAC-SHA256 with the app secret). Constant-time compare. */
export function verifySignature(rawBody: string, header: string | null, appSecret: string): boolean {
  if (!header || !appSecret || Buffer.byteLength(rawBody) > MAX_WEBHOOK_BYTES) return false;
  const m = /^sha256=([0-9a-f]{64})$/i.exec(header);
  if (!m?.[1]) return false;
  const expected = createHmac("sha256", appSecret).update(rawBody).digest();
  return timingSafeEqual(Buffer.from(m[1], "hex"), expected);
}

/** GET verification: returns the challenge only when mode and token match. */
export function verifyChallenge(params: URLSearchParams, verifyToken: string): string | null {
  const token = params.get("hub.verify_token") ?? "";
  const ok = params.get("hub.mode") === "subscribe" && verifyToken.length > 0 && token.length === verifyToken.length
    && timingSafeEqual(Buffer.from(token), Buffer.from(verifyToken));
  return ok ? (params.get("hub.challenge") ?? "") : null;
}

const message = z.object({
  id: z.string().min(1).max(200),
  from: z.string().regex(/^\d{8,20}$/),
  timestamp: z.string().optional(),
  type: z.string().max(30),
  text: z.object({ body: z.string().max(4096) }).optional(),
});
const status = z.object({
  id: z.string().min(1).max(200),
  status: z.enum(["sent", "delivered", "read", "failed"]),
  timestamp: z.string().optional(),
});
const payload = z.object({
  entry: z.array(z.object({
    changes: z.array(z.object({
      value: z.object({
        metadata: z.object({ phone_number_id: z.string().max(40) }).optional(),
        messages: z.array(message).max(100).optional(),
        statuses: z.array(status).max(100).optional(),
      }),
    })).max(100),
  })).max(100),
});

export type InboundMessage = { waMessageId: string; from: string; text: string; phoneNumberId?: string | undefined };
export type StatusEvent = { waMessageId: string; status: "sent" | "delivered" | "read" | "failed" };

/** Validates the payload and keeps only what the app uses. Text stays data: it is never executed or interpreted here. */
export function parseWebhook(raw: string): { messages: InboundMessage[]; statuses: StatusEvent[] } | null {
  let json: unknown;
  try { json = JSON.parse(raw); } catch { return null; }
  const parsed = payload.safeParse(json);
  if (!parsed.success) return null;
  const messages: InboundMessage[] = [];
  const statuses: StatusEvent[] = [];
  const seen = new Set<string>();
  for (const entry of parsed.data.entry) {
    for (const { value } of entry.changes) {
      for (const m of value.messages ?? []) {
        if (m.type !== "text" || !m.text || seen.has(m.id)) continue;
        seen.add(m.id);
        messages.push({ waMessageId: m.id, from: m.from, text: m.text.body, phoneNumberId: value.metadata?.phone_number_id });
      }
      for (const s of value.statuses ?? []) statuses.push({ waMessageId: s.id, status: s.status });
    }
  }
  return { messages, statuses };
}

const RANK = { sent: 1, delivered: 2, read: 3, failed: 4 } as const;
/** Status events can arrive out of order: never move a message backwards (e.g. "read" then a late "delivered"). */
export const nextStatus = (current: StatusEvent["status"] | null, incoming: StatusEvent["status"]) =>
  current && RANK[current] >= RANK[incoming] ? current : incoming;
