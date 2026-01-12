-- CreateTable
CREATE TABLE "SanityCheck" (
    "id" SERIAL NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SanityCheck_pkey" PRIMARY KEY ("id")
);
