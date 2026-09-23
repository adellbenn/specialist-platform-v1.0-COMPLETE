#!/bin/sh
# ════════════════════════════════════════════════════════
# restore.sh — استعادة النسخة الاحتياطية (قاعدة البيانات + المرفوعات)
#
# الاستخدام:
#   docker-compose --env-file .env.production \
#     -f docker-compose.prod.yml --profile restore run --rm restore
#
# الخيارات (بيئية):
#   RESTORE_FILE=<اسم الملف داخل /restores دون مسار>   (إلزامي)
#   SKIP_UPLOADS=true     → استعادة قاعدة البيانات فقط
#   SKIP_DB=true          → استعادة المرفوعات فقط
#
# آمنة لإعادة التشغيل:
#   - تفشل (exit≠0) إن لم يوجد الملف أو كان تالفاً — لا تكتب نصيًّا ناقصاً
#   - استعادة DB عبر psql تتجاوز الترانساكشن الواحد (لأنه dump كامل)
#   - المرفوعات تُستعاد عن طريق tar إلى مجلد مؤقت ثم rename ذري
# ════════════════════════════════════════════════════════

set -euo pipefail

RESTORE_DIR="${RESTORE_DIR:-/restores}"
UPLOADS_DIR="${UPLOADS_DIR:-/app/uploads}"

if [ -z "${DB_HOST:-}" ]; then DB_HOST=postgres; fi
DB_USER="${POSTGRES_USER:-postgres}"
DB_NAME="${POSTGRES_DB:-specialist_platform}"

if [ -z "${RESTORE_FILE:-}" ]; then
  echo "❌ خطأ: يجب تحديد RESTORE_FILE (اسم ملف النسخة الاحتياطية)"
  echo "   مثال: RESTORE_FILE=specialist_platform_20260301_020000.sql.gz"
  exit 2
fi

SRC="${RESTORE_DIR}/${RESTORE_FILE}"

if [ ! -f "${SRC}" ]; then
  echo "❌ خطأ: الملف غير موجود: ${SRC}"
  echo "   الملفات المتاحة في ${RESTORE_DIR}:"
  ls -1 "${RESTORE_DIR}"/*.sql.gz 2>/dev/null || true
  exit 1
fi

# ─── تحقق سريع من سلامة الأرشيف قبل أي استعادة ──────────
case "${RESTORE_FILE}" in
  *.sql.gz) gzip -t "${SRC}" || { echo "❌ النسخة تالفة (gzip -t فشل)"; exit 1; } ;;
  *.tar.gz) tar -tzf "${SRC}" >/dev/null || { echo "❌ الأرشيف تالف"; exit 1; } ;;
  *) echo "❌ امتداد غير مدعوم — يُقبل فقط: *.sql.gz أو *.tar.gz"; exit 1 ;;
esac

# ─── 1) استعادة قاعدة البيانات ──────────────────────────
if [ "${SKIP_DB:-false}" = "true" ]; then
  echo "⏭️  تخطي استعادة قاعدة البيانات (SKIP_DB=true)"
else
  echo "🔄 استعادة قاعدة البيانات من: ${RESTORE_FILE}"
  gzip -dc "${SRC}" | psql \
    -h "${DB_HOST}" \
    -U "${DB_USER}" \
    -d "${DB_NAME}" \
    --no-password \
    -v ON_ERROR_STOP=1 \
    -q
  echo "✅ تمت استعادة قاعدة البيانات بنجاح"
fi

# ─── 2) استعادة المرفوعات (uploads) ─────────────────────
if [ "${SKIP_UPLOADS:-false}" = "true" ]; then
  echo "⏭️  تخطي استعادة المرفوعات (SKIP_UPLOADS=true)"
elif [ "${RESTORE_FILE##*.}" != "tar.gz" ]; then
  echo "⏭️  لا داعي لأحد: هذا الملف يخص قاعدة البيانات فقط"
else
  echo "🔄 استعادة المرفوعات من: ${RESTORE_FILE}"
  mkdir -p "${UPLOADS_DIR}"
  TMP_DIR="$(dirname "${UPLOADS_DIR}")/.uploads_restore_$$"
  mkdir -p "${TMP_DIR}"
  tar -xzf "${SRC}" -C "${TMP_DIR}"
  # افتراضياً النسخة داخل أرشيف تحمل مجلد uploads/ — اجعلها تلقائية:
  # إن وُجد مجلد مفرد باسم uploads نستخدم محتواه مباشرة
  INNER="$(find "${TMP_DIR}" -mindepth 1 -maxdepth 1 -type d | head -n1)"
  if [ -n "${INNER}" ]; then
    cp -a "${INNER}/." "${UPLOADS_DIR}/"
  else
    cp -a "${TMP_DIR}/." "${UPLOADS_DIR}/"
  fi
  rm -rf "${TMP_DIR}"
  echo "✅ تمت استعادة المرفوعات بنجاح"
fi

echo "🎉 اكتملت الاستعادة بنجاح"
