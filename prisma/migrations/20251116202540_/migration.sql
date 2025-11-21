/*
  Warnings:

  - You are about to alter the column `embedding` on the `document_embedding` table. The data in that column could be lost. The data in that column will be cast from `vector` to `Unsupported("vector")`.

*/
-- AlterTable
ALTER TABLE "document_embedding" ALTER COLUMN "embedding" SET DATA TYPE vector;

-- CreateTable
CREATE TABLE "document_collab_state" (
    "documentId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "snapshot" JSONB,
    "version" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "document_collab_state_pkey" PRIMARY KEY ("documentId")
);

-- CreateIndex
CREATE INDEX "document_collab_state_workspaceId_idx" ON "document_collab_state"("workspaceId");

-- AddForeignKey
ALTER TABLE "document_collab_state" ADD CONSTRAINT "document_collab_state_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_collab_state" ADD CONSTRAINT "document_collab_state_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
