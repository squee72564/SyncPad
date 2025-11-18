/*
  Warnings:

  - You are about to alter the column `embedding` on the `document_embedding` table. The data in that column could be lost. The data in that column will be cast from `vector` to `Unsupported("vector")`.

*/
-- AlterTable
ALTER TABLE "document_embedding" ALTER COLUMN "embedding" SET DATA TYPE vector;
