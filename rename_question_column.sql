-- Rename content column to question_text to match entity
ALTER TABLE questions RENAME COLUMN content TO question_text;
