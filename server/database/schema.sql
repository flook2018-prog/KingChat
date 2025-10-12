-- KingChat Database Schema - Fixed Version-- KingChat Database Schema

-- PostgreSQL Database for LINE OA Management System-- PostgreSQL Database for LINE OA Management System



-- Drop existing tables with foreign key constraints first (if needed for reset)-- Table: line_accounts (บัญชี LINE OA)

-- DROP TABLE IF EXISTS chat_messages CASCADE;CREATE TABLE IF NOT EXISTS line_accounts (

-- DROP TABLE IF EXISTS quick_messages CASCADE;    id SERIAL PRIMARY KEY,

-- DROP TABLE IF EXISTS customers CASCADE;    name VARCHAR(255) NOT NULL,

    channel_id VARCHAR(255) UNIQUE NOT NULL,

-- Table: line_accounts (บัญชี LINE OA)    channel_secret VARCHAR(500) NOT NULL,

CREATE TABLE IF NOT EXISTS line_accounts (    access_token TEXT NOT NULL,

    id SERIAL PRIMARY KEY,    status VARCHAR(50) DEFAULT 'active',

    name VARCHAR(255) NOT NULL,    webhook_verified BOOLEAN DEFAULT false,

    channel_id VARCHAR(255) UNIQUE NOT NULL,    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    channel_secret VARCHAR(500) NOT NULL,    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

    access_token TEXT NOT NULL,);

    status VARCHAR(50) DEFAULT 'active',

    webhook_verified BOOLEAN DEFAULT false,-- Table: customers (ลูกค้า)

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,CREATE TABLE IF NOT EXISTS customers (

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP    id SERIAL PRIMARY KEY,

);    line_user_id VARCHAR(255) UNIQUE NOT NULL,

    display_name VARCHAR(255),

-- Table: customers (ลูกค้า) - Fixed data types    picture_url TEXT,

CREATE TABLE IF NOT EXISTS customers (    phone_number VARCHAR(20),

    id SERIAL PRIMARY KEY,    notes TEXT,

    line_user_id VARCHAR(255) UNIQUE NOT NULL,    line_account_id INTEGER REFERENCES line_accounts(id),

    display_name VARCHAR(255),    status VARCHAR(50) DEFAULT 'active',

    picture_url TEXT,    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    phone_number VARCHAR(20),    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    notes TEXT,    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

    line_account_id INTEGER REFERENCES line_accounts(id) ON DELETE SET NULL,);

    status VARCHAR(50) DEFAULT 'active',

    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,-- Table: chat_messages (ข้อความแชท)

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,CREATE TABLE IF NOT EXISTS chat_messages (

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP    id SERIAL PRIMARY KEY,

);    customer_id INTEGER REFERENCES customers(id),

    line_account_id INTEGER REFERENCES line_accounts(id),

-- Table: chat_messages (ข้อความ) - Fixed to use INTEGER for customer_id    message_type VARCHAR(50) NOT NULL, -- text, image, sticker, etc.

CREATE TABLE IF NOT EXISTS chat_messages (    message_content TEXT,

    id SERIAL PRIMARY KEY,    image_url TEXT,

    customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,    sticker_id VARCHAR(100),

    line_account_id INTEGER REFERENCES line_accounts(id) ON DELETE CASCADE,    direction VARCHAR(20) NOT NULL, -- incoming, outgoing

    message_type VARCHAR(50) DEFAULT 'text',    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    message_text TEXT,    read_status BOOLEAN DEFAULT false,

    sender VARCHAR(50) NOT NULL, -- 'customer' or 'admin'    reply_token VARCHAR(500)

    is_read BOOLEAN DEFAULT false,);

    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP-- Table: quick_messages (ข้อความด่วน)

);CREATE TABLE IF NOT EXISTS quick_messages (

    id SERIAL PRIMARY KEY,

-- Table: quick_messages (ข้อความด่วน)    title VARCHAR(255) NOT NULL,

CREATE TABLE IF NOT EXISTS quick_messages (    content TEXT NOT NULL,

    id SERIAL PRIMARY KEY,    image_url TEXT,

    line_account_id INTEGER REFERENCES line_accounts(id) ON DELETE CASCADE,    sent_count INTEGER DEFAULT 0,

    title VARCHAR(255) NOT NULL,    created_by INTEGER REFERENCES users(id),

    message TEXT NOT NULL,    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    category VARCHAR(100),    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

    is_active BOOLEAN DEFAULT true,);

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP-- Table: users (ผู้ใช้ระบบ)

);CREATE TABLE IF NOT EXISTS users (

    id SERIAL PRIMARY KEY,

-- Table: admin (แอดมิน) - Enhanced with ROV ranking system    username VARCHAR(100) UNIQUE NOT NULL,

CREATE TABLE IF NOT EXISTS admin (    email VARCHAR(255) UNIQUE NOT NULL,

    id SERIAL PRIMARY KEY,    password_hash VARCHAR(255) NOT NULL,

    username VARCHAR(100) UNIQUE NOT NULL,    role VARCHAR(50) DEFAULT 'user',

    password_hash TEXT NOT NULL,    status VARCHAR(50) DEFAULT 'active',

    display_name VARCHAR(255),    last_login TIMESTAMP,

    role VARCHAR(50) DEFAULT 'admin',    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    points INTEGER DEFAULT 0,    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

    messages_handled INTEGER DEFAULT 0,);

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

);-- Table: broadcast_messages (ข้อความที่ส่งออกแล้ว)

