"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Loader2, MessageSquare, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";

import type { AiChatThreadRecord } from "@/lib/ai-chat-thread";
import {
  createAiChatThreadAction,
  deleteAiChatThreadAction,
  loadAiChatThreadsAction,
  updateAiChatThreadAction,
} from "./actions";
import { useCursorPagination } from "@/hooks/useCursorPagination";
import { cn, formatDate } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type ThreadListProps = {
  workspaceName: string;
  threads: AiChatThreadRecord[];
  nextCursor: string | null;
};

export default function ThreadList({ workspaceName, threads, nextCursor }: ThreadListProps) {
  const [title, setTitle] = useState("");
  const [editingThreadId, setEditingThreadId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const {
    items,
    nextCursor: cursor,
    isLoading,
    loadMore,
    setItems,
  } = useCursorPagination<AiChatThreadRecord>({
    initialData: threads,
    initialCursor: nextCursor,
    loadMore: async (currentCursor) => {
      const result = await loadAiChatThreadsAction({
        cursor: currentCursor ?? undefined,
        limit: 10,
      });

      if (!result.success) {
        toast.error(result.error ?? "Failed to load more threads");
        return { data: [], nextCursor: null };
      }

      if (!result.data) {
        return { data: [], nextCursor: null };
      }

      return result.data;
    },
  });

  const handleCreate = () => {
    const trimmed = title.trim();

    startTransition(async () => {
      const result = await createAiChatThreadAction({ title: trimmed || null });

      if (!result.success) {
        toast.error(result.error ?? "Unable to create chat");
        return;
      }

      if (result.data && result.data.thread) {
        setItems((prev) => [result.data!.thread, ...prev]);
        setTitle("");
        toast.success("Chat thread created");
        return;
      }

      toast.error("Unable to create chat");
    });
  };

  const handleRename = (thread: AiChatThreadRecord) => {
    const nextTitle =
      thread.title ?? `Chat ${new Date(thread.createdAt).toLocaleDateString("en-US")}`;
    const value = window.prompt("Rename chat thread", nextTitle);

    if (value === null) {
      return;
    }

    const trimmed = value.trim();
    setEditingThreadId(thread.id);

    startTransition(async () => {
      const result = await updateAiChatThreadAction({
        threadId: thread.id,
        title: trimmed.length > 0 ? trimmed : null,
      });

      setEditingThreadId(null);

      if (!result.success) {
        toast.error(result.error ?? "Failed to rename chat");
        return;
      }

      if (result.data && result.data.thread) {
        setItems((prev) =>
          prev.map((item) => (item.id === thread.id ? result.data!.thread : item))
        );
        toast.success("Chat renamed");
        return;
      }

      toast.error("Failed to rename chat");
    });
  };

  const handleDelete = (threadId: string) => {
    const confirmed = window.confirm(
      "Delete this chat thread and its messages? This cannot be undone."
    );
    if (!confirmed) {
      return;
    }

    startTransition(async () => {
      const result = await deleteAiChatThreadAction(threadId);

      if (!result.success) {
        toast.error(result.error ?? "Failed to delete chat");
        return;
      }

      setItems((prev) => prev.filter((item) => item.id !== threadId));
      toast.success("Chat removed");
    });
  };

  const isMutating = isPending;

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>New chat</CardTitle>
          <CardDescription>
            Start a fresh conversation inside <span className="font-medium">{workspaceName}</span>.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <Input
              placeholder="Chat Title (e.g., Roadmap Q&A)"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  handleCreate();
                }
              }}
              disabled={isMutating}
            />
            <Button onClick={handleCreate} disabled={isMutating} className="w-full md:w-auto">
              {isMutating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              Start chat
            </Button>
          </div>
        </CardContent>
      </Card>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-muted-foreground/40 p-10 text-center">
          <h3 className="text-base font-semibold">No chats yet</h3>
          <p className="max-w-sm text-sm text-muted-foreground">
            Create your first chat to ask questions about the documents in {workspaceName}.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((thread) => {
            const label = thread.title?.trim() || "Untitled chat";
            const lastActivity = formatDate(thread.lastMessageAt);

            return (
              <Card key={thread.id} className="flex h-full flex-col">
                <CardHeader className="flex flex-row items-start gap-3 space-y-0">
                  <div className="flex-1 space-y-1">
                    <CardTitle className="line-clamp-1 text-base">
                      <Link href={`/dashboard/ai/qa/${thread.id}`} className="hover:underline">
                        {label}
                      </Link>
                    </CardTitle>
                    <CardDescription>Updated {lastActivity}</CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleRename(thread)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Rename
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => handleDelete(thread.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col gap-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2 text-xs font-medium uppercase text-muted-foreground/80">
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" />
                      Chat
                    </Badge>
                    <span className={cn("text-muted-foreground")}>
                      Last activity {lastActivity}
                    </span>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button asChild variant="link" className="p-0 text-sm">
                    <Link href={`/dashboard/ai/qa/${thread.id}`}>Open chat</Link>
                  </Button>
                  {editingThreadId === thread.id ? (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Saving...
                    </div>
                  ) : null}
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      {cursor ? (
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={loadMore}
            disabled={isLoading || isMutating}
            className="w-full md:w-auto"
          >
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {isLoading ? "Loading..." : "Load more"}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
