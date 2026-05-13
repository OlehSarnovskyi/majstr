-- CreateTable
CREATE TABLE "reviews" (
  "id"         TEXT        NOT NULL DEFAULT gen_random_uuid(),
  "booking_id" TEXT        NOT NULL,
  "rating"     INTEGER     NOT NULL,
  "comment"    TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "reviews_pkey"       PRIMARY KEY ("id"),
  CONSTRAINT "reviews_booking_id_key" UNIQUE ("booking_id"),
  CONSTRAINT "reviews_booking_id_fkey"
    FOREIGN KEY ("booking_id") REFERENCES "bookings"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

-- Verify
SELECT 'reviews table created, rows: ' || COUNT(*)::TEXT AS info
FROM "reviews";
