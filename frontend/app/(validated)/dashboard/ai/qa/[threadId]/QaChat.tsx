"use client";

import { FormEvent, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { Loader2, RefreshCcw, Send } from "lucide-react";
import { $Enums } from "@generated/prisma-postgres";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn, formatDate } from "@/lib/utils";
import type { AiChatMessageRecord } from "@/lib/ai-chat-message";
import { loadAiChatMessagesAction, sendQaMessageAction } from "./actions";

type QaChatProps = {
  threadId: string;
  threadTitle: string;
  workspaceId: string;
  workspaceName: string;
  initialMessages: AiChatMessageRecord[];
  nextCursor: string | null;
};

type UiMessage = AiChatMessageRecord & { local?: boolean };

export default function QaChat({
  threadId,
  threadTitle,
  workspaceId,
  workspaceName,
  initialMessages,
  nextCursor: initialCursor,
}: QaChatProps) {
  const [messages, setMessages] = useState<UiMessage[]>(initialMessages);
  const [nextCursor, setNextCursor] = useState<string | null>(initialCursor);
  const [input, setInput] = useState("");
  const [isSending, startSending] = useTransition();
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const lastAssistantMessage = useMemo(
    () => [...messages].reverse().find((msg) => msg.role === $Enums.RagChatRole.ASSISTANT),
    [messages]
  );

  const mergeMessages = (current: UiMessage[], incoming: UiMessage[]) => {
    const seen = new Set(current.map((msg) => msg.id));
    return [...current, ...incoming.filter((msg) => !seen.has(msg.id))];
  };

  const refreshMessages = async (limit = 100) => {
    const result = await loadAiChatMessagesAction({ threadId, limit });

    if (!result.success) {
      toast.error(result.error ?? "Failed to refresh messages");
      return;
    }

    if (!result.data) {
      toast.error("Failed to refresh messages");
      return;
    }

    setMessages(result.data.data);
    setNextCursor(result.data.nextCursor);
  };

  const handleSend = (event: FormEvent) => {
    event.preventDefault();
    const query = input.trim();
    if (!query || isSending) return;

    const tempUserMessage: UiMessage = {
      id: `local-${Date.now()}`,
      threadId,
      workspaceId,
      role: $Enums.RagChatRole.USER,
      content: query,
      authorId: null,
      error: false,
      createdAt: new Date(),
    };

    setMessages((prev) => [...prev, tempUserMessage]);
    setInput("");

    startSending(async () => {
      const result = await sendQaMessageAction({ threadId, query });

      if (!result.success) {
        toast.error(result.error ?? "Failed to send message");
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === tempUserMessage.id
              ? {
                  ...msg,
                  error: true,
                }
              : msg
          )
        );
        return;
      }

      if (result.data?.assistantResponse) {
        const tempAssistant: UiMessage = {
          id: `local-assistant-${Date.now()}`,
          threadId,
          workspaceId,
          role: $Enums.RagChatRole.ASSISTANT,
          content: result.data.assistantResponse,
          authorId: null,
          error: false,
          createdAt: new Date(),
        };

        setMessages((prev) => [...prev, tempAssistant]);
      }

      await refreshMessages();
    });
  };

  const handleLoadMore = async () => {
    if (!nextCursor) return;
    setIsLoadingMore(true);

    const result = await loadAiChatMessagesAction({
      threadId,
      cursor: nextCursor,
      limit: 25,
    });

    setIsLoadingMore(false);

    if (!result.success) {
      toast.error(result.error ?? "Failed to load more messages");
      return;
    }

    if (!result.data) {
      toast.error("Failed to load more messages");
      return;
    }

    setMessages((prev) => mergeMessages(prev, result.data!.data));
    setNextCursor(result.data.nextCursor);
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-col gap-1">
        <CardTitle className="flex flex-wrap items-center gap-3">
          {threadTitle}
          <Badge variant="secondary">{workspaceName}</Badge>
        </CardTitle>
        <CardDescription>Converse with the assistant about your workspace content.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {messages.length} message{messages.length === 1 ? "" : "s"}
          </span>
          {lastAssistantMessage ? (
            <span>Last reply at {formatDate(lastAssistantMessage.createdAt)}</span>
          ) : null}
        </div>

        <div className="flex flex-col gap-3 rounded-lg border bg-muted/30 p-4">
          {messages.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              No messages yet. Ask your first question below to start the conversation.
            </div>
          ) : (
            messages.map((message) => {
              const isAssistant = message.role === $Enums.RagChatRole.ASSISTANT;
              const isError = message.error;

              return (
                <div
                  key={message.id}
                  className={cn("flex", isAssistant ? "justify-start" : "justify-end")}
                >
                  <div
                    className={cn(
                      "max-w-3xl rounded-lg border px-3 py-2 text-sm shadow-sm",
                      isAssistant
                        ? "bg-background text-foreground"
                        : "bg-primary text-primary-foreground",
                      isError && "border-destructive text-destructive-foreground bg-destructive/10"
                    )}
                  >
                    <div className="mb-1 flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-wide text-muted-foreground/80">
                      <span>{isAssistant ? "Assistant" : "You"}</span>
                      {message.author?.name ? (
                        <span className="text-muted-foreground/70">{message.author.name}</span>
                      ) : null}
                      <span>• {formatDate(message.createdAt)}</span>
                      {message.local ? <span className="text-orange-500">pending</span> : null}
                      {isError ? <span className="text-destructive">error</span> : null}
                    </div>
                    <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {nextCursor ? (
          <div className="flex justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={handleLoadMore}
              disabled={isLoadingMore || isSending}
            >
              {isLoadingMore ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isLoadingMore ? "Loading..." : "Load more"}
            </Button>
          </div>
        ) : null}
      </CardContent>
      <CardFooter>
        <form onSubmit={handleSend} className="flex w-full flex-col gap-3">
          <Textarea
            placeholder="Ask a question about your workspace..."
            value={input}
            onChange={(event) => setInput(event.target.value)}
            disabled={isSending}
            rows={4}
          />
          <div className="flex items-center justify-between">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => refreshMessages()}
              disabled={isSending}
            >
              <RefreshCcw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Button type="submit" disabled={isSending}>
              {isSending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              {isSending ? "Sending" : "Send"}
            </Button>
          </div>
        </form>
      </CardFooter>
    </Card>
  );
}
