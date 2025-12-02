"use client";

import { useMemo, useState, useTransition } from "react";
import { Send } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { askWorkspaceQuestionAction } from "../actions";
import { RagHistoryMessage } from "@/lib/rag";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

type ChatMessage = RagHistoryMessage & { id: string; error: boolean };

type QaChatProps = {
  workspaceId: string;
  threadId: string;
  workspaceName?: string;
};

const createId = () => Math.random().toString(36).slice(2);

export default function QaChat({ threadId, workspaceId, workspaceName }: QaChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "intro",
      role: "ASSISTANT",
      content: workspaceName
        ? `You’re chatting with your ${workspaceName} workspace. Ask me about documents, decisions, or anything saved here.`
        : "You’re chatting with your workspace. Ask me about documents, decisions, or anything saved here.",
      error: false,
    },
  ]);
  const [input, setInput] = useState("");
  const [isPending, startTransition] = useTransition();

  const disableSend = useMemo(() => isPending || input.trim().length === 0, [input, isPending]);

  const handleSend = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (disableSend) return;

    const trimmed = input.trim();
    const userMessage: ChatMessage = {
      id: createId(),
      role: "USER",
      content: trimmed,
      error: false,
    };
    const nextMessages = [...messages, userMessage];

    setMessages(nextMessages);
    setInput("");

    startTransition(async () => {
      const result = await askWorkspaceQuestionAction(workspaceId, threadId, {
        query: trimmed,
      });

      if (result.success && !result.data) {
        toast.error("Error processing request.");
        return;
      }

      const assistantMessage: ChatMessage = {
        id: createId(),
        role: "ASSISTANT",
        content: result.success
          ? result.data
            ? result.data.response
            : "Error Processing Request."
          : result.error,
        error: !result || !result.success || !result.data,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    });
  };

  return (
    <Card className="h-full w-full">
      <CardHeader className="border-b">
        <CardTitle>Ask a question</CardTitle>
        <CardDescription>We’ll ground responses in your workspace documents.</CardDescription>
      </CardHeader>
      <CardContent className="flex h-full flex-col gap-6 py-6">
        <div className="flex flex-1 flex-col gap-3">
          <div className="flex flex-1 flex-col gap-3 overflow-y-auto rounded-lg border bg-muted/40 p-4">
            {messages.map((message) => (
              <Badge
                key={message.id}
                variant={message.error ? "destructive" : "outline"}
                className={cn(
                  "flex flex-col gap-1 rounded-lg p-3 text-sm shadow-sm",
                  message.role === "ASSISTANT"
                    ? "border border-primary/20 bg-primary/5"
                    : "border ml-auto border-muted-foreground/30 bg-background"
                )}
              >
                <span className="text-xs font-semibold uppercase text-muted-foreground">
                  {message.role === "ASSISTANT" ? "Assistant" : "You"}
                </span>
                <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
              </Badge>
            ))}
            {isPending && (
              <div className="flex flex-col gap-1 rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm shadow-sm">
                <span className="text-xs font-semibold uppercase text-muted-foreground">
                  Assistant
                </span>
                <p className="animate-pulse text-muted-foreground">Thinking…</p>
              </div>
            )}
          </div>
        </div>

        <form onSubmit={handleSend} className="flex flex-col gap-3">
          <Textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Ask about a document, decision, or topic…"
            rows={3}
            disabled={isPending}
            className="resize-none"
          />
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              Queries are scoped to the current workspace. Avoid sharing sensitive personal data.
            </p>
            <Button type="submit" disabled={disableSend} className="inline-flex items-center gap-2">
              <Send className="h-4 w-4" />
              {isPending ? "Generating…" : "Send"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
