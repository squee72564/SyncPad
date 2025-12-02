/*
  Warnings:

  - You are about to drop the column `metadata` on the `rag_chat_message` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "rag_chat_message" DROP COLUMN "metadata";
