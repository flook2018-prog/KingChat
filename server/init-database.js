const { Pool } = require('pg');

// Database connection configuration
const pool = new Pool({
  connectionString: 'postgresql://postgres:uEDCzaMjeCGBXCItjOqqMNEYECEFgBsn@postgres.railway.internal:5432/railway',
  ssl: false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

async function initializeDatabase() {
  try {
    console.log('🔄 Initializing PostgreSQL database...');

    // Test connection
    const client = await pool.connect();
    console.log('✅ Database connection successful');

    // Create admins table
    const createAdminsTableQuery = `
      CREATE TABLE IF NOT EXISTS admins (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        email VARCHAR(100),
        full_name VARCHAR(100),
        role VARCHAR(20) DEFAULT 'admin',
        status VARCHAR(20) DEFAULT 'active',
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP
      );
    `;

    await client.query(createAdminsTableQuery);
    console.log('✅ Admins table created successfully');

    // Create line_oa_accounts table
    const createLineOATableQuery = `
      CREATE TABLE IF NOT EXISTS line_oa_accounts (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        channel_id VARCHAR(100) UNIQUE NOT NULL,
        channel_secret VARCHAR(255),
        access_token VARCHAR(500),
        webhook_url VARCHAR(500),
        status VARCHAR(20) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await client.query(createLineOATableQuery);
    console.log('✅ LINE OA accounts table created successfully');

    // Create customers table
    const createCustomersTableQuery = `
      CREATE TABLE IF NOT EXISTS customers (
        id SERIAL PRIMARY KEY,
        line_user_id VARCHAR(100) UNIQUE NOT NULL,
        display_name VARCHAR(100),
        picture_url VARCHAR(500),
        status_message VARCHAR(500),
        phone_number VARCHAR(20),
        email VARCHAR(100),
        notes TEXT,
        tags VARCHAR(500),
        is_blocked BOOLEAN DEFAULT FALSE,
        last_interaction TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await client.query(createCustomersTableQuery);
    console.log('✅ Customers table created successfully');

    // Create quick_messages table
    const createQuickMessagesTableQuery = `
      CREATE TABLE IF NOT EXISTS quick_messages (
        id SERIAL PRIMARY KEY,
        title VARCHAR(100) NOT NULL,
        content TEXT NOT NULL,
        category VARCHAR(50) DEFAULT 'general',
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await client.query(createQuickMessagesTableQuery);
    console.log('✅ Quick messages table created successfully');

    // Insert default admin if not exists
    const bcrypt = require('bcrypt');
    const adminCheck = await client.query('SELECT * FROM admins WHERE username = $1', ['admin']);
    
    if (adminCheck.rows.length === 0) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await client.query(
        'INSERT INTO admins (username, password, email, full_name, role, status) VALUES ($1, $2, $3, $4, $5, $6)',
        ['admin', hashedPassword, 'admin@kingchat.com', 'System Administrator', 'super-admin', 'active']
      );
      console.log('✅ Default admin user created: admin / admin123');
    } else {
      console.log('✅ Default admin user already exists');
    }

    // Insert sample LINE OA account if not exists
    const lineOACheck = await client.query('SELECT * FROM line_oa_accounts WHERE channel_id = $1', ['@kingchat_demo']);
    
    if (lineOACheck.rows.length === 0) {
      await client.query(
        'INSERT INTO line_oa_accounts (name, channel_id, channel_secret, access_token, webhook_url, status) VALUES ($1, $2, $3, $4, $5, $6)',
        ['KingChat Demo', '@kingchat_demo', 'demo_secret', 'demo_access_token', 'https://kingchat.up.railway.app/api/webhook', 'active']
      );
      console.log('✅ Sample LINE OA account created');
    } else {
      console.log('✅ Sample LINE OA account already exists');
    }

    // Insert sample quick messages if not exists
    const quickMsgCheck = await client.query('SELECT COUNT(*) FROM quick_messages');
    
    if (parseInt(quickMsgCheck.rows[0].count) === 0) {
      const sampleMessages = [
        ['สวัสดีครับ', 'สวัสดีครับ ยินดีให้บริการ', 'greeting'],
        ['ขอบคุณครับ', 'ขอบคุณที่ใช้บริการครับ', 'greeting'],
        ['รอสักครู่', 'กรุณารอสักครู่นะครับ กำลังตรวจสอบข้อมูลให้', 'general'],
        ['ช่วยเหลือ', 'มีอะไรให้ช่วยเหลือไหมครับ?', 'support']
      ];

      for (const [title, content, category] of sampleMessages) {
        await client.query(
          'INSERT INTO quick_messages (title, content, category) VALUES ($1, $2, $3)',
          [title, content, category]
        );
      }
      console.log('✅ Sample quick messages created');
    } else {
      console.log('✅ Quick messages already exist');
    }

    client.release();
    console.log('✅ Database initialization completed successfully');
    return true;

  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    console.error('Error details:', error.message);
    return false;
  }
}

// Run initialization
if (require.main === module) {
  initializeDatabase().then((success) => {
    if (success) {
      console.log('🎉 Database setup completed!');
      process.exit(0);
    } else {
      console.log('💥 Database setup failed!');
      process.exit(1);
    }
  });
}

module.exports = { initializeDatabase };