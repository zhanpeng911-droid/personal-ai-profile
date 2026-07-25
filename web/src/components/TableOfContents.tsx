"use client";

import { useEffect, useState } from "react";

type TocItem = {
  id: string;
  label: string;
};

export function TableOfContents({ items }: { items: TocItem[] }) {
  const [active, setActive] = useState<string>("");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActive(entry.target.id);
          }
        }
      },
      { rootMargin: "-80px 0px -70% 0px", threshold: 0 },
    );

    for (const item of items) {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [items]);

  function handleClick(e: React.MouseEvent, id: string) {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  return (
    <nav
      className="rounded-xl border border-white/40 bg-white/30 p-4 shadow-soft-lg backdrop-blur-md"
      aria-label="页面目录"
    >
      <p className="mb-3 font-mono text-[10px] uppercase tracking-wider text-ink-400">
        目录 · Contents
      </p>
      <ul className="space-y-1.5 border-l border-paper-200">
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              onClick={(e) => handleClick(e, item.id)}
              className={`-ml-px block border-l-2 py-1 pl-3 text-xs transition-all ${
                active === item.id
                  ? "border-clay font-medium text-clay-dark"
                  : "border-transparent text-ink-500 hover:text-ink-900"
              }`}
              aria-current={active === item.id ? "true" : undefined}
            >
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
