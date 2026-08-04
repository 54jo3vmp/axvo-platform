-- AXVO Database — Migration 004: Two-Factor Authentication
-- Phase 2 requirement: 2FA

ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_secret VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN NOT NULL DEFAULT false;
