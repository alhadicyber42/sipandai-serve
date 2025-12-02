-- Fix announcements foreign key to reference profiles instead of auth.users
-- This allows PostgREST to join announcements with profiles

-- Drop existing FK to auth.users (if it exists with default name)
ALTER TABLE public.announcements DROP CONSTRAINT IF EXISTS announcements_author_id_fkey;

-- Add new FK to profiles
ALTER TABLE public.announcements
    ADD CONSTRAINT announcements_author_id_fkey
    FOREIGN KEY (author_id)
    REFERENCES public.profiles(id)
    ON DELETE CASCADE;
