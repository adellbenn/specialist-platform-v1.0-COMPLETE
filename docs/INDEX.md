# 📑 INDEX.md

## فهرس الملفات والمجلدات الكامل

---

## 🚀 ابدأ من هنا - Start Here

```
1. اقرأ: QUICK_START.md (5 دقائق)
2. اقرأ: INSTALLATION.md (تفاصيل كاملة)
3. شغّل البرنامج!
```

---

## 📁 هيكل المشروع - Project Structure

```
specialist-platform/
│
├── 📄 README.md                  ← شرح عام
├── 📄 SETUP_GUIDE_WINDOWS.md     ← لـ Windows فقط
│
├── 📁 docs/                      ← جميع الملفات التوثيقية
│   ├── QUICK_START.md            ⭐ ابدأ هنا
│   ├── INSTALLATION.md           ✅ شرح التثبيت كامل
│   ├── PROJECT_STATUS.md         📊 حالة المشروع
│   ├── PERMISSIONS_GUIDE.md      🔐 شرح الصلاحيات
│   ├── IMPLEMENTATION_GUIDE.md   🔧 خطوات التطبيق
│   ├── SUMMARY.md                📋 ملخص شامل
│   ├── TASKS.md                  ✔️ قائمة المهام
│   ├── CHANGELOG.md              📝 سجل التغييرات
│   ├── API_DOCS.md               📡 توثيق API
│   └── README.md                 ℹ️ معلومات إضافية
│
├── 📁 apps/
│   ├── backend/                  🔧 Backend (NestJS)
│   │   ├── src/
│   │   │   ├── config/           ⚙️ ملفات الإعدادات
│   │   │   │   ├── role-permissions.ts
│   │   │   │   ├── roles.enum.ts
│   │   │   │   ├── role-permission.interface.ts
│   │   │   │   └── configuration.ts
│   │   │   ├── modules/          📦 14+ وحدة
│   │   │   ├── common/           🔄 كود مشترك
│   │   │   └── database/         💾 قاعدة البيانات
│   │   └── package.json
│   │
│   └── frontend/                 💻 Frontend (Next.js)
│       ├── src/
│       │   ├── pages/            📄 17+ صفحة
│       │   ├── components/       🧩 مكونات
│       │   ├── hooks/            🎣 React hooks
│       │   └── types/            📝 TypeScript types
│       └── package.json
│
├── 📁 infrastructure/            🚀 البنية التحتية
│   ├── docker/                   🐳 Docker files
│   │   ├── Dockerfile.backend
│   │   ├── Dockerfile.frontend
│   │   ├── nginx.conf
│   │   └── init.sql              💾 Database init
│   └── scripts/                  📜 Scripts
│       └── backup.sh             💿 Backup script
│
├── 📁 .github/
│   └── workflows/                ⚡ CI/CD Pipeline
│       └── ci-cd.yml
│
├── 🐳 docker-compose.yml         Docker configuration
├── 📦 package.json               Root dependencies
├── .gitignore                    Git ignore rules
├── .env.production.example       Production env
├── .env.lan.example              LAN env
│
└── 📜 start-windows.bat          ▶️ بدء سريع لـ Windows
```

---

## 📚 الملفات التوثيقية - Documentation Files

### للمبتدئين - For Beginners:

| الملف | الوصف | الوقت |
|------|------|------|
| QUICK_START.md | ابدأ في 5 دقائق | ⏱️ 5 min |
| INSTALLATION.md | شرح التثبيت كامل | ⏱️ 15 min |
| PROJECT_STATUS.md | معلومات عن المشروع | ⏱️ 10 min |

### للمطورين - For Developers:

| الملف | الوصف | الوقت |
|------|------|------|
| PERMISSIONS_GUIDE.md | شرح الصلاحيات | ⏱️ 30 min |
| IMPLEMENTATION_GUIDE.md | خطوات التطبيق | ⏱️ 60 min |
| API_DOCS.md | توثيق API | ⏱️ 20 min |

### للمسؤولين - For Admins:

| الملف | الوصف | الوقت |
|------|------|------|
| SUMMARY.md | ملخص شامل | ⏱️ 15 min |
| CHANGELOG.md | سجل التغييرات | ⏱️ 10 min |
| TASKS.md | قائمة المهام | ⏱️ 10 min |

---

## 🔐 ملفات الصلاحيات والأدوار - Roles & Permissions Files

