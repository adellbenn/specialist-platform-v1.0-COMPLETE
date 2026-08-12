'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import apiClient from '@/lib/api-client';
import { PageLoader } from '@/components/ui/spinner';
import { Card } from '@/components/ui/card';
import { useRouteGuard } from '@/components/auth/route-guard';
import { PermissionGate } from '@/components/auth/permission-gate';
import { formatCurrency } from '@/lib/utils';
import toast from 'react-hot-toast';

interface Beneficiary {
  id: string;
  firstName: string;
  lastName: string;
}

export default function NewInvoicePage() {
  useRouteGuard({ anyRole: ['super_admin', 'center_manager'], redirectTo: '/dashboard' });
  const router = useRouter();
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedBeneficiary, setSelectedBeneficiary] = useState('');
  const [amount, setAmount] = useState('');
  const [discount, setDiscount] = useState('');
  const [tax, setTax] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    apiClient.get<{ data: Beneficiary[] }>('/beneficiaries?limit=200')
      .then((res) => setBeneficiaries(res.data.data))
      .catch(() => toast.error('فشل تحميل البيانات'))
      .finally(() => setLoading(false));
  }, []);

  const netTotal = Number(amount || 0) - Number(discount || 0) + Number(tax || 0);

  const handleSubmit = async () => {
    if (!selectedBeneficiary) {
      toast.error('يرجى اختيار المستفيد');
      return;
    }
    if (!amount || Number(amount) <= 0) {
      toast.error('يرجى إدخال المبلغ');
      return;
    }
    setSaving(true);
    try {
      await apiClient.post('/payments/invoices', {
        beneficiaryId: selectedBeneficiary,
        amount: Number(amount),
        discount: discount ? Number(discount) : undefined,
        tax: tax ? Number(tax) : undefined,
        paymentMethod: paymentMethod || undefined,
        notes: notes || undefined,
      });
      toast.success('تم إنشاء الفاتورة');
      router.push('/dashboard/payments');
    } catch {
      toast.error('فشل إنشاء الفاتورة');
    } finally {
      setSaving(false);
    }
  };

  const filteredBeneficiaries = beneficiaries.filter(
    (b) => `${b.firstName} ${b.lastName}`.includes(search),
  );

  if (loading) return <PageLoader />;

  return (
    <PermissionGate permission="payment:create" fallback={
      <div className="text-center py-12" style={{ color: 'var(--text-secondary)' }}>ليس لديك صلاحية إنشاء فواتير</div>
    }>
      <div className="max-w-xl space-y-5">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>فاتورة جديدة</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>إنشاء فاتورة جديدة لمستفيد</p>
        </div>

        <Card>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>المستفيد *</label>
              <div className="relative mb-2">
                <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                  placeholder="بحث عن مستفيد..."
                  className="w-full text-sm border pr-9 px-3 py-2 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" style={{ borderColor: 'var(--border)' }} />
              </div>
              <select value={selectedBeneficiary} onChange={(e) => setSelectedBeneficiary(e.target.value)}
                className="w-full text-sm border px-3 py-2 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" style={{ borderColor: 'var(--border)' }}>
                <option value="">اختر مستفيد...</option>
                {filteredBeneficiaries.map((b) => (
                  <option key={b.id} value={b.id}>{b.firstName} {b.lastName}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>المبلغ *</label>
              <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
                className="w-full text-sm border px-3 py-2 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" style={{ borderColor: 'var(--border)' }} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>الخصم</label>
                <input type="number" value={discount} onChange={(e) => setDiscount(e.target.value)}
                  className="w-full text-sm border px-3 py-2 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" style={{ borderColor: 'var(--border)' }} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>الضريبة</label>
                <input type="number" value={tax} onChange={(e) => setTax(e.target.value)}
                  className="w-full text-sm border px-3 py-2 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" style={{ borderColor: 'var(--border)' }} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>طريقة الدفع</label>
              <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full text-sm border px-3 py-2 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" style={{ borderColor: 'var(--border)' }}>
                <option value="">اختر طريقة الدفع...</option>
                <option value="cash">نقداً</option>
                <option value="card">بطاقة</option>
                <option value="bank_transfer">تحويل بنكي</option>
              </select>
            </div>

            <div className="flex justify-between items-center pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
              <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>الصافي</span>
              <span className="text-lg font-bold" style={{ color: 'var(--primary)' }}>{formatCurrency(netTotal)}</span>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>ملاحظات</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
                className="w-full text-sm border px-3 py-2 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" style={{ borderColor: 'var(--border)' }} />
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button onClick={() => router.push('/dashboard/payments')}
                className="text-sm border px-4 py-2 rounded-2xl hover:bg-[var(--surface)] transition" style={{ borderColor: 'var(--border)' }}>إلغاء</button>
              <button onClick={handleSubmit} disabled={saving}
                className="text-sm text-white px-4 py-2 rounded-2xl hover:brightness-90 transition disabled:opacity-50" style={{ backgroundColor: 'var(--primary)' }}>
                {saving ? 'جاري الإنشاء...' : 'إنشاء الفاتورة'}
              </button>
            </div>
          </div>
        </Card>
      </div>
    </PermissionGate>
  );
}
