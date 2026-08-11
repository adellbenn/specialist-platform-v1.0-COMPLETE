-- ═══════════════════════════════════════════════════════════
-- تهيئة قاعدة البيانات الأولية
-- منصة إدارة أدوار الأخصائيين
-- ═══════════════════════════════════════════════════════════

-- تفعيل امتداد UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- للبحث النصي السريع

-- ═══════════════════════════════════════════════════════════
-- ENUMS
-- ═══════════════════════════════════════════════════════════

CREATE TYPE tenant_type AS ENUM ('clinic', 'rehabilitation', 'educational', 'support');
CREATE TYPE subscription_plan AS ENUM ('basic', 'professional', 'enterprise');
CREATE TYPE user_role AS ENUM (
    'super_admin', 'center_manager', 'supervisor',
    'specialist', 'receptionist', 'accountant'
);
CREATE TYPE gender_type AS ENUM ('male', 'female');
CREATE TYPE case_type AS ENUM ('psychological', 'educational', 'speech', 'occupational', 'social');
CREATE TYPE beneficiary_status AS ENUM ('active', 'inactive', 'completed', 'archived');
CREATE TYPE appointment_type AS ENUM ('initial', 'follow_up', 'assessment', 'group');
CREATE TYPE appointment_status AS ENUM ('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show');
CREATE TYPE attendance_status AS ENUM ('present', 'absent', 'late', 'excused');
CREATE TYPE report_type AS ENUM ('initial_assessment', 'progress', 'periodic', 'final', 'referral');
CREATE TYPE report_status AS ENUM ('draft', 'submitted', 'approved', 'archived');
CREATE TYPE payment_method AS ENUM ('cash', 'card', 'transfer', 'insurance');
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'partial', 'refunded');
CREATE TYPE storage_entity AS ENUM ('beneficiary', 'session', 'report', 'invoice');
CREATE TYPE notification_type AS ENUM (
    'appointment_reminder', 'session_due', 'report_due', 'payment_due', 'system'
);
CREATE TYPE audit_action AS ENUM ('CREATE', 'READ', 'UPDATE', 'DELETE', 'LOGIN', 'EXPORT');
CREATE TYPE specialization_type AS ENUM (
    'psychology', 'educational', 'speech_therapy',
    'occupational', 'behavioral', 'social_work'
);

-- ═══════════════════════════════════════════════════════════
-- TABLES
-- ═══════════════════════════════════════════════════════════

-- المراكز والعيادات
CREATE TABLE tenants (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name                    VARCHAR(255) NOT NULL UNIQUE,
    slug                    VARCHAR(100) NOT NULL UNIQUE,
    type                    tenant_type NOT NULL DEFAULT 'clinic',
    subscription_plan       subscription_plan NOT NULL DEFAULT 'basic',
    subscription_expires_at TIMESTAMP,
    max_users               INTEGER NOT NULL DEFAULT 10,
    max_beneficiaries       INTEGER NOT NULL DEFAULT 100,
    settings                JSONB,
    logo_url                TEXT,
    address                 TEXT,
    phone                   VARCHAR(20),
    email                   VARCHAR(255),
    is_active               BOOLEAN NOT NULL DEFAULT true,
    created_at              TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP NOT NULL DEFAULT NOW()
);

-- المستخدمون
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID REFERENCES tenants(id) ON DELETE SET NULL,
    email           VARCHAR(255) NOT NULL UNIQUE,
    password_hash   TEXT NOT NULL,
    first_name      VARCHAR(100) NOT NULL,
    last_name       VARCHAR(100) NOT NULL,
    phone           VARCHAR(20),
    avatar_url      TEXT,
    role            user_role NOT NULL,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    last_login_at   TIMESTAMP,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

-- بيانات الأخصائيين الإضافية
CREATE TABLE specialists (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id          UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    tenant_id        UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    specialization   specialization_type NOT NULL,
    license_number   VARCHAR(100),
    license_expiry   DATE,
    qualifications   TEXT[],
    working_hours    JSONB,
    max_cases_per_day INTEGER DEFAULT 8,
    bio              TEXT,
    is_available     BOOLEAN NOT NULL DEFAULT true,
    created_at       TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMP NOT NULL DEFAULT NOW()
);

-- المستفيدون
CREATE TABLE beneficiaries (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id               UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    file_number             VARCHAR(50) NOT NULL,
    first_name              VARCHAR(100) NOT NULL,
    last_name               VARCHAR(100) NOT NULL,
    date_of_birth           DATE,
    gender                  gender_type,
    national_id             VARCHAR(20),
    phone                   VARCHAR(20),
    email                   VARCHAR(255),
    address                 TEXT,
    guardian_name           VARCHAR(200),
    guardian_phone          VARCHAR(20),
    guardian_relationship   VARCHAR(50),
    referral_source         VARCHAR(50),
    case_type               case_type NOT NULL,
    status                  beneficiary_status NOT NULL DEFAULT 'active',
    assigned_specialist_id  UUID REFERENCES specialists(id) ON DELETE SET NULL,
    intake_date             DATE NOT NULL DEFAULT CURRENT_DATE,
    notes                   TEXT,
    created_by              UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at              TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(tenant_id, file_number)
);

