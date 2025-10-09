const { Sequelize } = require('sequelize');

// Database configuration
const isDevelopment = process.env.NODE_ENV !== 'production';

// Use the Railway PostgreSQL connection string you provided
const databaseUrl = process.env.DATABASE_URL || 'postgresql://postgres:uEDCzaMjeCGBXCItjOqqMNEYECEFgBsn@postgres.railway.internal:5432/railway';

console.log('🔗 Connecting to PostgreSQL database...');
console.log('🔗 Database URL:', databaseUrl.replace(/:[^:]*@/, ':***@'));

const sequelize = new Sequelize(databaseUrl, {
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
  },
  retry: {
    max: 3
  }
});

// Test connection
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ PostgreSQL connection has been established successfully.');
    return true;
  } catch (error) {
    console.error('❌ Unable to connect to PostgreSQL database:', error.message);
    throw error;
  }
};

module.exports = { sequelize, testConnection };