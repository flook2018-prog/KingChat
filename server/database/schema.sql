-- KingChat Database Schema - Clean Version
-- PostgreSQL Database for LINE OA Management System

-- Table: admin (ผู้ดูแลระบบ)
CREATE TABLE IF NOT EXISTS admin (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'admin',
    points INTEGER DEFAULT 0,
    messages_handled INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
CREATE INDEX IF NOT EXISTS idx_admin_username ON admin(username);
CREATE INDEX IF NOT EXISTS idx_admin_points ON admin(points DESC);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_customers_line_user_id ON customers(line_user_id);
CREATE INDEX IF NOT EXISTS idx_customers_line_account_id ON customers(line_account_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_timestamp ON chat_messages(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_customer_id ON chat_messages(customer_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_is_read ON chat_messages(is_read);

-- Insert default admin users (password: admin123, somchai123, supha123, vichai123)
INSERT INTO admin (username, password_hash, display_name, role, points, messages_handled) 
VALUES 
('admin', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'ผู้ดูแลระบบหลัก', 'super_admin', 4500, 450),
('somchai', '$2b$10$k8RQ4K9yOQJYvXUzFQnbh.eOqJ8QeKvR4yTgNcQS8zKqQgW3Md8QKxy', 'สมชาย ใจดี', 'admin', 3200, 320),
('supha', '$2b$10$m9SL5N0pQJYvXUzFQnbh.eOqJ8QeKvR4yTgNcQS8zKqQgW3Md8QKxy', 'สุภา รักงาน', 'admin', 2300, 230),
('vichai', '$2b$10$n6TM8O1qRJYvXUzFQnbh.eOqJ8QeKvR4yTgNcQS8zKqQgW3Md8QKxy', 'วิชัย เก่งงาน', 'admin', 1800, 180)
ON CONFLICT (username) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    points = EXCLUDED.points,
    messages_handled = EXCLUDED.messages_handled;

-- Insert default user (for legacy support)
INSERT INTO users (username, email, password_hash, role) 
VALUES ('admin', 'admin@kingchat.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin')
ON CONFLICT (username) DO NOTHING;

-- Insert demo LINE account data
INSERT INTO line_accounts (name, channel_id, channel_secret, access_token, status) 
VALUES ('Demo LINE OA', '2007723051', 'a4719acc696186068a848449e93f4247', 'demo_access_token_789', 'active')
ON CONFLICT (channel_id) DO NOTHING;

-- Insert demo customer data
INSERT INTO customers (line_user_id, display_name, line_account_id, status)
VALUES 
('U1234567890', 'ลูกค้า A', 1, 'online'),
('U2345678901', 'ลูกค้า B', 1, 'offline'),
('U3456789012', 'ลูกค้า C', 1, 'inactive'),
('U4567890123', 'ลูกค้า D', 1, 'online')
ON CONFLICT (line_user_id) DO NOTHING;

-- Insert demo quick messages
INSERT INTO quick_messages (title, message_text, category) 
VALUES 
('ขอบคุณสำหรับการติดต่อ', 'ขอบคุณที่ติดต่อเรา เราจะตอบกลับโดยเร็วที่สุด', 'general'),
('ช่วงเวลาทำการ', 'เวลาทำการ: จันทร์-ศุกร์ 9:00-18:00 น. เสาร์-อาทิตย์ 9:00-17:00 น.', 'info'),
('ขอข้อมูลเพิ่มเติม', 'กรุณาส่งข้อมูลที่ต้องการเพิ่มเติมให้เราด้วยค่ะ', 'request')
ON CONFLICT DO NOTHING;

-- Insert demo settings
INSERT INTO settings (setting_key, setting_value, description)
VALUES 
('site_name', 'KingChat', 'ชื่อเว็บไซต์'),
('welcome_message', 'ยินดีต้อนรับสู่ KingChat', 'ข้อความต้อนรับ'),
('auto_reply', 'true', 'เปิดใช้การตอบอัตโนมัติ'),
('notification_sound', 'true', 'เปิดใช้เสียงแจ้งเตือน')
ON CONFLICT (setting_key) DO NOTHING;
    line_account_id INTEGER REFERENCES line_accounts(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'active',
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: chat_messages (ข้อความแชท)
CREATE TABLE IF NOT EXISTS chat_messages (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
    line_account_id INTEGER REFERENCES line_accounts(id) ON DELETE CASCADE,
    message_type VARCHAR(50) DEFAULT 'text',
    message_text TEXT,
    image_url TEXT,
    sticker_id VARCHAR(100),
    sender VARCHAR(50) NOT NULL,
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
    usage_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: settings (การตั้งค่าระบบ)
CREATE TABLE IF NOT EXISTS settings (
    id SERIAL PRIMARY KEY,
    setting_key VARCHAR(255) UNIQUE NOT NULL,
    setting_value TEXT,
    description TEXT,
    data_type VARCHAR(50) DEFAULT 'string',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_admin_username ON admin(username);
CREATE INDEX IF NOT EXISTS idx_admin_points ON admin(points DESC);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_customers_line_user_id ON customers(line_user_id);
CREATE INDEX IF NOT EXISTS idx_customers_line_account_id ON customers(line_account_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_timestamp ON chat_messages(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_customer_id ON chat_messages(customer_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_is_read ON chat_messages(is_read);

-- Insert default admin users (password: admin123, somchai123, supha123, vichai123)
INSERT INTO admin (username, password_hash, display_name, role, points, messages_handled) 
VALUES 
('admin', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'ผู้ดูแลระบบหลัก', 'super_admin', 4500, 450),
('somchai', '$2b$10$k8RQ4K9yOQJYvXUzFQnbh.eOqJ8QeKvR4yTgNcQS8zKqQgW3Md8QKxy', 'สมชาย ใจดี', 'admin', 3200, 320),
('supha', '$2b$10$m9SL5N0pQJYvXUzFQnbh.eOqJ8QeKvR4yTgNcQS8zKqQgW3Md8QKxy', 'สุภา รักงาน', 'admin', 2300, 230),
('vichai', '$2b$10$n6TM8O1qRJYvXUzFQnbh.eOqJ8QeKvR4yTgNcQS8zKqQgW3Md8QKxy', 'วิชัย เก่งงาน', 'admin', 1800, 180)
ON CONFLICT (username) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    points = EXCLUDED.points,
    messages_handled = EXCLUDED.messages_handled;

-- Insert default user (for legacy support)
INSERT INTO users (username, email, password_hash, role) 
VALUES ('admin', 'admin@kingchat.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin')
ON CONFLICT (username) DO NOTHING;

-- Insert demo LINE account data
INSERT INTO line_accounts (name, channel_id, channel_secret, access_token, status) 
VALUES ('Demo LINE OA', '2007723051', 'a4719acc696186068a848449e93f4247', 'demo_access_token_789', 'active')
ON CONFLICT (channel_id) DO NOTHING;

-- Insert demo customer data
INSERT INTO customers (line_user_id, display_name, line_account_id, status)
VALUES 
('U1234567890', 'ลูกค้า A', 1, 'online'),
('U2345678901', 'ลูกค้า B', 1, 'offline'),
('U3456789012', 'ลูกค้า C', 1, 'inactive'),
('U4567890123', 'ลูกค้า D', 1, 'online')
ON CONFLICT (line_user_id) DO NOTHING;

-- Insert demo quick messages
INSERT INTO quick_messages (title, message_text, category) 
VALUES 
('ขอบคุณสำหรับการติดต่อ', 'ขอบคุณที่ติดต่อเรา เราจะตอบกลับโดยเร็วที่สุด', 'general'),
('ช่วงเวลาทำการ', 'เวลาทำการ: จันทร์-ศุกร์ 9:00-18:00 น. เสาร์-อาทิตย์ 9:00-17:00 น.', 'info'),
('ขอข้อมูลเพิ่มเติม', 'กรุณาส่งข้อมูลที่ต้องการเพิ่มเติมให้เราด้วยค่ะ', 'request')
ON CONFLICT DO NOTHING;

-- Insert demo settings
INSERT INTO settings (setting_key, setting_value, description)
VALUES 
('site_name', 'KingChat', 'ชื่อเว็บไซต์'),
('welcome_message', 'ยินดีต้อนรับสู่ KingChat', 'ข้อความต้อนรับ'),
('auto_reply', 'true', 'เปิดใช้การตอบอัตโนมัติ'),
('notification_sound', 'true', 'เปิดใช้เสียงแจ้งเตือน')
ON CONFLICT (setting_key) DO NOTHING;
    content TEXT NOT NULL,
    category VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: users (ผู้ใช้งานระบบ)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    display_name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'user',
    permissions TEXT,
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP,
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

-- Table: broadcast_messages (ข้อความประกาศ)
CREATE TABLE IF NOT EXISTS broadcast_messages (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    line_account_id INTEGER REFERENCES line_accounts(id) ON DELETE CASCADE,
    target_audience VARCHAR(100) DEFAULT 'all',
    scheduled_time TIMESTAMP,
    sent_time TIMESTAMP,
    status VARCHAR(50) DEFAULT 'draft',
    sent_count INTEGER DEFAULT 0,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_customers_line_user_id ON customers(line_user_id);
CREATE INDEX IF NOT EXISTS idx_customers_line_account_id ON customers(line_account_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_customer_id ON chat_messages(customer_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_timestamp ON chat_messages(timestamp);
CREATE INDEX IF NOT EXISTS idx_line_accounts_channel_id ON line_accounts(channel_id);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Insert demo data only if tables are empty

-- Insert demo LINE accounts
INSERT INTO line_accounts (name, channel_id, channel_secret, access_token, status)
VALUES 
('KingChat Demo', 'demo_channel_id', 'demo_channel_secret', 'demo_access_token', 'active'),
('Test Account', 'test_channel_id', 'test_channel_secret', 'test_access_token', 'inactive')
ON CONFLICT (channel_id) DO NOTHING;

-- Insert demo users
INSERT INTO users (username, email, password, display_name, role, is_active)
VALUES 
('demo_user', 'demo@kingchat.com', '$2b$10$demo_hashed_password', 'Demo User', 'user', true),
('manager', 'manager@kingchat.com', '$2b$10$manager_hashed_password', 'Manager', 'manager', true)
ON CONFLICT (username) DO NOTHING;

-- Insert demo quick messages
INSERT INTO quick_messages (title, content, category, is_active)
VALUES 
('สวัสดี', 'สวัสดีครับ/ค่ะ ยินดีให้บริการ', 'greeting', true),
('ขอบคุณ', 'ขอบคุณมากครับ/ค่ะ', 'thanks', true),
('รอสักครู่', 'กรุณารอสักครู่นะครับ/ค่ะ กำลังตรวจสอบให้', 'wait', true),
('ช่วยได้อีกไหม', 'มีอะไรให้ช่วยเหลืออีกไหมครับ/ค่ะ', 'help', true)
ON CONFLICT DO NOTHING;

-- Insert demo customers
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