# 📖 API_DOCS.md
# منصة إدارة أدوار الأخصائيين — توثيق الـ API الكامل

**Base URL:** `http://localhost:3001/api/v1`
**Swagger UI:** `http://localhost:3001/api/docs`
**Content-Type:** `application/json`

---

## المصادقة

جميع الطلبات (عدا `/auth/login` و `/auth/refresh`) تحتاج Header:
```
Authorization: Bearer <access_token>
```

---

## شكل الاستجابة العام

### نجاح
```json
{
  "success": true,
  "data": { ... },
  "message": "رسالة اختيارية",
  "meta": { "total": 100, "page": 1, "limit": 20, "totalPages": 5 }
}
```

### خطأ
```json
{
  "success": false,
  "statusCode": 400,
  "message": "وصف الخطأ",
  "errors": ["تفاصيل إضافية"],
  "timestamp": "2026-06-14T10:00:00.000Z",
  "path": "/api/v1/..."
}
```

---

## 🔐 Auth — المصادقة

| Method | Endpoint | الوصف | صلاحية |
|--------|----------|-------|--------|
| POST | `/auth/login` | تسجيل الدخول | عام |
| POST | `/auth/refresh` | تجديد التوكن | عام |
| GET  | `/auth/me` | بيانات المستخدم الحالي | مصادق |
| POST | `/auth/logout` | تسجيل الخروج | مصادق |

### POST /auth/login
```json
// Request
{ "email": "admin@platform.com", "password": "Admin@123456" }

// Response
{
  "data": {
    "accessToken": "eyJ...",
    "refreshToken": "eyJ...",
    "user": {
      "id": "uuid",
      "email": "admin@platform.com",
      "firstName": "مدير",
      "lastName": "النظام",
      "role": "super_admin",
      "tenantId": null
    }
  }
}
```

---

## 👥 Beneficiaries — المستفيدون

| Method | Endpoint | الوصف | صلاحية |
|--------|----------|-------|--------|
| GET    | `/beneficiaries` | قائمة المستفيدين | الكل |
| GET    | `/beneficiaries/stats` | الإحصائيات | موظفو المركز |
| GET    | `/beneficiaries/me` | ملف المستفيد (self) | beneficiary |
| PATCH  | `/beneficiaries/me` | تحديث بياناته | beneficiary |
| POST   | `/beneficiaries` | إنشاء مستفيد | writer |
| GET    | `/beneficiaries/:id` | تفاصيل مستفيد | الكل |
| PUT    | `/beneficiaries/:id` | تعديل مستفيد | writer |
| PATCH  | `/beneficiaries/:id/assign` | تعيين أخصائي | writer |
| PATCH  | `/beneficiaries/:id/status` | تغيير الحالة | writer |
| DELETE | `/beneficiaries/:id` | أرشفة | writer |
| GET    | `/beneficiaries/:id/file` | الملف الإلكتروني | الكل |
| PATCH  | `/beneficiaries/:id/file` | تعديل الملف | writer |

### Query Parameters — GET /beneficiaries
```
?search=أحمد
&status=active|inactive|completed|archived
&caseType=psychological|educational|speech|occupational|social
&specialistId=uuid
&page=1
&limit=20
```

### POST /beneficiaries — Body
```json
{
  "firstName": "أحمد",
  "lastName": "الغامدي",
  "dateOfBirth": "2010-05-15",
  "gender": "male",
  "nationalId": "1234567890",
  "phone": "0501234567",
  "email": "ahmed@example.com",
  "address": "الرياض، حي النزهة",
  "guardianName": "محمد الغامدي",
  "guardianPhone": "0509876543",
  "guardianRelationship": "father",
  "referralSource": "hospital",
  "caseType": "psychological",
  "intakeDate": "2026-06-01",
  "notes": "ملاحظات أولية",
  "assignedSpecialistId": "uuid"
}
```

---

## 📅 Appointments — المواعيد

| Method | Endpoint | الوصف | صلاحية |
|--------|----------|-------|--------|
| POST   | `/appointments` | إنشاء موعد | writer |
| GET    | `/appointments` | قائمة المواعيد | الكل |
| GET    | `/appointments/calendar` | بيانات التقويم | الكل |
| GET    | `/appointments/today` | مواعيد اليوم | موظفو المركز |
| GET    | `/appointments/stats` | الإحصائيات | موظفو المركز |
| GET    | `/appointments/:id` | تفاصيل موعد | الكل |
| PUT    | `/appointments/:id` | تعديل موعد | writer |
| PATCH  | `/appointments/:id/confirm` | تأكيد الموعد | writer |
| PATCH  | `/appointments/:id/cancel` | إلغاء الموعد | writer |
| PATCH  | `/appointments/:id/no-show` | تسجيل غياب | writer |
| PATCH  | `/appointments/:id/complete` | إتمام + جلسة | writer |

