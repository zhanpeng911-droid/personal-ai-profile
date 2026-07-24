import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MessageSquare, Code2 } from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { ProjectDiagram } from "@/components/ProjectDiagram";
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
    { title: "解决的问题", body: project.problem },
    { title: "个人职责", body: project.role },
    { title: "技术栈", body: project.stack.join(" · ") },
    { title: "取舍", body: project.tradeoffs },
    { title: "成果", body: project.outcomes },
  ];

  return (
    <article className="mx-auto max-w-3xl space-y-8">
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
          <h1 className="font-display text-3xl font-bold text-ink-900">{project.name}</h1>
          {project.repo && (
            <a
              href={project.repo}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-paper-200 bg-card px-3 py-2 text-xs text-ink-700 transition-all hover:border-clay/30 hover:bg-clay/5 hover:text-clay-dark"
            >
              <Code2 size={14} />
              <span className="hidden sm:inline">GitHub</span>
            </a>
          )}
        </div>
        <p className="mt-4 leading-relaxed text-ink-700">{project.summary}</p>
        <div className="mt-4 flex flex-wrap gap-1.5">
          {project.tags.map((t) => (
            <span key={t} className="rounded-md border border-paper-200 bg-paper-50 px-2.5 py-0.5 font-mono text-xs text-ink-500">
              {t}
            </span>
          ))}
        </div>
      </Reveal>

      <ProjectDiagram type={slug as "novamind" | "notebook"} />

      {sections.map((s, i) => (
        <Reveal key={s.title} delay={i * 60} as="section" className="hover-glow rounded-2xl border border-paper-200 bg-card p-6 shadow-card">
          <h2 className="font-display text-lg font-semibold text-ink-900">{s.title}</h2>
          <p className="mt-3 text-sm leading-relaxed text-ink-700">{s.body}</p>
        </Reveal>
      ))}

      <Reveal delay={120} as="section" className="rounded-2xl border border-clay/20 bg-clay/5 p-6 shadow-glow">
        <h2 className="font-display text-lg font-semibold text-ink-900">可继续追问</h2>
        <ul className="mt-3 space-y-2.5">
          {project.followups.map((q) => (
            <li key={q} className="flex gap-2.5 text-sm text-ink-700">
              <span className="mt-0.5 shrink-0 font-mono text-xs text-clay-dark">?</span>
              <span>{q}</span>
            </li>
          ))}
        </ul>
        <Link
          href="/access"
          className="mt-6 inline-flex h-11 items-center gap-2 rounded-xl bg-clay px-6 text-sm font-medium text-white transition-all hover:bg-clay-dark hover:shadow-glow"
        >
          <MessageSquare size={16} />
          向 AI 分身提问
        </Link>
      </Reveal>
    </article>
  );
}
