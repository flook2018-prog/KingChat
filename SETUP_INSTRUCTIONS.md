# KingChat Demo Mode Setup

## 🎯 ข้อมูลสำคัญที่คุณต้องการ:

### 1. บัญชี Admin สำหรับ Login:
```
Username: admin
Password: admin123
Role: Super Admin

Username: somchai_admin
Password: admin123
Role: Admin

Username: supha_admin
Password: admin123
Role: Admin
```

### 2. การตั้งค่า Environment:
สร้างไฟล์ `.env` ใน folder `server` และเพิ่ม:
```env
NODE_ENV=development
PORT=5001
JWT_SECRET=kingchat-secret-key-2024
DATABASE_URL=postgresql://localhost:5432/kingchat
```

### 3. การติดตั้ง Dependencies:
```bash
cd server
npm install bcrypt jsonwebtoken
```

### 4. URLs สำหรับเข้าใช้งาน:
- Login Page: http://localhost:5001/login.html
- Admin Page: http://localhost:5001/admin-working.html
- API Endpoints: http://localhost:5001/api/

### 5. การทำงานของระบบ:
- ✅ Login system ทำงานด้วย admin-auth routes
- ✅ UI พร้อมใช้งาน (login, admin pages)
- ⚠️  Database connection ยังไม่ทำงาน (ต้องการ PostgreSQL)
- ✅ Fallback ให้แสดงข้อความเมื่อ API ไม่ทำงาน

### 6. Next Steps เพื่อให้ทำงานเต็มรูปแบบ:
1. ติดตั้งและตั้งค่า PostgreSQL
2. รัน setup script เพื่อสร้าง admin users
3. อัปเดต DATABASE_URL ใน .env file
4. ทดสอบการ login และจัดการ admin

คุณต้องการข้อมูลเพิ่มเติมเกี่ยวกับขั้นตอนไหนบ้าง?