# 📖 دليل التشغيل الكامل على Windows
# منصة إدارة أدوار الأخصائيين — الإصدار 1.0.0

---

## 📋 جدول المحتويات
1. تثبيت المتطلبات
2. تحضير المشروع
3. تشغيل قاعدة البيانات
4. تشغيل Backend
5. تشغيل Frontend
6. فتح المنصة
7. الوصول من الشبكة المحلية (LAN)
8. إيقاف المشروع
9. حل المشاكل الشائعة
10. Checklist التحقق النهائي

---

## 1️⃣ تثبيت المتطلبات

### Node.js
```
1. افتح: https://nodejs.org
2. اضغط "Download Node.js (LTS)" الزر الأخضر
3. شغّل الملف المحمّل وثبّته (Next → Next → Finish)
4. تحقق: افتح PowerShell واكتب:
   node --version
   npm --version
```

### Docker Desktop
```
1. افتح: https://www.docker.com/products/docker-desktop
2. اضغط "Download for Windows"
3. ثبّته وأعد تشغيل الجهاز
4. افتح Docker Desktop
5. انتظر حتى تصبح الأيقونة خضراء في شريط المهام
6. تحقق: افتح PowerShell واكتب:
   docker --version
```

### VS Code (اختياري لكن مستحسن)
```
1. افتح: https://code.visualstudio.com
2. حمّل وثبّت
3. Extensions مقترحة:
   - ES7+ React/Redux/React-Native snippets
   - Prettier - Code formatter
   - ESLint
   - TypeScript Hero
```

---

## 2️⃣ تحضير المشروع

### الطريقة السهلة (ملف BAT)
```
1. افتح مجلد المشروع
2. انقر مرتين على: setup-windows.bat
3. انتظر حتى ينتهي تلقائياً
```

### الطريقة اليدوية
افتح PowerShell داخل مجلد المشروع:

```powershell
# انسخ ملفات البيئة
copy apps\backend\.env.example apps\backend\.env
copy apps\frontend\.env.example apps\frontend\.env.local

# ثبّت حزم Backend
cd apps\backend
npm install
cd ..\..

# ثبّت حزم Frontend
cd apps\frontend
npm install
cd ..\..
```

---

## 3️⃣ تشغيل قاعدة البيانات

```powershell
docker-compose up postgres -d
```

انتظر حتى ترى:
```
✅ specialist_db  started
```

قاعدة البيانات ستُنشأ تلقائياً مع:
- 15 جدول كامل
- جميع الـ Indexes
- حساب Admin افتراضي

---

## 4️⃣ تشغيل Backend

افتح **PowerShell جديد**:

```powershell
cd apps\backend
npm run start:dev
```

انتظر حتى ترى:
```
╔══════════════════════════════════════════════════╗
║   🏥 منصة إدارة أدوار الأخصائيين               ║
║   🚀 Server: http://localhost:3001               ║
║   📚 Docs:   http://localhost:3001/api/docs      ║
╚══════════════════════════════════════════════════╝
```

---

## 5️⃣ تشغيل Frontend

افتح **PowerShell جديد ثانٍ**:

```powershell
cd apps\frontend
npm run dev
```

انتظر حتى ترى:
```
▲ Next.js 14.x.x
- Local:   http://localhost:3000
✓ Ready in 3.2s
```

---

## 6️⃣ فتح المنصة

افتح Chrome أو Edge واكتب:
```
http://localhost:3000
```

**بيانات الدخول:**
| | البيانات |
|-|---------|
| البريد | admin@platform.com |
| كلمة المرور | Admin@123456 |

**روابط مهمة:**
| الرابط | الوصف |
|--------|-------|
| http://localhost:3000 | المنصة |
| http://localhost:3001/api/docs | توثيق API |
| http://localhost:3001/api/v1/health | فحص الصحة |

---

## 7️⃣ الوصول من الشبكة المحلية (LAN)

