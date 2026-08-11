import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1721680000000 implements MigrationInterface {
  name = 'InitialSchema1721680000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const isSqlite = queryRunner.connection.options.type === 'sqlite';

    const nowDefault = isSqlite ? "(STRFTIME('%Y-%m-%dT%H:%M:%fZ','now'))" : 'now()';
    const boolType = isSqlite ? 'INTEGER' : 'boolean';
    const intType = isSqlite ? 'INTEGER' : 'integer';
    const smallIntType = isSqlite ? 'INTEGER' : 'smallint';
    const bigIntType = isSqlite ? 'INTEGER' : 'bigint';
    const textType = 'text';
    const decimalType = isSqlite ? 'REAL' : 'decimal(10,2)';
    const timestampType = isSqlite ? 'TEXT' : 'timestamp';
    const dateType = isSqlite ? 'TEXT' : 'date';
    const varcharType = 'varchar';
    const jsonType = 'text';

    // ─── 1. tenants ───────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "tenants" (
        "id"                     text NOT NULL,
        "created_at"             ${timestampType} NOT NULL DEFAULT ${nowDefault},
        "updated_at"             ${timestampType} NOT NULL DEFAULT ${nowDefault},
        "name"                   ${varcharType} NOT NULL,
        "slug"                   ${varcharType} NOT NULL,
        "type"                   ${varcharType} NOT NULL DEFAULT 'clinic',
        "subscription_plan"      ${varcharType} NOT NULL DEFAULT 'basic',
        "subscription_expires_at" ${timestampType},
        "max_users"              ${intType} NOT NULL DEFAULT 10,
        "max_beneficiaries"      ${intType} NOT NULL DEFAULT 100,
        "settings"               ${jsonType},
        "logo_url"               ${varcharType},
        "address"                ${varcharType},
        "phone"                  ${varcharType},
        "email"                  ${varcharType},
        "is_active"              ${boolType} NOT NULL DEFAULT 1,
        CONSTRAINT "UQ_tenants_name" UNIQUE ("name"),
        CONSTRAINT "UQ_tenants_slug" UNIQUE ("slug"),
        CONSTRAINT "PK_tenants" PRIMARY KEY ("id")
      )
    `);

    // ─── 2. permissions ───────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "permissions" (
        "id"           text NOT NULL,
        "created_at"   ${timestampType} NOT NULL DEFAULT ${nowDefault},
        "updated_at"   ${timestampType} NOT NULL DEFAULT ${nowDefault},
        "module"       ${varcharType} NOT NULL,
        "action"       ${varcharType} NOT NULL,
        "display_name" ${varcharType} NOT NULL,
        "description"  ${textType},
        "is_system"    ${boolType} NOT NULL DEFAULT 1,
        "sort_order"   ${intType} NOT NULL DEFAULT 0,
        CONSTRAINT "PK_permissions" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_permissions_module_action" ON "permissions" ("module", "action")`,
    );

    // ─── 3. roles ─────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "roles" (
        "id"           text NOT NULL,
        "created_at"   ${timestampType} NOT NULL DEFAULT ${nowDefault},
        "updated_at"   ${timestampType} NOT NULL DEFAULT ${nowDefault},
        "name"         ${varcharType} NOT NULL,
        "description"  ${textType},
        "color"        ${varcharType} NOT NULL DEFAULT '#6B5B95',
        "icon"         ${varcharType},
        "is_active"    ${boolType} NOT NULL DEFAULT 1,
        "is_system"    ${boolType} NOT NULL DEFAULT 0,
        "priority"     ${intType} NOT NULL DEFAULT 0,
        "created_by"   text,
        CONSTRAINT "UQ_roles_name" UNIQUE ("name"),
        CONSTRAINT "PK_roles" PRIMARY KEY ("id")
      )
    `);

    // ─── 4. permission_groups ─────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "permission_groups" (
        "id"           text NOT NULL,
        "created_at"   ${timestampType} NOT NULL DEFAULT ${nowDefault},
        "updated_at"   ${timestampType} NOT NULL DEFAULT ${nowDefault},
        "name"         ${varcharType} NOT NULL,
        "description"  ${textType},
        "color"        ${varcharType} NOT NULL DEFAULT '#6B5B95',
        "is_active"    ${boolType} NOT NULL DEFAULT 1,
        "is_system"    ${boolType} NOT NULL DEFAULT 0,
        "created_by"   text,
        CONSTRAINT "UQ_permission_groups_name" UNIQUE ("name"),
        CONSTRAINT "PK_permission_groups" PRIMARY KEY ("id")
      )
    `);

    // ─── 5. role_permissions (join table) ─────────────────────
    await queryRunner.query(`
      CREATE TABLE "role_permissions" (
        "role_id"       text NOT NULL,
        "permission_id" text NOT NULL,
        CONSTRAINT "PK_role_permissions" PRIMARY KEY ("role_id", "permission_id"),
        CONSTRAINT "FK_role_permissions_role_id" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_role_permissions_permission_id" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_role_permissions_role_id" ON "role_permissions" ("role_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_role_permissions_permission_id" ON "role_permissions" ("permission_id")`,
    );

    // ─── 6. group_permissions (join table) ────────────────────
    await queryRunner.query(`
      CREATE TABLE "group_permissions" (
        "group_id"      text NOT NULL,
        "permission_id" text NOT NULL,
        CONSTRAINT "PK_group_permissions" PRIMARY KEY ("group_id", "permission_id"),
        CONSTRAINT "FK_group_permissions_group_id" FOREIGN KEY ("group_id") REFERENCES "permission_groups"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_group_permissions_permission_id" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_group_permissions_group_id" ON "group_permissions" ("group_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_group_permissions_permission_id" ON "group_permissions" ("permission_id")`,
    );

    // ─── 7. users ─────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id"                     text NOT NULL,
        "created_at"             ${timestampType} NOT NULL DEFAULT ${nowDefault},
        "updated_at"             ${timestampType} NOT NULL DEFAULT ${nowDefault},
        "tenant_id"              text,
        "email"                  ${varcharType} NOT NULL,
        "password_hash"          ${varcharType} NOT NULL,
        "first_name"             ${varcharType} NOT NULL,
        "last_name"              ${varcharType} NOT NULL,
        "phone"                  ${varcharType},
        "avatar_url"             ${varcharType},
        "bio"                    ${varcharType},
        "role"                   ${varcharType} NOT NULL,
        "role_id"                text,
        "beneficiary_id"         text,
        "is_active"              ${boolType} NOT NULL DEFAULT 1,
        "theme_preference"       ${varcharType} NOT NULL DEFAULT 'system',
        "preferences"            ${jsonType},
        "last_login_at"          ${timestampType},
        "failed_login_attempts"  ${intType} NOT NULL DEFAULT 0,
        "locked_until"           ${timestampType},
        "must_change_password"   ${boolType} NOT NULL DEFAULT 0,
        CONSTRAINT "UQ_users_email" UNIQUE ("email"),
        CONSTRAINT "PK_users" PRIMARY KEY ("id"),
        CONSTRAINT "FK_users_tenant_id" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT "FK_users_role_id" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_users_tenant_id_role" ON "users" ("tenant_id", "role")`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_users_tenant_id" ON "users" ("tenant_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_users_email" ON "users" ("email")`);
    await queryRunner.query(`CREATE INDEX "IDX_users_role" ON "users" ("role")`);

    // ─── 8. beneficiaries ─────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "beneficiaries" (
        "id"                     text NOT NULL,
        "created_at"             ${timestampType} NOT NULL DEFAULT ${nowDefault},
        "updated_at"             ${timestampType} NOT NULL DEFAULT ${nowDefault},
        "tenant_id"              text NOT NULL,
        "file_number"            ${varcharType} NOT NULL,
        "first_name"             ${varcharType} NOT NULL,
        "last_name"              ${varcharType} NOT NULL,
        "date_of_birth"          ${dateType},
        "gender"                 ${varcharType},
        "national_id"            ${varcharType},
        "phone"                  ${varcharType},
        "email"                  ${varcharType},
        "address"                ${varcharType},
        "guardian_name"          ${varcharType},
        "guardian_phone"         ${varcharType},
        "guardian_relationship"  ${varcharType},
        "referral_source"        ${varcharType},
        "case_type"              ${varcharType} NOT NULL,
        "status"                 ${varcharType} NOT NULL DEFAULT 'active',
        "assigned_specialist_id" text,
        "intake_date"            ${dateType} NOT NULL,
        "notes"                  ${textType},
        "created_by"             text,
        CONSTRAINT "PK_beneficiaries" PRIMARY KEY ("id"),
        CONSTRAINT "FK_beneficiaries_tenant_id" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT "FK_beneficiaries_assigned_specialist_id" FOREIGN KEY ("assigned_specialist_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT "FK_beneficiaries_created_by" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_beneficiaries_tenant_id_status" ON "beneficiaries" ("tenant_id", "status")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_beneficiaries_tenant_id_case_type" ON "beneficiaries" ("tenant_id", "case_type")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_beneficiaries_tenant_id" ON "beneficiaries" ("tenant_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_beneficiaries_file_number" ON "beneficiaries" ("file_number")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_beneficiaries_case_type" ON "beneficiaries" ("case_type")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_beneficiaries_status" ON "beneficiaries" ("status")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_beneficiaries_assigned_specialist_id" ON "beneficiaries" ("assigned_specialist_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_beneficiaries_created_by" ON "beneficiaries" ("created_by")`,
    );

    // ─── 9. beneficiary_files ─────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "beneficiary_files" (
        "id"                   text NOT NULL,
        "created_at"           ${timestampType} NOT NULL DEFAULT ${nowDefault},
        "updated_at"           ${timestampType} NOT NULL DEFAULT ${nowDefault},
        "beneficiary_id"       text NOT NULL,
        "tenant_id"            text NOT NULL,
        "diagnosis"            ${jsonType},
        "medical_history"      ${textType},
        "educational_history"  ${textType},
        "family_history"       ${textType},
        "assessment_results"   ${jsonType},
        "goals"                ${jsonType},
        "created_by"           text,
        CONSTRAINT "PK_beneficiary_files" PRIMARY KEY ("id"),
        CONSTRAINT "FK_beneficiary_files_beneficiary_id" FOREIGN KEY ("beneficiary_id") REFERENCES "beneficiaries"("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT "FK_beneficiary_files_tenant_id" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT "FK_beneficiary_files_created_by" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_beneficiary_files_beneficiary_id_tenant_id" ON "beneficiary_files" ("beneficiary_id", "tenant_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_beneficiary_files_beneficiary_id" ON "beneficiary_files" ("beneficiary_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_beneficiary_files_tenant_id" ON "beneficiary_files" ("tenant_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_beneficiary_files_created_by" ON "beneficiary_files" ("created_by")`,
    );

    // ─── 10. appointments ─────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "appointments" (
        "id"                  text NOT NULL,
        "created_at"          ${timestampType} NOT NULL DEFAULT ${nowDefault},
        "updated_at"          ${timestampType} NOT NULL DEFAULT ${nowDefault},
        "tenant_id"           text NOT NULL,
        "beneficiary_id"      text NOT NULL,
        "specialist_id"       text NOT NULL,
        "scheduled_at"        ${timestampType} NOT NULL,
        "duration_minutes"    ${intType} NOT NULL DEFAULT 60,
        "type"                ${varcharType} NOT NULL DEFAULT 'follow_up',
        "status"              ${varcharType} NOT NULL DEFAULT 'scheduled',
        "location"            ${varcharType},
        "notes"               ${textType},
        "cancellation_reason" ${textType},
        "reminder_sent_at"    ${timestampType},
        "created_by"          text,
        CONSTRAINT "PK_appointments" PRIMARY KEY ("id"),
        CONSTRAINT "FK_appointments_tenant_id" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT "FK_appointments_beneficiary_id" FOREIGN KEY ("beneficiary_id") REFERENCES "beneficiaries"("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT "FK_appointments_specialist_id" FOREIGN KEY ("specialist_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT "FK_appointments_created_by" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_appointments_tenant_id_scheduled_at" ON "appointments" ("tenant_id", "scheduled_at")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_appointments_tenant_id_status" ON "appointments" ("tenant_id", "status")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_appointments_tenant_id_specialist_id" ON "appointments" ("tenant_id", "specialist_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_appointments_tenant_id" ON "appointments" ("tenant_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_appointments_beneficiary_id" ON "appointments" ("beneficiary_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_appointments_specialist_id" ON "appointments" ("specialist_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_appointments_scheduled_at" ON "appointments" ("scheduled_at")`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_appointments_status" ON "appointments" ("status")`);
    await queryRunner.query(
      `CREATE INDEX "IDX_appointments_created_by" ON "appointments" ("created_by")`,
    );

    // ─── 11. sessions ─────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "sessions" (
        "id"                       text NOT NULL,
        "created_at"               ${timestampType} NOT NULL DEFAULT ${nowDefault},
        "updated_at"               ${timestampType} NOT NULL DEFAULT ${nowDefault},
        "tenant_id"                text NOT NULL,
        "appointment_id"           text,
        "beneficiary_id"           text NOT NULL,
        "specialist_id"            text NOT NULL,
        "session_number"           ${intType} NOT NULL DEFAULT 1,
        "started_at"               ${timestampType} NOT NULL,
        "ended_at"                 ${timestampType},
        "actual_duration_minutes"  ${intType},
        "attendance"               ${varcharType} NOT NULL DEFAULT 'present',
        "mood_assessment"          ${smallIntType},
        "objectives_met"           ${boolType},
        "session_notes"            ${textType},
        "interventions_used"       ${jsonType},
        "homework_assigned"        ${textType},
        "next_session_plan"        ${textType},
        CONSTRAINT "PK_sessions" PRIMARY KEY ("id"),
        CONSTRAINT "FK_sessions_tenant_id" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT "FK_sessions_appointment_id" FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT "FK_sessions_beneficiary_id" FOREIGN KEY ("beneficiary_id") REFERENCES "beneficiaries"("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT "FK_sessions_specialist_id" FOREIGN KEY ("specialist_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_sessions_tenant_id_started_at" ON "sessions" ("tenant_id", "started_at")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_sessions_tenant_id_attendance" ON "sessions" ("tenant_id", "attendance")`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_sessions_tenant_id" ON "sessions" ("tenant_id")`);
    await queryRunner.query(
      `CREATE INDEX "IDX_sessions_appointment_id" ON "sessions" ("appointment_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_sessions_beneficiary_id" ON "sessions" ("beneficiary_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_sessions_specialist_id" ON "sessions" ("specialist_id")`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_sessions_attendance" ON "sessions" ("attendance")`);

    // ─── 12. reports ──────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "reports" (
        "id"                       text NOT NULL,
        "created_at"               ${timestampType} NOT NULL DEFAULT ${nowDefault},
        "updated_at"               ${timestampType} NOT NULL DEFAULT ${nowDefault},
        "tenant_id"                text NOT NULL,
        "beneficiary_id"           text NOT NULL,
        "specialist_id"            text NOT NULL,
        "type"                     ${varcharType} NOT NULL,
        "title"                    ${varcharType} NOT NULL,
        "period_from"              ${dateType},
        "period_to"                ${dateType},
        "content"                  ${jsonType} NOT NULL DEFAULT '{}',
        "recommendations"          ${textType},
        "status"                   ${varcharType} NOT NULL DEFAULT 'draft',
        "shared_with_beneficiary"  ${boolType} NOT NULL DEFAULT 0,
        "approved_by"              text,
        "approved_at"              ${timestampType},
        CONSTRAINT "PK_reports" PRIMARY KEY ("id"),
        CONSTRAINT "FK_reports_tenant_id" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT "FK_reports_beneficiary_id" FOREIGN KEY ("beneficiary_id") REFERENCES "beneficiaries"("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT "FK_reports_specialist_id" FOREIGN KEY ("specialist_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT "FK_reports_approved_by" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_reports_tenant_id_status" ON "reports" ("tenant_id", "status")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_reports_tenant_id_beneficiary_id" ON "reports" ("tenant_id", "beneficiary_id")`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_reports_tenant_id" ON "reports" ("tenant_id")`);
    await queryRunner.query(
      `CREATE INDEX "IDX_reports_beneficiary_id" ON "reports" ("beneficiary_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_reports_specialist_id" ON "reports" ("specialist_id")`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_reports_status" ON "reports" ("status")`);
    await queryRunner.query(`CREATE INDEX "IDX_reports_approved_by" ON "reports" ("approved_by")`);

    // ─── 13. file_attachments ─────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "file_attachments" (
        "id"              text NOT NULL,
        "created_at"      ${timestampType} NOT NULL DEFAULT ${nowDefault},
        "updated_at"      ${timestampType} NOT NULL DEFAULT ${nowDefault},
        "tenant_id"       text NOT NULL,
        "entity_type"     ${varcharType} NOT NULL,
        "entity_id"       text NOT NULL,
        "file_name"       ${varcharType} NOT NULL,
        "file_path"       ${varcharType} NOT NULL,
        "file_size"       ${bigIntType} NOT NULL,
        "mime_type"       ${varcharType} NOT NULL,
        "original_name"   ${varcharType} NOT NULL,
        "uploaded_by"     text,
        CONSTRAINT "PK_file_attachments" PRIMARY KEY ("id"),
        CONSTRAINT "FK_file_attachments_tenant_id" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT "FK_file_attachments_uploaded_by" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_file_attachments_tenant_id_entity_type_entity_id" ON "file_attachments" ("tenant_id", "entity_type", "entity_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_file_attachments_tenant_id" ON "file_attachments" ("tenant_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_file_attachments_entity_type" ON "file_attachments" ("entity_type")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_file_attachments_uploaded_by" ON "file_attachments" ("uploaded_by")`,
    );

    // ─── 14. service_packages ─────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "service_packages" (
        "id"              text NOT NULL,
        "created_at"      ${timestampType} NOT NULL DEFAULT ${nowDefault},
        "updated_at"      ${timestampType} NOT NULL DEFAULT ${nowDefault},
        "tenant_id"       text NOT NULL,
        "name"            ${varcharType} NOT NULL,
        "description"     ${textType},
        "sessions_count"  ${intType} NOT NULL,
        "price"           ${decimalType} NOT NULL,
        "validity_days"   ${intType} NOT NULL DEFAULT 90,
        "is_active"       ${boolType} NOT NULL DEFAULT 1,
        CONSTRAINT "PK_service_packages" PRIMARY KEY ("id"),
        CONSTRAINT "FK_service_packages_tenant_id" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_service_packages_tenant_id_is_active" ON "service_packages" ("tenant_id", "is_active")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_service_packages_tenant_id" ON "service_packages" ("tenant_id")`,
    );

    // ─── 15. subscriptions ────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "subscriptions" (
        "id"                 text NOT NULL,
        "created_at"         ${timestampType} NOT NULL DEFAULT ${nowDefault},
        "updated_at"         ${timestampType} NOT NULL DEFAULT ${nowDefault},
        "tenant_id"          text NOT NULL,
        "beneficiary_id"     text NOT NULL,
        "package_id"         text,
        "sessions_used"      ${intType} NOT NULL DEFAULT 0,
        "sessions_remaining" ${intType} NOT NULL,
        "amount_paid"        ${decimalType} NOT NULL DEFAULT 0,
        "discount_amount"    ${decimalType} NOT NULL DEFAULT 0,
        "start_date"         ${dateType} NOT NULL,
        "expiry_date"        ${dateType} NOT NULL,
        "status"             ${varcharType} NOT NULL DEFAULT 'active',
        "created_by"         text,
        CONSTRAINT "PK_subscriptions" PRIMARY KEY ("id"),
        CONSTRAINT "FK_subscriptions_tenant_id" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT "FK_subscriptions_beneficiary_id" FOREIGN KEY ("beneficiary_id") REFERENCES "beneficiaries"("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT "FK_subscriptions_package_id" FOREIGN KEY ("package_id") REFERENCES "service_packages"("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT "FK_subscriptions_created_by" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_subscriptions_tenant_id_status" ON "subscriptions" ("tenant_id", "status")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_subscriptions_tenant_id_beneficiary_id" ON "subscriptions" ("tenant_id", "beneficiary_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_subscriptions_tenant_id" ON "subscriptions" ("tenant_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_subscriptions_beneficiary_id" ON "subscriptions" ("beneficiary_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_subscriptions_package_id" ON "subscriptions" ("package_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_subscriptions_status" ON "subscriptions" ("status")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_subscriptions_created_by" ON "subscriptions" ("created_by")`,
    );

    // ─── 16. invoices ─────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "invoices" (
        "id"               text NOT NULL,
        "created_at"       ${timestampType} NOT NULL DEFAULT ${nowDefault},
        "updated_at"       ${timestampType} NOT NULL DEFAULT ${nowDefault},
        "tenant_id"        text NOT NULL,
        "invoice_number"   ${varcharType} NOT NULL,
        "beneficiary_id"   text NOT NULL,
        "subscription_id"  text,
        "amount"           ${decimalType} NOT NULL,
        "discount"         ${decimalType} NOT NULL DEFAULT 0,
        "tax"              ${decimalType} NOT NULL DEFAULT 0,
        "total"            ${decimalType} NOT NULL,
        "payment_method"   ${varcharType},
        "payment_status"   ${varcharType} NOT NULL DEFAULT 'pending',
        "paid_at"          ${timestampType},
        "notes"            ${textType},
        "created_by"       text,
        CONSTRAINT "PK_invoices" PRIMARY KEY ("id"),
        CONSTRAINT "FK_invoices_tenant_id" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT "FK_invoices_beneficiary_id" FOREIGN KEY ("beneficiary_id") REFERENCES "beneficiaries"("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT "FK_invoices_subscription_id" FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT "FK_invoices_created_by" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_invoices_tenant_id_payment_status" ON "invoices" ("tenant_id", "payment_status")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_invoices_tenant_id_beneficiary_id" ON "invoices" ("tenant_id", "beneficiary_id")`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_invoices_tenant_id" ON "invoices" ("tenant_id")`);
    await queryRunner.query(
      `CREATE INDEX "IDX_invoices_beneficiary_id" ON "invoices" ("beneficiary_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_invoices_subscription_id" ON "invoices" ("subscription_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_invoices_payment_status" ON "invoices" ("payment_status")`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_invoices_created_by" ON "invoices" ("created_by")`);

    // ─── 17. notifications ────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "notifications" (
        "id"          text NOT NULL,
        "created_at"  ${timestampType} NOT NULL DEFAULT ${nowDefault},
        "updated_at"  ${timestampType} NOT NULL DEFAULT ${nowDefault},
        "tenant_id"   text,
        "user_id"     text NOT NULL,
        "type"        ${varcharType} NOT NULL,
        "title"       ${varcharType} NOT NULL,
        "message"     ${textType} NOT NULL,
        "link"        ${varcharType},
        "is_read"     ${boolType} NOT NULL DEFAULT 0,
        "read_at"     ${timestampType},
        CONSTRAINT "PK_notifications" PRIMARY KEY ("id"),
        CONSTRAINT "FK_notifications_tenant_id" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT "FK_notifications_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_notifications_user_id_is_read" ON "notifications" ("user_id", "is_read")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_notifications_tenant_id" ON "notifications" ("tenant_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_notifications_user_id" ON "notifications" ("user_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_notifications_is_read" ON "notifications" ("is_read")`,
    );

    // ─── 18. audit_logs ───────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "audit_logs" (
        "id"           text NOT NULL,
        "created_at"   ${timestampType} NOT NULL DEFAULT ${nowDefault},
        "updated_at"   ${timestampType} NOT NULL DEFAULT ${nowDefault},
        "tenant_id"    text,
        "user_id"      text,
        "action"       ${varcharType} NOT NULL,
        "entity_type"  ${varcharType} NOT NULL,
        "entity_id"    text,
        "old_values"   ${jsonType},
        "new_values"   ${jsonType},
        "ip_address"   ${varcharType},
        "user_agent"   ${textType},
        "description"  ${textType},
        CONSTRAINT "PK_audit_logs" PRIMARY KEY ("id"),
        CONSTRAINT "FK_audit_logs_tenant_id" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT "FK_audit_logs_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_audit_logs_tenant_id_action" ON "audit_logs" ("tenant_id", "action")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_audit_logs_tenant_id_entity_type" ON "audit_logs" ("tenant_id", "entity_type")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_audit_logs_tenant_id_created_at" ON "audit_logs" ("tenant_id", "created_at")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_audit_logs_tenant_id" ON "audit_logs" ("tenant_id")`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_audit_logs_user_id" ON "audit_logs" ("user_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_audit_logs_action" ON "audit_logs" ("action")`);
    await queryRunner.query(
      `CREATE INDEX "IDX_audit_logs_entity_type" ON "audit_logs" ("entity_type")`,
    );

    // ─── 19. password_reset_tokens ────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "password_reset_tokens" (
        "id"          text NOT NULL,
        "created_at"  ${timestampType} NOT NULL DEFAULT ${nowDefault},
        "updated_at"  ${timestampType} NOT NULL DEFAULT ${nowDefault},
        "token"       ${varcharType} NOT NULL,
        "user_id"     text NOT NULL,
        "expires_at"  ${timestampType} NOT NULL,
        "used_at"     ${timestampType},
        "is_used"     ${boolType} NOT NULL DEFAULT 0,
        CONSTRAINT "PK_password_reset_tokens" PRIMARY KEY ("id"),
        CONSTRAINT "FK_password_reset_tokens_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_password_reset_tokens_token" ON "password_reset_tokens" ("token")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_password_reset_tokens_user_id" ON "password_reset_tokens" ("user_id")`,
    );

    // ─── 20. user_permissions ─────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "user_permissions" (
        "id"             text NOT NULL,
        "created_at"     ${timestampType} NOT NULL DEFAULT ${nowDefault},
        "updated_at"     ${timestampType} NOT NULL DEFAULT ${nowDefault},
        "user_id"        text NOT NULL,
        "permission_id"  text NOT NULL,
        "override_type"  ${varcharType} NOT NULL DEFAULT 'granted',
        "granted_by"     text,
        "expires_at"     ${timestampType},
        "role_id"        text,
        CONSTRAINT "UQ_user_permissions_user_permission" UNIQUE ("user_id", "permission_id"),
        CONSTRAINT "PK_user_permissions" PRIMARY KEY ("id"),
        CONSTRAINT "FK_user_permissions_permission_id" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT "FK_user_permissions_role_id" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_user_permissions_user_id" ON "user_permissions" ("user_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_user_permissions_role_id" ON "user_permissions" ("role_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "user_permissions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "password_reset_tokens"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "audit_logs"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "notifications"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "invoices"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "subscriptions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "service_packages"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "file_attachments"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "reports"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "sessions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "appointments"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "beneficiary_files"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "beneficiaries"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "group_permissions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "role_permissions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "permission_groups"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "roles"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "permissions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "tenants"`);
  }
}
