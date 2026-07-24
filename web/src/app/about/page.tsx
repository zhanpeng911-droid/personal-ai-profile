import type { Metadata } from "next";
import { Compass, Code2 } from "lucide-react";
import { Reveal } from "@/components/Reveal";
import site from "@/content/site.json";

export const metadata: Metadata = { title: "关于" };

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <Reveal>
        <p className="font-mono text-xs uppercase tracking-wider text-clay-dark">About</p>
        <h1 className="mt-2 font-display text-3xl font-bold text-ink-900">关于我</h1>
        <p className="mt-3 text-ink-700">{site.title}。{site.tagline}</p>
      </Reveal>

      <Reveal delay={80} as="section" className="rounded-2xl border border-paper-200 bg-card p-6 shadow-card">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-clay/10 text-clay">
            <Compass size={16} />
          </span>
          <h2 className="font-display text-lg font-semibold text-ink-900">求职方向</h2>
        </div>
        <ul className="mt-4 space-y-2 text-sm text-ink-700">
          <li className="flex gap-2"><span className="text-clay">·</span> AI Agent 工程师 / LLM 应用工程师</li>
          <li className="flex gap-2"><span className="text-clay">·</span> RAG / 知识库系统工程师</li>
          <li className="flex gap-2"><span className="text-clay">·</span> 后端工程师（偏 AI 应用）</li>
        </ul>
        <p className="mt-3 border-t border-paper-200 pt-3 text-xs text-ink-500">
          关注点：可信检索、上下文工程、可观测性、低成本可上线方案。
        </p>
      </Reveal>

      <Reveal delay={160} as="section" className="rounded-2xl border border-paper-200 bg-card p-6 shadow-card">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-moss/10 text-moss">
            <Code2 size={16} />
          </span>
          <h2 className="font-display text-lg font-semibold text-ink-900">能力关键词</h2>
        </div>
        <div className="mt-4 flex flex-wrap gap-1.5">
          {site.keywords.map((k) => (
            <span
              key={k}
              className="rounded-md border border-paper-200 bg-paper-50 px-2.5 py-1 font-mono text-xs text-ink-700 transition-colors hover:border-clay/20"
            >
              {k}
            </span>
          ))}
        </div>
      </Reveal>
    </div>
  );
}