### POST /appointments — Body
```json
{
  "beneficiaryId": "uuid",
  "specialistId": "uuid",
  "scheduledAt": "2026-06-20T10:00:00",
  "durationMinutes": 60,
  "type": "follow_up",
  "location": "غرفة 1",
  "notes": "ملاحظات"
}
```

### GET /appointments/calendar
```
?year=2026&month=6
```
```json
{
  "data": {
    "appointments": [...],
    "byDay": {
      "2026-06-15": [{ "id": "...", "scheduledAt": "..." }]
    }
  }
}
```

---

## 📋 Sessions — الجلسات

| Method | Endpoint | الوصف | صلاحية |
|--------|----------|-------|--------|
| POST | `/sessions` | تسجيل جلسة | writer |
| GET  | `/sessions` | قائمة الجلسات | الكل |
| GET  | `/sessions/stats` | الإحصائيات | موظفو المركز |
| GET  | `/sessions/:id` | تفاصيل جلسة | الكل |
| PUT  | `/sessions/:id` | تعديل جلسة | writer |

### POST /sessions — Body
```json
{
  "beneficiaryId": "uuid",
  "specialistId": "uuid",
  "appointmentId": "uuid",
  "startedAt": "2026-06-20T10:00:00",
  "endedAt": "2026-06-20T11:00:00",
  "attendance": "present",
  "moodAssessment": 7,
  "objectivesMet": true,
  "sessionNotes": "ملاحظات الجلسة التفصيلية",
  "interventionsUsed": ["CBT", "تقنيات الاسترخاء"],
  "homeworkAssigned": "تمارين التنفس يومياً",
  "nextSessionPlan": "متابعة التطور المعرفي"
}
```

---

## 📝 Reports — التقارير

| Method | Endpoint | الوصف | صلاحية |
|--------|----------|-------|--------|
| POST   | `/reports` | إنشاء تقرير | writer |
| GET    | `/reports` | قائمة التقارير | الكل |
| GET    | `/reports/stats` | الإحصائيات | موظفو المركز |
| GET    | `/reports/:id` | تفاصيل تقرير | الكل |
| PUT    | `/reports/:id` | تعديل تقرير | writer |
| PATCH  | `/reports/:id/submit` | تقديم للمراجعة | writer |
| PATCH  | `/reports/:id/approve` | الموافقة | admin |
| PATCH  | `/reports/:id/toggle-share` | مشاركة مع المستفيد | admin |
| DELETE | `/reports/:id` | أرشفة | admin |

### POST /reports — Body
```json
{
  "beneficiaryId": "uuid",
  "type": "progress",
  "title": "تقرير تقدم — يونيو 2026",
  "periodFrom": "2026-05-01",
  "periodTo": "2026-05-31",
  "content": {
    "summary": "ملخص الفترة",
    "achievements": "الإنجازات خلال الفترة",
    "challenges": "التحديات التي واجهها المستفيد",
    "behaviorChanges": "التغيرات السلوكية الملاحظة"
  },
  "recommendations": "التوصيات للفترة القادمة",
  "sharedWithBeneficiary": false
}
```

---

## 📎 Files — الملفات

| Method | Endpoint | الوصف | صلاحية |
|--------|----------|-------|--------|
| POST | `/files/upload` | رفع ملف | writer |
| GET  | `/files` | ملفات كيان | موظفو المركز |
| GET  | `/files/:id/download` | تحميل ملف | موظفو المركز |
| DELETE | `/files/:id` | حذف ملف | writer |

### POST /files/upload
```
Content-Type: multipart/form-data
Query: ?entityType=beneficiary&entityId=uuid

Form Data:
  file: [الملف]
```

---

## 💰 Payments — المدفوعات

| Method | Endpoint | الوصف | صلاحية |
|--------|----------|-------|--------|
| GET    | `/payments/stats` | الإحصائيات المالية | الكل |
| POST   | `/payments/packages` | إنشاء باقة | writer |
| GET    | `/payments/packages` | الباقات النشطة | الكل |
| GET    | `/payments/packages/all` | جميع الباقات | admin |
| PUT    | `/payments/packages/:id` | تعديل باقة | writer |
| POST   | `/payments/subscriptions` | إنشاء اشتراك | writer |
| GET    | `/payments/subscriptions` | قائمة الاشتراكات | الكل |
| GET    | `/payments/subscriptions/:id` | تفاصيل اشتراك | الكل |
| GET    | `/payments/subscriptions/beneficiary/:id/active` | الاشتراك النشط | الكل |
| PATCH  | `/payments/subscriptions/:id/cancel` | إلغاء اشتراك | writer |
| POST   | `/payments/invoices` | إصدار فاتورة | writer |
| GET    | `/payments/invoices` | قائمة الفواتير | الكل |
| GET    | `/payments/invoices/:id` | تفاصيل فاتورة | الكل |
| PATCH  | `/payments/invoices/:id/pay` | تسجيل الدفع | writer |
| PATCH  | `/payments/invoices/:id/refund` | استرداد | admin |

