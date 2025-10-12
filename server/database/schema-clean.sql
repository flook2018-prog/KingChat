-- KingChat Database Schema - Clean Version
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
    sender VARCHAR(50) NOT NULL, -- 'customer' or 'admin'
    is_read BOOLEAN DEFAULT false,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: quick_messages (ข้อความด่วน)
CREATE TABLE IF NOT EXISTS quick_messages (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
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
    permissions TEXT, -- JSON string
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: broadcast_messages (ข้อความประกาศ)
CREATE TABLE IF NOT EXISTS broadcast_messages (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    line_account_id INTEGER REFERENCES line_accounts(id) ON DELETE CASCADE,
    target_audience VARCHAR(100) DEFAULT 'all', -- all, active, inactive
    scheduled_time TIMESTAMP,
    sent_time TIMESTAMP,
    status VARCHAR(50) DEFAULT 'draft', -- draft, scheduled, sent, failed
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