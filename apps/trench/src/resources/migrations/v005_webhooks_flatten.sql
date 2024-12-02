ALTER TABLE webhooks
ADD COLUMN IF NOT EXISTS flatten Boolean DEFAULT false;
