-- Add parent_id to departments to support hierarchy (College -> Department)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='departments' AND column_name='parent_id') THEN
        ALTER TABLE departments ADD COLUMN parent_id BIGINT;
    END IF;
END $$;

-- Add foreign key constraint if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='fk_department_parent') THEN
        ALTER TABLE departments 
        ADD CONSTRAINT fk_department_parent 
        FOREIGN KEY (parent_id) REFERENCES departments(id);
    END IF;
END $$;

-- Optional: Add index for performance
CREATE INDEX IF NOT EXISTS idx_department_parent_id ON departments(parent_id);
