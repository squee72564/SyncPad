-- DropForeignKey
ALTER TABLE "ai_job" DROP CONSTRAINT "ai_job_documentId_fkey";

-- AddForeignKey
ALTER TABLE "ai_job" ADD CONSTRAINT "ai_job_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "document"("id") ON DELETE CASCADE ON UPDATE CASCADE;
