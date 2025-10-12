-- Add points and messages_handled columns if they don't exist
ALTER TABLE admin 
ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS messages_handled INTEGER DEFAULT 0;

-- Insert demo admin data if not exists
INSERT INTO admin (username, password_hash, display_name, role, points, messages_handled) 
VALUES 
('admin', '.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'สมชาย ใจดี', 'super_admin', 4500, 450),
('supha_admin', '.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'สุภา รักงาน', 'admin', 2300, 230),
('vichai_admin', '.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'วิชัย เก่งงาน', 'admin', 1800, 180),
('nantaporn_admin', '.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'นันทพร ขยันดี', 'admin', 6500, 650)
ON CONFLICT (username) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    points = EXCLUDED.points,
    messages_handled = EXCLUDED.messages_handled;
