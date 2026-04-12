-- CreateTable
CREATE TABLE "Job" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "rawDescription" TEXT NOT NULL,
    "salary" TEXT,
    "location" TEXT,
    "remote" BOOLEAN NOT NULL DEFAULT false,
    "matchScore" INTEGER NOT NULL,
    "matchReasons" TEXT NOT NULL,
    "concerns" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'viewed',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
