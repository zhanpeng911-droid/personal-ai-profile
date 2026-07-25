"use client";

import { useEffect, useState, useCallback } from "react";
import { ChevronLeft, ChevronRight, ImageIcon, X, ZoomIn } from "lucide-react";

export type GalleryImage = {
  src: string;
  caption?: string;
};

type Props = {
  images: GalleryImage[];
  alt: string;
  /** 大图宽高比 */
  aspect?: "16/9" | "4/3" | "3/2" | "auto";
  /** 图片填充模式：终端截图用 contain 避免裁剪 */
  objectFit?: "cover" | "contain";
  /** sticky 模式：左侧固定不动时用 */
  sticky?: boolean;
};

export function ProjectGallery({ images, alt, aspect = "16/9", objectFit = "contain", sticky = false }: Props) {
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const total = images.length;

  const go = useCallback(
    (next: number) => {
      setActive((prev) => (next + total) % total);
    },
    [total],
  );

  // 自动轮播：5 秒一切，hover/focus 时暂停
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (paused || total <= 1) return;
    const timer = setInterval(() => {
      setActive((prev) => (prev + 1) % total);
    }, 5000);
    return () => clearInterval(timer);
  }, [paused, total]);

  // lightbox 打开时锁滚动 + ESC 关闭
  useEffect(() => {
    if (!lightbox) return;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setLightbox(false);
      if (e.key === "ArrowLeft") go(active - 1);
      if (e.key === "ArrowRight") go(active + 1);
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [lightbox, active, go]);

  // 键盘可访问：左右切换
  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      go(active - 1);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      go(active + 1);
    }
  }

  const aspectClass =
    aspect === "16/9" ? "aspect-[16/9]" : aspect === "4/3" ? "aspect-[4/3]" : aspect === "3/2" ? "aspect-[3/2]" : "";
  const fitClass = objectFit === "contain" ? "object-contain" : "object-cover";

  // 无图：占位
  if (total === 0) {
    return (
      <div
        className={`flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-paper-300 bg-white/30 backdrop-blur-sm ${aspectClass || "min-h-[300px]"}`}
      >
        <ImageIcon size={28} className="text-ink-400" />
        <span className="font-mono text-xs text-ink-400">作品图片占位</span>
      </div>
    );
  }

  return (
    <div
      className={`relative ${sticky ? "lg:sticky lg:top-20" : ""}`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      {/* 图片视窗 */}
      <div
        className={`relative overflow-hidden rounded-xl border border-white/50 bg-ink-900/5 shadow-soft backdrop-blur-sm ${aspectClass || "min-h-[300px]"}`}
        onKeyDown={onKeyDown}
        tabIndex={0}
        role="group"
        aria-roledescription="carousel"
        aria-label={alt}
      >
        {images.map((img, i) => (
          <div
            key={img.src + i}
            className="absolute inset-0 transition-opacity duration-500"
            style={{ opacity: i === active ? 1 : 0 }}
            aria-hidden={i !== active}
          >
            <button
              type="button"
              onClick={() => { setActive(i); setLightbox(true); }}
              className="group/zoom h-full w-full cursor-zoom-in"
              aria-label="点击放大查看"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.src}
                alt={img.caption ? `${alt} - ${img.caption}` : alt}
                className={`h-full w-full ${fitClass}`}
                loading={i === 0 ? "eager" : "lazy"}
              />
            </button>
            {/* 放大提示角标 */}
            <div className="pointer-events-none absolute right-3 bottom-3 flex h-7 w-7 items-center justify-center rounded-full border border-white/40 bg-ink-900/40 text-white/80 backdrop-blur-md opacity-0 transition-opacity group-hover:opacity-100">
              <ZoomIn size={12} />
            </div>
            {/* 底部渐变 + caption */}
            {img.caption && (
              <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink-900/70 to-transparent px-4 pb-3 pt-8">
                <p className="font-mono text-xs text-white/90">{img.caption}</p>
              </div>
            )}
          </div>
        ))}

        {/* 左右切换箭头（仅多图显示） */}
        {total > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(active - 1)}
              className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/40 bg-white/30 text-ink-900 backdrop-blur-md transition-all hover:bg-white/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay/40"
              aria-label="上一张"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              onClick={() => go(active + 1)}
              className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/40 bg-white/30 text-ink-900 backdrop-blur-md transition-all hover:bg-white/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay/40"
              aria-label="下一张"
            >
              <ChevronRight size={16} />
            </button>
          </>
        )}

        {/* 计数器 */}
        {total > 1 && (
          <div className="absolute right-3 top-3 rounded-full border border-white/40 bg-ink-900/40 px-2.5 py-0.5 font-mono text-[10px] text-white/90 backdrop-blur-md">
            {active + 1} / {total}
          </div>
        )}
      </div>

      {/* 进度指示器 */}
      {total > 1 && (
        <div className="mt-3 flex justify-center gap-1.5">
          {images.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActive(i)}
              className="h-1 rounded-full transition-all duration-300"
              style={{
                width: i === active ? 24 : 8,
                backgroundColor: i === active ? "#d97757" : "#d4d2c5",
              }}
              aria-label={`第 ${i + 1} 张`}
              aria-current={i === active}
            />
          ))}
        </div>
      )}

      {/* Lightbox - 点击放大全屏查看 */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/90 backdrop-blur-md"
          onClick={() => setLightbox(false)}
          role="dialog"
          aria-modal="true"
          aria-label={`${alt} 大图查看`}
        >
          {/* 关闭按钮 */}
          <button
            type="button"
            onClick={() => setLightbox(false)}
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full border border-white/30 bg-white/10 text-white/90 backdrop-blur-md transition-all hover:bg-white/20"
            aria-label="关闭"
          >
            <X size={18} />
          </button>

          {/* 大图 */}
          <div className="relative max-h-[90vh] max-w-[90vw]" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={images[active].src}
              alt={images[active].caption ? `${alt} - ${images[active].caption}` : alt}
              className="max-h-[85vh] max-w-[90vw] rounded-lg object-contain"
            />
            {images[active].caption && (
              <p className="mt-3 text-center font-mono text-xs text-white/80">{images[active].caption}</p>
            )}
          </div>

          {/* 左右切换 */}
          {total > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); go(active - 1); }}
                className="absolute left-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-white/10 text-white/90 backdrop-blur-md transition-all hover:bg-white/20"
                aria-label="上一张"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); go(active + 1); }}
                className="absolute right-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-white/10 text-white/90 backdrop-blur-md transition-all hover:bg-white/20"
                aria-label="下一张"
              >
                <ChevronRight size={20} />
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
