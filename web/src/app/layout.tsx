import type { Metadata } from "next";
import { Bricolage_Grotesque, Outfit, JetBrains_Mono } from "next/font/google";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const display = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const body = Outfit({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: {
    default: "彭展玮 | AI Agent / RAG 应用开发",
    template: "%s | 彭展玮",
  },
  description:
    "面向招聘方的个人作品集与 AI 简历分身。可追问的项目证据 + 邀请码保护的 AI 问答。完整简历请在招聘平台获取。",
  openGraph: {
    title: "彭展玮 | AI Agent / RAG 应用开发",
    description: "可验证工程经历 + 邀请码保护的 AI 问答",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="zh-CN"
      className={`${display.variable} ${body.variable} ${mono.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* 在 CSS 之前注入 js 标记：无 JS 时 .reveal 默认可见，有 JS 时才隐藏等待触发 */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
      </head>
      <body className="min-h-screen font-sans antialiased">
        <TooltipProvider delay={200}>
          <SiteHeader />
          <main className="container-page py-8 sm:py-10">{children}</main>
          <SiteFooter />
        </TooltipProvider>
      </body>
    </html>
  );
}
