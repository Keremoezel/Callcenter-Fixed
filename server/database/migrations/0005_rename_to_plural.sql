-- Migration: Rename tables from singular to plural
-- user -> users
-- session -> sessions

-- Rename user table to users
ALTER TABLE user RENAME TO users;

-- Rename session table to sessions
ALTER TABLE session RENAME TO sessions;
