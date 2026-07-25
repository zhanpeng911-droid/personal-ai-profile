import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MessageSquare, Code2 } from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { ProjectDiagram } from "@/components/ProjectDiagram";
import { ProjectGallery, type GalleryImage } from "@/components/ProjectGallery";
import { TableOfContents } from "@/components/TableOfContents";
import projects from "@/content/projects.json";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const project = projects.find((p) => p.slug === slug);
  return { title: project?.name || "项目" };
}

export default async function ProjectDetailPage({ params }: Props) {
  const { slug } = await params;
  const project = projects.find((p) => p.slug === slug);
  if (!project) notFound();

  const sections = [
    { id: "problem", title: "解决的问题", body: project.problem },
    { id: "role", title: "个人职责", body: project.role },
    { id: "stack", title: "技术栈", body: project.stack.join(" · ") },
    { id: "tradeoffs", title: "取舍", body: project.tradeoffs },
    { id: "outcomes", title: "成果", body: project.outcomes },
  ];

  const hasImages = (project.images?.length ?? 0) > 0;

  const tocItems = [
    { id: "architecture", label: "架构图" },
    ...sections.map((s) => ({ id: s.id, label: s.title })),
    { id: "followups", label: "可继续追问" },
  ];

  return (
    <article className="mx-auto max-w-7xl space-y-8">
      {/* Hero - 顶部标题区 */}
      <Reveal>
        <Link
          href="/projects"
          className="mb-4 inline-flex items-center gap-1 text-sm text-ink-500 transition-colors hover:text-clay-dark"
        >
          <ArrowLeft size={14} />
          返回项目列表
        </Link>
        <p className="font-mono text-xs uppercase tracking-wider text-clay-dark">Project</p>
        <div className="mt-2 flex items-start justify-between gap-3">
          <h1 className="font-display text-3xl font-bold text-ink-900 sm:text-4xl">{project.name}</h1>
          {project.repo && (
            <a
              href={project.repo}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-flex shrink-0 items-center gap-1.5 rounded-lg glass-tag px-3 py-2 text-xs text-ink-700 transition-all hover:border-clay/30 hover:bg-clay/5 hover:text-clay-dark"
            >
              <Code2 size={14} />
              <span className="hidden sm:inline">GitHub</span>
            </a>
          )}
        </div>
        <p className="mt-4 max-w-2xl leading-relaxed text-ink-700">{project.summary}</p>
        <div className="mt-4 flex flex-wrap gap-1.5">
          {project.tags.map((t) => (
            <span key={t} className="glass-tag px-2.5 py-0.5 text-ink-500">
              {t}
            </span>
          ))}
        </div>
      </Reveal>

      {/* 三栏布局:左图固定 + 中内容 + 右 TOC */}
      <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-10 xl:grid-cols-[0.7fr_1.3fr_180px] xl:gap-12">
        {/* 左:项目截图 - sticky 固定不动 */}
        {hasImages && (
          <div className="lg:sticky lg:top-20 lg:self-start">
            <Reveal>
              <ProjectGallery
                images={project.images as GalleryImage[]}
                alt={project.name}
                aspect="auto"
                objectFit="contain"
              />
            </Reveal>
          </div>
        )}

        {/* 中:架构图 + sections + 问答 */}
        <div className="space-y-6">
          <div id="architecture" className="scroll-mt-20">
            <ProjectDiagram type={slug as "novamind" | "notebook"} />
          </div>

          {sections.map((s, i) => (
            <Reveal key={s.id} delay={i * 60} as="section" id={s.id} className="glass-hover scroll-mt-20 p-6">
              <h2 className="font-display text-lg font-semibold text-ink-900">{s.title}</h2>
              <p className="mt-3 text-sm leading-relaxed text-ink-700">{s.body}</p>
            </Reveal>
          ))}

          <Reveal
            delay={120}
            as="section"
            id="followups"
            className="scroll-mt-20 rounded-2xl border border-clay/20 bg-clay/5 p-6 shadow-soft-lg backdrop-blur-md"
          >
            <h2 className="font-display text-lg font-semibold text-ink-900">可继续追问</h2>
            <ul className="mt-3 space-y-2.5">
              {project.followups.map((q) => (
                <li key={q} className="flex gap-2.5 text-sm text-ink-700">
                  <span className="mt-0.5 shrink-0 font-mono text-xs text-clay-dark">?</span>
                  <span>{q}</span>
                </li>
              ))}
            </ul>
            <Link href="/ask" className="mt-6 glass-btn-primary h-11">
              <MessageSquare size={16} />
              向 AI 分身提问
            </Link>
          </Reveal>
        </div>

        {/* 右:TOC 目录导航 - sticky */}
        <div className="hidden xl:sticky xl:top-20 xl:block xl:self-start">
          <TableOfContents items={tocItems} />
        </div>
      </div>
    </article>
  );
}
