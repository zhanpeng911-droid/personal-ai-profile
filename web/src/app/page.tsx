import Link from "next/link";
import { MessageSquare, FolderGit2, ArrowRight } from "lucide-react";
import { ProjectFeature } from "@/components/ProjectFeature";
import { SnapshotCarousel } from "@/components/SnapshotCarousel";
import { ScrollHint } from "@/components/ScrollHint";
import { Reveal } from "@/components/Reveal";
import projects from "@/content/projects.json";
import site from "@/content/site.json";

export default function HomePage() {
  const [major, minor] = projects;

  return (
    <div>
      {/* ===== 第一屏:全屏 Hero ===== */}
      <section className="relative flex min-h-[calc(100dvh-8rem)] flex-col justify-center">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_0.6fr] lg:items-center lg:gap-16">
          {/* 左侧:超大标题区 */}
          <div className="relative">
            {/* 破格装饰竖线 */}
            <div className="absolute -left-4 top-2 hidden h-[calc(100%-0.5rem)] w-px bg-gradient-to-b from-transparent via-clay/30 to-transparent lg:block" />

            {/* 小标签 */}
            <Reveal>
              <p className="font-mono text-xs font-medium uppercase tracking-[0.2em] text-clay-dark sm:text-sm">
                {site.title}
              </p>
            </Reveal>

            {/* 超大主标题 - 视觉中心 */}
            <Reveal delay={60}>
              <h1 className="mt-5 font-display text-6xl font-bold leading-[0.9] tracking-tight text-ink-900 sm:text-7xl lg:text-8xl xl:text-[9rem]">
                可追问的
                <br />
                <span className="text-clay">AI 简历分身</span>
              </h1>
            </Reveal>

            {/* 说明文案 */}
            <Reveal delay={140}>
              <p className="mt-8 max-w-lg text-sm leading-relaxed text-ink-700 sm:text-base">
                {site.tagline}
              </p>
            </Reveal>

            {/* 行动按钮 - 玻璃拟态 */}
            <Reveal delay={220}>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/ask" className="glass-btn-primary h-11">
                  <MessageSquare size={16} />
                  与 AI 分身交流
                </Link>
                <Link href="/projects" className="glass-btn-secondary h-11">
                  <FolderGit2 size={16} />
                  查看项目
                </Link>
              </div>
            </Reveal>
          </div>

          {/* 右侧:浮动玻璃卡片 - 快照轮播 */}
          <Reveal delay={300}>
            <SnapshotCarousel />
          </Reveal>
        </div>

        {/* 关键词横排 */}
        <Reveal delay={400} className="mt-10">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-paper-200 pt-6 font-mono text-xs text-ink-500">
            {site.keywords.map((k, i) => (
              <span key={k} className="flex items-center gap-3">
                {i > 0 && <span className="text-paper-300">/</span>}
                <span>{k}</span>
              </span>
            ))}
          </div>
        </Reveal>

        {/* 滚动提示 - 点击精准跳到精选项目区 */}
        <ScrollHint targetId="projects" />
      </section>

      {/* ===== 第二屏:项目区 ===== */}
      <section id="projects" className="scroll-mt-20 py-20 lg:py-28">
        <Reveal className="mb-12 flex items-end justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-wider text-clay-dark">Selected Work</p>
            <h2 className="mt-2 font-display text-3xl font-bold text-ink-900 sm:text-4xl">
              精选项目
            </h2>
          </div>
          <Link
            href="/projects"
            className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-clay-dark transition-colors hover:text-clay"
          >
            全部项目
            <ArrowRight size={14} />
          </Link>
        </Reveal>

        {/* 不对称双栏 */}
        <div className="grid gap-10 lg:grid-cols-[1.5fr_1fr] lg:gap-12">
          <Reveal>
            <ProjectFeature
              index="01"
              slug={major.slug}
              name={major.name}
              summary={major.summary}
              tags={major.tags}
              repo={major.repo}
              image={major.image || undefined}
              images={major.images}
              variant="large"
            />
          </Reveal>
          <Reveal delay={120}>
            <ProjectFeature
              index="02"
              slug={minor.slug}
              name={minor.name}
              summary={minor.summary}
              tags={minor.tags}
              repo={minor.repo}
              image={minor.image || undefined}
              images={minor.images}
              variant="small"
            />
          </Reveal>
        </div>
      </section>
    </div>
  );
}
