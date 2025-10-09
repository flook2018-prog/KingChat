const { Sequelize } = require('sequelize');

// Database configuration
const isDevelopment = process.env.NODE_ENV !== 'production';

let sequelize;

// Set default DATABASE_URL if not provided (Railway fallback)
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'postgresql://postgres:uEDCzaMjeCGBXCItjOqqMNEYECEFgBsn@postgres.railway.internal:5432/railway';
}

if (process.env.DATABASE_URL) {
  console.log('🔗 Connecting to PostgreSQL:', process.env.DATABASE_URL.replace(/:[^:]*@/, ':***@'));
  
  // Production: Use Railway PostgreSQL
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    protocol: 'postgres',
    logging: isDevelopment ? console.log : false,
    dialectOptions: {
      ssl: false // Railway internal connection doesn't need SSL
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  });
} else {
  // Development: Use local PostgreSQL or fallback
  sequelize = new Sequelize({
    dialect: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'kingchat',
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    logging: console.log,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  });
}

// Test connection
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ PostgreSQL connection has been established successfully.');
    
  } catch (error) {
    console.error('❌ Unable to connect to PostgreSQL database:', error.message);
    throw error; // Re-throw to handle in calling function
  }
};

module.exports = { sequelize, testConnection };