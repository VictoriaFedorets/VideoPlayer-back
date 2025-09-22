/*
  Warnings:

  - A unique constraint covering the columns `[emailConfirmationToken]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "emailConfirmationToken" TEXT,
ADD COLUMN     "emailConfirmed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "resetToken" TEXT,
ADD COLUMN     "resetTokenValidUntil" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "User_emailConfirmationToken_key" ON "public"."User"("emailConfirmationToken");
