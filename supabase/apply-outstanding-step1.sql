-- Step 1 of 2. Run this alone, then run supabase/apply-outstanding.sql.
--
-- Postgres will not accept ALTER TYPE ... ADD VALUE inside a transaction
-- block, and the Supabase SQL editor runs a pasted file as one transaction.
-- So this one statement is kept apart from the rest. `if not exists` means
-- running it twice is harmless.

alter type order_status add value if not exists 'packed' after 'paid';
