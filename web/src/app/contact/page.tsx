import type { Metadata } from "next";
import { FileText, Mail, ArrowUpRight, Code2 } from "lucide-react";
import { Reveal } from "@/components/Reveal";
import site from "@/content/site.json";

export const metadata: Metadata = { title: "联系与简历" };

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <Reveal>
        <p className="font-mono text-xs uppercase tracking-wider text-clay-dark">Contact</p>
        <h1 className="mt-2 font-display text-3xl font-bold text-ink-900">联系与简历</h1>
        <p className="mt-3 text-ink-700">
          本站<strong className="text-ink-900">不提供简历 PDF 下载</strong>
          。完整简历请在招聘平台获取；此处仅放公开联系方式与说明。
        </p>
      </Reveal>

      <Reveal delay={80} as="section" id="resume-on-platforms" className="rounded-2xl border border-paper-200 bg-card p-6 shadow-card">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gold/10 text-gold">
            <FileText size={16} />
          </span>
          <h2 className="font-display text-lg font-semibold text-ink-900">完整简历：请在招聘平台下载</h2>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-ink-700">
          为避免多处维护版本不一致，站点专注展示项目证据与 AI 可追问分身。请在你收到投递或沟通的招聘平台下载最新简历。
        </p>
        <ul className="mt-4 space-y-2.5">
          {site.platforms.map((p) => (
            <li key={p.name}>
              <a
                href={p.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between rounded-xl border border-paper-200 bg-paper-50 px-4 py-3 transition-all hover:border-clay/30 hover:bg-clay/5"
              >
                <div>
                  <div className="font-medium text-ink-900">{p.name}</div>
                  <div className="mt-0.5 text-sm text-ink-500">{p.note}</div>
                </div>
                <ArrowUpRight size={16} className="shrink-0 text-ink-400 transition-colors group-hover:text-clay" />
              </a>
            </li>
          ))}
        </ul>
      </Reveal>

      <Reveal delay={160} as="section" className="rounded-2xl border border-paper-200 bg-card p-6 shadow-card">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-clay/10 text-clay">
            <Mail size={16} />
          </span>
          <h2 className="font-display text-lg font-semibold text-ink-900">公开联系方式</h2>
        </div>
        <div className="mt-4 space-y-3">
          <a
            href={`mailto:${site.email}`}
            className="flex items-center gap-2 text-sm text-ink-700 transition-colors hover:text-clay-dark"
          >
            <Mail size={14} className="text-ink-400" />
            {site.email}
          </a>
          <a
            href={site.github}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 text-sm text-ink-700 transition-colors hover:text-clay-dark"
          >
            <Code2 size={14} className="text-ink-400" />
            {site.github}
          </a>
        </div>
      </Reveal>
    </div>
  );
}
