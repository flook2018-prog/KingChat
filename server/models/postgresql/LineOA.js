const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');

const LineOA = sequelize.define('LineOA', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 100]
    }
  },
  channelId: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true
    }
  },
  channelSecret: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  accessToken: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  webhookUrl: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isUrl: true
    }
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'pending', 'error'),
    defaultValue: 'pending'
  },
  lastWebhookCheck: {
    type: DataTypes.DATE,
    allowNull: true
  },
  totalMessages: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  totalCustomers: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  settings: {
    type: DataTypes.JSON,
    defaultValue: {}
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'lineoa_accounts',
  timestamps: true,
  indexes: [
    {
      fields: ['channelId']
    },
    {
      fields: ['status']
    },
    {
      fields: ['isActive']
    }
  ]
});

module.exports = LineOA;