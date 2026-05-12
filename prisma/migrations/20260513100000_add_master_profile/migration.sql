-- Migration: add_master_profile
-- Creates master_profiles table and links it to users 1:1.
-- onDelete: Cascade — if user is deleted, their profile is deleted too.

CREATE TABLE "master_profiles" (
  "id"          TEXT         NOT NULL,
  "user_id"     TEXT         NOT NULL,
  "slug"        TEXT         NOT NULL,
  "description" TEXT,
  "is_verified" BOOLEAN      NOT NULL DEFAULT false,
  "created_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"  TIMESTAMP(3) NOT NULL,

  CONSTRAINT "master_profiles_pkey"    PRIMARY KEY ("id"),
  CONSTRAINT "master_profiles_user_id_key" UNIQUE ("user_id"),
  CONSTRAINT "master_profiles_slug_key"    UNIQUE ("slug"),
  CONSTRAINT "master_profiles_user_id_fkey"
    FOREIGN KEY ("user_id")
    REFERENCES "users"("id")
    ON DELETE CASCADE
    ON UPDATE CASCADE
);
