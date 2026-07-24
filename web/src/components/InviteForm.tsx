"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { verifyInvite } from "@/lib/api";

export function InviteForm() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await verifyInvite(code.trim());
      router.push("/ask");
    } catch (err) {
      setError(err instanceof Error ? err.message : "验证失败");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-paper-200 bg-card p-6 shadow-card">
      <div>
        <label htmlFor="invite" className="text-sm text-ink-700">
          邀请码
        </label>
        <input
          id="invite"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="例如 DEMO-2026"
          className="mt-2 w-full rounded-xl border border-paper-200 bg-paper-50 px-4 py-3 text-ink-900 outline-none transition-all placeholder:text-ink-400 focus:border-clay/40 focus:ring-2 focus:ring-clay/15"
          autoComplete="off"
          required
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-clay text-sm font-medium text-white transition-all hover:bg-clay-dark disabled:opacity-40"
      >
        {loading ? "验证中…" : "进入 AI 问答"}
        {!loading && <ArrowRight size={16} />}
      </button>
      <p className="text-xs leading-relaxed text-ink-500">
        本地演示默认邀请码：<code className="rounded bg-paper-200 px-1 py-0.5 font-mono text-clay-dark">DEMO-2026</code>
        。完整简历请在招聘平台下载，本站不提供 PDF。
      </p>
    </form>
  );
}
