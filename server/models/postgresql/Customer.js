const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');

const Customer = sequelize.define('Customer', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  lineUserId: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true
  },
  displayName: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  pictureUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },
  statusMessage: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  phoneNumber: {
    type: DataTypes.STRING,
    allowNull: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isEmail: true
    }
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  tags: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  isBlocked: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  lastMessageAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  messageCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'blocked'),
    defaultValue: 'active'
  }
}, {
  tableName: 'customers',
  timestamps: true,
  indexes: [
    { fields: ['lineUserId'] },
    { fields: ['displayName'] },
    { fields: ['status'] },
    { fields: ['lastMessageAt'] }
  ]
});

module.exports = Customer;