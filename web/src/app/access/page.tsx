import type { Metadata } from "next";
import { Lock, MessageSquare, FileText } from "lucide-react";
import { InviteForm } from "@/components/InviteForm";
import { Reveal } from "@/components/Reveal";

export const metadata: Metadata = { title: "邀请码" };

export default function AccessPage() {
  return (
    <div className="mx-auto grid max-w-4xl gap-8 lg:grid-cols-2">
      <Reveal className="space-y-4">
        <p className="font-mono text-xs uppercase tracking-wider text-clay-dark">Access</p>
        <h1 className="font-display text-3xl font-bold text-ink-900">邀请码入口</h1>
        <p className="text-sm leading-relaxed text-ink-700">
          AI 问答仅对邀请码持有者开放，用于控制成本与滥用。回答只基于候选人审核过的公开求职资料。
        </p>
        <div className="space-y-3 rounded-2xl border border-paper-200 bg-card p-5 shadow-card">
          <div className="flex gap-2.5 text-sm text-ink-700">
            <Lock size={16} className="mt-0.5 shrink-0 text-clay" />
            <p>请勿输入个人敏感信息。</p>
          </div>
          <div className="flex gap-2.5 text-sm text-ink-700">
            <MessageSquare size={16} className="mt-0.5 shrink-0 text-clay" />
            <p>系统默认仅保存访问统计与错误信息，不保存完整对话。</p>
          </div>
          <div className="flex gap-2.5 text-sm text-ink-700">
            <FileText size={16} className="mt-0.5 shrink-0 text-clay" />
            <p>完整简历请在招聘平台下载，本站不提供 PDF。</p>
          </div>
        </div>
      </Reveal>
      <Reveal delay={120}>
        <InviteForm />
      </Reveal>
    </div>
  );
}
