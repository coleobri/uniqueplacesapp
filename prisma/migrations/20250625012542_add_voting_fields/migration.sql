/*
  Warnings:

  - A unique constraint covering the columns `[placeId]` on the table `Place` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `placeId` to the `Place` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Place" ADD COLUMN     "placeId" TEXT NOT NULL,
ADD COLUMN     "votes" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE UNIQUE INDEX "Place_placeId_key" ON "Place"("placeId");
