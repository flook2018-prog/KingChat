const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// MongoDB connection (Atlas)
const mongoUrl = 'mongodb+srv://kingchat:kingchat2024@cluster0.mongodb.net/kingchat?retryWrites=true&w=majority';

// Admin Schema
const adminSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  level: { type: Number, default: 80 },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Admin = mongoose.model('Admin', adminSchema);

async function createAdminUsers() {
  try {
    console.log('🔗 กำลังเชื่อมต่อ MongoDB...');
    await mongoose.connect(mongoUrl);
    console.log('✅ เชื่อมต่อ MongoDB สำเร็จ');

    // ลบข้อมูลเก่า
    await Admin.deleteMany({});
    console.log('🗑️ ลบข้อมูลเก่าแล้ว');

    // สร้างรหัสผ่านแบบ hash
    const password1 = await bcrypt.hash('admin123', 10);
    const password2 = await bcrypt.hash('kingchat2024', 10);
    const password3 = await bcrypt.hash('superadmin', 10);
    const password4 = await bcrypt.hash('test123', 10);

    // เพิ่มผู้ใช้ใหม่
    const users = [
      { username: 'admin', password: password1, level: 100 },
      { username: 'kingchat', password: password2, level: 80 },
      { username: 'superadmin', password: password3, level: 100 },
      { username: 'test', password: password4, level: 50 }
    ];

    for (const userData of users) {
      const admin = new Admin(userData);
      await admin.save();
      console.log(`✅ สร้าง user: ${userData.username} (level: ${userData.level}) สำเร็จ`);
    }

    // แสดงรายการผู้ใช้ทั้งหมด
    const allUsers = await Admin.find({}, 'username level createdAt').sort({ level: -1 });
    
    console.log('\n🎉 สร้างผู้ใช้สำเร็จ! รายการผู้ใช้ในระบบ:');
    console.log('====================================');
    allUsers.forEach(user => {
      const levelName = user.level >= 100 ? 'Super Admin' : user.level >= 80 ? 'Admin' : 'User';
      console.log(`Username: ${user.username.padEnd(12)} | Level: ${user.level} (${levelName}) | สร้างเมื่อ: ${user.createdAt.toLocaleString('th-TH')}`);
    });
    
    console.log('\n🔑 รหัสเข้าใช้งาน:');
    console.log('====================================');
    console.log('1. Username: admin      | Password: admin123     | Level: 100 (Super Admin)');
    console.log('2. Username: kingchat   | Password: kingchat2024 | Level: 80 (Admin)');
    console.log('3. Username: superadmin | Password: superadmin   | Level: 100 (Super Admin)');
    console.log('4. Username: test       | Password: test123      | Level: 50 (User)');
    
    console.log('\n🌐 URL: https://kingchat.up.railway.app');
    console.log('🔧 แนะนำใช้: admin / admin123');

  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาด:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ ปิดการเชื่อมต่อ MongoDB แล้ว');
  }
}

// รันฟังก์ชัน
createAdminUsers();