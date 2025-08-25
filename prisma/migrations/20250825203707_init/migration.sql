-- CreateEnum
CREATE TYPE "public"."Store" AS ENUM ('KABUM', 'TERABYTE', 'PICHAU');

-- CreateTable
CREATE TABLE "public"."Product" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "store" "public"."Store" NOT NULL,
    "url" TEXT NOT NULL,
    "sku" VARCHAR(64),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PriceHistory" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "priceDecimal" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'BRL',
    "collectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PriceHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Product_url_key" ON "public"."Product"("url");

-- CreateIndex
CREATE INDEX "Product_store_isActive_idx" ON "public"."Product"("store", "isActive");

-- CreateIndex
CREATE INDEX "PriceHistory_productId_collectedAt_idx" ON "public"."PriceHistory"("productId", "collectedAt");

-- CreateIndex
CREATE UNIQUE INDEX "PriceHistory_productId_collectedAt_key" ON "public"."PriceHistory"("productId", "collectedAt");

-- AddForeignKey
ALTER TABLE "public"."PriceHistory" ADD CONSTRAINT "PriceHistory_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
