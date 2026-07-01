-- CreateIndex
CREATE INDEX "LiveSnapshot_collectedAt_idx" ON "LiveSnapshot"("collectedAt");

-- CreateIndex
CREATE INDEX "LiveSnapshot_collectedAt_categoryType_idx" ON "LiveSnapshot"("collectedAt", "categoryType");
