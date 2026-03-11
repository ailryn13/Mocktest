-- Migration: add per-question banned_keywords column
-- Run once against the production database.
ALTER TABLE questions
  ADD COLUMN IF NOT EXISTS banned_keywords TEXT;