-- الملفات الطبية والتربوية
CREATE TABLE beneficiary_files (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    beneficiary_id      UUID NOT NULL REFERENCES beneficiaries(id) ON DELETE CASCADE,
    tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    diagnosis           JSONB,
    medical_history     TEXT,
    educational_history TEXT,
    family_history      TEXT,
    assessment_results  JSONB,
    goals               JSONB,
    created_by          UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at          TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP NOT NULL DEFAULT NOW()
);

-- المواعيد
CREATE TABLE appointments (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    beneficiary_id      UUID NOT NULL REFERENCES beneficiaries(id) ON DELETE CASCADE,
    specialist_id       UUID NOT NULL REFERENCES specialists(id) ON DELETE CASCADE,
    scheduled_at        TIMESTAMP NOT NULL,
    duration_minutes    INTEGER NOT NULL DEFAULT 60,
    type                appointment_type NOT NULL DEFAULT 'follow_up',
    status              appointment_status NOT NULL DEFAULT 'scheduled',
    location            TEXT,
    notes               TEXT,
    cancellation_reason TEXT,
    reminder_sent_at    TIMESTAMP,
    created_by          UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at          TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP NOT NULL DEFAULT NOW()
);

-- الجلسات المنجزة
CREATE TABLE sessions (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id               UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    appointment_id          UUID REFERENCES appointments(id) ON DELETE SET NULL,
    beneficiary_id          UUID NOT NULL REFERENCES beneficiaries(id) ON DELETE CASCADE,
    specialist_id           UUID NOT NULL REFERENCES specialists(id) ON DELETE CASCADE,
    session_number          INTEGER NOT NULL DEFAULT 1,
    started_at              TIMESTAMP NOT NULL,
    ended_at                TIMESTAMP,
    actual_duration_minutes INTEGER,
    attendance              attendance_status NOT NULL DEFAULT 'present',
    mood_assessment         SMALLINT CHECK (mood_assessment BETWEEN 1 AND 10),
    objectives_met          BOOLEAN,
    session_notes           TEXT,
    interventions_used      TEXT[],
    homework_assigned       TEXT,
    next_session_plan       TEXT,
    created_at              TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP NOT NULL DEFAULT NOW()
);

