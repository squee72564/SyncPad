-- CreateEnum
CREATE TYPE "RagChatRole" AS ENUM ('USER', 'ASSISTANT');

-- CreateTable
CREATE TABLE "rag_chat_thread" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "createdById" TEXT,
    "title" TEXT,
    "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rag_chat_thread_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rag_chat_message" (
    "id" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "authorId" TEXT,
    "role" "RagChatRole" NOT NULL,
    "content" TEXT NOT NULL,
    "error" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rag_chat_message_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "rag_chat_thread_workspaceId_lastMessageAt_idx" ON "rag_chat_thread"("workspaceId", "lastMessageAt");

-- CreateIndex
CREATE INDEX "rag_chat_message_threadId_createdAt_idx" ON "rag_chat_message"("threadId", "createdAt");

-- CreateIndex
CREATE INDEX "rag_chat_message_workspaceId_createdAt_idx" ON "rag_chat_message"("workspaceId", "createdAt");

-- AddForeignKey
ALTER TABLE "rag_chat_thread" ADD CONSTRAINT "rag_chat_thread_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rag_chat_thread" ADD CONSTRAINT "rag_chat_thread_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rag_chat_message" ADD CONSTRAINT "rag_chat_message_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "rag_chat_thread"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rag_chat_message" ADD CONSTRAINT "rag_chat_message_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rag_chat_message" ADD CONSTRAINT "rag_chat_message_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
