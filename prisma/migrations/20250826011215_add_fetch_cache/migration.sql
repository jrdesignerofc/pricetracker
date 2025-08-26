-- CreateTable
CREATE TABLE "public"."FetchCache" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "etag" TEXT,
    "lastModified" TEXT,
    "statusCode" INTEGER,
    "bodyHash" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FetchCache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FetchCache_url_key" ON "public"."FetchCache"("url");

-- CreateIndex
CREATE INDEX "FetchCache_url_idx" ON "public"."FetchCache"("url");
