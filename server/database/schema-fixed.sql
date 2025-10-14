-- KingChat Database Schema - Fixed Version
-- PostgreSQL Database for LINE OA Management System

-- Table: admins (ผู้ดูแลระบบ)
CREATE TABLE IF NOT EXISTS admins (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE,
    password VARCHAR(255) NOT NULL,
    "displayName" VARCHAR(255),
    role VARCHAR(50) DEFAULT 'admin',
    points INTEGER DEFAULT 0,
    messages_handled INTEGER DEFAULT 0,
    "isActive" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: users (ผู้ใช้ระบบ)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user',
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: line_accounts (บัญชี LINE OA)
CREATE TABLE IF NOT EXISTS line_accounts (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    channel_id VARCHAR(255) UNIQUE NOT NULL,
    channel_secret VARCHAR(500) NOT NULL,
    access_token TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'active',
    webhook_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: customers (ลูกค้า)
CREATE TABLE IF NOT EXISTS customers (
    id SERIAL PRIMARY KEY,
    line_user_id VARCHAR(255) UNIQUE NOT NULL,
    display_name VARCHAR(255),
    picture_url TEXT,
    phone_number VARCHAR(20),
    notes TEXT,
    line_account_id INTEGER REFERENCES line_accounts(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: chat_messages (ข้อความ)
CREATE TABLE IF NOT EXISTS chat_messages (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
    line_account_id INTEGER REFERENCES line_accounts(id) ON DELETE CASCADE,
    message_type VARCHAR(50) DEFAULT 'text',
    message_text TEXT,
    image_url TEXT,
    sticker_id VARCHAR(100),
    sender VARCHAR(50) NOT NULL,
    direction VARCHAR(20) NOT NULL,
    is_read BOOLEAN DEFAULT false,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: quick_messages (ข้อความด่วน)
CREATE TABLE IF NOT EXISTS quick_messages (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    message_text TEXT NOT NULL,
    category VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: broadcast_messages (ข้อความแจ้งเตือน)
CREATE TABLE IF NOT EXISTS broadcast_messages (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    message_text TEXT NOT NULL,
    line_account_id INTEGER REFERENCES line_accounts(id) ON DELETE CASCADE,
    sent_count INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'draft',
    scheduled_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: settings (การตั้งค่า)
CREATE TABLE IF NOT EXISTS settings (
    id SERIAL PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_admins_username ON admins(username);
CREATE INDEX IF NOT EXISTS idx_admins_points ON admins(points DESC);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_customers_line_user_id ON customers(line_user_id);
CREATE INDEX IF NOT EXISTS idx_customers_line_account_id ON customers(line_account_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_timestamp ON chat_messages(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_customer ON chat_messages(customer_id);

-- Insert default admin if not exists
INSERT INTO admins (username, email, password, "displayName", role, points) 
VALUES ('admin', 'admin@kingchat.com', '$2a$12$x3Fadf4Vfm/lPy0umF5sO.V5UEUu2LPe28KrL5W.FIAQE5d.kdD1y', 'System Administrator', 'super_admin', 5000)
ON CONFLICT (username) DO NOTHING;

-- Insert sample LINE account
INSERT INTO line_accounts (name, channel_id, channel_secret, access_token)
VALUES ('KingChat Demo', 'demo_channel_id', 'demo_channel_secret', 'demo_access_token')
ON CONFLICT (channel_id) DO NOTHING;

-- Insert sample customers
INSERT INTO customers (line_user_id, display_name, line_account_id, status)
VALUES 
    ('U001', 'ลูกค้า A', 1, 'active'),
    ('U002', 'ลูกค้า B', 1, 'active'),
    ('U003', 'ลูกค้า C', 1, 'active')
ON CONFLICT (line_user_id) DO NOTHING;

-- Insert sample quick messages
INSERT INTO quick_messages (title, message_text, category, is_active)
VALUES 
    ('ขอบคุณ', 'ขอบคุณครับ/ค่ะ', 'courtesy', true),
    ('รอสักครู่', 'รอสักครู่นะครับ/ค่ะ กำลังตรวจสอบให้', 'response', true),
    ('ติดต่อกลับ', 'เราจะติดต่อกลับไปครับ/ค่ะ', 'followup', true),
    ('ข้อมูลเพิ่มเติม', 'ต้องการข้อมูลเพิ่มเติมไหมครับ/ค่ะ', 'inquiry', true)
ON CONFLICT DO NOTHING;

-- Insert default settings
INSERT INTO settings (setting_key, setting_value, description)
VALUES 
    ('system_name', 'KingChat', 'ชื่อระบบ'),
    ('max_file_size', '10485760', 'ขนาดไฟล์สูงสุด (bytes)'),
    ('auto_reply_enabled', 'true', 'เปิดใช้การตอบกลับอัตโนมัติ'),
    ('notification_enabled', 'true', 'เปิดใช้การแจ้งเตือน')
ON CONFLICT (setting_key) DO NOTHING;