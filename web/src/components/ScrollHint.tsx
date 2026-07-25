"use client";

import { ArrowDown } from "lucide-react";

export function ScrollHint({ targetId }: { targetId: string }) {
  function handleClick() {
    const el = document.getElementById(targetId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  return (
    <div className="absolute bottom-2 right-0 hidden lg:block">
      <button
        type="button"
        onClick={handleClick}
        className="group flex flex-col items-center gap-2 text-ink-400 transition-colors hover:text-clay-dark"
        aria-label="向下滚动到精选项目"
      >
        <span className="font-mono text-[10px] uppercase tracking-wider">向下滚动</span>
        <span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/50 bg-white/30 backdrop-blur-md transition-all group-hover:border-clay/40 group-hover:bg-clay/5">
          <ArrowDown size={14} className="animate-bounce" />
        </span>
      </button>
    </div>
  );
}
