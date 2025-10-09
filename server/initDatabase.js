const { testConnection } = require('./config/database');
const { Admin, User, Customer, Message, Settings, LineOA } = require('./models/postgresql');
const bcrypt = require('bcryptjs');

async function initializeDatabase() {
  try {
    console.log('🔄 Initializing PostgreSQL database...');
    
    // Test connection
    await testConnection();
    
    // Sync all models to create tables
    console.log('📝 Creating database tables...');
    await Admin.sync({ force: false });
    await User.sync({ force: false });
    await LineOA.sync({ force: false });
    await Customer.sync({ force: false });
    await Message.sync({ force: false });
    await Settings.sync({ force: false });
    
    console.log('✅ Database tables created successfully');
    
    // Check if default admin exists
    const adminCount = await Admin.count();
    if (adminCount === 0) {
      console.log('👤 Creating default admin user...');
      
      const defaultAdmin = await Admin.create({
        username: 'admin',
        email: 'admin@kingchat.com',
        password: 'admin123', // Will be hashed by the model hook
        displayName: 'System Administrator',
        role: 'admin',
        permissions: ['all'],
        isActive: true
      });
      
      console.log(`✅ Default admin created: ${defaultAdmin.username}`);
    } else {
      console.log('ℹ️  Admin user already exists, skipping creation');
    }
    
    // Create default settings
    const settingsCount = await Settings.count();
    if (settingsCount === 0) {
      console.log('⚙️  Creating default settings...');
      
      const defaultSettings = [
        {
          category: 'general',
          key: 'app_name',
          value: 'KingChat',
          type: 'string',
          description: 'Application name',
          isPublic: true
        },
        {
          category: 'general',
          key: 'app_version',
          value: '1.0.0',
          type: 'string',
          description: 'Application version',
          isPublic: true
        },
        {
          category: 'chat',
          key: 'max_message_length',
          value: '1000',
          type: 'number',
          description: 'Maximum message length',
          isPublic: false
        }
      ];
      
      await Settings.bulkCreate(defaultSettings);
      console.log('✅ Default settings created');
    } else {
      console.log('ℹ️  Settings already exist, skipping creation');
    }
    
    console.log('🎉 Database initialization completed successfully');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  initializeDatabase();
}

module.exports = { initializeDatabase };