```
📁 apps/backend/src/config/

├── role-permissions.ts
│   └── مصفوفة الصلاحيات الرئيسية
│       • 7 أدوار
│       • 30+ صلاحية
│       • دوال مساعدة

├── roles.enum.ts
│   └── قائمة الأدوار
│       • Enum definition
│       • Helper functions
│       • Arabic names

└── role-permission.interface.ts
    └── الواجهات (Interfaces)
        • RoleInfo
        • PermissionInfo
        • Audit structures
```

---

## 📊 ملفات قاعدة البيانات - Database Files

```
📁 infrastructure/docker/

├── init.sql
│   └── 15 جدول جاهز
│       • Users & Roles
│       • Beneficiaries
│       • Appointments
│       • Sessions
│       • Reports
│       • Payments
│       • Audit logs

└── Dockerfile.backend
    └── بناء Backend image
```

---

## 🚀 ملفات البدء - Startup Files

```
📁 جذر المشروع

├── start-windows.bat
│   └── بدء Backend و Frontend معاً
│       (Windows only)

├── docker-compose.yml
│   └── بدء كل شيء بـ Docker
│       • Backend
│       • Frontend
│       • Database
│       • Nginx

└── package.json
    └── الـ dependencies الجذرية
```

---

## 🔧 ملفات الإعدادات - Configuration Files

```
📁 جذر المشروع

├── .env.production.example
│   └── إعدادات الإنتاج

├── .env.lan.example
│   └── إعدادات الشبكة المحلية

└── .gitignore
    └── ملفات Git المتجاهلة
```

---

## 🏗️ كيفية البناء - Building Process

```
1. فك الضغط
   ↓
2. npm install (تثبيت الـ packages)
   ↓
3. تشغيل قاعدة البيانات
   ↓
4. npm run build (بناء المشروع)
   ↓
5. npm run start:dev (بدء التطوير)
   ↓
6. افتح http://localhost:3000
   ↓
7. سجّل دخول
   ↓
8. ابدأ العمل!
```

---

## 📍 مواقع الملفات المهمة - Important File Locations

```
قاعدة البيانات init:
📍 infrastructure/docker/init.sql

ملفات الصلاحيات:
📍 apps/backend/src/config/role-permissions.ts
📍 apps/backend/src/config/roles.enum.ts
📍 apps/backend/src/config/role-permission.interface.ts

التوثيق الرئيسي:
📍 docs/QUICK_START.md
📍 docs/INSTALLATION.md
📍 docs/PERMISSIONS_GUIDE.md

بدء سريع:
📍 start-windows.bat
📍 docker-compose.yml
```

---

## 🎓 ترتيب القراءة الموصى به - Recommended Reading Order

```
الأسبوع الأول:
├── 1. QUICK_START.md
├── 2. INSTALLATION.md
├── 3. PROJECT_STATUS.md
└── 4. PERMISSIONS_GUIDE.md

الأسبوع الثاني:
├── 5. IMPLEMENTATION_GUIDE.md
├── 6. API_DOCS.md
└── 7. README.md (كل ملف)

الأسبوع الثالث:
├── 8. SUMMARY.md
├── 9. CHANGELOG.md
└── 10. TASKS.md
```

---

## 🔍 البحث السريع - Quick Search

```
البحث عن:
├── كيفية البدء؟ → QUICK_START.md
├── شرح الصلاحيات؟ → PERMISSIONS_GUIDE.md
├── خطأ في التثبيت؟ → INSTALLATION.md
├── معلومات عن المشروع؟ → PROJECT_STATUS.md
├── كيفية الترميز؟ → API_DOCS.md
├── ملخص شامل؟ → SUMMARY.md
└── التحديثات؟ → CHANGELOG.md
```

---

## ✅ قائمة التحقق - Checklist

قبل البدء:
```
☐ فكّ الضغط
☐ قرأت QUICK_START.md
☐ ثبّت Node.js v20
☐ ثبّت PostgreSQL
☐ عندك npm packages
☐ البدء!
```

أثناء الاستخدام:
```
☐ Backend يعمل
☐ Frontend يعمل
☐ Database متصل
☐ تسجيل دخول ينجح
☐ لوحة التحكم تظهر
☐ كل صلاحياتك موجودة
```

---

## 📞 دعم إضافي - Additional Support

```
في حالة المشاكل:

1. اقرأ INSTALLATION.md قسم "حل المشاكل"
2. تحقق من PERMISSIONS_GUIDE.md
3. ابحث في IMPLEMENTATION_GUIDE.md
4. شاهد CHANGELOG.md للمعروف من المشاكل
5. اقرأ SUMMARY.md للملخص
```

---

**Version:** v1.0
**Updated:** June 2024
**Status:** ✅ Production Ready
**Language:** Arabic & English
