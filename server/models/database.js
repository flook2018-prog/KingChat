const { Pool } = require('pg');

// Database connection configuration
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:uEDCzaMjeCGBXCItjOqqMNEYECEFgBsn@postgres.railway.internal:5432/railway',
  ssl: false, // Railway internal connections don't need SSL
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

// Test database connection
const testConnection = async () => {
  try {
    const client = await pool.connect();
    console.log('✅ Database connection test successful');
    client.release();
    return true;
  } catch (error) {
    console.error('❌ Database connection test failed:', error);
    throw error;
  }
};

pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('❌ Database connection error:', err);
});

// Database Models
class LineAccount {
  static async getAll() {
    const query = `
      SELECT id, name, channel_id, status, webhook_verified, created_at,
             (SELECT COUNT(*) FROM customers WHERE line_account_id = line_accounts.id) as customer_count,
             (SELECT COUNT(*) FROM chat_messages WHERE line_account_id = line_accounts.id AND timestamp >= CURRENT_DATE) as message_count_today
      FROM line_accounts 
      ORDER BY created_at DESC
    `;
    const result = await pool.query(query);
    return result.rows;
  }

  static async create(data) {
    const query = `
      INSERT INTO line_accounts (name, channel_id, channel_secret, access_token, status)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const values = [data.name, data.channel_id, data.channel_secret, data.access_token, 'active'];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async update(id, data) {
    const query = `
      UPDATE line_accounts 
      SET name = $2, channel_secret = $3, access_token = $4, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;
    const values = [id, data.name, data.channel_secret, data.access_token];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async delete(id) {
    const query = 'DELETE FROM line_accounts WHERE id = $1 RETURNING *';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async getById(id) {
    const query = 'SELECT * FROM line_accounts WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async getByChannelId(channelId) {
    const query = 'SELECT * FROM line_accounts WHERE channel_id = $1';
    const result = await pool.query(query, [channelId]);
    return result.rows[0];
  }
}

class Customer {
  static async getAll() {
    const query = `
      SELECT c.*, la.name as line_account_name,
             (SELECT COUNT(*) FROM chat_messages WHERE customer_id = c.id AND read_status = false) as unread_count,
             (SELECT message_content FROM chat_messages WHERE customer_id = c.id ORDER BY timestamp DESC LIMIT 1) as last_message,
             (SELECT timestamp FROM chat_messages WHERE customer_id = c.id ORDER BY timestamp DESC LIMIT 1) as last_message_time
      FROM customers c
      LEFT JOIN line_accounts la ON c.line_account_id = la.id
      ORDER BY c.last_activity DESC
    `;
    const result = await pool.query(query);
    return result.rows;
  }

  static async create(data) {
    const query = `
      INSERT INTO customers (line_user_id, display_name, picture_url, line_account_id, phone_number, notes)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const values = [data.line_user_id, data.display_name, data.picture_url, data.line_account_id, data.phone_number, data.notes];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async update(id, data) {
    const query = `
      UPDATE customers 
      SET display_name = $2, phone_number = $3, notes = $4, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;
    const values = [id, data.display_name, data.phone_number, data.notes];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async delete(id) {
    const query = 'DELETE FROM customers WHERE id = $1 RETURNING *';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async getById(id) {
    const query = `
      SELECT c.*, la.name as line_account_name, la.channel_id
      FROM customers c
      LEFT JOIN line_accounts la ON c.line_account_id = la.id
      WHERE c.id = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async getByLineUserId(lineUserId) {
    const query = 'SELECT * FROM customers WHERE line_user_id = $1';
    const result = await pool.query(query, [lineUserId]);
    return result.rows[0];
  }

  static async updateLastActivity(id) {
    const query = 'UPDATE customers SET last_activity = CURRENT_TIMESTAMP WHERE id = $1';
    await pool.query(query, [id]);
  }
}

class ChatMessage {
  static async getByCustomerId(customerId, limit = 50) {
    const query = `
      SELECT cm.*, la.name as line_account_name
      FROM chat_messages cm
      LEFT JOIN line_accounts la ON cm.line_account_id = la.id
      WHERE cm.customer_id = $1
      ORDER BY cm.timestamp DESC
      LIMIT $2
    `;
    const result = await pool.query(query, [customerId, limit]);
    return result.rows.reverse(); // Return in chronological order
  }

  static async create(data) {
    const query = `
      INSERT INTO chat_messages (customer_id, line_account_id, message_type, message_content, image_url, sticker_id, direction, reply_token)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
    const values = [
      data.customer_id, 
      data.line_account_id, 
      data.message_type, 
      data.message_content, 
      data.image_url, 
      data.sticker_id, 
      data.direction, 
      data.reply_token
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async markAsRead(customerId) {
    const query = 'UPDATE chat_messages SET read_status = true WHERE customer_id = $1 AND direction = \'incoming\'';
    await pool.query(query, [customerId]);
  }

  static async getUnreadCount() {
    const query = 'SELECT COUNT(*) as count FROM chat_messages WHERE read_status = false AND direction = \'incoming\'';
    const result = await pool.query(query);
    return parseInt(result.rows[0].count);
  }
}

class QuickMessage {
  static async getAll() {
    const query = `
      SELECT qm.*, u.username as created_by_name
      FROM quick_messages qm
      LEFT JOIN users u ON qm.created_by = u.id
      ORDER BY qm.created_at DESC
    `;
    const result = await pool.query(query);
    return result.rows;
  }

  static async create(data) {
    const query = `
      INSERT INTO quick_messages (title, content, image_url, created_by)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    const values = [data.title, data.content, data.image_url, data.created_by];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async update(id, data) {
    const query = `
      UPDATE quick_messages 
      SET title = $2, content = $3, image_url = $4, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;
    const values = [id, data.title, data.content, data.image_url];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async delete(id) {
    const query = 'DELETE FROM quick_messages WHERE id = $1 RETURNING *';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async incrementSentCount(id) {
    const query = 'UPDATE quick_messages SET sent_count = sent_count + 1 WHERE id = $1';
    await pool.query(query, [id]);
  }
}

class User {
  static async getAll() {
    const query = `
      SELECT id, username, email, role, status, last_login, created_at
      FROM users
      ORDER BY created_at DESC
    `;
    const result = await pool.query(query);
    return result.rows;
  }

  static async create(data) {
    const query = `
      INSERT INTO users (username, email, password_hash, role)
      VALUES ($1, $2, $3, $4)
      RETURNING id, username, email, role, status, created_at
    `;
    const values = [data.username, data.email, data.password_hash, data.role || 'user'];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async update(id, data) {
    const query = `
      UPDATE users 
      SET username = $2, email = $3, role = $4, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING id, username, email, role, status, updated_at
    `;
    const values = [id, data.username, data.email, data.role];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async delete(id) {
    const query = 'DELETE FROM users WHERE id = $1 RETURNING id, username, email';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async getByUsername(username) {
    const query = 'SELECT * FROM users WHERE username = $1';
    const result = await pool.query(query, [username]);
    return result.rows[0];
  }

  static async updateLastLogin(id) {
    const query = 'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1';
    await pool.query(query, [id]);
  }

  static async getAllWithPasswords() {
    const query = 'SELECT id, username, email, role, status, last_login, created_at, password_hash FROM users ORDER BY created_at ASC';
    const result = await pool.query(query);
    return result.rows;
  }

  static async updatePassword(id, hashedPassword) {
    const query = 'UPDATE users SET password_hash = $1 WHERE id = $2 RETURNING id, username, email';
    const result = await pool.query(query, [hashedPassword, id]);
    return result.rows[0];
  }
}

// Debug functions
async function debugDatabase() {
  try {
    console.log('🔍 Starting database debug...');
    
    // Test connection
    await testConnection();
    
    // Check if users table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `);
    
    console.log('📋 Users table exists:', tableCheck.rows[0].exists);
    
    if (tableCheck.rows[0].exists) {
      // Get all users
      const users = await pool.query('SELECT id, username, email, role, status, created_at FROM users ORDER BY id ASC');
      console.log('👥 Users in database:', users.rows.length);
      console.log('👥 Users data:', users.rows);
      
      return {
        success: true,
        tableExists: true,
        userCount: users.rows.length,
        users: users.rows
      };
    } else {
      console.log('❌ Users table does not exist');
      return {
        success: false,
        tableExists: false,
        error: 'Users table does not exist'
      };
    }
  } catch (error) {
    console.error('❌ Database debug failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

module.exports = {
  pool,
  testConnection,
  debugDatabase,
  LineAccount,
  Customer,
  ChatMessage,
  QuickMessage,
  User
};