"use client";

import { useEffect, useRef, useState } from "react";
import { Reveal } from "@/components/Reveal";

type DiagramType = "novamind" | "notebook";

/* ---------- NovaMind 纵向 9 层架构 ---------- */

const NOVAMIND_LAYERS = [
  { title: "CLI 入口", subtitle: "Typer · config / run / monitor / doctor", tag: "入口", core: false },
  { title: "三协程编排", subtitle: "user_input · agent_worker · pacemaker", tag: "EventBus 队列", core: true },
  { title: "自研状态机", subtitle: "agent ⇄ tools 循环 · max_iter=50", tag: "替代 LangGraph", core: true },
  { title: "中间件 + 上下文", subtitle: "洋葱模型 · 回合裁剪 · Context Pack", tag: "可插拔", core: false },
  { title: "多模型 Provider", subtitle: "OpenAI / Anthropic / Ollama 兼容", tag: "ProviderFactory", core: false },
  { title: "策略 + 工具调度", subtitle: "HarnessPolicy 白名单 → tool_executor", tag: "零信任", core: false },
  { title: "工具表面", subtitle: "12 内置工具 + 动态技能 + MCP 适配器", tag: "扩展面", core: false },
  { title: "零信任沙箱", subtitle: "office 沙箱 · commonpath 防穿越 · Shell 白名单", tag: "安全边界", core: true },
  { title: "持久化 + 可观测", subtitle: "SQLite 记忆 · JSONL 审计 · Token 追踪", tag: "可追溯", core: false },
];

// 估测标签宽度：中文约 11px，英文/数字约 6.5px，加 16px padding
function tagWidth(t: string): number {
  let w = 16;
  for (const ch of t) w += /[\u4e00-\u9fa5]/.test(ch) ? 11 : 6.5;
  return Math.ceil(w);
}

function NovaMindDiagram({ visible }: { visible: boolean }) {
  const total = NOVAMIND_LAYERS.length;
  const layerH = 60;
  const gap = 14;
  const top = 16;
  const height = top + total * layerH + (total - 1) * gap + 16;
  const W = 600;

  return (
    <svg
      viewBox={`0 0 ${W} ${height}`}
      className="w-full"
      role="img"
      aria-label="NovaMind 分层架构图"
    >
      <defs>
        <marker id="nm-arrow" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
          <path d="M0,0 L8,4 L0,8 z" fill="#d97757" />
        </marker>
      </defs>

      {NOVAMIND_LAYERS.map((l, i) => {
        const y = top + i * (layerH + gap);
        const tagW = tagWidth(l.tag);
        const op = visible ? 1 : 0;
        const style: React.CSSProperties = {
          opacity: op,
          transition: `opacity .5s ease, transform .5s cubic-bezier(0.16,1,0.3,1)`,
          transitionDelay: `${i * 60}ms`,
          transform: visible ? "translateX(0)" : "translateX(-8px)",
        };
        return (
          <g key={l.title} style={style}>
            {/* 层底条 */}
            <rect
              x={16}
              y={y}
              width={W - 32}
              height={layerH}
              rx={10}
              fill={l.core ? "rgba(217,119,87,0.08)" : "rgba(245,244,238,0.7)"}
              stroke={l.core ? "#d97757" : "#ebe9e0"}
              strokeWidth={l.core ? 1.5 : 1}
              strokeDasharray={l.core ? "5 3" : undefined}
            />
            {/* 左侧序号竖条 */}
            <rect x={16} y={y} width={4} height={layerH} rx={2} fill={l.core ? "#d97757" : "rgba(217,119,87,0.4)"} />
            {/* 序号 */}
            <text x={34} y={y + 22} fill="#9c9b91" style={{ fontSize: 10.5, fontFamily: "var(--font-mono)" }}>
              {String(i + 1).padStart(2, "0")}
            </text>
            {/* 标题 */}
            <text x={54} y={y + 24} fill="#141413" style={{ fontSize: 14, fontWeight: 600, fontFamily: "var(--font-display)" }}>
              {l.title}
            </text>
            {/* 副标题 */}
            <text x={54} y={y + 42} fill="#6b6a63" style={{ fontSize: 11.5 }}>
              {l.subtitle}
            </text>
            {/* 右侧标签 */}
            <g>
              <rect
                x={W - 16 - tagW}
                y={y + 19}
                width={tagW}
                height={22}
                rx={11}
                fill={l.core ? "rgba(217,119,87,0.15)" : "rgba(120,140,93,0.1)"}
              />
              <text
                x={W - 16 - tagW / 2}
                y={y + 34}
                textAnchor="middle"
                fill={l.core ? "#c25e3d" : "#788c5d"}
                style={{ fontSize: 10, fontFamily: "var(--font-mono)" }}
              >
                {l.tag}
              </text>
            </g>
            {/* 层间下行箭头 */}
            {i < total - 1 && (
              <line
                x1={W / 2}
                y1={y + layerH}
                x2={W / 2}
                y2={y + layerH + gap}
                stroke="rgba(217,119,87,0.5)"
                strokeWidth={1.5}
                markerEnd="url(#nm-arrow)"
              />
            )}
          </g>
        );
      })}
    </svg>
  );
}

