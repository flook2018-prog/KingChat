-- KingChat Database Schema
-- PostgreSQL Database for LINE OA Management System

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
    line_account_id INTEGER REFERENCES line_accounts(id),
    status VARCHAR(50) DEFAULT 'active',
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: chat_messages (ข้อความแชท)
CREATE TABLE IF NOT EXISTS chat_messages (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(id),
    line_account_id INTEGER REFERENCES line_accounts(id),
    message_type VARCHAR(50) NOT NULL, -- text, image, sticker, etc.
    message_content TEXT,
    image_url TEXT,
    sticker_id VARCHAR(100),
    direction VARCHAR(20) NOT NULL, -- incoming, outgoing
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_status BOOLEAN DEFAULT false,
    reply_token VARCHAR(500)
);

-- Table: quick_messages (ข้อความด่วน)
CREATE TABLE IF NOT EXISTS quick_messages (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    image_url TEXT,
    sent_count INTEGER DEFAULT 0,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: users (ผู้ใช้ระบบ)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user',
    status VARCHAR(50) DEFAULT 'active',
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: broadcast_messages (ข้อความที่ส่งออกแล้ว)
CREATE TABLE IF NOT EXISTS broadcast_messages (
    id SERIAL PRIMARY KEY,
    quick_message_id INTEGER REFERENCES quick_messages(id),
    line_account_id INTEGER REFERENCES line_accounts(id),
    sent_to_count INTEGER DEFAULT 0,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    sent_by INTEGER REFERENCES users(id)
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_customers_line_user_id ON customers(line_user_id);
CREATE INDEX IF NOT EXISTS idx_customers_line_account_id ON customers(line_account_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_customer_id ON chat_messages(customer_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_timestamp ON chat_messages(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_read_status ON chat_messages(read_status);

-- Insert default admin user (password: admin123)
INSERT INTO users (username, email, password_hash, role) 
VALUES ('admin', 'admin@kingchat.com', '$2b$10$rQ8K9yOQJYvXUzFQnbh.eOqJ8QeKvR4yTgNcQS8zKqQgW3Md8QKxy', 'admin')
ON CONFLICT (username) DO NOTHING;

-- Sample LINE OA account (for testing)
INSERT INTO line_accounts (name, channel_id, channel_secret, access_token, status) 
VALUES ('Test LINE OA', '2007723051', 'a4719acc696186068a848449e93f4247', 'sample_access_token', 'active')
ON CONFLICT (channel_id) DO NOTHING;