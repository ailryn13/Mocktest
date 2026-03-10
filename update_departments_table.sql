-- Add missing columns to departments table
ALTER TABLE departments 
ADD COLUMN IF NOT EXISTS college_id BIGINT,
ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true;

-- Add foreign key constraint
ALTER TABLE departments 
ADD CONSTRAINT fk_department_college 
FOREIGN KEY (college_id) REFERENCES colleges(id);

-- Drop old unique constraint and add new one
ALTER TABLE departments 
DROP CONSTRAINT IF EXISTS uk_j6cwks7xecs5jov19ro8ge3qk;

ALTER TABLE departments 
ADD CONSTRAINT uk_department_college_name 
UNIQUE (college_id, name);
