-- Create admins table for KingChat system
CREATE TABLE IF NOT EXISTS admins (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'admin',
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

-- Create default admin if not exists
INSERT INTO admins (username, password, role, status)
SELECT 'admin', '$2b$12$x3Fadf4Vfm/lPy0umF5sO.V5UEUu2LPe28KrL5W.FIAQE5d.kdD1y', 'super_admin', 'active'
WHERE NOT EXISTS (SELECT 1 FROM admins WHERE username = 'admin');
