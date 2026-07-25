import Link from "next/link";
import { ArrowUpRight, Code2, ImageIcon } from "lucide-react";

type Props = {
  index: string;
  slug: string;
  name: string;
  summary: string;
  tags: string[];
  repo?: string;
  image?: string;
  images?: { src: string; caption?: string }[];
  variant: "large" | "small";
};

export function ProjectFeature({
  index,
  slug,
  name,
  summary,
  tags,
  repo,
  image,
  images,
  variant,
}: Props) {
  const isLarge = variant === "large";
  // 封面图：优先取 images 第一张，其次 image
  const cover = images?.[0]?.src || image;

  return (
    <article className="group flex flex-col">
      {/* 序号 + 分隔线 */}
      <div className="mb-4 flex items-center gap-3">
        <span className="font-mono text-xs font-medium text-clay-dark">{index}</span>
        <span className="h-px flex-1 bg-paper-200" />
      </div>

      {/* 标题 */}
      <Link href={`/projects/${slug}`} className="block w-fit">
        <h3
          className={`font-display font-bold leading-[1.05] tracking-tight text-ink-900 transition-colors group-hover:text-clay-dark ${
            isLarge ? "text-4xl sm:text-5xl" : "text-2xl sm:text-3xl"
          }`}
        >
          {name}
        </h3>
      </Link>

      {/* 说明 - 小字正文,与大标题形成对比 */}
      <p
        className={`mt-3 leading-relaxed text-ink-700 ${
          isLarge ? "text-sm sm:text-base max-w-md" : "text-xs sm:text-sm max-w-xs"
        }`}
      >
        {summary}
      </p>

      {/* 作品图片 - 封面图（点进详情看完整轮播） */}
      <div className="mt-6">
        {cover ? (
          <Link
            href={`/projects/${slug}`}
            className={`group/img relative block overflow-hidden rounded-xl border border-white/50 bg-ink-900 ${
              isLarge ? "aspect-[16/10]" : "aspect-[4/3]"
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={cover}
              alt={name}
              className="h-full w-full object-contain transition-transform duration-500 group-hover/img:scale-105"
            />
            {/* 多图角标 */}
            {(images?.length ?? 0) > 1 && (
              <span className="absolute right-3 top-3 rounded-full border border-white/40 bg-ink-900/40 px-2.5 py-0.5 font-mono text-[10px] text-white/90 backdrop-blur-md">
                1 / {images!.length}
              </span>
            )}
          </Link>
        ) : (
          <div
            className={`flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-paper-300 bg-white/30 backdrop-blur-sm ${
              isLarge ? "aspect-[16/9]" : "aspect-[4/3]"
            }`}
          >
            <ImageIcon size={isLarge ? 28 : 20} className="text-ink-400" />
            <span className={`font-mono text-ink-400 ${isLarge ? "text-xs" : "text-[10px]"}`}>
              作品图片占位
            </span>
          </div>
        )}
      </div>

      {/* tags + GitHub */}
      <div className="mt-5 flex flex-wrap items-center gap-1.5">
        {tags.map((t) => (
          <span
            key={t}
            className="glass-tag px-2 py-0.5 text-[11px] text-ink-500"
          >
            {t}
          </span>
        ))}
      </div>

      {/* 底部链接行 */}
      <div className="mt-4 flex items-center gap-4">
        <Link
          href={`/projects/${slug}`}
          className="inline-flex items-center gap-1 text-xs font-medium text-ink-700 transition-colors hover:text-clay-dark"
        >
          查看详情
          <ArrowUpRight size={12} />
        </Link>
        {repo && (
          <a
            href={repo}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-medium text-ink-700 transition-colors hover:text-clay-dark"
          >
            <Code2 size={12} />
            GitHub
          </a>
        )}
      </div>
    </article>
  );
}
