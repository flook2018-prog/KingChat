-- KingChat Admin Management System
-- PostgreSQL Database Schema for Admins

-- Drop table if exists
DROP TABLE IF EXISTS admins CASCADE;

-- Create admins table
CREATE TABLE admins (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'super_admin')),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    created_by INTEGER REFERENCES admins(id) ON DELETE SET NULL
);

-- Create index for faster queries
CREATE INDEX idx_admins_username ON admins(username);
CREATE INDEX idx_admins_role ON admins(role);
CREATE INDEX idx_admins_status ON admins(status);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_admins_updated_at 
    BEFORE UPDATE ON admins 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert default super admin (password: admin123)
-- Password hash for 'admin123' using bcrypt
INSERT INTO admins (username, password_hash, full_name, role, status) 
VALUES (
    'admin', 
    '$2b$10$rOOjI9H9YQnpZZKkzV.2TOJ4mJ1XqJ.WKZgY8z5QxQzYX8KzY5QzW', 
    'System Administrator', 
    'super_admin', 
    'active'
) ON CONFLICT (username) DO NOTHING;

-- Insert sample admin (password: admin123)
INSERT INTO admins (username, password_hash, full_name, role, status, created_by) 
VALUES (
    'admin1', 
    '$2b$10$rOOjI9H9YQnpZZKkzV.2TOJ4mJ1XqJ.WKZgY8z5QxQzYX8KzY5QzW', 
    'Admin User 1', 
    'admin', 
    'active',
    1
) ON CONFLICT (username) DO NOTHING;

-- Create view for admin list (without password)
CREATE OR REPLACE VIEW admin_list AS
SELECT 
    id,
    username,
    full_name,
    role,
    status,
    created_at,
    updated_at,
    last_login,
    created_by,
    (SELECT full_name FROM admins a2 WHERE a2.id = admins.created_by) as created_by_name
FROM admins
ORDER BY created_at DESC;

COMMENT ON TABLE admins IS 'KingChat Admin Users Management';
COMMENT ON COLUMN admins.role IS 'Admin levels: admin (basic), super_admin (full access)';
COMMENT ON COLUMN admins.status IS 'Account status: active, inactive';