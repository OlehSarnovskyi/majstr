ALTER TABLE "users" ADD COLUMN "is_banned" BOOLEAN NOT NULL DEFAULT false;

SELECT 'is_banned added, banned users: ' || COUNT(*)::TEXT AS info
FROM "users" WHERE is_banned = true;
