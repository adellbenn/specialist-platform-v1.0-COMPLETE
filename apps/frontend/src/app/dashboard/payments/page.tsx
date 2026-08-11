'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter }           from 'next/navigation';
import {
  DollarSign, CreditCard, Users, TrendingUp,
  Plus, List, Package,
} from 'lucide-react';
import toast                   from 'react-hot-toast';
import { paymentsService }     from '@/services/payments.service';
import { InvoiceCard }         from '@/components/payments/invoice-card';
import { SubscriptionCard }    from '@/components/payments/subscription-card';
import { PageLoader }          from '@/components/ui/spinner';
import { EmptyState }          from '@/components/ui/empty-state';
import { PermissionGate }      from '@/components/auth/permission-gate';
import { Card, SectionHeader } from '@/components/ui/card';
import {
  Invoice, Subscription, PaymentStats, ServicePackage,
  PaymentStatus, PAYMENT_METHOD_LABELS, PaymentMethod,
} from '@/types';
import { formatCurrency, cn }  from '@/lib/utils';

type TabId = 'invoices' | 'subscriptions' | 'packages';

export default function PaymentsPage() {
  const router  = useRouter();
  const [tab, setTab]             = useState<TabId>('invoices');
  const [stats, setStats]         = useState<PaymentStats | null>(null);
  const [invoices, setInvoices]   = useState<Invoice[]>([]);
  const [subs, setSubs]           = useState<Subscription[]>([]);
  const [packages, setPackages]   = useState<ServicePackage[]>([]);
  const [loading, setLoading]     = useState(true);
  const [page, setPage]           = useState(1);
  const [total, setTotal]         = useState(0);
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | ''>('');
  const [paymentModal, setPaymentModal] = useState<{ open: boolean; invoiceId: string }>({ open: false, invoiceId: '' });

  const fetchStats = useCallback(async () => {
    try {
      const res = await paymentsService.getStats();
      setStats(res.data.data);
    } catch {}
  }, []);

  const fetchTab = useCallback(async () => {
    setLoading(true);
    try {
      if (tab === 'invoices') {
        const res = await paymentsService.getInvoices({
          paymentStatus: statusFilter || undefined,
          page, limit: 18,
        });
        setInvoices(res.data.data);
        setTotal(res.data.meta?.total ?? 0);
      } else if (tab === 'subscriptions') {
        const res = await paymentsService.getSubscriptions({ page, limit: 18 });
        setSubs(res.data.data);
        setTotal(res.data.meta?.total ?? 0);
      } else {
        const res = await paymentsService.getAllPackages();
        setPackages(res.data.data as any);
        setTotal((res.data.data as any).length);
      }
    } catch {
      toast.error('فشل تحميل البيانات');
    } finally {
      setLoading(false);
    }
  }, [tab, statusFilter, page]);

  useEffect(() => { fetchStats(); }, [fetchStats]);
  useEffect(() => { setPage(1); }, [tab, statusFilter]);
  useEffect(() => { fetchTab(); }, [fetchTab]);

  const handleMarkPaid = async (id: string, method: PaymentMethod) => {
    setPaymentModal({ open: false, invoiceId: '' });
    try {
      await paymentsService.markPaid(id, method);
      toast.success('تم تسجيل الدفع');
      fetchTab(); fetchStats();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'فشل تسجيل الدفع');
    }
  };

  const handleCancelSub = async (id: string) => {
    if (!confirm('هل أنت متأكد من إلغاء الاشتراك؟')) return;
    try {
      await paymentsService.cancelSubscription(id);
      toast.success('تم إلغاء الاشتراك');
      fetchTab(); fetchStats();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'فشل الإلغاء');
    }
  };

  const totalPages = Math.ceil(total / 18);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>المدفوعات والفواتير</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            {stats ? `إيرادات الشهر: ${formatCurrency(stats.monthRevenue)}` : ''}
          </p>
        </div>
        <PermissionGate permission="payment:create">
          <div className="flex gap-2">
            <button
              onClick={() => router.push('/dashboard/payments/new-subscription')}
              className="flex items-center gap-1.5 border text-sm px-3 py-2 rounded-2xl hover:bg-[var(--primary-light)] transition" style={{ borderColor: 'var(--primary)', color: 'var(--primary)' }}
            >
              <Plus size={14} /> اشتراك جديد
            </button>
            <button
              onClick={() => router.push('/dashboard/payments/new-invoice')}
              className="flex items-center gap-1.5 text-white text-sm px-3 py-2 rounded-2xl hover:brightness-90 transition" style={{ backgroundColor: 'var(--primary)' }}
            >
              <Plus size={14} /> فاتورة جديدة
            </button>
          </div>
        </PermissionGate>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: 'إجمالي الإيرادات', value: formatCurrency(stats.totalRevenue), icon: TrendingUp, color: 'text-primary-700 bg-primary-50', large: true },
            { label: 'إيرادات الشهر',   value: formatCurrency(stats.monthRevenue),  icon: DollarSign, color: 'text-primary-600 bg-primary-50',  large: true },
            { label: 'فواتير مدفوعة',   value: String(stats.paidInvoices),          icon: CreditCard, color: 'text-[var(--primary)] bg-[var(--primary-light)]' },
            { label: 'قيد الانتظار',    value: String(stats.pendingInvoices),        icon: List,       color: 'text-warning bg-warning-light' },
            { label: 'اشتراكات نشطة',   value: String(stats.activeSubscriptions),    icon: Users,      color: 'text-success bg-success-light' },
            { label: 'إجمالي الفواتير', value: String(stats.totalInvoices),          icon: Package,    color: 'text-[var(--text-secondary)] bg-[var(--surface)]' },
          ].map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className={cn('rounded-xl p-3.5', s.color, s.large ? 'col-span-2 sm:col-span-1' : '')}>
                <div className="flex items-center gap-2 mb-1">
                  <Icon size={16} className="opacity-70" />
                  <p className="text-xs opacity-70 truncate">{s.label}</p>
                </div>
                <p className="text-lg font-bold leading-tight">{s.value}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b" style={{ borderColor: 'var(--border)' }}>
        {([
          { id: 'invoices',       label: 'الفواتير',     icon: CreditCard },
          { id: 'subscriptions',  label: 'الاشتراكات',   icon: Users },
          { id: 'packages',       label: 'الباقات',      icon: Package },
        ] as const).map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={cn(
              'flex items-center gap-2 px-5 py-2.5 text-sm font-medium border-b-2 transition',
              tab === id ? '' : 'border-transparent',
            )}
            style={tab === id ? { color: 'var(--primary)', borderColor: 'var(--primary)' } : { color: 'var(--text-secondary)' }}>
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      {/* ─── فلتر الحالة (للفواتير) ─── */}
      {tab === 'invoices' && (
        <div className="flex gap-2 overflow-x-auto pb-0.5">
          {(['', 'pending', 'paid', 'refunded'] as const).map((s) => (
            <button key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                'px-3 py-1.5 rounded-2xl text-sm whitespace-nowrap font-medium transition',
                statusFilter === s ? 'text-white hover:brightness-90' : 'hover:bg-[var(--surface)]',
              )}
              style={statusFilter === s ? { backgroundColor: 'var(--primary)' } : { backgroundColor: 'var(--surface)', color: 'var(--text-secondary)' }}>
              {s === ''          ? 'الكل'
                : s === 'pending' ? 'قيد الانتظار'
                : s === 'paid'    ? 'مدفوع'
                : 'مسترد'}
            </button>
          ))}
        </div>
      )}

      {/* ─── المحتوى ─── */}
      {loading ? (
        <PageLoader />
      ) : (
        <>
          {/* الفواتير */}
          {tab === 'invoices' && (
            invoices.length === 0
              ? <EmptyState icon={CreditCard} title="لا توجد فواتير" description="لم تُصدر أي فواتير بعد" />
              : <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {invoices.map((inv) => (
                    <InvoiceCard key={inv.id} invoice={inv} onMarkPaid={() => setPaymentModal({ open: true, invoiceId: inv.id })} />
                  ))}
                </div>
          )}

          {/* الاشتراكات */}
          {tab === 'subscriptions' && (
            subs.length === 0
              ? <EmptyState icon={Users} title="لا توجد اشتراكات" description="لم يتم إنشاء اشتراكات بعد" />
              : <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {subs.map((sub) => (
                    <SubscriptionCard key={sub.id} subscription={sub} onCancel={handleCancelSub} />
                  ))}
                </div>
          )}

          {/* الباقات */}
          {tab === 'packages' && (
            packages.length === 0
              ? (
                <EmptyState
                  icon={Package}
                  title="لا توجد باقات"
                  description="أنشئ باقات خدمية لتسهيل الاشتراكات"
                  action={
                    <PermissionGate permission="payment:create">
                      <button
                        onClick={() => router.push('/dashboard/payments/packages')}
                        className="flex items-center gap-2 text-white text-sm px-4 py-2 rounded-2xl" style={{ backgroundColor: 'var(--primary)' }}
                      >
                        <Plus size={14} /> باقة جديدة
                      </button>
                    </PermissionGate>
                  }
                />
              )
              : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {packages.map((pkg) => (
                    <Card key={pkg.id} className={cn(!pkg.isActive && 'opacity-60')}>
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{pkg.name}</p>
                          {pkg.description && (
                            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{pkg.description}</p>
                          )}
                        </div>
                        <span className={cn(
                          'text-xs px-2 py-0.5 rounded-full font-medium',
                          pkg.isActive ? 'bg-[var(--status-success-light)] text-[var(--status-success-text)]' : 'bg-[var(--surface)] text-[var(--text-secondary)]',
                        )}>
                          {pkg.isActive ? 'نشط' : 'غير نشط'}
                        </span>
                      </div>
                      <div className="space-y-1.5 text-sm">
                        <div className="flex justify-between">
                          <span style={{ color: 'var(--text-secondary)' }}>عدد الجلسات</span>
                          <span className="font-medium">{pkg.sessionsCount} جلسة</span>
                        </div>
                        <div className="flex justify-between">
                          <span style={{ color: 'var(--text-secondary)' }}>السعر</span>
                          <span className="font-bold" style={{ color: 'var(--primary)' }}>{formatCurrency(Number(pkg.price))}</span>
                        </div>
                        <div className="flex justify-between">
                          <span style={{ color: 'var(--text-secondary)' }}>الصلاحية</span>
                          <span className="font-medium">{pkg.validityDays} يوم</span>
                        </div>
                        <div className="flex justify-between text-xs pt-1 border-t" style={{ color: 'var(--text-muted)', borderColor: 'var(--border)' }}>
                          <span>سعر الجلسة</span>
                          <span>{formatCurrency(Number(pkg.price) / pkg.sessionsCount)}</span>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <button disabled={page === 1} onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1.5 text-sm rounded-2xl border disabled:opacity-40 hover:bg-[var(--surface)]">
                السابق
              </button>
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{page} / {totalPages}</span>
              <button disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 text-sm rounded-2xl border disabled:opacity-40 hover:bg-[var(--surface)]">
                التالي
              </button>
            </div>
          )}
        </>
      )}

      {/* Payment Method Modal */}
      {paymentModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="rounded-2xl p-6 w-80 shadow-xl" style={{ backgroundColor: 'var(--background)' }}>
            <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>طريقة الدفع</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'cash' as PaymentMethod, label: 'نقداً' },
                { value: 'card' as PaymentMethod, label: 'بطاقة' },
                { value: 'transfer' as PaymentMethod, label: 'تحويل' },
                { value: 'insurance' as PaymentMethod, label: 'تأمين' },
              ].map((opt) => (
                <button key={opt.value} onClick={() => handleMarkPaid(paymentModal.invoiceId, opt.value)}
                  className="px-4 py-3 rounded-xl text-sm font-medium transition hover:brightness-90 text-white"
                  style={{ backgroundColor: 'var(--primary)' }}>
                  {opt.label}
                </button>
              ))}
            </div>
            <button onClick={() => setPaymentModal({ open: false, invoiceId: '' })}
              className="w-full mt-3 text-sm py-2 rounded-xl border transition hover:bg-[var(--surface)]"
              style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
              إلغاء
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
