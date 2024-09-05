-- CreateTable
CREATE TABLE "EvolutionInstance" (
    "name" TEXT NOT NULL PRIMARY KEY
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Bot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "instanceName" TEXT NOT NULL,
    CONSTRAINT "Bot_instanceName_fkey" FOREIGN KEY ("instanceName") REFERENCES "EvolutionInstance" ("name") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Bot" ("id", "instanceName", "name") SELECT "id", "instanceName", "name" FROM "Bot";
DROP TABLE "Bot";
ALTER TABLE "new_Bot" RENAME TO "Bot";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
