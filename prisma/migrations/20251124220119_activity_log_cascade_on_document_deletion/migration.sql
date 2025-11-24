-- DropForeignKey
ALTER TABLE "activity_log" DROP CONSTRAINT "activity_log_documentId_fkey";

-- AddForeignKey
ALTER TABLE "activity_log" ADD CONSTRAINT "activity_log_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "document"("id") ON DELETE CASCADE ON UPDATE CASCADE;
