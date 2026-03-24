INSERT INTO roles (name, description) 
VALUES ('ADMIN', 'College Admin - can manage exams and users within their assigned college')
ON CONFLICT (name) DO NOTHING;
