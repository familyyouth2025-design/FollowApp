-- SAYET Admin Portal Seed Data
-- Run after schema.sql to insert the initial super admin.

INSERT INTO admins (
    first_name,
    surname,
    cell,
    email,
    password_hash,
    role,
    province,
    city,
    church
) VALUES (
    'Tinashe',
    'Makanda',
    '0652920805',
    'symphonytone@gmail.com',
    '$2b$10$8pELYwAeNxPuk927bdExsO7hqDRc3ZN9dMiim1L2v15631e2MqARO', -- bcrypt hash of 'password123'
    'super_admin',
    'Gauteng',
    'Johannesburg',
    'Joburg Central'
)
ON CONFLICT (email) DO NOTHING;
