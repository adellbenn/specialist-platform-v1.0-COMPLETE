'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import apiClient from '@/lib/api-client';
import { PageLoader } from '@/components/ui/spinner';
import { Card } from '@/components/ui/card';
import { useRouteGuard } from '@/components/auth/route-guard';
import { PermissionGate } from '@/components/auth/permission-gate';
import { formatCurrency, toDateKey } from '@/lib/utils';
import toast from 'react-hot-toast';

interface Beneficiary {
  id: string;
  firstName: string;
  lastName: string;
}

interface ServicePackage {
  id: string;
  name: string;
  price: string;
  sessionsCount: number;
  validityDays: number;
}

function addDays(date: Date, days: number): string {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return toDateKey(d);
}

export default function NewSubscriptionPage() {
  useRouteGuard({ anyRole: ['super_admin', 'center_manager'], redirectTo: '/dashboard' });
  const router = useRouter();
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [packages, setPackages] = useState<ServicePackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedBeneficiary, setSelectedBeneficiary] = useState('');
  const [selectedPackage, setSelectedPackage] = useState('');
  const [sessionsCount, setSessionsCount] = useState('');
  const [amountPaid, setAmountPaid] = useState('');
  const [startDate, setStartDate] = useState(toDateKey(new Date()));
  const [expiryDate, setExpiryDate] = useState(addDays(new Date(), 90));

  useEffect(() => {
    Promise.all([
      apiClient.get<{ data: Beneficiary[] }>('/beneficiaries?limit=200'),
      apiClient.get<{ data: ServicePackage[] }>('/payments/packages?active=true'),
    ])
      .then(([bRes, pRes]) => {
        setBeneficiaries(bRes.data.data);
        setPackages(pRes.data.data);
      })
      .catch(() => toast.error('فشل تحميل البيانات'))
      .finally(() => setLoading(false));
  }, []);

  const onPackageChange = (pkgId: string) => {
    setSelectedPackage(pkgId);
    const pkg = packages.find((p) => p.id === pkgId);
    if (pkg) {
      setSessionsCount(String(pkg.sessionsCount));
      setAmountPaid(pkg.price);
      setExpiryDate(addDays(new Date(startDate), pkg.validityDays || 90));
    }
  };

  const handleSubmit = async () => {
    if (!selectedBeneficiary || !selectedPackage) {
      toast.error('يرجى اختيار المستفيد والباقة');
      return;
    }
    if (!sessionsCount || !amountPaid) {
      toast.error('يرجى تحديد عدد الجلسات والمبلغ');
      return;
    }
    setSaving(true);
    try {
      await apiClient.post('/payments/subscriptions', {
        beneficiaryId: selectedBeneficiary,
        packageId: selectedPackage,
        sessionsCount: Number(sessionsCount),
        amountPaid: Number(amountPaid),
        startDate,
        expiryDate,
      });
      toast.success('تم إنشاء الاشتراك');
      router.push('/dashboard/payments');
    } catch {
      toast.error('فشل إنشاء الاشتراك');
    } finally {
      setSaving(false);
    }
  };

  const onStartDateChange = (date: string) => {
    setStartDate(date);
    const pkg = packages.find((p) => p.id === selectedPackage);
    if (pkg) {
      setExpiryDate(addDays(new Date(date), pkg.validityDays || 90));
    }
  };

  const filteredBeneficiaries = beneficiaries.filter(
    (b) => `${b.firstName} ${b.lastName}`.toLowerCase().includes(search.toLowerCase()),
  );

  if (loading) return <PageLoader />;

  return (
    <PermissionGate permission="payment:create" fallback={
      <div className="text-center py-12" style={{ color: 'var(--text-secondary)' }}>ليس لديك صلاحية إنشاء اشتراكات</div>
    }>
      <div className="max-w-xl space-y-5">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>اشتراك جديد</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>إنشاء اشتراك جديد لمستفيد</p>
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
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>الباقة *</label>
              <select value={selectedPackage} onChange={(e) => onPackageChange(e.target.value)}
                className="w-full text-sm border px-3 py-2 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" style={{ borderColor: 'var(--border)' }}>
                <option value="">اختر باقة...</option>
                {packages.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} - {formatCurrency(Number(p.price))} ({p.sessionsCount} جلسات)
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>عدد الجلسات *</label>
                <input type="number" value={sessionsCount} onChange={(e) => setSessionsCount(e.target.value)}
                  className="w-full text-sm border px-3 py-2 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" style={{ borderColor: 'var(--border)' }} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>المبلغ المدفوع *</label>
                <input type="number" value={amountPaid} onChange={(e) => setAmountPaid(e.target.value)}
                  className="w-full text-sm border px-3 py-2 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" style={{ borderColor: 'var(--border)' }} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>تاريخ البداية *</label>
                <input type="date" value={startDate} onChange={(e) => onStartDateChange(e.target.value)}
                  className="w-full text-sm border px-3 py-2 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" style={{ borderColor: 'var(--border)' }} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>تاريخ الانتهاء *</label>
                <input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)}
                  className="w-full text-sm border px-3 py-2 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" style={{ borderColor: 'var(--border)' }} />
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button onClick={() => router.push('/dashboard/payments')}
                className="text-sm border px-4 py-2 rounded-2xl hover:bg-[var(--surface)] transition" style={{ borderColor: 'var(--border)' }}>إلغاء</button>
              <button onClick={handleSubmit} disabled={saving}
                className="text-sm text-white px-4 py-2 rounded-2xl hover:brightness-90 transition disabled:opacity-50" style={{ backgroundColor: 'var(--primary)' }}>
                {saving ? 'جاري الإنشاء...' : 'إنشاء الاشتراك'}
              </button>
            </div>
          </div>
        </Card>
      </div>
    </PermissionGate>
  );
}
