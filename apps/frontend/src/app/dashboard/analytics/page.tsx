'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, BarChart3, DollarSign, Users, MapPin, Play, ArrowUpRight, Target } from 'lucide-react';
import { analyticsService } from '@/services/analytics.service';
import { PageLoader } from '@/components/ui/spinner';
import { useRouteGuard } from '@/components/auth/route-guard';

const formatCurrency = (n: number) =>
  '$' + n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

interface DashboardStats {
  beneficiaries: { active: number; total: number; newThisWeek: number; newThisMonth?: number };
  sessions: { thisMonth: number; total: number; present: number; absent: number; attendanceRate: number };
  appointments: { today: number; upcoming: number; pendingReports: number };
  financial: { monthRevenue: number; totalRevenue: number };
  subscriptions: { active: number; expiringSoon: number };
  team?: { specialists: number };
}

function RadialGauge({ pct, size = 180, stroke = 12 }: { pct: number; size?: number; stroke?: number }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  const cx = size / 2;
  const cy = size / 2;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="drop-shadow-sm">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--surface)" strokeWidth={stroke} />
      <circle
        cx={cx} cy={cy} r={r} fill="none"
        stroke="var(--text-primary)" strokeWidth={stroke} strokeLinecap="round"
        strokeDasharray={circ} strokeDashoffset={offset}
        transform={`rotate(-90 ${cx} ${cy})`}
        style={{ transition: 'stroke-dashoffset 1s ease' }}
      />
      <text x={cx} y={cy - 8} textAnchor="middle" fontSize="36" fontWeight="700" fill="var(--text-primary)" fontFamily="Inter, sans-serif">
        {pct}%
      </text>
      <text x={cx} y={cy + 20} textAnchor="middle" fontSize="13" fill="var(--text-secondary)" fontFamily="Inter, sans-serif">
        معدل الشعبية
      </text>
    </svg>
  );
}

function PersonIllustration() {
  return (
    <svg width="160" height="140" viewBox="0 0 160 140" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="80" cy="130" rx="50" ry="8" fill="var(--surface)" opacity="0.5" />
      <rect x="70" y="60" width="20" height="35" rx="4" fill="var(--primary)" />
      <circle cx="80" cy="44" r="16" fill="var(--primary)" />
      <rect x="66" y="95" width="28" height="6" rx="3" fill="var(--primary)" />
      <rect x="66" y="101" width="28" height="6" rx="3" fill="var(--primary)" />
      <rect x="56" y="67" width="14" height="4" rx="2" fill="var(--primary)" transform="rotate(-20 56 67)" />
      <rect x="90" y="67" width="14" height="4" rx="2" fill="var(--primary)" transform="rotate(20 90 67)" />
      <rect x="104" y="70" width="30" height="22" rx="3" fill="var(--surface)" />
      <rect x="104" y="70" width="30" height="3" rx="1" fill="var(--status-warning)" />
      <rect x="106" y="77" width="12" height="2" rx="1" fill="var(--text-muted)" />
      <rect x="106" y="82" width="20" height="2" rx="1" fill="var(--text-muted)" />
      <rect x="106" y="87" width="16" height="2" rx="1" fill="var(--text-muted)" />
    </svg>
  );
}

