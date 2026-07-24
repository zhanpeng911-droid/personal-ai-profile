import Link from "next/link";
import { ArrowRight, Sparkles, FileText, FolderGit2, MessageSquare } from "lucide-react";
import { ProjectCard } from "@/components/ProjectCard";
import { Reveal } from "@/components/Reveal";
import projects from "@/content/projects.json";
import site from "@/content/site.json";

export default function HomePage() {
  return (
    <div className="space-y-20">
      {/* Hero - 不对称布局 */}
      <section className="grid gap-10 lg:grid-cols-[1.3fr_0.7fr] lg:items-center">
        <div className="relative">
          {/* 破格装饰线 */}
          <div className="absolute -left-4 top-0 hidden h-full w-px bg-gradient-to-b from-transparent via-clay/30 to-transparent lg:block" />

          <div className="mb-4 flex items-center gap-2">
            <span className="inline-flex h-7 items-center gap-1.5 rounded-full border border-clay/20 bg-clay/5 px-3 text-xs font-medium text-clay-dark">
              <Sparkles size={12} />
              AI Agent / RAG 应用开发
            </span>
          </div>

          <h1 className="font-display text-4xl font-bold leading-[1.1] tracking-tight text-ink-900 sm:text-5xl lg:text-6xl">
            <span className="block animate-fade-up">{site.name}</span>
            <span className="mt-1 block animate-fade-up text-clay" style={{ animationDelay: "100ms" }}>
              可追问的 AI 简历分身
            </span>
          </h1>

          <p
            className="mt-6 max-w-xl animate-fade-up text-base leading-relaxed text-ink-700 sm:text-lg"
            style={{ animationDelay: "200ms" }}
          >
            {site.tagline}
          </p>

          <div className="mt-8 flex animate-fade-up flex-wrap gap-3" style={{ animationDelay: "300ms" }}>
            <Link
              href="/access"
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-clay px-6 text-sm font-medium text-white transition-all hover:bg-clay-dark hover:shadow-glow"
            >
              <MessageSquare size={16} />
              与 AI 分身交流
            </Link>
            <Link
              href="/projects"
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-paper-300 bg-white px-6 text-sm font-medium text-ink-900 transition-all hover:border-clay/30 hover:bg-clay/5"
            >
              <FolderGit2 size={16} />
              查看项目
            </Link>
            <Link
              href="/contact#resume-on-platforms"
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-paper-300 bg-white px-6 text-sm font-medium text-ink-900 transition-all hover:border-clay/30 hover:bg-clay/5"
            >
              <FileText size={16} />
              如何获取简历
            </Link>
          </div>

          {/* 技术关键词 - 非胶囊，用斜杠分隔更有编辑感 */}
          <div
            className="mt-8 flex animate-fade-up flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs text-ink-500"
            style={{ animationDelay: "400ms" }}
          >
            {site.keywords.map((k, i) => (
              <span key={k} className="flex items-center gap-3">
                {i > 0 && <span className="text-paper-300">/</span>}
                <span>{k}</span>
              </span>
            ))}
          </div>
        </div>

        {/* 数据亮点 - 装饰性面板 */}
        <Reveal delay={300} className="relative">
          <div className="relative overflow-hidden rounded-2xl border border-paper-200 bg-card p-6 shadow-soft-lg">
            {/* 顶部装饰条 */}
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-clay via-clay-light to-moss" />

            <p className="mb-4 text-xs font-medium uppercase tracking-wider text-ink-500">
              工程验证
            </p>

            <div className="space-y-4">
              {[
                { num: "2", label: "独立全栈项目", sub: "Notebook + NovaMind" },
                { num: "286+", label: "测试基线 passed", sub: "后端 235 + Django 12 + E2E 39" },
                { num: "114+", label: "Agent 测试 passed", sub: "单元 85 + Eval 14 + 集成 15" },
              ].map((item, i) => (
                <div
                  key={item.label}
                  className="flex items-baseline justify-between border-b border-paper-200 pb-3 last:border-0 last:pb-0"
                >
                  <div>
                    <div className="font-display text-3xl font-bold text-ink-900">{item.num}</div>
                    <div className="text-sm text-ink-700">{item.label}</div>
                  </div>
                  <div className="text-right text-xs text-ink-500">{item.sub}</div>
                </div>
              ))}
            </div>

            <p className="mt-4 border-t border-paper-200 pt-4 text-xs leading-relaxed text-ink-500">
              完整简历请在 Boss 直聘查看，本站不提供 PDF 下载。
            </p>
          </div>
        </Reveal>
      </section>

      {/* 精选项目 - 横向特色展示（非重复卡片网格） */}
      <section>
        <Reveal className="mb-8 flex items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-bold text-ink-900 sm:text-3xl">精选项目</h2>
            <p className="mt-2 text-sm text-ink-500">结构化证据优先，便于面试官逐项追问</p>
          </div>
          <Link
            href="/projects"
            className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-clay-dark transition-colors hover:text-clay"
          >
            全部项目
            <ArrowRight size={14} />
          </Link>
        </Reveal>
        <div className="grid gap-5 md:grid-cols-2">
          {projects.map((p, i) => (
            <Reveal key={p.slug} delay={i * 120}>
              <ProjectCard slug={p.slug} name={p.name} summary={p.summary} tags={p.tags} repo={p.repo} />
            </Reveal>
          ))}
        </div>
      </section>
    </div>
  );
}
