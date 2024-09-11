-- CreateTable
CREATE TABLE "EvolutionInstance" (
    "name" TEXT NOT NULL,

    CONSTRAINT "EvolutionInstance_pkey" PRIMARY KEY ("name")
);

-- CreateTable
CREATE TABLE "ChatwootInbox" (
    "inboxId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "instanceName" TEXT NOT NULL,

    CONSTRAINT "ChatwootInbox_pkey" PRIMARY KEY ("inboxId")
);

-- CreateTable
CREATE TABLE "Bot" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "instanceName" TEXT NOT NULL,

    CONSTRAINT "Bot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TypebotSession" (
    "id" SERIAL NOT NULL,
    "botId" TEXT NOT NULL,
    "remoteJid" TEXT NOT NULL,
    "instanceName" TEXT NOT NULL,
    "inboxId" INTEGER NOT NULL,

    CONSTRAINT "TypebotSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TypebotSession_remoteJid_key" ON "TypebotSession"("remoteJid");

-- AddForeignKey
ALTER TABLE "ChatwootInbox" ADD CONSTRAINT "ChatwootInbox_instanceName_fkey" FOREIGN KEY ("instanceName") REFERENCES "EvolutionInstance"("name") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bot" ADD CONSTRAINT "Bot_instanceName_fkey" FOREIGN KEY ("instanceName") REFERENCES "EvolutionInstance"("name") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TypebotSession" ADD CONSTRAINT "TypebotSession_botId_fkey" FOREIGN KEY ("botId") REFERENCES "Bot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TypebotSession" ADD CONSTRAINT "TypebotSession_inboxId_fkey" FOREIGN KEY ("inboxId") REFERENCES "ChatwootInbox"("inboxId") ON DELETE RESTRICT ON UPDATE CASCADE;
