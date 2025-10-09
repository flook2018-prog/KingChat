const { sequelize, testConnection } = require('./config/database');
const bcrypt = require('bcryptjs');

// Show all admins
async function showAdmins() {
  try {
    console.log('👥 Fetching all admin users...');
    
    const [admins] = await sequelize.query(`
      SELECT id, username, email, "displayName", role, "isActive", "createdAt"
      FROM admins
      ORDER BY "createdAt" DESC;
    `);
    
    if (admins.length === 0) {
      console.log('📝 No admin users found');
      return [];
    }
    
    console.log(`📋 Found ${admins.length} admin user(s):`);
    console.log('');
    
    admins.forEach((admin, index) => {
      console.log(`${index + 1}. ID: ${admin.id}`);
      console.log(`   Username: ${admin.username}`);
      console.log(`   Email: ${admin.email}`);
      console.log(`   Display Name: ${admin.displayName || 'N/A'}`);
      console.log(`   Role: ${admin.role}`);
      console.log(`   Active: ${admin.isActive ? 'Yes' : 'No'}`);
      console.log(`   Created: ${admin.createdAt}`);
      console.log('   ---');
    });
    
    return admins;
  } catch (error) {
    console.error('❌ Error fetching admins:', error.message);
    return [];
  }
}

// Update admin password
async function updateAdminPassword(username, newPassword) {
  try {
    console.log(`🔄 Updating password for user: ${username}`);
    
    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    
    // Update password
    const [result] = await sequelize.query(`
      UPDATE admins 
      SET password = :password, "updatedAt" = CURRENT_TIMESTAMP
      WHERE username = :username;
    `, {
      replacements: { password: hashedPassword, username }
    });
    
    if (result.rowCount === 0) {
      console.log(`❌ Admin user '${username}' not found`);
      return false;
    }
    
    console.log(`✅ Password updated successfully for user: ${username}`);
    return true;
  } catch (error) {
    console.error('❌ Error updating password:', error.message);
    return false;
  }
}

// Delete admin
async function deleteAdmin(username) {
  try {
    console.log(`🗑️  Attempting to delete user: ${username}`);
    
    // Check if this is the last admin
    const [adminCount] = await sequelize.query(`
      SELECT COUNT(*) as count FROM admins WHERE role = 'admin' AND "isActive" = true;
    `);
    
    if (adminCount[0].count <= 1) {
      console.log('❌ Cannot delete the last active admin user');
      return false;
    }
    
    // Delete admin
    const [result] = await sequelize.query(`
      DELETE FROM admins WHERE username = :username;
    `, {
      replacements: { username }
    });
    
    if (result.rowCount === 0) {
      console.log(`❌ Admin user '${username}' not found`);
      return false;
    }
    
    console.log(`✅ Admin user '${username}' deleted successfully`);
    return true;
  } catch (error) {
    console.error('❌ Error deleting admin:', error.message);
    return false;
  }
}

// Create new admin
async function createNewAdmin(username, email, password, displayName = null, role = 'admin') {
  try {
    console.log(`👤 Creating new admin: ${username}`);
    
    // Check if user already exists
    const [existing] = await sequelize.query(`
      SELECT id FROM admins WHERE username = :username OR email = :email;
    `, {
      replacements: { username, email }
    });
    
    if (existing.length > 0) {
      console.log('❌ User with this username or email already exists');
      return false;
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Create admin
    await sequelize.query(`
      INSERT INTO admins (username, email, password, "displayName", role, permissions, "isActive")
      VALUES (:username, :email, :password, :displayName, :role, '["all"]', true);
    `, {
      replacements: {
        username,
        email,
        password: hashedPassword,
        displayName: displayName || username,
        role
      }
    });
    
    console.log(`✅ Admin user '${username}' created successfully`);
    return true;
  } catch (error) {
    console.error('❌ Error creating admin:', error.message);
    return false;
  }
}

// Interactive menu
async function interactiveMenu() {
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  function question(prompt) {
    return new Promise((resolve) => {
      rl.question(prompt, resolve);
    });
  }
  
  try {
    console.log('🎛️  KingChat Admin Management Tool');
    console.log('===================================');
    console.log('1. Show all admins');
    console.log('2. Create new admin');
    console.log('3. Update admin password');
    console.log('4. Delete admin');
    console.log('5. Exit');
    console.log('');
    
    const choice = await question('Select option (1-5): ');
    
    switch (choice) {
      case '1':
        await showAdmins();
        break;
        
      case '2':
        const username = await question('Enter username: ');
        const email = await question('Enter email: ');
        const password = await question('Enter password: ');
        const displayName = await question('Enter display name (optional): ');
        await createNewAdmin(username, email, password, displayName || null);
        break;
        
      case '3':
        const updateUsername = await question('Enter username to update: ');
        const newPassword = await question('Enter new password: ');
        await updateAdminPassword(updateUsername, newPassword);
        break;
        
      case '4':
        const deleteUsername = await question('Enter username to delete: ');
        const confirm = await question(`Are you sure you want to delete '${deleteUsername}'? (yes/no): `);
        if (confirm.toLowerCase() === 'yes') {
          await deleteAdmin(deleteUsername);
        } else {
          console.log('Delete operation cancelled');
        }
        break;
        
      case '5':
        console.log('Goodbye!');
        break;
        
      default:
        console.log('Invalid option');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    rl.close();
  }
}

// Main function
async function main() {
  try {
    console.log('🚀 KingChat Admin Management');
    console.log('🗄️  Database: PostgreSQL');
    
    // Test connection
    await testConnection();
    
    // Check command line arguments
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
      // Interactive mode
      await interactiveMenu();
    } else {
      // Command line mode
      const action = args[0];
      
      switch (action) {
        case 'show':
          await showAdmins();
          break;
          
        case 'create':
          if (args.length < 4) {
            console.log('Usage: node adminManager.js create <username> <email> <password> [displayName]');
            process.exit(1);
          }
          await createNewAdmin(args[1], args[2], args[3], args[4]);
          break;
          
        case 'password':
          if (args.length < 3) {
            console.log('Usage: node adminManager.js password <username> <newPassword>');
            process.exit(1);
          }
          await updateAdminPassword(args[1], args[2]);
          break;
          
        case 'delete':
          if (args.length < 2) {
            console.log('Usage: node adminManager.js delete <username>');
            process.exit(1);
          }
          await deleteAdmin(args[1]);
          break;
          
        default:
          console.log('Available commands:');
          console.log('  show                              - Show all admins');
          console.log('  create <user> <email> <password>  - Create new admin');
          console.log('  password <user> <newPassword>     - Update password');
          console.log('  delete <username>                 - Delete admin');
      }
    }
    
  } catch (error) {
    console.error('❌ Application error:', error.message);
  } finally {
    process.exit(0);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  showAdmins,
  createNewAdmin,
  updateAdminPassword,
  deleteAdmin
};