### POST /payments/subscriptions — Body
```json
{
  "beneficiaryId": "uuid",
  "packageId": "uuid",
  "sessionsCount": 10,
  "amountPaid": 500.00,
  "discountAmount": 50.00,
  "startDate": "2026-06-01",
  "expiryDate": "2026-09-01"
}
```

---

## 🔔 Notifications — الإشعارات

| Method | Endpoint | الوصف | صلاحية |
|--------|----------|-------|--------|
| GET    | `/notifications` | قائمة الإشعارات | مصادق |
| GET    | `/notifications/unread-count` | عدد غير المقروء | مصادق |
| PATCH  | `/notifications/:id/read` | تعليم مقروء | مصادق |
| PATCH  | `/notifications/read-all` | تعليم الكل | مصادق |

---

## 📊 Analytics — الإحصائيات

| Method | Endpoint | الوصف | صلاحية |
|--------|----------|-------|--------|
| GET | `/analytics/dashboard` | إحصائيات لوحة التحكم | موظفو المركز |
| GET | `/analytics/appointments-trend` | مخطط المواعيد 6 أشهر | موظفو المركز |
| GET | `/analytics/beneficiaries-by-type` | توزيع المستفيدين | موظفو المركز |
| GET | `/analytics/revenue-trend` | مخطط الإيرادات 6 أشهر | موظفو المركز |

### GET /analytics/dashboard — Response
```json
{
  "data": {
    "beneficiaries": { "total": 150, "active": 120, "newThisMonth": 8, "newThisWeek": 3 },
    "sessions": { "total": 450, "thisMonth": 40, "attendanceRate": 88 },
    "appointments": { "today": 5, "upcoming": 23, "pendingReports": 2 },
    "subscriptions": { "active": 95, "expiringSoon": 4 },
    "financial": { "totalRevenue": 75000, "monthRevenue": 8500 },
    "team": { "specialists": 6 }
  }
}
```

---

## 🔍 Search — البحث

| Method | Endpoint | الوصف | صلاحية |
|--------|----------|-------|--------|
| GET | `/search` | بحث شامل | مصادق |
| GET | `/search/beneficiaries` | بحث في المستفيدين | مصادق |

### GET /search
```
?q=أحمد&limit=5
```
```json
{
  "data": {
    "results": [
      {
        "type": "beneficiary",
        "id": "uuid",
        "title": "أحمد الغامدي",
        "subtitle": "ملف رقم: BNF-00001",
        "meta": "active",
        "link": "/dashboard/beneficiaries/uuid"
      }
    ],
    "total": 3
  }
}
```

---

## 🛡️ Audit Logs — سجل النشاطات

| Method | Endpoint | الوصف | صلاحية |
|--------|----------|-------|--------|
| GET | `/audit-logs` | سجل النشاطات | admin فقط |

### GET /audit-logs
```
?action=CREATE&entityType=beneficiary&dateFrom=2026-06-01&dateTo=2026-06-30&page=1&limit=30
```

---

## 🔔 Health Check

| Method | Endpoint | الوصف | صلاحية |
|--------|----------|-------|--------|
| GET | `/health` | فحص صحة النظام | عام |

### Response
```json
{
  "status": "ok",
  "timestamp": "2026-06-14T10:00:00.000Z",
  "uptime": 86400,
  "version": "1.0.0",
  "services": {
    "database": { "status": "healthy", "latency": "3ms" },
    "memory":   { "used": "128MB", "total": "256MB" }
  }
}
```

---

## أكواد الاستجابة

| الكود | المعنى |
|-------|--------|
| 200 | نجاح |
| 201 | تم الإنشاء |
| 400 | بيانات غير صحيحة |
| 401 | غير مصادق |
| 403 | غير مصرح |
| 404 | غير موجود |
| 409 | تعارض (مكرر) |
| 429 | تجاوز حد الطلبات |
| 500 | خطأ في الخادم |

---

## ملاحظات RBAC

| التصنيف | الأدوار | HTTP Methods |
|---------|---------|--------------|
| ADMIN | super_admin, center_manager, supervisor, accountant | GET فقط |
| WRITER | specialist, receptionist | GET + POST + PUT + PATCH + DELETE |
| BENEFICIARY | beneficiary | GET (محدود) + PATCH /me |

---

*آخر تحديث: 2026-06-14 — الإصدار 1.0.0*
