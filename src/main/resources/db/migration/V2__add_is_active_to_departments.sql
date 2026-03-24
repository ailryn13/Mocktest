DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='departments' AND column_name='is_active') THEN
        ALTER TABLE departments ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true;
    END IF;
END $$;

