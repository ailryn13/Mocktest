-- Add parent_id to departments to support hierarchy (College -> Department)
ALTER TABLE departments ADD COLUMN parent_id BIGINT;

-- Add foreign key constraint
ALTER TABLE departments 
ADD CONSTRAINT fk_department_parent 
FOREIGN KEY (parent_id) REFERENCES departments(id);

-- Optional: Add index for performance
CREATE INDEX idx_department_parent_id ON departments(parent_id);
