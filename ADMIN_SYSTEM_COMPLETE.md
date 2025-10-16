# 🔐 KingChat Admin Management System

ระบบจัดการแอดมินสำหรับ KingChat ที่เชื่อมต่อกับ PostgreSQL Database

## 📋 Features

- ✅ ระบบ Login/Logout สำหรับแอดมิน
- ✅ 2 ระดับแอดมิน (admin, super_admin)
- ✅ เพิ่ม/แก้ไข/ลบแอดมิน
- ✅ Authentication ด้วย JWT Token
- ✅ Password Hashing ด้วย bcrypt
- ✅ ไม่ใช้ระบบอีเมล
- ✅ เชื่อมต่อ PostgreSQL Database

## 🗃️ Database Schema

### `admins` Table
```sql
- id (SERIAL PRIMARY KEY)
- username (VARCHAR(50) UNIQUE NOT NULL)
- password_hash (VARCHAR(255) NOT NULL)
- full_name (VARCHAR(100) NOT NULL)
- role (VARCHAR(20)) - 'admin' หรือ 'super_admin'
- status (VARCHAR(20)) - 'active' หรือ 'inactive'
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
- last_login (TIMESTAMP)
- created_by (INTEGER) - ใครสร้าง
```

## 👑 Admin Levels

### Super Admin
- สามารถจัดการแอดมินทั้งหมด (เพิ่ม/แก้ไข/ลบ)
- เปลี่ยน role และ status ของแอดมินอื่น
- เข้าถึงระบบทั้งหมด

### Admin
- เข้าถึงระบบทั่วไป
- แก้ไขข้อมูลตัวเอง (ยกเว้น role และ status)
- ไม่สามารถจัดการแอดมินอื่นได้

## 🚀 API Endpoints

### Authentication
```
POST /api/admin/login       - เข้าสู่ระบบ
POST /api/admin/logout      - ออกจากระบบ
GET  /api/admin/verify      - ตรวจสอบ token
```

### Admin Management (ต้อง login)
```
GET    /api/admin/admins     - ดูรายการแอดมินทั้งหมด
GET    /api/admin/admins/:id - ดูข้อมูลแอดมินเฉพาะ
POST   /api/admin/admins     - เพิ่มแอดมินใหม่ (Super Admin เท่านั้น)
PUT    /api/admin/admins/:id - แก้ไขแอดมิน
DELETE /api/admin/admins/:id - ลบแอดมิน (Super Admin เท่านั้น)
```

## 🔑 Default Admin Account

```
Username: admin
Password: admin123
Role: super_admin
```

## 📁 Files Structure

```
database/
├── admins_schema.sql           # Database schema

server/
├── routes/
│   └── admin-routes.js         # Admin API routes
├── setup-admin-complete.js     # Setup database table

client/
├── admin-login.html            # Login page
└── admin-working.html          # Admin management page
```

## 🛠️ Setup Instructions

### 1. Setup Database Table
```bash
cd server
node setup-admin-complete.js
```

### 2. Environment Variables
```env
DATABASE_URL=postgresql://user:pass@host:port/database
JWT_SECRET=your-secret-key
NODE_ENV=production
```

### 3. Install Dependencies
```bash
npm install bcrypt jsonwebtoken express pg
```

### 4. Start Server
```bash
npm start
```

## 🌐 Usage

### 1. Login
- ไปที่ `https://kingchat.up.railway.app/admin-login.html`
- ใส่ username และ password
- ระบบจะเก็บ token ใน localStorage/sessionStorage

### 2. Admin Management
- ไปที่ `https://kingchat.up.railway.app/admin-working.html`
- ดูรายการแอดมิน
- เพิ่ม/แก้ไข/ลบแอดมิน (ขึ้นอยู่กับสิทธิ์)

## 🔒 Security Features

- **Password Hashing**: ใช้ bcrypt กับ salt rounds 10
- **JWT Authentication**: Token หมดอายุใน 24 ชั่วโมง
- **Role-based Access**: ควบคุมสิทธิ์ตาม role
- **Input Validation**: ตรวจสอบข้อมูลที่ป้อนเข้า
- **SQL Injection Protection**: ใช้ parameterized queries

## 🐛 Troubleshooting

### Database Connection Issues
```bash
# Check database connection
node -e "console.log(process.env.DATABASE_URL)"

# Test connection
node test-connection.js
```

### Authentication Issues
- ตรวจสอบ JWT_SECRET ใน environment variables
- ลองลบ token ใน browser storage แล้ว login ใหม่

### Permission Errors
- ตรวจสอบ role ของแอดมิน
- Super Admin เท่านั้นที่สามารถจัดการแอดมินอื่นได้

## 📝 API Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message"
}
```

## 🔄 Update Notes

- ✅ ตาราง admins ถูกสร้างใน PostgreSQL
- ✅ API endpoints พร้อมใช้งาน
- ✅ Authentication system ทำงานปกติ
- ✅ Frontend UI เชื่อมต่อกับ database
- ✅ 2-level admin system ใช้งานได้

---

💡 **หมายเหตุ**: ระบบนี้ไม่ใช้อีเมลสำหรับการยืนยันตัวตนหรือรีเซ็ตรหัสผ่าน ใช้เฉพาะ username/password เท่านั้น