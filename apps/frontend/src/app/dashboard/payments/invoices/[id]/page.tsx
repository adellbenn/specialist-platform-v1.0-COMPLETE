'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter }  from 'next/navigation';
import { ArrowRight, Printer, CheckCircle, RotateCcw } from 'lucide-react';
import toast                     from 'react-hot-toast';
import { paymentsService }       from '@/services/payments.service';
import { Card, SectionHeader, DetailRow } from '@/components/ui/card';
import { Badge }                 from '@/components/ui/badge';
import { PageLoader }            from '@/components/ui/spinner';
import { PermissionGate }        from '@/components/auth/permission-gate';
import {
  Invoice,
  PAYMENT_STATUS_LABELS, PAYMENT_STATUS_COLORS,
  PAYMENT_METHOD_LABELS, PaymentMethod,
} from '@/types';
import { formatDate, formatDateTime, formatCurrency, cn } from '@/lib/utils';
import { useAuthStore }          from '@/store/auth.store';

export default function InvoiceDetailPage() {
  const { id }   = useParams<{ id: string }>();
  const router   = useRouter();
  const { user } = useAuthStore();
  const printRef = useRef<HTMLDivElement>(null);

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing]   = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  useEffect(() => {
    paymentsService.getInvoice(id)
      .then((res) => setInvoice(res.data.data))
      .catch(() => { toast.error('فشل تحميل الفاتورة'); router.push('/dashboard/payments'); })
      .finally(() => setLoading(false));
  }, [id, router]);

  const handleMarkPaid = async (method: PaymentMethod) => {
    setShowPaymentModal(false);
    setActing(true);
    try {
      const res = await paymentsService.markPaid(id, method);
      setInvoice(res.data.data);
      toast.success('تم تسجيل الدفع');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'فشل التسجيل');
    } finally {
      setActing(false);
    }
  };

  const handleRefund = async () => {
    if (!confirm('هل تريد استرداد هذه الفاتورة؟')) return;
    setActing(true);
    try {
      const res = await paymentsService.refund(id);
      setInvoice(res.data.data);
      toast.success('تم استرداد الفاتورة');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'فشل الاسترداد');
    } finally {
      setActing(false);
    }
  };

  const handlePrint = () => window.print();

  if (loading) return <PageLoader />;
  if (!invoice) return null;

  const inv = invoice;

  return (
    <>
      {/* Print Styles */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #print-area, #print-area * { visibility: visible; }
          #print-area { position: fixed; top: 0; left: 0; width: 100%; }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="max-w-2xl mx-auto space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3 no-print">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="p-2 rounded-2xl hover:bg-[var(--surface)] transition" style={{ color: 'var(--text-secondary)' }}>
              <ArrowRight size={18} />
            </button>
            <div>
              <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>فاتورة #{inv.invoiceNumber}</h1>
              <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>{formatDateTime(inv.createdAt)}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handlePrint}
              className="flex items-center gap-1.5 border text-sm px-3 py-2 rounded-2xl hover:bg-[var(--surface)] transition" style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
              <Printer size={14} /> طباعة
            </button>
            {inv.paymentStatus === 'pending' && (
              <PermissionGate permission="payment:update">
                <button onClick={() => setShowPaymentModal(true)} disabled={acting}
                  className="flex items-center gap-1.5 bg-primary text-white text-sm px-3 py-2 rounded-lg hover:bg-primary-hover disabled:opacity-60 transition">
                  <CheckCircle size={14} /> تسجيل الدفع
                </button>
              </PermissionGate>
            )}
            {inv.paymentStatus === 'paid' && (
              <PermissionGate permission="payment:update">
                <button onClick={handleRefund} disabled={acting}
                  className="flex items-center gap-1.5 border text-danger text-sm px-3 py-2 rounded-lg disabled:opacity-60 transition">
                  <RotateCcw size={14} /> استرداد
                </button>
              </PermissionGate>
            )}
          </div>
        </div>

        {/* ═══ منطقة الطباعة ═══ */}
        <div id="print-area" ref={printRef}>
          <Card className="print:shadow-none print:border-0">
            {/* رأس الفاتورة */}
            <div className="flex items-start justify-between mb-8 pb-6 border-b" style={{ borderColor: 'var(--border)' }}>
              <div>
                <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{user?.tenant?.name ?? 'المركز'}</h2>
                <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>فاتورة خدمات</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-mono font-bold" style={{ color: 'var(--primary)' }}>#{inv.invoiceNumber}</p>
                <Badge
                  label={PAYMENT_STATUS_LABELS[inv.paymentStatus]}
                  className={PAYMENT_STATUS_COLORS[inv.paymentStatus]}
                />
              </div>
            </div>

            {/* بيانات المستفيد */}
            {inv.beneficiary && (
              <div className="mb-6">
                <p className="text-xs font-medium uppercase mb-2" style={{ color: 'var(--text-muted)' }}>فاتورة إلى</p>
                <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {inv.beneficiary.firstName} {inv.beneficiary.lastName}
                </p>
                <p className="text-sm font-mono" style={{ color: 'var(--text-secondary)' }}>ملف رقم: {inv.beneficiary.fileNumber}</p>
              </div>
            )}

            {/* جدول المبالغ */}
            <div className="rounded-xl overflow-hidden mb-6" style={{ border: '1px solid var(--border)' }}>
              <table className="w-full text-sm">
                <thead style={{ backgroundColor: 'var(--surface)' }}>
                  <tr>
                    <th className="text-right py-3 px-4 font-medium" style={{ color: 'var(--text-secondary)' }}>البيان</th>
                    <th className="text-left py-3 px-4 font-medium" style={{ color: 'var(--text-secondary)' }}>المبلغ</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t" style={{ borderColor: 'var(--border)' }}>
                    <td className="py-3 px-4" style={{ color: 'var(--text-primary)' }}>
                      {inv.subscriptionId ? 'اشتراك خدمات' : 'خدمات'}
                    </td>
                    <td className="py-3 px-4 text-right font-mono">{formatCurrency(Number(inv.amount))}</td>
                  </tr>
                  {Number(inv.discount) > 0 && (
                    <tr className="border-t text-primary-600" style={{ borderColor: 'var(--border)' }}>
                      <td className="py-3 px-4">خصم</td>
                      <td className="py-3 px-4 text-right font-mono">- {formatCurrency(Number(inv.discount))}</td>
                    </tr>
                  )}
                  {Number(inv.tax) > 0 && (
                    <tr className="border-t" style={{ borderColor: 'var(--border)' }}>
                      <td className="py-3 px-4" style={{ color: 'var(--text-secondary)' }}>ضريبة</td>
                      <td className="py-3 px-4 text-right font-mono">{formatCurrency(Number(inv.tax))}</td>
                    </tr>
                  )}
                  <tr style={{ borderTop: '2px solid var(--text-primary)', backgroundColor: 'var(--surface)' }}>
                    <td className="py-3 px-4 font-bold" style={{ color: 'var(--text-primary)' }}>الإجمالي</td>
                    <td className="py-3 px-4 text-right font-bold font-mono text-base" style={{ color: 'var(--primary)' }}>
                      {formatCurrency(Number(inv.total))}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* تفاصيل الدفع */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>تاريخ الإصدار</p>
                <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{formatDate(inv.createdAt)}</p>
              </div>
              {inv.paymentMethod && (
                <div>
                  <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>طريقة الدفع</p>
                  <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{PAYMENT_METHOD_LABELS[inv.paymentMethod]}</p>
                </div>
              )}
              {inv.paidAt && (
                <div>
                  <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>تاريخ الدفع</p>
                  <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{formatDate(inv.paidAt)}</p>
                </div>
              )}
            </div>

            {inv.notes && (
              <div className="mt-5 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
                <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>ملاحظات</p>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{inv.notes}</p>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Payment Method Modal */}
      {showPaymentModal && (
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
                <button key={opt.value} onClick={() => handleMarkPaid(opt.value)}
                  className="px-4 py-3 rounded-xl text-sm font-medium transition hover:brightness-90 text-white"
                  style={{ backgroundColor: 'var(--primary)' }}>
                  {opt.label}
                </button>
              ))}
            </div>
            <button onClick={() => setShowPaymentModal(false)}
              className="w-full mt-3 text-sm py-2 rounded-xl border transition hover:bg-[var(--surface)]"
              style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
              إلغاء
            </button>
          </div>
        </div>
      )}
    </>
  );
}
