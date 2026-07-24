import type { Metadata } from "next";
import { ChatPanel } from "@/components/ChatPanel";

export const metadata: Metadata = { title: "AI 问答" };

export default function AskPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <ChatPanel />
    </div>
  );
}
