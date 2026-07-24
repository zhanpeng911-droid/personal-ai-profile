"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Bot, Send, RotateCcw, Sparkles } from "lucide-react";
import { ChatMessage, ChatResponse, fetchMe, sendChatStream } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const STARTERS = [
  "你的求职方向是什么？",
  "NovaMind 解决了什么问题？",
  "完整简历在哪里看？",
  "AI 分身的回答可信吗？",
];

const MODE_LABEL: Record<ChatResponse["mode"], { text: string; cls: string }> = {
  faq: { text: "精选问答", cls: "bg-moss/10 text-moss border-moss/20" },
  llm: { text: "AI 生成", cls: "bg-clay/10 text-clay-dark border-clay/20" },
  retrieval: { text: "资料摘录", cls: "bg-gold/10 text-gold border-gold/20" },
  refusal: { text: "资料未覆盖", cls: "bg-ink-500/10 text-ink-500 border-ink-500/20" },
};

type UiMessage = {
  role: "user" | "assistant";
  content: string;
  sources?: ChatResponse["sources"];
  mode?: ChatResponse["mode"];
  suggestions?: string[];
};

export function ChatPanel() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [connError, setConnError] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [dailyLimit, setDailyLimit] = useState<number | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastQuery, setLastQuery] = useState<string>("");
  const [messages, setMessages] = useState<UiMessage[]>([
    {
      role: "assistant",
      content:
        "你好，我是候选人的 **AI 简历分身**。我会基于已审核资料回答你的问题；资料不足时会明确说明。完整简历请在 Boss 直聘查看。\n\n你可以从下方推荐问题开始，或直接输入想了解的内容。",
    },
  ]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    fetchMe()
      .then((me) => {
        if (cancelled) return;
        if (!me.authenticated) {
          router.replace("/access");
          return;
        }
        setRemaining(me.remaining_questions ?? null);
        setDailyLimit(me.daily_limit ?? null);
        setReady(true);
      })
      .catch(() => {
        if (!cancelled) setConnError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [router]);

  // 消息变化时滚到底部
  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    }
  }, [messages, loading]);

  async function ask(text: string) {
    const message = text.trim();
    if (!message || loading) return;
    setError(null);
    setLoading(true);
    setLastQuery(message);
    setInput("");
    const nextHistory: ChatMessage[] = messages
      .filter((m) => m.role === "user" || m.role === "assistant")
      .slice(-8)
      .map((m) => ({ role: m.role, content: m.content }));

    setMessages((prev) => [
      ...prev,
      { role: "user", content: message },
      { role: "assistant", content: "" },
    ]);

    try {
      await sendChatStream(message, nextHistory, {
        onMeta: (meta) => {
          setRemaining(meta.remaining_questions);
          setMessages((prev) => {
            const updated = [...prev];
            const last = updated[updated.length - 1];
            if (last && last.role === "assistant") {
              updated[updated.length - 1] = {
                ...last,
                mode: meta.mode as ChatResponse["mode"],
                sources: meta.sources,
                suggestions: meta.suggested_questions,
              };
            }
            return updated;
          });
        },
        onDelta: (content) => {
          setMessages((prev) => {
            const updated = [...prev];
            const last = updated[updated.length - 1];
            if (last && last.role === "assistant") {
              updated[updated.length - 1] = { ...last, content: last.content + content };
            }
            return updated;
          });
        },
        onComplete: (response) => {
          setRemaining(response.remaining_questions);
          setMessages((prev) => {
            const updated = [...prev];
            const last = updated[updated.length - 1];
            if (last && last.role === "assistant") {
              updated[updated.length - 1] = {
                ...last,
                content: response.answer,
                sources: response.sources,
                mode: response.mode,
                suggestions: response.suggested_questions,
              };
            }
            return updated;
          });
        },
        onError: (msg) => {
          setError(msg);
          setMessages((prev) => {
            const last = prev[prev.length - 1];
            if (last && last.role === "assistant" && !last.content) {
              return prev.slice(0, -1);
            }
            return prev;
          });
        },
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "请求失败";
      setError(msg);
      if (msg.includes("401") || msg === "unauthorized") {
        router.replace("/access");
      }
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last && last.role === "assistant" && !last.content) {
          return prev.slice(0, -1);
        }
        return prev;
      });
    } finally {
      setLoading(false);
    }
  }

  if (connError) {
    return (
      <div className="flex h-[calc(100dvh-12rem)] flex-col items-center justify-center gap-4 px-6 text-center">
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-500">
          <RotateCcw size={22} />
        </span>
        <div>
          <p className="font-medium text-ink-900">无法连接到服务</p>
          <p className="mt-1 text-sm text-ink-500">网络异常或服务暂不可用，请稍后重试。</p>
        </div>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="inline-flex items-center gap-2 rounded-xl bg-clay px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-clay-dark"
        >
          <RotateCcw size={14} />
          重新加载
        </button>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="flex h-[calc(100dvh-12rem)] flex-col items-center justify-center gap-3">
        <span className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-clay animate-pulse-dot" style={{ animationDelay: "0ms" }} />
          <span className="h-2.5 w-2.5 rounded-full bg-clay animate-pulse-dot" style={{ animationDelay: "200ms" }} />
          <span className="h-2.5 w-2.5 rounded-full bg-clay animate-pulse-dot" style={{ animationDelay: "400ms" }} />
        </span>
        <p className="text-sm text-ink-500">检查访问权限…</p>
      </div>
    );
  }

  const lowQuota = remaining !== null && remaining <= 5;

  return (
    <div className="flex h-[calc(100dvh-12rem)] flex-col overflow-hidden rounded-2xl border border-paper-200 bg-card shadow-soft-lg">
      {/* 顶栏 - 固定不滚动 */}
      <div className="flex shrink-0 items-center justify-between border-b border-paper-200 bg-paper-50/80 px-4 py-3 backdrop-blur sm:px-6">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-clay/10 text-clay">
            <Bot size={18} />
          </span>
          <div>
            <h1 className="font-display text-base font-semibold text-ink-900">AI 简历分身</h1>
            <p className="text-xs text-ink-500">仅基于已审核资料 · 不提供站内简历下载</p>
          </div>
        </div>
        <Badge
          variant="outline"
          className={cn(
            "shrink-0 font-medium",
            lowQuota
              ? "border-gold/30 bg-gold/10 text-gold"
              : "border-clay/20 bg-clay/5 text-clay-dark"
          )}
        >
          剩余 {remaining ?? "-"} 次
        </Badge>
      </div>

      {/* 消息区 - 唯一滚动区 */}
      <div
        ref={scrollRef}
        className="flex-1 space-y-5 overflow-y-auto px-4 py-5 sm:px-6"
      >
        {messages.map((m, i) => (
          <div
            key={i}
            className={cn("flex animate-fade-up", m.role === "user" ? "justify-end" : "justify-start")}
          >
            <div
              className={cn(
                "max-w-[88%] rounded-2xl px-4 py-3 sm:max-w-[80%]",
                m.role === "user"
                  ? "rounded-br-sm bg-clay text-white"
                  : "rounded-bl-sm border border-paper-200 bg-paper-50 text-ink-900"
              )}
            >
              {m.role === "assistant" ? (
                <div className="prose-chat">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content || " "}</ReactMarkdown>
                </div>
              ) : (
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{m.content}</p>
              )}

              {/* 状态标签 */}
              {m.role === "assistant" && m.mode && (m.content) && (
                <div className="mt-2.5 flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className={cn("text-[11px]", MODE_LABEL[m.mode].cls)}>
                    {MODE_LABEL[m.mode].text}
                  </Badge>
                </div>
              )}

              {/* 追问建议 */}
              {m.role === "assistant" && m.suggestions && m.suggestions.length > 0 && (m.content) && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {m.suggestions.map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => ask(q)}
                      className="rounded-full border border-paper-200 bg-white px-3 py-1.5 text-xs text-ink-700 transition-all hover:border-clay/30 hover:bg-clay/5 hover:text-clay-dark"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* AI 思考动效 */}
        {loading && (() => {
          const last = messages[messages.length - 1];
          const waiting = !last || last.role !== "assistant" || !last.content;
          if (!waiting) return null;
          return (
            <div className="flex justify-start">
              <div className="flex items-center gap-2 rounded-2xl rounded-bl-sm border border-paper-200 bg-paper-50 px-4 py-3">
                <span className="flex gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-clay animate-pulse-dot" style={{ animationDelay: "0ms" }} />
                  <span className="h-2 w-2 rounded-full bg-clay animate-pulse-dot" style={{ animationDelay: "200ms" }} />
                  <span className="h-2 w-2 rounded-full bg-clay animate-pulse-dot" style={{ animationDelay: "400ms" }} />
                </span>
                <span className="text-xs text-ink-500">AI 分身检索资料中…</span>
              </div>
            </div>
          );
        })()}
      </div>

      {/* 配额低提醒 */}
      {lowQuota && remaining !== null && (
        <div className="shrink-0 border-t border-gold/15 bg-gold/5 px-4 py-2 text-center text-xs text-gold sm:px-6">
          今日剩余提问次数较少（{remaining} 次），请合理分配。
        </div>
      )}

      {/* 输入区 - 固定不滚动 */}
      <div className="shrink-0 border-t border-paper-200 bg-card px-4 py-4 sm:px-6">
        <div className="mb-3 flex flex-wrap gap-2">
          {STARTERS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => ask(s)}
              className="inline-flex items-center gap-1.5 rounded-full border border-paper-200 bg-white px-3 py-1.5 text-xs text-ink-700 transition-all hover:border-clay/30 hover:bg-clay/5 hover:text-clay-dark"
            >
              <Sparkles size={12} className="text-clay/60" />
              {s}
            </button>
          ))}
        </div>
        {error && (
          <div className="mb-2 flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2">
            <p className="text-sm text-red-600">{error}</p>
            <button
              type="button"
              onClick={() => ask(lastQuery)}
              className="inline-flex shrink-0 items-center gap-1 rounded-md border border-red-300 px-2.5 py-1 text-xs text-red-600 transition-colors hover:bg-red-100"
            >
              <RotateCcw size={12} />
              重试
            </button>
          </div>
        )}
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            ask(input);
          }}
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="输入与候选人经历相关的问题…"
            className="min-h-11 flex-1 rounded-xl border border-paper-200 bg-paper-50 px-4 text-sm text-ink-900 outline-none transition-all placeholder:text-ink-400 focus:border-clay/40 focus:ring-2 focus:ring-clay/15"
            maxLength={800}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-clay px-5 text-sm font-medium text-white transition-all hover:bg-clay-dark disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Send size={16} />
            发送
          </button>
        </form>
      </div>
    </div>
  );
}
