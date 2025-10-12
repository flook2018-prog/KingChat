// Admin model using raw PostgreSQL queries
const { pool } = require('../database');

class Admin {
  constructor(data) {
    this.id = data.id;
    this.username = data.username;
    this.email = data.email;
    this.password = data.password;
    this.displayName = data.displayName || data.displayname;
    this.role = data.role;
    this.permissions = data.permissions;
    this.isActive = data.isActive !== undefined ? data.isActive : true;
    this.createdAt = data.createdAt || data.createdat;
    this.updatedAt = data.updatedAt || data.updatedat;
  }

  // Static methods for database operations
  static async findAll(options = {}) {
    try {
      const query = `
        SELECT id, username, email, password, "displayName", role, permissions, "isActive", "createdAt", "updatedAt"
        FROM admins 
        WHERE "isActive" = true
        ORDER BY "createdAt" DESC
      `;
      const result = await pool.query(query);
      return result.rows.map(row => new Admin(row));
    } catch (error) {
      console.error('Error in Admin.findAll:', error);
      throw error;
    }
  }

  static async findByPk(id) {
    try {
      const query = `
        SELECT id, username, email, password, "displayName", role, permissions, "isActive", "createdAt", "updatedAt"
        FROM admins 
        WHERE id = $1 AND "isActive" = true
        LIMIT 1
      `;
      const result = await pool.query(query, [id]);
      return result.rows.length > 0 ? new Admin(result.rows[0]) : null;
    } catch (error) {
      console.error('Error in Admin.findByPk:', error);
      throw error;
    }
  }

  static async findOne(options) {
    try {
      const { where } = options;
      let query = `
        SELECT id, username, email, password, "displayName", role, permissions, "isActive", "createdAt", "updatedAt"
        FROM admins 
        WHERE "isActive" = true
      `;
      const params = [];
      let paramIndex = 1;

      if (where) {
        if (where.username) {
          query += ` AND username = $${paramIndex++}`;
          params.push(where.username);
        }
        if (where.email) {
          query += ` AND email = $${paramIndex++}`;
          params.push(where.email);
        }
        if (where.id) {
          query += ` AND id = $${paramIndex++}`;
          params.push(where.id);
        }
      }

      query += ' LIMIT 1';
      const result = await pool.query(query, params);
      return result.rows.length > 0 ? new Admin(result.rows[0]) : null;
    } catch (error) {
      console.error('Error in Admin.findOne:', error);
      throw error;
    }
  }

  static async create(data) {
    try {
      const query = `
        INSERT INTO admins (username, email, password, "displayName", role, permissions, "isActive", "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
        RETURNING id, username, email, "displayName", role, permissions, "isActive", "createdAt", "updatedAt"
      `;
      const params = [
        data.username,
        data.email,
        data.password,
        data.displayName || data.fullName,
        data.role || 'admin',
        JSON.stringify(data.permissions || ["all"]),
        data.isActive !== undefined ? data.isActive : true
      ];
      
      const result = await pool.query(query, params);
      return new Admin(result.rows[0]);
    } catch (error) {
      console.error('Error in Admin.create:', error);
      throw error;
    }
  }

  static async update(updateData, options) {
    try {
      const { where } = options;
      if (!where || !where.id) {
        throw new Error('ID is required for update');
      }

      const updateFields = [];
      const params = [];
      let paramIndex = 1;

      // Build dynamic update query
      Object.keys(updateData).forEach(key => {
        if (updateData[key] !== undefined && key !== 'id') {
          if (key === 'displayName') {
            updateFields.push(`"displayName" = $${paramIndex++}`);
          } else if (key === 'permissions') {
            updateFields.push(`permissions = $${paramIndex++}`);
            updateData[key] = JSON.stringify(updateData[key]);
          } else {
            updateFields.push(`${key} = $${paramIndex++}`);
          }
          params.push(updateData[key]);
        }
      });

      if (updateFields.length === 0) {
        return [0]; // No fields to update
      }

      // Add updated timestamp
      updateFields.push(`"updatedAt" = NOW()`);
      
      // Add WHERE condition
      params.push(where.id);
      const whereIndex = paramIndex;

      const query = `
        UPDATE admins 
        SET ${updateFields.join(', ')}
        WHERE id = $${whereIndex}
        RETURNING id, username, email, "displayName", role, permissions, "isActive", "createdAt", "updatedAt"
      `;

      const result = await pool.query(query, params);
      return [result.rowCount, result.rows.map(row => new Admin(row))];
    } catch (error) {
      console.error('Error in Admin.update:', error);
      throw error;
    }
  }

  static async destroy(options) {
    try {
      const { where } = options;
      if (!where || !where.id) {
        throw new Error('ID is required for delete');
      }

      const query = 'DELETE FROM admins WHERE id = $1';
      const result = await pool.query(query, [where.id]);
      return result.rowCount;
    } catch (error) {
      console.error('Error in Admin.destroy:', error);
      throw error;
    }
  }

  // Instance methods
  async save() {
    try {
      if (this.id) {
        // Update existing
        const updateData = {
          username: this.username,
          email: this.email,
          password: this.password,
          displayName: this.displayName,
          role: this.role,
          permissions: this.permissions,
          isActive: this.isActive
        };
        await Admin.update(updateData, { where: { id: this.id } });
      } else {
        // Create new
        const created = await Admin.create(this);
        this.id = created.id;
        this.createdAt = created.createdAt;
        this.updatedAt = created.updatedAt;
      }
      return this;
    } catch (error) {
      console.error('Error in Admin.save:', error);
      throw error;
    }
  }

  async update(data) {
    try {
      Object.assign(this, data);
      const [affectedRows, updatedAdmins] = await Admin.update(data, { where: { id: this.id } });
      if (updatedAdmins && updatedAdmins.length > 0) {
        Object.assign(this, updatedAdmins[0]);
      }
      return this;
    } catch (error) {
      console.error('Error in Admin instance update:', error);
      throw error;
    }
  }

  hasPermission(permission) {
    if (this.role === 'super_admin') return true;
    return this.permissions && this.permissions.includes(permission);
  }

  getLevel() {
    const roleLevels = {
      'super_admin': 100,
      'admin': 80,
      'moderator': 60,
      'support': 40
    };
    return roleLevels[this.role] || 20;
  }

  // Static helper methods
  static async findByCredentials(identifier) {
    try {
      const query = `
        SELECT id, username, email, password, "displayName", role, permissions, "isActive", "createdAt", "updatedAt"
        FROM admins 
        WHERE (username = $1 OR email = $1) AND "isActive" = true
        LIMIT 1
      `;
      const result = await pool.query(query, [identifier]);
      return result.rows.length > 0 ? new Admin(result.rows[0]) : null;
    } catch (error) {
      console.error('Error in Admin.findByCredentials:', error);
      throw error;
    }
  }
}

module.exports = Admin;