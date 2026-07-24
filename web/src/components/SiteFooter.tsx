import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-paper-200 py-10">
      <div className="container-page flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <p className="font-display text-sm font-medium text-ink-900">彭展玮 · AI 求职分身</p>
          <p className="text-xs text-ink-500">回答仅基于已审核公开资料 · 完整简历请在招聘平台获取</p>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
          <Link href="/projects" className="text-ink-500 transition-colors hover:text-clay-dark">
            项目
          </Link>
          <Link href="/faq" className="text-ink-500 transition-colors hover:text-clay-dark">
            FAQ
          </Link>
          <Link href="/contact#resume-on-platforms" className="text-ink-500 transition-colors hover:text-clay-dark">
            招聘平台
          </Link>
          <Link href="/access" className="text-ink-500 transition-colors hover:text-clay-dark">
            邀请码入口
          </Link>
        </div>
      </div>
    </footer>
  );
}
