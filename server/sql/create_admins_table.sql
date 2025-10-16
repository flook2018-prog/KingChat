-- Create admins table if not exists
CREATE TABLE IF NOT EXISTS admins (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'admin',
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_admins_username ON admins(username);
CREATE INDEX IF NOT EXISTS idx_admins_status ON admins(status);
CREATE INDEX IF NOT EXISTS idx_admins_role ON admins(role);

-- Insert default admin if not exists
INSERT INTO admins (username, password, full_name, role, status, created_at, updated_at)
SELECT 'admin', '$2b$12$K9h.QVY5mP0FZGmS8.WpjOGMK5YmZ9KQXZ9O8VY5mP0FZGmS8.Wpj', 'ผู้ดูแลระบบหลัก', 'super-admin', 'active', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM admins WHERE username = 'admin');

-- Update function for updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_admins_updated_at ON admins;
CREATE TRIGGER update_admins_updated_at
    BEFORE UPDATE ON admins
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();