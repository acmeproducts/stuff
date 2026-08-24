ALTER TABLE processing_workers
  ADD COLUMN bytes_hashed INTEGER NOT NULL DEFAULT 0 CHECK (bytes_hashed >= 0);

ALTER TABLE processing_workers
  ADD COLUMN bytes_total INTEGER NOT NULL DEFAULT 0 CHECK (bytes_total >= 0);

