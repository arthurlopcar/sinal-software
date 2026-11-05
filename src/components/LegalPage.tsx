import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

export function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <Link to="/" className="font-display text-xl font-bold text-primary">Sinal<span className="text-foreground">.</span></Link>
      <h1 className="mt-8 font-display text-3xl font-bold">{title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">Versão provisória — o texto final será revisado pela assessoria jurídica da Sinal Sistemas.</p>
      <div className="mt-8 space-y-4 text-sm leading-relaxed [&_h2]:mt-6 [&_h2]:font-display [&_h2]:text-lg [&_h2]:font-semibold">{children}</div>
    </div>
  );
}
