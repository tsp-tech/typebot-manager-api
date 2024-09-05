-- CreateTable
CREATE TABLE "TypebotSession" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "remoteJid" TEXT NOT NULL,
    "pushName" TEXT NOT NULL,
    "instanceName" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "TypebotSession_remoteJid_key" ON "TypebotSession"("remoteJid");
