// 开发环境：API 地址跟随当前页面 hostname，便于局域网/多设备访问
// 生产环境可通过 NEXT_PUBLIC_API_BASE 覆盖
const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ||
  (typeof window !== "undefined" ? `${window.location.protocol}//${window.location.hostname}:8009` : "http://localhost:8009");

export type ChatMessage = { role: "user" | "assistant"; content: string };

export type ChatResponse = {
  answer: string;
  sources: { id: string; title: string; anchor?: string | null }[];
  mode: "faq" | "retrieval" | "llm" | "refusal";
  remaining_questions: number;
  suggested_questions: string[];
};

export type AccessMe = {
  authenticated: boolean;
  remaining_questions?: number | null;
  daily_limit?: number | null;
  invite_id?: string | null;
};

async function parseError(res: Response): Promise<string> {
  try {
    const data = await res.json();
    return data.detail || data.message || res.statusText;
  } catch {
    return res.statusText;
  }
}

export async function verifyInvite(inviteCode: string): Promise<{ ok: boolean; daily_limit: number }> {
  const res = await fetch(`${API_BASE}/v1/access/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ invite_code: inviteCode }),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function fetchMe(): Promise<AccessMe> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(`${API_BASE}/v1/access/me`, {
      credentials: "include",
      cache: "no-store",
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) return { authenticated: false };
    return res.json();
  } catch {
    return { authenticated: false };
  }
}

export async function sendChat(message: string, history: ChatMessage[]): Promise<ChatResponse> {
  const res = await fetch(`${API_BASE}/v1/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ message, history }),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export type StreamCallbacks = {
  onMeta?: (meta: { sources: ChatResponse["sources"]; mode: string; remaining_questions: number; suggested_questions: string[] }) => void;
  onDelta?: (content: string) => void;
  onComplete?: (response: ChatResponse) => void;
  onError?: (message: string) => void;
};

/** 流式问答。用 fetch + ReadableStream 解析 SSE。 */
export async function sendChatStream(
  message: string,
  history: ChatMessage[],
  callbacks: StreamCallbacks,
): Promise<void> {
  const res = await fetch(`${API_BASE}/v1/chat/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ message, history }),
  });
  if (!res.ok) {
    throw new Error(await parseError(res));
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error("stream_unavailable");

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    // 按双换行分割 SSE 事件
    const parts = buffer.split("\n\n");
    buffer = parts.pop() || "";

    for (const part of parts) {
      const line = part.trim();
      if (!line.startsWith("data: ")) continue;
      const jsonStr = line.slice(6);
      try {
        const data = JSON.parse(jsonStr);
        if (data.type === "meta") {
          callbacks.onMeta?.(data);
        } else if (data.type === "delta") {
          callbacks.onDelta?.(data.content);
        } else if (data.type === "complete") {
          const { type, ...response } = data;
          callbacks.onComplete?.(response as ChatResponse);
        } else if (data.type === "error") {
          callbacks.onError?.(data.message || "生成异常");
        }
      } catch {
        // 忽略解析失败
      }
    }
  }
}

export { API_BASE };
