-- ตาราง LineOA
CREATE TABLE IF NOT EXISTS line_oa (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    channel_id VARCHAR(255) NOT NULL,
    channel_secret VARCHAR(255) NOT NULL,
    access_token TEXT NOT NULL,
    webhook_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ตาราง Admin
CREATE TABLE IF NOT EXISTS admin (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    display_name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'admin',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ตาราง Customer
CREATE TABLE IF NOT EXISTS customer (
    id SERIAL PRIMARY KEY,
    line_user_id VARCHAR(255) UNIQUE NOT NULL,
    display_name VARCHAR(255),
    last_contact TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ตาราง Message
CREATE TABLE IF NOT EXISTS message (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customer(id),
    line_oa_id INTEGER REFERENCES line_oa(id),
    sender VARCHAR(50) NOT NULL, -- 'admin' หรือ 'customer'
    message TEXT NOT NULL,
    message_type VARCHAR(50) DEFAULT 'text',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ตาราง QuickReply
CREATE TABLE IF NOT EXISTS quick_reply (
    id SERIAL PRIMARY KEY,
    line_oa_id INTEGER REFERENCES line_oa(id),
    title VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    category VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ตาราง Mapping Admin กับ LineOA (สิทธิ์)
CREATE TABLE IF NOT EXISTS admin_line_oa (
    id SERIAL PRIMARY KEY,
    admin_id INTEGER REFERENCES admin(id),
    line_oa_id INTEGER REFERENCES line_oa(id),
    role VARCHAR(50) DEFAULT 'admin',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
