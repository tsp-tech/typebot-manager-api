/*
  Warnings:

  - You are about to drop the column `pushName` on the `TypebotSession` table. All the data in the column will be lost.
  - Added the required column `botId` to the `TypebotSession` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "Bot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "instanceName" TEXT NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_TypebotSession" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "botId" TEXT NOT NULL,
    "remoteJid" TEXT NOT NULL,
    "instanceName" TEXT NOT NULL,
    CONSTRAINT "TypebotSession_botId_fkey" FOREIGN KEY ("botId") REFERENCES "Bot" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_TypebotSession" ("id", "instanceName", "remoteJid") SELECT "id", "instanceName", "remoteJid" FROM "TypebotSession";
DROP TABLE "TypebotSession";
ALTER TABLE "new_TypebotSession" RENAME TO "TypebotSession";
CREATE UNIQUE INDEX "TypebotSession_remoteJid_key" ON "TypebotSession"("remoteJid");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
