@echo off
chcp 65001 > nul
title منصة إدارة الأخصائيين - تشغيل

echo.
echo ████████████████████████████████████████████████
echo       تشغيل المنصة...
echo ████████████████████████████████████████████████
echo.

REM تشغيل Backend في نافذة جديدة
start "Backend - منصة الأخصائيين" cmd /k "cd /d %~dp0apps\backend && echo جاري تشغيل Backend... && npm run start:dev"

REM انتظر 3 ثوانٍ
timeout /t 3 /nobreak > nul

REM تشغيل Frontend في نافذة جديدة
start "Frontend - منصة الأخصائيين" cmd /k "cd /d %~dp0apps\frontend && echo جاري تشغيل Frontend... && npm run dev"

echo.
echo [OK] تم فتح نافذتين للتشغيل
echo.
echo انتظر 30 ثانية ثم افتح المتصفح:
echo http://localhost:3000
echo.
echo البريد:      admin@platform.com
echo كلمة المرور: Admin@123456
echo.
pause
