/*
  Warnings:

  - Added the required column `inboxId` to the `TypebotSession` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "ChatwootInbox" (
    "inboxId" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "instanceName" TEXT NOT NULL,
    CONSTRAINT "ChatwootInbox_instanceName_fkey" FOREIGN KEY ("instanceName") REFERENCES "EvolutionInstance" ("name") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_TypebotSession" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "botId" TEXT NOT NULL,
    "remoteJid" TEXT NOT NULL,
    "instanceName" TEXT NOT NULL,
    "inboxId" INTEGER NOT NULL,
    CONSTRAINT "TypebotSession_botId_fkey" FOREIGN KEY ("botId") REFERENCES "Bot" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "TypebotSession_inboxId_fkey" FOREIGN KEY ("inboxId") REFERENCES "ChatwootInbox" ("inboxId") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_TypebotSession" ("botId", "id", "instanceName", "remoteJid") SELECT "botId", "id", "instanceName", "remoteJid" FROM "TypebotSession";
DROP TABLE "TypebotSession";
ALTER TABLE "new_TypebotSession" RENAME TO "TypebotSession";
CREATE UNIQUE INDEX "TypebotSession_remoteJid_key" ON "TypebotSession"("remoteJid");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
