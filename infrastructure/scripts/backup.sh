#!/bin/sh
# ════════════════════════════════════════════════════════
# backup.sh — نسخ احتياطي تلقائي لقاعدة البيانات
# يُنفَّذ يومياً عبر cron أو Docker scheduled task
# ════════════════════════════════════════════════════════

set -e

BACKUP_DIR="/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
FILENAME="specialist_platform_${TIMESTAMP}.sql.gz"
RETAIN_DAYS=30

echo "▶️  بدء النسخ الاحتياطي: $TIMESTAMP"

# إنشاء النسخة الاحتياطية
pg_dump \
  -h postgres \
  -U "${POSTGRES_USER:-postgres}" \
  -d "${POSTGRES_DB:-specialist_platform}" \
  --no-password \
  | gzip > "${BACKUP_DIR}/${FILENAME}"

SIZE=$(du -sh "${BACKUP_DIR}/${FILENAME}" | cut -f1)
echo "✅ تم إنشاء النسخة: ${FILENAME} (${SIZE})"

# حذف النسخ القديمة (أكثر من 30 يوم)
find "${BACKUP_DIR}" -name "*.sql.gz" -mtime "+${RETAIN_DAYS}" -delete
echo "🧹 تم حذف النسخ القديمة (أكثر من ${RETAIN_DAYS} يوم)"

TOTAL=$(ls "${BACKUP_DIR}"/*.sql.gz 2>/dev/null | wc -l)
echo "📦 إجمالي النسخ المتاحة: ${TOTAL}"
echo "✅ اكتمل النسخ الاحتياطي بنجاح"
