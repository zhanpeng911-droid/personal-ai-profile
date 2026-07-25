import type { Metadata } from "next";
import { ProjectFeature } from "@/components/ProjectFeature";
import { Reveal } from "@/components/Reveal";
import projects from "@/content/projects.json";

export const metadata: Metadata = { title: "项目" };

export default function ProjectsPage() {
  const [major, minor] = projects;

  return (
    <div className="space-y-16">
      {/* 页面标题 */}
      <Reveal>
        <p className="font-mono text-xs uppercase tracking-wider text-clay-dark">Selected Work</p>
        <h1 className="mt-2 font-display text-4xl font-bold text-ink-900 sm:text-5xl">项目</h1>
        <p className="mt-3 max-w-2xl text-sm text-ink-700">
          结构化项目证据，便于面试官逐项追问。进入详情查看架构图与取舍，或通过邀请码向 AI 分身提问。
        </p>
      </Reveal>

      {/* 不对称双栏:主项目 60% + 次项目 40% */}
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
    </div>
  );
}
