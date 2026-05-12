-- Migration: add_booking_prices
-- Adds estimatedPrice (snapshot of Service.price at booking creation)
-- and actualPrice (optional final price set by master on COMPLETED).
-- Both nullable: estimatedPrice because old rows have no snapshot;
-- actualPrice because it's filled later or never.

ALTER TABLE "bookings"
  ADD COLUMN "estimated_price" DECIMAL(10,2),
  ADD COLUMN "actual_price"    DECIMAL(10,2);
