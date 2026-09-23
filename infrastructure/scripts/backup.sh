#!/bin/sh
# ════════════════════════════════════════════════════════
# backup.sh — نسخ احتياطي تلقائي لقاعدة البيانات + المرفوعات
# يُنفَّذ يومياً عبر cron أو Docker scheduled task
#
# Atomic + fail-fast:
#   - set -o pipefail: أي فشل في مسار الأنبوب يوقف السكربت بفشل
#   - الكاتب في ملف مؤقت ثم rename ذري → لا توجد نسخة "نافصة" نهائية
#   - gzip -t يتحقق من سلامة الملف قبل اعتماده
#   - RETAIN_DAYS قابل للضبط من البيئة (الافتراضي 30)
# ════════════════════════════════════════════════════════

set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/backups}"
UPLOADS_DIR="${UPLOADS_DIR:-/app/uploads}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DB_FILENAME="specialist_platform_db_${TIMESTAMP}.sql.gz"
UPLOADS_FILENAME="specialist_platform_uploads_${TIMESTAMP}.tar.gz"
RETAIN_DAYS="${RETAIN_DAYS:-30}"

mkdir -p "${BACKUP_DIR}"

echo "▶️  بدء النسخ الاحتياطي: ${TIMESTAMP}"

# ────────────────────────────────────────────────────────
# 1) قاعدة البيانات — كاتب ذري مع تحقق من السلامة
# ────────────────────────────────────────────────────────
DB_TMP="${BACKUP_DIR}/.${DB_FILENAME}.tmp"
pg_dump \
  -h "${PGHOST:-postgres}" \
  -U "${POSTGRES_USER:-postgres}" \
  -d "${POSTGRES_DB:-specialist_platform}" \
  --no-password \
  | gzip > "${DB_TMP}"

# تحقق من سلامة الأرشيف قبل اعتماده
gzip -t "${DB_TMP}"
mv "${DB_TMP}" "${BACKUP_DIR}/${DB_FILENAME}"
echo "✅ قاعدة البيانات: ${DB_FILENAME} ($(du -sh "${BACKUP_DIR}/${DB_FILENAME}" | cut -f1))"

# ────────────────────────────────────────────────────────
# 2) الملفات المرفوعة (uploads) — إذا كان المجلد موجوداً
# ────────────────────────────────────────────────────────
if [ -d "${UPLOADS_DIR}" ] && [ "$(find "${UPLOADS_DIR}" -type f | wc -l)" -gt 0 ]; then
  UPLOADS_TMP="${BACKUP_DIR}/.${UPLOADS_FILENAME}.tmp"
  tar -czf "${UPLOADS_TMP}" -C "$(dirname "${UPLOADS_DIR}")" "$(basename "${UPLOADS_DIR}")"
  gzip -t "${UPLOADS_TMP}"
  mv "${UPLOADS_TMP}" "${BACKUP_DIR}/${UPLOADS_FILENAME}"
  echo "✅ المرفوعات: ${UPLOADS_FILENAME} ($(du -sh "${BACKUP_DIR}/${UPLOADS_FILENAME}" | cut -f1))"
else
  echo "⚠️  مجلد المرفوعات غير موجود أو فارغ — يتم تخطيه"
fi

# ────────────────────────────────────────────────────────
# 3) الاحتفاظ — حذف النسخ الأقدم من RETAIN_DAYS فقط
#    (أحدث نسخة لا تُحذف أبداً: find يعتمد على -mtime فلا يصيبها)
# ────────────────────────────────────────────────────────
echo "🧹 حذف النسخ الأقدم من ${RETAIN_DAYS} يوماً..."
find "${BACKUP_DIR}" -maxdepth 1 -name "*.sql.gz" -mtime "+${RETAIN_DAYS}" -delete
find "${BACKUP_DIR}" -maxdepth 1 -name "*.tar.gz" -mtime "+${RETAIN_DAYS}" -delete

DB_TOTAL=$(find "${BACKUP_DIR}" -maxdepth 1 -name "*.sql.gz" | wc -l)
UPLOADS_TOTAL=$(find "${BACKUP_DIR}" -maxdepth 1 -name "*.tar.gz" | wc -l)
echo "📦 قاعدة البيانات: ${DB_TOTAL} | المرفوعات: ${UPLOADS_TOTAL}"
echo "✅ اكتمل النسخ الاحتياطي بنجاح"