/* ---------- Notebook 横向流水线 + 回环 ---------- */

function NotebookDiagram({ visible }: { visible: boolean }) {
  const W = 660;
  const mainNodes = [
    { title: "Guardrails", sub: "校验 · 防注入 · 45s" },
    { title: "Planner", sub: "规则分类 · 检索策略" },
    { title: "Retrieval", sub: "HyDE · 混合检索" },
    { title: "Evidence Grader", sub: "规则评分 0.3/0.4" },
    { title: "Answer Generator", sub: "LLM 生成 · 30s" },
  ];
  const nodeH = 52;
  const gap = 12;
  const padX = 16;
  const nodeW = (W - padX * 2 - gap * (mainNodes.length - 1)) / mainNodes.length;
  const xs = mainNodes.map((_, i) => padX + i * (nodeW + gap));
  const row1Y = 16;

  const row2Y = 150;
  const row2Nodes = [
    { title: "Citation Manager", sub: "引用归一化 · 可追溯", accent: true },
    { title: "SSE 流式输出", sub: "10 阶段事件 · 限流", accent: false },
  ];
  const row2W = (W - padX * 2 - gap) / 2;

  const height = 330;

  const nodeStyle = (delay: number): React.CSSProperties => ({
    opacity: visible ? 1 : 0,
    transition: `opacity .5s ease, transform .5s cubic-bezier(0.16,1,0.3,1)`,
    transitionDelay: `${delay}ms`,
    transform: visible ? "translateY(0)" : "translateY(8px)",
  });

  return (
    <svg viewBox={`0 0 ${W} ${height}`} className="w-full" role="img" aria-label="Notebook Agentic RAG 流水线图">
      <defs>
        <marker id="nb-arrow" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
          <path d="M0,0 L8,4 L0,8 z" fill="#d97757" />
        </marker>
        <marker id="nb-loop" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
          <path d="M0,0 L8,4 L0,8 z" fill="#788c5d" />
        </marker>
      </defs>

      {/* 主线节点 + 横向箭头 */}
      {mainNodes.map((n, i) => (
        <g key={n.title} style={nodeStyle(i * 80)}>
          <rect
            x={xs[i]}
            y={row1Y}
            width={nodeW}
            height={nodeH}
            rx={10}
            fill={n.title === "Evidence Grader" ? "rgba(217,119,87,0.12)" : "rgba(245,244,238,0.9)"}
            stroke={n.title === "Evidence Grader" ? "#d97757" : "#ebe9e0"}
            strokeWidth={n.title === "Evidence Grader" ? 1.5 : 1}
          />
          <text x={xs[i] + nodeW / 2} y={row1Y + 22} textAnchor="middle" fill="#141413" style={{ fontSize: 12.5, fontWeight: 600, fontFamily: "var(--font-display)" }}>
            {n.title}
          </text>
          <text x={xs[i] + nodeW / 2} y={row1Y + 38} textAnchor="middle" fill="#6b6a63" style={{ fontSize: 10 }}>
            {n.sub}
          </text>
          {i < mainNodes.length - 1 && (
            <line x1={xs[i] + nodeW} y1={row1Y + nodeH / 2} x2={xs[i + 1]} y2={row1Y + nodeH / 2} stroke="rgba(217,119,87,0.5)" strokeWidth={1.5} markerEnd="url(#nb-arrow)" />
          )}
        </g>
      ))}

      {/* 回环：Evidence Grader(索引3) 不足 -> Planner(索引1) 改写重试 */}
      <g style={nodeStyle(480)}>
        <path
          d={`M ${xs[3] + nodeW / 2} ${row1Y + nodeH}
              C ${xs[3] + nodeW / 2} ${row1Y + nodeH + 40},
                ${xs[1] + nodeW / 2} ${row1Y + nodeH + 40},
                ${xs[1] + nodeW / 2} ${row1Y + nodeH}`}
          fill="none"
          stroke="rgba(120,140,93,0.7)"
          strokeWidth={1.5}
          strokeDasharray="5 3"
          markerEnd="url(#nb-loop)"
        />
        <text x={(xs[1] + xs[3]) / 2 + nodeW / 2} y={row1Y + nodeH + 34} textAnchor="middle" fill="#788c5d" style={{ fontSize: 10.5, fontFamily: "var(--font-mono)" }}>
          证据不足 · Query Rewrite ↺ ≤ 2 轮
        </text>
      </g>

      {/* Evidence Grader 充分 → 下行到第二行 Citation */}
      <g style={nodeStyle(540)}>
        <line x1={xs[3] + nodeW / 2} y1={row1Y + nodeH} x2={xs[3] + nodeW / 2} y2={row2Y - 8} stroke="rgba(217,119,87,0.5)" strokeWidth={1.5} markerEnd="url(#nb-arrow)" />
        <text x={xs[3] + nodeW / 2 + 8} y={row1Y + nodeH + 18} fill="#6b6a63" style={{ fontSize: 10, fontFamily: "var(--font-mono)" }}>
          充分 ↓
        </text>
      </g>

      {/* 第二行：Citation -> SSE */}
      {row2Nodes.map((n, i) => (
        <g key={n.title} style={nodeStyle(620 + i * 80)}>
          <rect
            x={padX + i * (row2W + gap)}
            y={row2Y}
            width={row2W}
            height={nodeH}
            rx={10}
            fill={n.accent ? "rgba(217,119,87,0.12)" : "rgba(245,244,238,0.9)"}
            stroke={n.accent ? "#d97757" : "#ebe9e0"}
            strokeWidth={n.accent ? 1.5 : 1}
          />
          <text x={padX + i * (row2W + gap) + row2W / 2} y={row2Y + 22} textAnchor="middle" fill="#141413" style={{ fontSize: 12.5, fontWeight: 600, fontFamily: "var(--font-display)" }}>
            {n.title}
          </text>
          <text x={padX + i * (row2W + gap) + row2W / 2} y={row2Y + 38} textAnchor="middle" fill="#6b6a63" style={{ fontSize: 10 }}>
            {n.sub}
          </text>
          {i < row2Nodes.length - 1 && (
            <line x1={padX + row2W} y1={row2Y + nodeH / 2} x2={padX + row2W + gap} y2={row2Y + nodeH / 2} stroke="rgba(217,119,87,0.5)" strokeWidth={1.5} markerEnd="url(#nb-arrow)" />
          )}
        </g>
      ))}

      {/* 底部支撑层 */}
      <g style={nodeStyle(820)}>
        <line x1={padX} y1={row2Y + nodeH + 26} x2={W - padX} y2={row2Y + nodeH + 26} stroke="#ebe9e0" strokeWidth={1} />
        <text x={padX} y={row2Y + nodeH + 46} fill="#9c9b91" style={{ fontSize: 10, fontFamily: "var(--font-mono)" }}>
          支撑层
        </text>
        <text x={padX} y={row2Y + nodeH + 66} fill="#6b6a63" style={{ fontSize: 11 }}>
          用户/空间隔离（JWT → 检索过滤 → 数据层） · Celery 异步索引 + Beat 补偿 · 多模型工厂
        </text>
        <text x={padX} y={row2Y + nodeH + 84} fill="#9c9b91" style={{ fontSize: 10, fontFamily: "var(--font-mono)" }}>
          max_retrieval_rounds=2 · 45s 总超时 · 三道闸防无限循环
        </text>
      </g>
    </svg>
  );
}

