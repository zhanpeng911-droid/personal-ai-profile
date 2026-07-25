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
    <form onSubmit={onSubmit} className="glass space-y-4 p-6">
      <div>
        <label htmlFor="invite" className="text-sm text-ink-700">
          邀请码
        </label>
        <input
          id="invite"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="例如 DEMO-2026"
          className="mt-2 w-full rounded-xl border border-white/50 bg-white/30 px-4 py-3 text-ink-900 outline-none backdrop-blur-sm transition-all placeholder:text-ink-400 focus:border-clay/40 focus:bg-white/40 focus:ring-2 focus:ring-clay/15"
          autoComplete="off"
          required
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="glass-btn-primary h-11 w-full justify-center disabled:opacity-40"
      >
        {loading ? "验证中…" : "进入 AI 问答"}
        {!loading && <ArrowRight size={16} />}
      </button>
      <p className="text-xs leading-relaxed text-ink-500">
        本地演示默认邀请码：<code className="glass-tag px-1 py-0.5 text-clay-dark">DEMO-2026</code>
        。完整简历请在 Boss 直聘查看，本站不提供 PDF。
      </p>
    </form>
  );
}