export default function AnalyticsPage() {
  useRouteGuard({ anyRole: ['super_admin', 'center_manager'], redirectTo: '/dashboard' });

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [revenueTrend, setRevenueTrend] = useState<Array<{ month: string; revenue: number }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      analyticsService.getDashboard(),
      analyticsService.getRevenueTrend(),
    ])
      .then(([dash, rev]) => {
        setStats(dash.data.data);
        setRevenueTrend(rev.data.data ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader />;

  const visitsToday = stats?.appointments.today ?? 0;
  const attendanceRate = stats?.sessions.attendanceRate ?? 0;
  const monthlyIncome = stats?.financial.monthRevenue ?? 0;
  const attendanceLabel = attendanceRate >= 90 ? 'نسبة حضور ممتازة' : attendanceRate >= 75 ? 'نسبة حضور جيدة' : 'نسبة حضور متوسطة';
  const barData = revenueTrend.length > 0
    ? revenueTrend.map((r) => ({ label: r.month, value: r.revenue }))
    : [];

  return (
    <div className="min-h-full" style={{ fontFamily: "'Inter', 'Poppins', sans-serif" }}>
      {/* Navigation Tabs */}
      <div className="flex items-center gap-6 mb-6 pb-3 border-b" style={{ borderColor: 'var(--border)' }}>
        <span className="text-sm font-semibold px-1 pb-0.5" style={{ color: 'var(--text-primary)', borderBottom: '2px solid var(--text-primary)' }}>
          لوحة التحكم
        </span>
        <span className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>التحليلات</span>
        <span className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>القنوات</span>
        <div className="mr-auto flex items-center">
          <div className="flex -space-x-2 rtl:space-x-reverse">
            {['var(--primary)', 'var(--status-info)', 'var(--status-success)', 'var(--status-warning)'].map((c, i) => (
              <div key={i} className="w-8 h-8 rounded-full border-2 border-background flex items-center justify-center text-xs font-bold text-white shadow-sm"
                style={{ backgroundColor: c }}>
                {['SC', 'JW', 'ED', 'MB'][i]}
              </div>
            ))}
          </div>
          <span className="text-xs mr-2 font-medium" style={{ color: 'var(--text-secondary)' }}>+{stats?.team?.specialists ?? 0}</span>
        </div>
      </div>

      {/* Hero Section */}
      <div className="grid lg:grid-cols-5 gap-5 mb-5">
        {/* Left - Visits card */}
        <div className="lg:col-span-3 rounded-[24px] p-6 shadow-lg relative overflow-hidden flex"
          style={{ backgroundColor: 'var(--primary-light)' }}>
          <div className="flex-1 relative z-10">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0"><PersonIllustration /></div>
              <div>
                <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>عدد الزيارات اليوم</p>
                <p className="text-5xl font-bold leading-tight" style={{ color: 'var(--text-primary)' }}>{visitsToday}</p>
                <div className="flex items-center gap-3 mt-3">
                  <span className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full" style={{ backgroundColor: 'var(--surface)', color: 'var(--primary)' }}>
                    <TrendingUp size={12} /> {attendanceLabel} {attendanceRate}%
                  </span>
                </div>
              </div>
            </div>
            <div className="mt-5">
              <button
                className="inline-flex items-center gap-2 text-white text-sm font-semibold px-6 py-2.5 rounded-[16px] shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-0.5"
                style={{ backgroundColor: 'var(--primary)' }}>
                عرض الإحصائيات الكاملة <ArrowUpRight size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Right - Gauge card */}
        <div className="lg:col-span-2 rounded-[24px] p-6 shadow-lg relative overflow-hidden flex flex-col items-center justify-center"
          style={{ backgroundColor: 'var(--background)' }}>
          <RadialGauge pct={attendanceRate} />
          <p className="text-sm text-center mt-1 font-medium" style={{ color: 'var(--text-secondary)', maxWidth: 160 }}>
            {attendanceLabel}
          </p>
          <div className="mt-4 flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-[16px] shadow-sm cursor-pointer hover:shadow-md transition"
            style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary)' }}>
            <Play size={12} fill="var(--primary)" /> شاهد الفيديو التعريفي
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid lg:grid-cols-3 gap-5">

        {/* Finance Performance */}
        <div className="rounded-[24px] p-6 shadow-lg" style={{ backgroundColor: 'var(--background)' }}>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-[12px] flex items-center justify-center" style={{ backgroundColor: 'var(--surface)' }}>
                <DollarSign size={18} style={{ color: 'var(--primary)' }} />
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>الأداء المالي</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>الدخل الشهري</p>
              </div>
            </div>
            <span className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{formatCurrency(monthlyIncome)}</span>
          </div>
          <div className="flex items-end justify-between gap-2 h-32 pt-2">
            {barData.length > 0 ? (
              (() => {
                const maxVal = Math.max(...barData.map(d => d.value), 1);
                return barData.map((item) => (
                  <div key={item.label} className="flex-1 flex flex-col items-center gap-1.5">
                    <div
                      className="w-full rounded-[8px] transition-all duration-300 hover:opacity-80"
                      style={{
                        height: `${(item.value / maxVal) * 120}px`,
                        backgroundColor: 'var(--primary)',
                        opacity: 0.85,
                      }}
                    />
                    <span className="text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>{item.label}</span>
                  </div>
                ));
              })()
            ) : (
              <div className="w-full text-center text-sm" style={{ color: 'var(--text-muted)' }}>لا توجد بيانات إيرادات متاحة</div>
            )}
          </div>
        </div>

        {/* Top Performers */}
        <div className="rounded-[24px] p-6 shadow-lg" style={{ backgroundColor: 'var(--background)' }}>
          <div className="flex items-center gap-2 mb-5">
            <div className="w-9 h-9 rounded-[12px] flex items-center justify-center" style={{ backgroundColor: 'var(--surface)' }}>
              <Users size={18} style={{ color: 'var(--status-info)' }} />
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>الأفضل أداءً</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>أفضل الموظفين تقييماً</p>
            </div>
          </div>
          <p className="text-xs text-center py-4" style={{ color: 'var(--text-muted)' }}>بيانات التقييم غير متوفرة بعد</p>
        </div>

        {/* Beneficiaries by Type */}
        <div className="rounded-[24px] p-6 shadow-lg" style={{ backgroundColor: 'var(--background)' }}>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-9 h-9 rounded-[12px] flex items-center justify-center" style={{ backgroundColor: 'var(--surface)' }}>
              <MapPin size={18} style={{ color: 'var(--status-warning)' }} />
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>المستفيدون</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>إجمالي الحالات</p>
            </div>
          </div>
          <div className="space-y-2 mt-2">
            <div className="flex items-center gap-2 text-xs p-2.5 rounded-[14px] hover:bg-[var(--surface-secondary)] transition cursor-pointer">
              <span className="font-medium flex-1" style={{ color: 'var(--text-primary)' }}>إجمالي المستفيدين</span>
              <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{stats?.beneficiaries?.total ?? 0}</span>
            </div>
            <div className="flex items-center gap-2 text-xs p-2.5 rounded-[14px] hover:bg-[var(--surface-secondary)] transition cursor-pointer">
              <span className="font-medium flex-1" style={{ color: 'var(--text-primary)' }}>نشط حالياً</span>
              <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{stats?.beneficiaries?.active ?? 0}</span>
            </div>
            <div className="flex items-center gap-2 text-xs p-2.5 rounded-[14px] hover:bg-[var(--surface-secondary)] transition cursor-pointer">
              <span className="font-medium flex-1" style={{ color: 'var(--text-primary)' }}>جديد هذا الأسبوع</span>
              <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{stats?.beneficiaries?.newThisWeek ?? 0}</span>
            </div>
            <div className="flex items-center gap-2 text-xs p-2.5 rounded-[14px] hover:bg-[var(--surface-secondary)] transition cursor-pointer">
              <span className="font-medium flex-1" style={{ color: 'var(--text-primary)' }}>المواعيد اليوم</span>
              <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{stats?.appointments?.today ?? 0}</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
