export type Plan = "essencial" | "pro" | "premium";
export type Feature = "queue" | "manual_send" | "results" | "whatsapp_api" | "ai_agent";

const FEATURES: Record<Plan, readonly Feature[]> = {
  essencial: ["queue", "manual_send", "results"],
  pro: ["queue", "manual_send", "results"],
  premium: ["queue", "manual_send", "results", "whatsapp_api", "ai_agent"],
};

export const isPlan = (v: unknown): v is Plan => v === "essencial" || v === "pro" || v === "premium";

export const hasFeature = (plan: unknown, feature: Feature): boolean => isPlan(plan) && FEATURES[plan].includes(feature);

/** Call on the server before running a paid feature. The screen hiding a button is not enough. */
export function requireFeature(plan: unknown, feature: Feature): void {
  if (!hasFeature(plan, feature)) throw new Error("Recurso não disponível no plano atual.");
}
