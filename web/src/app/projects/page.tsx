import type { Metadata } from "next";
import { ProjectCard } from "@/components/ProjectCard";
import { Reveal } from "@/components/Reveal";
import projects from "@/content/projects.json";

export const metadata: Metadata = { title: "项目" };

export default function ProjectsPage() {
  return (
    <div className="space-y-8">
      <Reveal>
        <p className="font-mono text-xs uppercase tracking-wider text-clay-dark">Projects</p>
        <h1 className="mt-2 font-display text-3xl font-bold text-ink-900">项目</h1>
        <p className="mt-3 max-w-2xl text-ink-700">
          结构化项目证据，便于面试官逐项追问。进入详情查看架构与取舍，或通过邀请码向 AI 分身提问。
        </p>
      </Reveal>
      <div className="grid gap-5 md:grid-cols-2">
        {projects.map((p, i) => (
          <Reveal key={p.slug} delay={i * 120}>
            <ProjectCard slug={p.slug} name={p.name} summary={p.summary} tags={p.tags} repo={p.repo} />
          </Reveal>
        ))}
      </div>
    </div>
  );
}
