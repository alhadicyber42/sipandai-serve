-- Add new status value to service_status enum for resubmitted services
ALTER TYPE service_status ADD VALUE IF NOT EXISTS 'resubmitted';