/* ---------- 对外组件 ---------- */

export function ProjectDiagram({ type }: { type: DiagramType }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ob = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setVisible(true);
            ob.disconnect();
          }
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" },
    );
    ob.observe(el);
    return () => ob.disconnect();
  }, []);

  return (
    <Reveal as="section" className="rounded-2xl border border-paper-200 bg-card/60 p-6 shadow-card backdrop-blur-sm">
      <div ref={ref} className="mb-4 flex items-center justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-wider text-clay-dark">Architecture</p>
          <h2 className="mt-1 font-display text-lg font-semibold text-ink-900">
            {type === "novamind" ? "分层架构" : "Agentic RAG 流水线"}
          </h2>
        </div>
        <button
          type="button"
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          onFocus={() => setHovered(true)}
          onBlur={() => setHovered(false)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-paper-200 bg-paper-50 px-2.5 py-1.5 text-xs text-ink-500 transition-colors hover:border-clay/30 hover:text-clay-dark"
          aria-label="可追问点"
        >
          <span className="inline-block h-1.5 w-1.5 animate-pulse-dot rounded-full bg-clay" />
          可追问点
        </button>
      </div>

      {hovered && (
        <div className="mb-4 rounded-xl border border-clay/20 bg-clay/5 p-3 text-xs leading-relaxed text-ink-700">
          {type === "novamind" ? (
            <ul className="space-y-1">
              <li>· 状态机条件路由如何实现？agent⇄tools 循环如何防死循环？</li>
              <li>· 三协程为何心跳与用户输入共享同一队列？</li>
              <li>· 零信任沙箱为何用 commonpath 而非字符串前缀匹配？</li>
            </ul>
          ) : (
            <ul className="space-y-1">
              <li>· Planner 如何决定检索策略？为何用规则引擎而非 LLM？</li>
              <li>· Evidence Grader 评分标准？为何第二轮放宽？</li>
              <li>· 如何用三道闸防止 Agent 无限循环？</li>
            </ul>
          )}
        </div>
      )}

      <div className="overflow-x-auto">
        {type === "novamind" ? <NovaMindDiagram visible={visible} /> : <NotebookDiagram visible={visible} />}
      </div>

      <p className="mt-4 border-t border-paper-200 pt-3 text-xs text-ink-400">
        {type === "novamind"
          ? "自上而下分层 · 虚线框为核心自研模块（状态机 / 协程编排 / 沙箱）"
          : "横向流水线 · 绿色虚线为证据不足时的改写重试回环"}
      </p>
    </Reveal>
  );
}
