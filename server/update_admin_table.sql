-- Update admin table to support ROV ranking system
ALTER TABLE admin 
ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS messages_handled INTEGER DEFAULT 0;

-- Insert demo admin data
INSERT INTO admin (username, password_hash, display_name, role, points, messages_handled) 
VALUES 
('admin', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'สมชาย ใจดี', 'super_admin', 4500, 450),
('supha_admin', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'สุภา รักงาน', 'admin', 2300, 230),
('vichai_admin', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'วิชัย เก่งงาน', 'admin', 1800, 180),
('nantaporn_admin', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'นันทพร ขยันดี', 'admin', 6500, 650)
ON CONFLICT (username) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    points = EXCLUDED.points,
    messages_handled = EXCLUDED.messages_handled;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_admin_points ON admin(points DESC);
CREATE INDEX IF NOT EXISTS idx_admin_role ON admin(role);