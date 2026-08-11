@echo off
chcp 65001 > nul
title منصة إدارة الأخصائيين - تشغيل تلقائي

echo.
echo ████████████████████████████████████████████████
echo       منصة إدارة أدوار الأخصائيين
echo       الإصدار 1.0.0
echo ████████████████████████████████████████████████
echo.

REM ─── التحقق من Node.js ───────────────────────────
echo [1/5] التحقق من Node.js...
node --version > nul 2>&1
if %errorlevel% neq 0 (
  echo [خطأ] Node.js غير مثبت!
  echo       حمّله من: https://nodejs.org
  pause
  exit /b 1
)
echo [OK] Node.js موجود

REM ─── التحقق من Docker ────────────────────────────
echo [2/5] التحقق من Docker...
docker --version > nul 2>&1
if %errorlevel% neq 0 (
  echo [خطأ] Docker غير مثبت أو غير مشغّل!
  echo       افتح Docker Desktop أولاً
  pause
  exit /b 1
)
echo [OK] Docker موجود

REM ─── نسخ ملفات البيئة إن لم تكن موجودة ─────────
echo [3/5] إعداد ملفات البيئة...
if not exist "apps\backend\.env" (
  copy "apps\backend\.env.example" "apps\backend\.env" > nul
  echo [OK] تم إنشاء apps\backend\.env
) else (
  echo [OK] apps\backend\.env موجود مسبقاً
)

if not exist "apps\frontend\.env.local" (
  copy "apps\frontend\.env.example" "apps\frontend\.env.local" > nul
  echo [OK] تم إنشاء apps\frontend\.env.local
) else (
  echo [OK] apps\frontend\.env.local موجود مسبقاً
)

REM ─── تشغيل Docker Compose ────────────────────────
echo [4/5] تشغيل قاعدة البيانات...
docker-compose up postgres -d
if %errorlevel% neq 0 (
  echo [خطأ] فشل تشغيل Docker!
  pause
  exit /b 1
)
echo [OK] قاعدة البيانات تعمل

REM ─── تثبيت Dependencies ──────────────────────────
echo [5/5] تثبيت الحزم...
echo.
echo جاري تثبيت حزم Backend...
cd apps\backend
call npm install --silent
cd ..\..

echo جاري تثبيت حزم Frontend...
cd apps\frontend
call npm install --silent
cd ..\..

echo.
echo ████████████████████████████████████████████████
echo  كل شيء جاهز! يمكنك الآن تشغيل المشروع
echo.
echo  لتشغيل Backend:
echo    cd apps\backend ^&^& npm run start:dev
echo.
echo  لتشغيل Frontend (Terminal آخر):
echo    cd apps\frontend ^&^& npm run dev
echo.
echo  ثم افتح المتصفح: http://localhost:3000
echo.
echo  البريد:      admin@platform.com
echo  كلمة المرور: Admin@123456
echo ████████████████████████████████████████████████
echo.
pause
