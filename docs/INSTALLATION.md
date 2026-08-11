# 📦 INSTALLATION.md

## دليل التثبيت الكامل
**Complete Installation Guide**

---

## 📋 الجدول

- [العربية](#العربية)
- [English](#english)

---

# 🇸🇦 العربية

## المتطلبات قبل البدء

```
✅ Node.js v20.18.1 LTS
✅ npm v10+
✅ PostgreSQL v14+
✅ Git
✅ Docker (اختياري)
```

---

## الخطوة 1️⃣: فك ضغط الملفات

```bash
# انسخ الملف ZIP
# ثم فك الضغط

cd C:\Users\YourName\Desktop\
# أو أينما حفظت الملفات
```

---

## الخطوة 2️⃣: التحقق من Node.js

```bash
node --version
# يجب أن تشاهد: v20.18.1

npm --version
# يجب أن تشاهد: v10+
```

إذا كان الإصدار مختلف:
- اذهب لـ: https://nodejs.org
- حمّل الإصدار v20 LTS
- ثبّته

---

## الخطوة 3️⃣: التحقق من PostgreSQL

```bash
# يجب أن يكون مشغل
# تحقق من Windows Services:
# Services.msc → PostgreSQL
```

أو استخدم Docker:

```bash
docker-compose up -d
```

---

## الخطوة 4️⃣: تثبيت Dependencies

```bash
# في مجلد المشروع
cd specialist-platform

# ثبّت الـ packages
npm install
```

---

## الخطوة 5️⃣: تشغيل Migrations

```bash
cd apps/backend

# شغّل migrations
npm run typeorm migration:run
```

---

## الخطوة 6️⃣: بدء التشغيل

### Terminal 1: Backend

```bash
cd apps/backend
npm run start:dev

# يجب أن ترى:
# ✅ Nest application successfully started on port 3001
```

### Terminal 2: Frontend

```bash
cd apps/frontend
npm run dev

# يجب أن ترى:
# ✅ ready - started server on 0.0.0.0:3000
```

---

## الخطوة 7️⃣: افتح الموقع

```
اضغط على المتصفح:
http://localhost:3000

سجل الدخول:
📧 البريد: admin@platform.com
🔒 كلمة المرور: Admin@123456
```

---

## ✅ نجح التثبيت إذا:

```
✅ Backend يعمل على port 3001
✅ Frontend يعمل على port 3000
✅ قاعدة البيانات متصلة
✅ تسجيل الدخول ينجح
✅ لوحة التحكم تحمّل
```

---

## 🆘 حل المشاكل الشائعة

### مشكلة: Port already in use

```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac
lsof -i :3000
kill -9 <PID>
```

### مشكلة: Module not found

```bash
npm install
npm run build
```

### مشكلة: Database connection error

```bash
# تأكد من تشغيل PostgreSQL
# أو استخدم Docker:
docker-compose up -d
```

### مشكلة: Invalid password

```bash
# البيانات الافتراضية:
Email: admin@platform.com
Password: Admin@123456

# أو أعد تشغيل migration
```

---

# 🇬🇧 English

## Prerequisites

```
✅ Node.js v20.18.1 LTS
✅ npm v10+
✅ PostgreSQL v14+
✅ Git
✅ Docker (optional)
```

---

## Step 1️⃣: Extract Files

```bash
cd C:\Users\YourName\Desktop\
# or where you saved the files
```

---

## Step 2️⃣: Check Node.js

```bash
node --version
# Should see: v20.18.1

npm --version
# Should see: v10+
```

---

## Step 3️⃣: Check PostgreSQL

```bash
# Make sure it's running
# Go to: Services.msc → PostgreSQL

# Or use Docker:
docker-compose up -d
```

---

## Step 4️⃣: Install Dependencies

```bash
cd specialist-platform

npm install
```

---

## Step 5️⃣: Run Migrations

```bash
cd apps/backend

npm run typeorm migration:run
```

---

## Step 6️⃣: Start Development

### Terminal 1: Backend

```bash
cd apps/backend
npm run start:dev

# You should see:
# ✅ Nest application successfully started on port 3001
```

### Terminal 2: Frontend

```bash
cd apps/frontend
npm run dev

# You should see:
# ✅ ready - started server on 0.0.0.0:3000
```

---

## Step 7️⃣: Open in Browser

```
Go to:
http://localhost:3000

Login with:
📧 Email: admin@platform.com
🔒 Password: Admin@123456
```

---

## ✅ Installation Successful If:

```
✅ Backend running on port 3001
✅ Frontend running on port 3000
✅ Database connected
✅ Login successful
✅ Dashboard loads
```

---

## 🆘 Common Issues

### Issue: Port already in use

```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac
lsof -i :3000
kill -9 <PID>
```

### Issue: Module not found

```bash
npm install
npm run build
```

### Issue: Database connection error

```bash
# Make sure PostgreSQL is running
# Or use Docker:
docker-compose up -d
```

### Issue: Invalid password

```bash
# Default credentials:
Email: admin@platform.com
Password: Admin@123456

# Or re-run migration
```

---

## 📞 Support

For more help, see:
- PROJECT_STATUS.md
- IMPLEMENTATION_GUIDE.md
- PERMISSIONS_GUIDE.md

---

**Version:** v1.0
**Updated:** June 2024
**Status:** Production Ready ✅
