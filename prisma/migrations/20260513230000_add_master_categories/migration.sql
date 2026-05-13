-- CreateTable: master_categories (many-to-many: User ↔ ServiceCategory)
CREATE TABLE "master_categories" (
  "master_id"   TEXT NOT NULL,
  "category_id" TEXT NOT NULL,

  CONSTRAINT "master_categories_pkey"
    PRIMARY KEY ("master_id", "category_id"),
  CONSTRAINT "master_categories_master_id_fkey"
    FOREIGN KEY ("master_id") REFERENCES "users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "master_categories_category_id_fkey"
    FOREIGN KEY ("category_id") REFERENCES "service_categories"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

-- Index for reverse lookup (category → masters)
CREATE INDEX "master_categories_category_id_idx"
  ON "master_categories"("category_id");

-- Verify
SELECT 'master_categories created, rows: ' || COUNT(*)::TEXT AS info
FROM "master_categories";
