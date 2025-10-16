// Setup admin table for KingChat
const { Pool } = require('pg');
const bcrypt = require('bcrypt');

// Create database connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function setupAdminTable() {
    const client = await pool.connect();
    
    try {
        console.log('🔄 Setting up admin table...');

        // Read and execute the schema file
        const fs = require('fs');
        const path = require('path');
        const schemaPath = path.join(__dirname, '../database/admins_schema.sql');
        
        if (fs.existsSync(schemaPath)) {
            const schema = fs.readFileSync(schemaPath, 'utf8');
            await client.query(schema);
            console.log('✅ Admin table schema created successfully');
        } else {
            // Create schema manually if file doesn't exist
            await client.query(`
                DROP TABLE IF EXISTS admins CASCADE;
                
                CREATE TABLE admins (
                    id SERIAL PRIMARY KEY,
                    username VARCHAR(50) UNIQUE NOT NULL,
                    password_hash VARCHAR(255) NOT NULL,
                    full_name VARCHAR(100) NOT NULL,
                    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'super_admin')),
                    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    last_login TIMESTAMP NULL,
                    created_by INTEGER REFERENCES admins(id) ON DELETE SET NULL
                );
                
                CREATE INDEX idx_admins_username ON admins(username);
                CREATE INDEX idx_admins_role ON admins(role);
                CREATE INDEX idx_admins_status ON admins(status);
                
                CREATE OR REPLACE FUNCTION update_updated_at_column()
                RETURNS TRIGGER AS $$
                BEGIN
                    NEW.updated_at = CURRENT_TIMESTAMP;
                    RETURN NEW;
                END;
                $$ language 'plpgsql';
                
                CREATE TRIGGER update_admins_updated_at 
                    BEFORE UPDATE ON admins 
                    FOR EACH ROW 
                    EXECUTE FUNCTION update_updated_at_column();
            `);
            console.log('✅ Admin table created manually');
        }

        // Create default super admin
        const defaultPassword = 'admin123';
        const passwordHash = await bcrypt.hash(defaultPassword, 10);
        
        await client.query(`
            INSERT INTO admins (username, password_hash, full_name, role, status) 
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (username) DO UPDATE SET
                password_hash = EXCLUDED.password_hash,
                full_name = EXCLUDED.full_name,
                role = EXCLUDED.role,
                status = EXCLUDED.status
        `, ['admin', passwordHash, 'System Administrator', 'super_admin', 'active']);

        console.log('✅ Default super admin created');
        console.log('   Username: admin');
        console.log('   Password: admin123');
        
        // Create view for admin list
        await client.query(`
            CREATE OR REPLACE VIEW admin_list AS
            SELECT 
                id,
                username,
                full_name,
                role,
                status,
                created_at,
                updated_at,
                last_login,
                created_by,
                (SELECT full_name FROM admins a2 WHERE a2.id = admins.created_by) as created_by_name
            FROM admins
            ORDER BY created_at DESC;
        `);
        
        console.log('✅ Admin list view created');

        // Test the table
        const result = await client.query('SELECT id, username, full_name, role FROM admins');
        console.log('📊 Current admins in database:');
        result.rows.forEach(admin => {
            console.log(`   - ${admin.username} (${admin.full_name}) - ${admin.role}`);
        });

        console.log('🎉 Admin table setup completed successfully!');
        
    } catch (error) {
        console.error('❌ Error setting up admin table:', error);
        throw error;
    } finally {
        client.release();
    }
}

// Run setup if called directly
if (require.main === module) {
    setupAdminTable()
        .then(() => {
            console.log('✅ Setup completed');
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ Setup failed:', error);
            process.exit(1);
        });
}

module.exports = { setupAdminTable };