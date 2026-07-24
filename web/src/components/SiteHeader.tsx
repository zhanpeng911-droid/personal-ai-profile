"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/about", label: "关于" },
  { href: "/projects", label: "项目" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "联系" },
  { href: "/access", label: "AI 分身" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-40 border-b border-paper-200 bg-paper-50/80 backdrop-blur-xl">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Link href="/" className="group flex items-center gap-2">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-clay text-white transition-transform group-hover:scale-105">
            <span className="font-display text-sm font-bold">P</span>
          </span>
          <span className="font-display text-sm font-semibold tracking-wide text-ink-900">
            彭展玮
          </span>
        </Link>

        {/* 桌面导航 */}
        <nav className="hidden items-center gap-7 md:flex">
          {links.map((l) => {
            const active = pathname === l.href || pathname.startsWith(l.href + "/");
            return (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "relative text-sm transition-colors duration-200",
                  active ? "text-clay-dark font-medium" : "text-ink-700 hover:text-ink-900"
                )}
                aria-current={active ? "page" : undefined}
              >
                {l.label}
                {active && (
                  <span className="absolute -bottom-1.5 left-0 h-0.5 w-full rounded-full bg-clay" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/access"
            className="hidden h-9 items-center gap-1.5 rounded-lg bg-clay px-4 text-xs font-medium text-white transition-all hover:bg-clay-dark sm:inline-flex sm:text-sm"
          >
            <MessageSquare size={14} />
            与 AI 交流
          </Link>
          {/* 移动端汉堡按钮 */}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-paper-200 bg-white text-ink-900 md:hidden"
            aria-label={open ? "关闭菜单" : "打开菜单"}
            aria-expanded={open}
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* 移动端下拉菜单 */}
      <div
        className={cn(
          "overflow-hidden border-t border-paper-200 bg-paper-50/95 backdrop-blur-xl transition-[max-height,opacity] duration-300 md:hidden",
          open ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <nav className="container-page flex flex-col gap-1 py-4">
          {links.map((l) => {
            const active = pathname === l.href || pathname.startsWith(l.href + "/");
            return (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "rounded-lg px-4 py-3 text-sm transition-colors",
                  active
                    ? "bg-clay/10 text-clay-dark font-medium"
                    : "text-ink-700 hover:bg-paper-100 hover:text-ink-900"
                )}
              >
                {l.label}
              </Link>
            );
          })}
          <Link
            href="/access"
            className="mt-2 inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-clay text-sm font-medium text-white"
          >
            <MessageSquare size={16} />
            与 AI 交流
          </Link>
        </nav>
      </div>
    </header>
  );
}
