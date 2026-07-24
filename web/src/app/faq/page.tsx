import type { Metadata } from "next";
import { ChevronDown } from "lucide-react";
import { Reveal } from "@/components/Reveal";
import faq from "@/content/faq.json";

export const metadata: Metadata = { title: "FAQ" };

export default function FaqPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <Reveal>
        <p className="font-mono text-xs uppercase tracking-wider text-clay-dark">FAQ</p>
        <h1 className="mt-2 font-display text-3xl font-bold text-ink-900">精选问答</h1>
        <p className="mt-3 text-ink-700">以下答案经过审核，无需邀请码即可阅读。</p>
      </Reveal>
      <div className="space-y-3">
        {faq.map((item, i) => (
          <Reveal key={item.q} delay={i * 60}>
            <details className="hover-glow group rounded-2xl border border-paper-200 bg-card p-5 shadow-card">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-display text-base font-medium text-ink-900">
                <span>{item.q}</span>
                <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-paper-200 bg-paper-50 text-ink-400 transition-all duration-300 group-open:rotate-180 group-open:border-clay/30 group-open:bg-clay/5 group-open:text-clay">
                  <ChevronDown size={14} />
                </span>
              </summary>
              <p className="mt-3 border-t border-paper-200 pt-3 text-sm leading-relaxed text-ink-700">
                {item.a}
              </p>
            </details>
          </Reveal>
        ))}
      </div>
    </div>
  );
}