CREATE TABLE IF NOT EXISTS broadcast_messages (

-- Table: settings (การตั้งค่า)    id SERIAL PRIMARY KEY,

CREATE TABLE IF NOT EXISTS settings (    quick_message_id INTEGER REFERENCES quick_messages(id),

    id SERIAL PRIMARY KEY,    line_account_id INTEGER REFERENCES line_accounts(id),

    setting_key VARCHAR(100) UNIQUE NOT NULL,    sent_to_count INTEGER DEFAULT 0,

    setting_value TEXT,    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    description TEXT,    sent_by INTEGER REFERENCES users(id)

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,);

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

);-- Indexes for better performance

CREATE INDEX IF NOT EXISTS idx_customers_line_user_id ON customers(line_user_id);

-- Create indexes for better performanceCREATE INDEX IF NOT EXISTS idx_customers_line_account_id ON customers(line_account_id);

CREATE INDEX IF NOT EXISTS idx_customers_line_user_id ON customers(line_user_id);CREATE INDEX IF NOT EXISTS idx_chat_messages_customer_id ON chat_messages(customer_id);

CREATE INDEX IF NOT EXISTS idx_customers_line_account_id ON customers(line_account_id);CREATE INDEX IF NOT EXISTS idx_chat_messages_timestamp ON chat_messages(timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_chat_messages_customer_id ON chat_messages(customer_id);CREATE INDEX IF NOT EXISTS idx_chat_messages_read_status ON chat_messages(read_status);

CREATE INDEX IF NOT EXISTS idx_chat_messages_timestamp ON chat_messages(timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_admin_username ON admin(username);-- Insert default admin user (password: admin123)

CREATE INDEX IF NOT EXISTS idx_admin_points ON admin(points DESC);INSERT INTO users (username, email, password_hash, role) 

VALUES ('admin', 'admin@kingchat.com', '$2b$10$rQ8K9yOQJYvXUzFQnbh.eOqJ8QeKvR4yTgNcQS8zKqQgW3Md8QKxy', 'admin')

-- Insert demo LINE account dataON CONFLICT (username) DO NOTHING;

INSERT INTO line_accounts (name, channel_id, channel_secret, access_token, webhook_verified) 

VALUES (-- Sample LINE OA account (for testing)

    'Demo LINE Account', INSERT INTO line_accounts (name, channel_id, channel_secret, access_token, status) 

    'demo_channel_123', VALUES ('Test LINE OA', '2007723051', 'a4719acc696186068a848449e93f4247', 'sample_access_token', 'active')

    'demo_secret_456', ON CONFLICT (channel_id) DO NOTHING;
    'demo_access_token_789',
    false
)
ON CONFLICT (channel_id) DO NOTHING;

-- Insert demo admin data with ROV ranking system
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

-- Insert demo customer data
INSERT INTO customers (line_user_id, display_name, line_account_id, status)
VALUES 
('U1234567890', 'Melendez', 1, 'online'),
('U2345678901', 'สถิการ', 1, 'offline'),
('U3456789012', 'ลูกค้าไฟ', 1, 'inactive'),
('U4567890123', 'คุณแม่ใจ', 1, 'online')
ON CONFLICT (line_user_id) DO NOTHING;

-- Insert demo settings
INSERT INTO settings (setting_key, setting_value, description)
VALUES 
('site_name', 'KingChat', 'ชื่อเว็บไซต์'),
('welcome_message', 'ยินดีต้อนรับสู่ KingChat', 'ข้อความต้อนรับ'),
('auto_reply', 'true', 'เปิดใช้การตอบอัตโนมัติ'),
('notification_sound', 'true', 'เปิดใช้เสียงแจ้งเตือน')
ON CONFLICT (setting_key) DO NOTHING;