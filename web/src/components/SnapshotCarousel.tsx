"use client";

import { useEffect, useState } from "react";

type Snapshot = {
  label: string;
  value: string;
  sub: string;
};

const SNAPSHOTS: Snapshot[] = [
  { label: "测试基线", value: "286+", sub: "后端 235 · Django 12 · E2E 39" },
  { label: "Agent 测试", value: "114+", sub: "单元 85 · Eval 14 · 集成 15" },
  { label: "独立项目", value: "2", sub: "NovaMind · Notebook" },
  { label: "技术栈", value: "Python", sub: "FastAPI · LangChain · Vue 3" },
  { label: "求职方向", value: "AI Agent", sub: "RAG · 上下文工程 · 可观测性" },
];

export function SnapshotCarousel() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActive((prev) => (prev + 1) % SNAPSHOTS.length);
    }, 2800);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative">
      {/* 浮动玻璃卡片 - 当前展示项 */}
      <div className="relative overflow-hidden rounded-2xl border border-white/50 bg-white/40 shadow-soft-lg backdrop-blur-xl">
        {/* 顶部彩色条 */}
        <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-clay via-clay-light to-moss" />

        <div className="p-6">
          <p className="mb-5 font-mono text-[11px] uppercase tracking-wider text-ink-400">
            快照 · Snapshot
          </p>

          {/* 轮播内容区 - 固定高度避免跳动，放大字号 */}
          <div className="relative h-[120px]">
            {SNAPSHOTS.map((s, i) => (
              <div
                key={s.label}
                className="absolute inset-0 transition-all duration-500"
                style={{
                  opacity: i === active ? 1 : 0,
                  transform: i === active ? "translateY(0)" : "translateY(10px)",
                }}
              >
                <div className="flex items-baseline gap-2">
                  <span className="font-display text-4xl font-bold text-ink-900">{s.value}</span>
                  <span className="text-sm text-ink-700">{s.label}</span>
                </div>
                <p className="mt-2 font-mono text-[11px] text-ink-400">{s.sub}</p>
              </div>
            ))}
          </div>

          {/* 进度指示器 - 移到右边，避开左下角 verified 装饰 */}
          <div className="mt-5 flex justify-end gap-1.5">
            {SNAPSHOTS.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setActive(i)}
                className="h-1 rounded-full transition-all duration-300"
                style={{
                  width: i === active ? 24 : 8,
                  backgroundColor: i === active ? "#d97757" : "#d4d2c5",
                }}
                aria-label={`快照 ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* 装饰性浮动小卡片 - 玻璃质感（移到右上，避开底部进度条） */}
      <div className="absolute -right-3 -top-3 hidden h-14 w-14 items-center justify-center rounded-xl border border-white/50 bg-white/40 shadow-soft backdrop-blur-md lg:flex">
        <span className="font-display text-xs font-bold text-clay">AI</span>
      </div>
      <div className="absolute -bottom-2 -right-3 hidden items-center justify-center rounded-lg border border-white/50 bg-white/40 px-2 py-1 shadow-soft backdrop-blur-md lg:flex">
        <span className="font-mono text-[9px] text-moss">verified ✓</span>
      </div>
    </div>
  );
}
