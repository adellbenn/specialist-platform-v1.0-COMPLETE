'use client';

import { useState, useEffect, useCallback } from 'react';
import { Package, Plus, Edit3, ToggleLeft, ToggleRight } from 'lucide-react';
import apiClient from '@/lib/api-client';
import { PageLoader } from '@/components/ui/spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { Card } from '@/components/ui/card';
import { useRouteGuard } from '@/components/auth/route-guard';
import { formatCurrency, cn } from '@/lib/utils';
import toast from 'react-hot-toast';

interface ServicePackage {
  id: string;
  name: string;
  description: string | null;
  price: string;
  sessionsCount: number;
  validityDays: number;
  isActive: boolean;
  createdAt: string;
}

export default function PackagesPage() {
  useRouteGuard({ anyRole: ['super_admin', 'center_manager', 'accountant'], redirectTo: '/dashboard' });
  const [packages, setPackages] = useState<ServicePackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ServicePackage | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [sessionsCount, setSessionsCount] = useState('');
  const [validityDays, setValidityDays] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchPackages = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get<{ data: ServicePackage[] }>('/payments/packages');
      setPackages(res.data.data);
    } catch {
      setPackages([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPackages(); }, [fetchPackages]);

  const resetForm = () => {
    setName('');
    setDescription('');
    setPrice('');
    setSessionsCount('');
    setValidityDays('');
    setEditing(null);
    setShowForm(false);
  };

  const openEdit = (pkg: ServicePackage) => {
    setName(pkg.name);
    setDescription(pkg.description || '');
    setPrice(pkg.price);
    setSessionsCount(String(pkg.sessionsCount));
    setValidityDays(String(pkg.validityDays));
    setEditing(pkg);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!name || !price || !sessionsCount || !validityDays) {
      toast.error('يرجى ملء جميع الحقول المطلوبة');
      return;
    }
    setSaving(true);
    try {
      const body = { name, description, price: Number(price), sessionsCount: Number(sessionsCount), validityDays: Number(validityDays) };
      if (editing) {
        await apiClient.put(`/payments/packages/${editing.id}`, body);
        toast.success('تم تحديث الباقة');
      } else {
        await apiClient.post('/payments/packages', body);
        toast.success('تم إنشاء الباقة');
      }
      resetForm();
      fetchPackages();
    } catch {
      toast.error('فشل حفظ الباقة');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (pkg: ServicePackage) => {
    try {
      await apiClient.put(`/payments/packages/${pkg.id}`, { isActive: !pkg.isActive });
      toast.success(`تم ${pkg.isActive ? 'تعطيل' : 'تفعيل'} الباقة`);
      fetchPackages();
    } catch {
      toast.error('فشل تحديث الحالة');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Package size={20} style={{ color: 'var(--primary)' }} />
          <div>
            <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>إدارة الباقات</h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>{packages.length} باقة خدمية</p>
          </div>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-1.5 text-white text-sm px-4 py-2 rounded-2xl hover:brightness-90 transition" style={{ backgroundColor: 'var(--primary)' }}>
          <Plus size={14} /> باقة جديدة
        </button>
      </div>

      {showForm && (
        <Card>
          <div className="space-y-4">
            <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>{editing ? 'تعديل الباقة' : 'باقة جديدة'}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>اسم الباقة *</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                  className="w-full text-sm border px-3 py-2 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" style={{ borderColor: 'var(--border)' }} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>السعر *</label>
                <input type="number" value={price} onChange={(e) => setPrice(e.target.value)}
                  className="w-full text-sm border px-3 py-2 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" style={{ borderColor: 'var(--border)' }} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>عدد الجلسات *</label>
                <input type="number" value={sessionsCount} onChange={(e) => setSessionsCount(e.target.value)}
                  className="w-full text-sm border px-3 py-2 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" style={{ borderColor: 'var(--border)' }} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>الصلاحية (أيام) *</label>
                <input type="number" value={validityDays} onChange={(e) => setValidityDays(e.target.value)}
                  className="w-full text-sm border px-3 py-2 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" style={{ borderColor: 'var(--border)' }} />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>الوصف</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2}
                  className="w-full text-sm border px-3 py-2 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" style={{ borderColor: 'var(--border)' }} />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={resetForm}
                className="text-sm border px-4 py-2 rounded-2xl hover:bg-[var(--surface)] transition" style={{ borderColor: 'var(--border)' }}>إلغاء</button>
              <button onClick={handleSave} disabled={saving}
                className="text-sm text-white px-4 py-2 rounded-2xl hover:brightness-90 transition disabled:opacity-50" style={{ backgroundColor: 'var(--primary)' }}>
                {saving ? 'جاري الحفظ...' : editing ? 'تحديث' : 'إنشاء'}
              </button>
            </div>
          </div>
        </Card>
      )}

      {loading ? (
        <PageLoader />
      ) : packages.length === 0 && !showForm ? (
        <EmptyState icon={Package} title="لا توجد باقات" description="أنشئ باقات خدمية لتسهيل الاشتراكات"
          action={
            <button onClick={() => setShowForm(true)}
              className="flex items-center gap-2 text-white text-sm px-4 py-2 rounded-2xl" style={{ backgroundColor: 'var(--primary)' }}>
              <Plus size={14} /> باقة جديدة
            </button>
          }
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {packages.map((pkg) => (
            <div key={pkg.id} className={cn('rounded-xl border p-5', !pkg.isActive && 'opacity-60')} style={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)' }}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{pkg.name}</p>
                  {pkg.description && <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{pkg.description}</p>}
                </div>
                <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', pkg.isActive ? 'bg-[var(--status-success-light)] text-[var(--status-success-text)]' : 'bg-[var(--surface)] text-[var(--text-secondary)]')}>
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
                  <span style={{ color: 'var(--text-secondary)' }}>سعر الجلسة</span>
                  <span className="font-medium">{formatCurrency(Number(pkg.price) / pkg.sessionsCount)}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: 'var(--text-secondary)' }}>الصلاحية</span>
                  <span className="font-medium">{pkg.validityDays} يوم</span>
                </div>
              </div>
              <div className="flex gap-2 mt-4 pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
                <button onClick={() => openEdit(pkg)}
                  className="flex items-center gap-1 text-xs border px-3 py-1.5 rounded-2xl hover:bg-[var(--surface)] transition" style={{ color: 'var(--text-secondary)', borderColor: 'var(--border)' }}>
                  <Edit3 size={12} /> تعديل
                </button>
                <button onClick={() => toggleActive(pkg)}
                  className="flex items-center gap-1 text-xs border px-3 py-1.5 rounded-2xl hover:bg-[var(--surface)] transition" style={{ color: 'var(--text-secondary)', borderColor: 'var(--border)' }}>
                  {pkg.isActive ? <ToggleLeft size={12} /> : <ToggleRight size={12} />}
                  {pkg.isActive ? 'تعطيل' : 'تفعيل'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
