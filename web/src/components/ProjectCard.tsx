import Link from "next/link";
import { ArrowUpRight, Code2 } from "lucide-react";

type Props = {
  slug: string;
  name: string;
  summary: string;
  tags: string[];
  repo?: string;
};

export function ProjectCard({ slug, name, summary, tags, repo }: Props) {
  return (
    <div className="hover-glow group block rounded-2xl border border-paper-200 bg-card p-6 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <Link href={`/projects/${slug}`} className="transition-colors group-hover:text-clay-dark">
          <h3 className="font-display text-lg font-semibold text-ink-900 transition-colors group-hover:text-clay-dark">
            {name}
          </h3>
        </Link>
        <div className="flex shrink-0 items-center gap-1.5">
          {repo && (
            <a
              href={repo}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub 仓库"
              className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-paper-200 bg-paper-50 text-ink-400 transition-all duration-300 hover:border-clay/30 hover:bg-clay/5 hover:text-clay"
            >
              <Code2 size={14} />
            </a>
          )}
          <Link
            href={`/projects/${slug}`}
            className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-paper-200 bg-paper-50 text-ink-400 transition-all duration-300 group-hover:border-clay/30 group-hover:bg-clay/5 group-hover:text-clay"
            aria-label="查看详情"
          >
            <ArrowUpRight size={14} />
          </Link>
        </div>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-ink-700">{summary}</p>
      <div className="mt-4 flex flex-wrap gap-1.5">
        {tags.map((t) => (
          <span
            key={t}
            className="rounded-md border border-paper-200 bg-paper-50 px-2 py-0.5 font-mono text-xs text-ink-500 transition-colors group-hover:border-clay/15"
          >
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}
