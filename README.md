# 🏥 منصة إدارة أدوار الأخصائيين

منصة ويب احترافية لإدارة العيادات ومراكز الدعم النفسي والتربوي والتأهيلي.

---

## 📋 جدول المحتويات

- [المميزات](#المميزات)
- [التقنيات](#التقنيات)
- [البنية العامة](#البنية-العامة)
- [المتطلبات](#المتطلبات)
- [التشغيل السريع](#التشغيل-السريع)
- [نظام الصلاحيات](#نظام-الصلاحيات)
- [هيكل المشروع](#هيكل-المشروع)
- [API Reference](#api-reference)
- [النشر في الإنتاج](#النشر-في-الإنتاج)

---

## 🌟 المميزات

| الميزة | الوصف |
|--------|-------|
| 👥 إدارة المستفيدين | ملفات إلكترونية، أهداف علاجية، تاريخ طبي |
| 📅 نظام المواعيد | تقويم تفاعلي، تحقق التعارض، تسجيل الجلسات |
| 📋 التقارير | دورة حياة كاملة، موافقة، مشاركة مع المستفيد |
| 📎 الملفات | رفع مرفقات لأي كيان مع تحميل مباشر |
| 💰 المدفوعات | فواتير، اشتراكات، باقات خدمات |
| 🔔 الإشعارات | إشعارات فورية، تعليم مقروء |
| 📊 الإحصائيات | لوحة تحكم ديناميكية بمخططات حقيقية |
| 🔍 البحث | بحث شامل في جميع البيانات مع Ctrl+K |
| 🛡️ سجل النشاطات | تتبع كامل لكل عملية في النظام |
| 📤 التصدير | CSV + PDF من المتصفح |
| 🏢 Multi-Tenant | عزل تام بين المراكز |
| 🔐 RBAC Pro | 7 أدوار + 35 صلاحية + 5 طبقات حماية |

---

## 🛠️ التقنيات

```
Frontend:  Next.js 14 + TypeScript + Tailwind CSS + Zustand
Backend:   NestJS + TypeORM + PostgreSQL
Auth:      JWT (Access 15m + Refresh 7d) + RBAC
Storage:   Local FS (قابل للتوسع لـ AWS S3)
Deploy:    Docker + Nginx + GitHub Actions
```

---

## 🏗️ البنية العامة

```
specialist-platform/
├── apps/
│   ├── backend/          # NestJS API
│   │   └── src/modules/  # 13 وحدة
│   └── frontend/         # Next.js App
│       └── src/app/dashboard/  # 17 صفحة
├── infrastructure/
│   ├── docker/           # Dockerfiles + Nginx + init.sql
│   └── scripts/          # backup.sh
├── .github/workflows/    # CI/CD
└── docs/                 # التوثيق
```

---

## 📦 المتطلبات

```bash
Node.js >= 20
PostgreSQL >= 16
Docker >= 24
Docker Compose >= 2
```

---

## ⚡ التشغيل السريع (Development)

```bash
# 1. نسخ المستودع
git clone https://github.com/your-org/specialist-platform.git
cd specialist-platform

# 2. إعداد متغيرات البيئة
cp apps/backend/.env.example apps/backend/.env
cp apps/frontend/.env.example apps/frontend/.env.local

# 3. تشغيل قاعدة البيانات
docker-compose up postgres -d

# 4. تشغيل Backend
cd apps/backend
npm install
npm run start:dev

# 5. تشغيل Frontend (terminal جديد)
cd apps/frontend
npm install
npm run dev
```

**الوصول:**
- Frontend: http://localhost:3000
- API:      http://localhost:3001/api/v1
- Swagger:  http://localhost:3001/api/docs

**حساب تجريبي:**
```
البريد:     admin@platform.com
كلمة المرور: Admin@123456
```

---

## 🐳 تشغيل بالكامل عبر Docker

```bash
# Development
docker-compose up -d --build

# Production
cp .env.production.example .env.production
# عدّل القيم في .env.production (إلزامي: DB_TYPE=postgres,
# SUPER_ADMIN_PASSWORD، JWT_SECRET/JWT_REFRESH_SECRET، REDIS_PASSWORD)
docker-compose --env-file .env.production -f docker-compose.prod.yml up -d --build
```

> ⚠️ ملاحظات الإنتاج:
> - تمرير `--env-file .env.production` ضروري حتى تُقرأ القيم
>   المستخدمة في docker-compose (قاعدة البيانات، Redis، النطاق).
> - مخطط قاعدة البيانات يُنشأ تلقائياً عبر TypeORM migrations (خدمة `migrate`).
> - `NEXT_PUBLIC_API_URL` تُثبَّت وقت البناء — في الإنتاج تستخدم القيمة
>   النسبية `/api/v1` ويوجّه nginx الطلبات إلى الـ backend.
> - أول تشغيل ينشئ حساب Super Admin من `SUPER_ADMIN_EMAIL` /
>   `SUPER_ADMIN_PASSWORD` في `.env.production`.

---

## 🔐 نظام الصلاحيات

### الأدوار

| الدور | التصنيف | الوصف |
|-------|---------|-------|
| `super_admin` | ADMIN | صلاحيات كاملة على المنصة |
| `center_manager` | ADMIN | إدارة المركز |
| `supervisor` | ADMIN | مراقبة + موافقة التقارير |
| `accountant` | ADMIN | المدفوعات فقط |
| `specialist` | WRITER | حالاته + مواعيده + تقاريره |
| `receptionist` | WRITER | المواعيد + تسجيل المستفيدين |
| `beneficiary` | BENEFICIARY | ملفه + مواعيده فقط |

### طبقات الحماية

```
HTTP Request
    ↓
RbacMiddleware    [طبقة 1: HTTP Method]
    ↓
JwtAuthGuard     [طبقة 2: توكن JWT]
    ↓
TenantGuard      [طبقة 3: عزل المركز]
    ↓
RbacGuard        [طبقة 4: تصنيف الدور]
    ↓
PermissionGuard  [طبقة 5: صلاحية دقيقة]
    ↓
Controller
```

---

## 🗄️ قاعدة البيانات (15 جدول)

```
tenants              المراكز والعيادات
users                المستخدمون
specialists          بيانات الأخصائيين
beneficiaries        المستفيدون
beneficiary_files    الملفات الطبية والتربوية
appointments         المواعيد
sessions             الجلسات
attendance_logs      سجل الحضور
reports              التقارير
service_packages     باقات الخدمات
subscriptions        اشتراكات المستفيدين
invoices             الفواتير
file_attachments     المرفقات
notifications        الإشعارات
audit_logs           سجل النشاطات
```

---

## 🔌 API Reference (80+ Endpoint)

| المجموعة | Endpoints |
|----------|-----------|
| Auth | POST /login, POST /refresh, GET /me, POST /logout |
| Beneficiaries | CRUD + assign + status + file + goals |
| Appointments | CRUD + confirm + cancel + complete + calendar |
| Sessions | CRUD + stats |
| Reports | CRUD + submit + approve + share |
| Files | upload + download + delete |
| Payments | packages + subscriptions + invoices |
| Notifications | list + markRead + markAllRead |
| Analytics | dashboard + trends |
| Search | global + beneficiaries |
| Audit Logs | list with filters |

📖 **Swagger Docs:** `http://localhost:3001/api/docs`

---

## 🚀 النشر في الإنتاج

```bash
# 1. إعداد السيرفر (Ubuntu 22.04)
curl -fsSL https://get.docker.com | sh

# 2. نسخ الملفات
git clone https://github.com/your-org/specialist-platform.git /opt/specialist-platform
cd /opt/specialist-platform

# 3. إعداد البيئة
cp .env.production.example .env.production
nano .env.production  # عدّل جميع القيم

# 4. شهادة SSL
mkdir infrastructure/ssl
# انسخ fullchain.pem و privkey.pem

# 5. تشغيل (يبني الصور ويشغّل migrations تلقائياً)
docker-compose --env-file .env.production -f docker-compose.prod.yml up -d --build

# 6. تحقق من الصحة
docker-compose --env-file .env.production -f docker-compose.prod.yml ps
curl -fsS https://your-domain.com/api/v1/health
```

---

## 📁 هيكل Backend Modules

```
src/modules/
├── auth/             JWT + Passport
├── users/            إدارة المستخدمين
├── tenants/          Multi-Tenant
├── beneficiaries/    المستفيدون + الملفات
├── appointments/     المواعيد + تحقق التعارض
├── sessions/         الجلسات + الحضور
├── reports/          دورة حياة التقارير
├── files/            رفع الملفات
├── payments/         المدفوعات + الفواتير
├── notifications/    الإشعارات
├── analytics/        الإحصائيات التجميعية
├── search/           البحث الشامل
└── audit-log/        سجل النشاطات
```

---

## 🧪 الاختبارات

```bash
# Backend unit tests
cd apps/backend && npm test

# Backend coverage
cd apps/backend && npm run test:cov

# Frontend type check
cd apps/frontend && npm run type-check
```

---

## 🔄 النسخ الاحتياطي

```bash
# نسخة احتياطية يدوية
docker-compose -f docker-compose.prod.yml \
  --profile backup run --rm backup

# جدولة تلقائية (cron - كل يوم 2 صباحاً)
0 2 * * * docker-compose -f /opt/specialist-platform/docker-compose.prod.yml \
  --profile backup run --rm backup >> /var/log/backup.log 2>&1
```

---

## 📝 المساهمة

1. Fork المستودع
2. أنشئ branch: `git checkout -b feature/amazing-feature`
3. Commit: `git commit -m 'feat: add amazing feature'`
4. Push: `git push origin feature/amazing-feature`
5. افتح Pull Request

---

## 📄 الترخيص

MIT License — © 2026 فريق التطوير

---

**صُنع بـ ❤️ لخدمة مجتمع الرعاية النفسية والتربوية**
