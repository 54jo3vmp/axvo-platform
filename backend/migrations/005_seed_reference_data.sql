-- AXVO Database — Migration 005: Seed reference data
-- Phase 3 requirement: Country / Currency dropdowns need real rows to reference.

INSERT INTO countries (code, name) VALUES
  ('TW', 'Taiwan'),
  ('HK', 'Hong Kong'),
  ('SG', 'Singapore'),
  ('US', 'United States'),
  ('JP', 'Japan'),
  ('MY', 'Malaysia'),
  ('CN', 'China'),
  ('GB', 'United Kingdom'),
  ('AU', 'Australia'),
  ('CA', 'Canada')
ON CONFLICT (code) DO NOTHING;

INSERT INTO currencies (code, name, symbol) VALUES
  ('TWD', 'New Taiwan Dollar', 'NT$'),
  ('USD', 'US Dollar', '$'),
  ('HKD', 'Hong Kong Dollar', 'HK$'),
  ('SGD', 'Singapore Dollar', 'S$'),
  ('JPY', 'Japanese Yen', '¥'),
  ('MYR', 'Malaysian Ringgit', 'RM'),
  ('CNY', 'Chinese Yuan', '¥'),
  ('GBP', 'British Pound', '£'),
  ('AUD', 'Australian Dollar', 'A$'),
  ('EUR', 'Euro', '€')
ON CONFLICT (code) DO NOTHING;
