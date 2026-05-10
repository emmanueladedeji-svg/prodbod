-- Add emoji_icon column to products table
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS emoji_icon varchar(10);