-- سجل الحضور والغياب
CREATE TABLE attendance_logs (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    session_id      UUID REFERENCES sessions(id) ON DELETE CASCADE,
    beneficiary_id  UUID NOT NULL REFERENCES beneficiaries(id) ON DELETE CASCADE,
    specialist_id   UUID NOT NULL REFERENCES specialists(id) ON DELETE CASCADE,
    date            DATE NOT NULL,
    status          attendance_status NOT NULL,
    reason          TEXT,
    recorded_by     UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

-- التقارير
CREATE TABLE reports (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    beneficiary_id  UUID NOT NULL REFERENCES beneficiaries(id) ON DELETE CASCADE,
    specialist_id   UUID NOT NULL REFERENCES specialists(id) ON DELETE CASCADE,
    type            report_type NOT NULL,
    title           VARCHAR(255) NOT NULL,
    period_from     DATE,
    period_to       DATE,
    content         JSONB NOT NULL DEFAULT '{}',
    recommendations TEXT,
    status          report_status NOT NULL DEFAULT 'draft',
    approved_by     UUID REFERENCES users(id) ON DELETE SET NULL,
    approved_at     TIMESTAMP,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

-- باقات الخدمات
CREATE TABLE service_packages (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name            VARCHAR(255) NOT NULL,
    description     TEXT,
    sessions_count  INTEGER NOT NULL,
    price           DECIMAL(10,2) NOT NULL,
    validity_days   INTEGER NOT NULL DEFAULT 90,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

-- اشتراكات المستفيدين
CREATE TABLE subscriptions (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    beneficiary_id      UUID NOT NULL REFERENCES beneficiaries(id) ON DELETE CASCADE,
    package_id          UUID REFERENCES service_packages(id) ON DELETE SET NULL,
    sessions_used       INTEGER NOT NULL DEFAULT 0,
    sessions_remaining  INTEGER NOT NULL,
    amount_paid         DECIMAL(10,2) NOT NULL DEFAULT 0,
    discount_amount     DECIMAL(10,2) NOT NULL DEFAULT 0,
    start_date          DATE NOT NULL DEFAULT CURRENT_DATE,
    expiry_date         DATE NOT NULL,
    status              VARCHAR(20) NOT NULL DEFAULT 'active',
    created_by          UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at          TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP NOT NULL DEFAULT NOW()
);

-- الفواتير
CREATE TABLE invoices (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    invoice_number  VARCHAR(50) NOT NULL,
    beneficiary_id  UUID NOT NULL REFERENCES beneficiaries(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
    amount          DECIMAL(10,2) NOT NULL,
    discount        DECIMAL(10,2) NOT NULL DEFAULT 0,
    tax             DECIMAL(10,2) NOT NULL DEFAULT 0,
    total           DECIMAL(10,2) NOT NULL,
    payment_method  payment_method,
    payment_status  payment_status NOT NULL DEFAULT 'pending',
    paid_at         TIMESTAMP,
    notes           TEXT,
    created_by      UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(tenant_id, invoice_number)
);

-- المرفقات
CREATE TABLE file_attachments (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    entity_type storage_entity NOT NULL,
    entity_id   UUID NOT NULL,
    file_name   VARCHAR(255) NOT NULL,
    file_path   TEXT NOT NULL,
    file_size   BIGINT NOT NULL,
    mime_type   VARCHAR(100) NOT NULL,
    uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

-- الإشعارات
CREATE TABLE notifications (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id   UUID REFERENCES tenants(id) ON DELETE CASCADE,
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type        notification_type NOT NULL,
    title       VARCHAR(255) NOT NULL,
    message     TEXT NOT NULL,
    link        TEXT,
    is_read     BOOLEAN NOT NULL DEFAULT false,
    read_at     TIMESTAMP,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

-- سجل النشاطات
CREATE TABLE audit_logs (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id   UUID REFERENCES tenants(id) ON DELETE CASCADE,
    user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
    action      audit_action NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id   UUID,
    old_values  JSONB,
    new_values  JSONB,
    ip_address  INET,
    user_agent  TEXT,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════
-- INDEXES — لتسريع الاستعلامات الشائعة
-- ═══════════════════════════════════════════════════════════

-- Users
CREATE INDEX idx_users_tenant_id ON users(tenant_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- Beneficiaries
CREATE INDEX idx_beneficiaries_tenant_id ON beneficiaries(tenant_id);
CREATE INDEX idx_beneficiaries_specialist ON beneficiaries(assigned_specialist_id);
CREATE INDEX idx_beneficiaries_status ON beneficiaries(status);
CREATE INDEX idx_beneficiaries_search ON beneficiaries USING gin(
    to_tsvector('arabic', coalesce(first_name,'') || ' ' || coalesce(last_name,''))
);

-- Appointments
CREATE INDEX idx_appointments_tenant ON appointments(tenant_id);
CREATE INDEX idx_appointments_specialist ON appointments(specialist_id);
CREATE INDEX idx_appointments_beneficiary ON appointments(beneficiary_id);
CREATE INDEX idx_appointments_date ON appointments(scheduled_at);
CREATE INDEX idx_appointments_status ON appointments(status);

-- Sessions
CREATE INDEX idx_sessions_tenant ON sessions(tenant_id);
CREATE INDEX idx_sessions_beneficiary ON sessions(beneficiary_id);
CREATE INDEX idx_sessions_specialist ON sessions(specialist_id);

-- Notifications
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = false;

-- Audit Logs
CREATE INDEX idx_audit_logs_tenant ON audit_logs(tenant_id);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);

-- ═══════════════════════════════════════════════════════════
-- FUNCTIONS — دوال مساعدة
-- ═══════════════════════════════════════════════════════════

-- دالة تحديث updated_at تلقائياً
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- تطبيق الـ trigger على جميع الجداول
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN
        SELECT table_name FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name IN (
            'tenants','users','specialists','beneficiaries','beneficiary_files',
            'appointments','sessions','reports','service_packages',
            'subscriptions','invoices'
        )
    LOOP
        EXECUTE format(
            'CREATE TRIGGER set_updated_at BEFORE UPDATE ON %I
             FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()', t
        );
    END LOOP;
END;
$$;

-- دالة توليد رقم ملف المستفيد تلقائياً
CREATE OR REPLACE FUNCTION generate_file_number(p_tenant_id UUID)
RETURNS VARCHAR AS $$
DECLARE
    v_count INTEGER;
    v_prefix VARCHAR(10);
BEGIN
    SELECT COUNT(*) + 1 INTO v_count
    FROM beneficiaries WHERE tenant_id = p_tenant_id;

    v_prefix := 'BNF';
    RETURN v_prefix || '-' || LPAD(v_count::TEXT, 5, '0');
END;
$$ LANGUAGE plpgsql;

-- دالة توليد رقم الفاتورة تلقائياً
CREATE OR REPLACE FUNCTION generate_invoice_number(p_tenant_id UUID)
RETURNS VARCHAR AS $$
DECLARE
    v_count INTEGER;
    v_year  TEXT;
BEGIN
    v_year := TO_CHAR(NOW(), 'YYYY');
    SELECT COUNT(*) + 1 INTO v_count
    FROM invoices WHERE tenant_id = p_tenant_id
    AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW());

    RETURN 'INV-' || v_year || '-' || LPAD(v_count::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- ═══════════════════════════════════════════════════════════
-- SEED — بيانات أولية للاختبار
-- ═══════════════════════════════════════════════════════════

-- إنشاء مستخدم Super Admin افتراضي
-- كلمة المرور: Admin@123456 (يجب تغييرها فوراً)
INSERT INTO users (id, email, password_hash, first_name, last_name, role)
VALUES (
    uuid_generate_v4(),
    'admin@platform.com',
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj2NF5h5j1Oy',
    'مدير',
    'النظام',
    'super_admin'
) ON CONFLICT (email) DO NOTHING;
