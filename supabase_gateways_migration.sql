-- Migration SQL: Run this inside your Supabase SQL Editor to support the dynamic Payment Gateways Add/Delete system.
-- This will add the payment_gateways column to your page_settings table and populate it with default values.

ALTER TABLE public.page_settings 
ADD COLUMN IF NOT EXISTS payment_gateways jsonb NOT NULL DEFAULT '[
  {"id": "venmo", "name": "Venmo", "handle": "@hoarentservices", "qrCode": ""},
  {"id": "cashapp", "name": "Cash App", "handle": "$hoarentservices", "qrCode": ""},
  {"id": "chime", "name": "Chime", "handle": "hoarentservices@chime.com", "qrCode": ""}
]'::jsonb;
