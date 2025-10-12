const { pool } = require('./database');
const bcrypt = require('bcrypt');

class Admin {
  static async getAll() {
    const query = 
      SELECT 
        id,
        username,
        display_name as full_name,
        role,
        COALESCE(points, 0) as points,
        COALESCE(messages_handled, 0) as messages_handled,
        created_at,
        CASE 
          WHEN role = 'super_admin' THEN 100 
          ELSE 80 
        END as level
      FROM admin 
      ORDER BY points DESC, created_at DESC
    ;
    const result = await pool.query(query);
    return result.rows;
  }

  static async getById(id) {
    const query = 
      SELECT 
        id,
        username,
        display_name as full_name,
        role,
        COALESCE(points, 0) as points,
        COALESCE(messages_handled, 0) as messages_handled,
        created_at,
        CASE 
          WHEN role = 'super_admin' THEN 100 
          ELSE 80 
        END as level
      FROM admin 
      WHERE id = $1
    ;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async create(data) {
    const hashedPassword = await bcrypt.hash(data.password, 10);
    
    const query = 
      INSERT INTO admin (username, password_hash, display_name, role, points, messages_handled)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING 
        id,
        username,
        display_name as full_name,
        role,
        COALESCE(points, 0) as points,
        COALESCE(messages_handled, 0) as messages_handled,
        created_at,
        CASE 
          WHEN role = 'super_admin' THEN 100 
          ELSE 80 
        END as level
    ;
    
    const values = [
      data.username,
      hashedPassword,
      data.fullName,
      data.role,
      data.points || 0,
      Math.floor((data.points || 0) / 10)
    ];
    
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async update(id, data) {
    let query = UPDATE admin SET ;
    const values = [];
    const updates = [];
    let paramCount = 1;

    if (data.fullName) {
      updates.push(display_name = $${paramCount});
      values.push(data.fullName);
      paramCount++;
    }

    if (data.username) {
      updates.push(username = $${paramCount});
      values.push(data.username);
      paramCount++;
    }

    if (data.password) {
      const hashedPassword = await bcrypt.hash(data.password, 10);
      updates.push(password_hash = $${paramCount});
      values.push(hashedPassword);
      paramCount++;
    }

    if (data.role) {
      updates.push(ole = $${paramCount});
      values.push(data.role);
      paramCount++;
    }

    if (data.points !== undefined) {
      updates.push(points = $${paramCount});
      values.push(data.points);
      paramCount++;
      
      updates.push(messages_handled = $${paramCount});
      values.push(Math.floor(data.points / 10));
      paramCount++;
    }

    query += updates.join(', ');
    query +=  WHERE id = $${paramCount} RETURNING 
      id,
      username,
      display_name as full_name,
      role,
      COALESCE(points, 0) as points,
      COALESCE(messages_handled, 0) as messages_handled,
      created_at,
      CASE 
        WHEN role = 'super_admin' THEN 100 
        ELSE 80 
      END as level;
    
    values.push(id);
    
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async delete(id) {
    const query = DELETE FROM admin WHERE id = $1 RETURNING *;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }
}

module.exports = Admin;