```powershell
# اعرف IP جهازك
ipconfig
# ابحث عن: IPv4 Address ... مثلاً 192.168.1.100
```

عدّل `apps\frontend\.env.local`:
```
NEXT_PUBLIC_API_URL=http://192.168.1.100:3001/api/v1
```

الأجهزة الأخرى تفتح:
```
http://192.168.1.100:3000
```

---

## 8️⃣ إيقاف المشروع

```powershell
# في PowerShell 1 (Backend): اضغط Ctrl+C
# في PowerShell 2 (Frontend): اضغط Ctrl+C
# إيقاف Docker:
docker-compose down
```

---

## 9️⃣ حل المشاكل الشائعة

### مشكلة: npm غير موجود
```
الحل: أعد تشغيل PowerShell بعد تثبيت Node.js
```

### مشكلة: Docker غير موجود
```
الحل: افتح Docker Desktop وانتظر حتى تصبح الأيقونة خضراء
```

### مشكلة: المنفذ 3000 مستخدم
```powershell
# اعرف ما يستخدم المنفذ
netstat -ano | findstr :3000
# اقتل العملية
taskkill /PID <رقم_الـ_PID> /F
```

### مشكلة: قاعدة البيانات لا تتصل
```powershell
# تحقق من Docker
docker ps
# إذا postgres غير ظاهر:
docker-compose up postgres -d
```

### مشكلة: خطأ في الـ .env
```
الحل: تأكد أن apps\backend\.env موجود
      إذا لا: copy apps\backend\.env.example apps\backend\.env
```

### مشكلة: npm install بطيء جداً
```powershell
# استخدم mirror أسرع
npm config set registry https://registry.npmmirror.com
npm install
```

---

## 🔟 Checklist التحقق النهائي

### قبل التشغيل
- [ ] Node.js مثبت (`node --version` يعطي رقم)
- [ ] Docker Desktop مفتوح وأيقونته خضراء
- [ ] مجلد المشروع موجود بالكامل
- [ ] `apps\backend\.env` موجود
- [ ] `apps\frontend\.env.local` موجود

### أثناء التشغيل
- [ ] `docker-compose up postgres -d` نجح
- [ ] `npm install` في Backend نجح بدون أخطاء حمراء
- [ ] `npm install` في Frontend نجح بدون أخطاء حمراء
- [ ] Backend يعمل على http://localhost:3001
- [ ] Frontend يعمل على http://localhost:3000

### التحقق من الوظائف
- [ ] صفحة تسجيل الدخول تظهر
- [ ] تسجيل الدخول بـ admin@platform.com ينجح
- [ ] لوحة التحكم تعرض إحصائيات
- [ ] http://localhost:3001/api/v1/health يعطي `"status":"ok"`
- [ ] http://localhost:3001/api/docs يعرض Swagger

### RBAC والصلاحيات
- [ ] المدير يرى الإحصائيات فقط (بدون تعديل)
- [ ] الأخصائي يستطيع إضافة مستفيد
- [ ] المستفيد يرى ملفه فقط

### الوحدات الرئيسية
- [ ] إضافة مستفيد جديد تنجح
- [ ] جدولة موعد تنجح
- [ ] إنشاء تقرير وإرساله للمراجعة
- [ ] إصدار فاتورة
- [ ] البحث الشامل (Ctrl+K) يعمل
- [ ] الإشعارات تظهر
- [ ] رفع ملف مرفق يعمل

### قاعدة البيانات
- [ ] 15 جدول موجودة
- [ ] الحساب الافتراضي `admin@platform.com` موجود
- [ ] البيانات تُحفظ وتُسترجع بشكل صحيح

---

**✅ إذا اكتمل هذا الـ Checklist — المشروع يعمل 100%**

---

## 📞 للمساعدة

إذا واجهت أي مشكلة:
1. خذ screenshot للخطأ
2. أرسل نص الخطأ كاملاً
3. أخبر في أي خطوة توقفت

---

*آخر تحديث: 2026-06-14 — الإصدار 1.0.0*
