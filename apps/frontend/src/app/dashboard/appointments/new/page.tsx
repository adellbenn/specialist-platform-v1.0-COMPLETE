'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowRight, Save, Loader2, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import { useRouteGuard }       from '@/components/auth/route-guard';
import { Card, SectionHeader } from '@/components/ui/card';
import { Input }               from '@/components/ui/input';
import { Select }              from '@/components/ui/select';
import { Textarea }            from '@/components/ui/textarea';
import { appointmentsService } from '@/services/appointments.service';
import { beneficiariesService } from '@/services/beneficiaries.service';
import apiClient               from '@/lib/api-client';
import { Beneficiary }         from '@/types';

const schema = z.object({
  beneficiaryId:   z.string().uuid('اختر المستفيد'),
  specialistId:    z.string().uuid('اختر الأخصائي'),
  scheduledAt:     z.string().min(1, 'التاريخ والوقت مطلوبان'),
  durationMinutes: z.coerce.number().min(15).max(240).optional(),
  type:            z.enum(['initial', 'follow_up', 'assessment', 'group']).optional(),
  location:        z.string().optional(),
  notes:           z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const TYPE_OPTIONS = [
  { value: 'initial',    label: 'جلسة أولى' },
  { value: 'follow_up',  label: 'متابعة' },
  { value: 'assessment', label: 'تقييم' },
  { value: 'group',      label: 'جماعية' },
];

const DURATION_OPTIONS = [
  { value: '30',  label: '30 دقيقة' },
  { value: '45',  label: '45 دقيقة' },
  { value: '60',  label: 'ساعة كاملة' },
  { value: '90',  label: 'ساعة ونصف' },
  { value: '120', label: 'ساعتان' },
];

export default function NewAppointmentPage() {
  useRouteGuard({ permission: 'appointment:create', redirectTo: '/dashboard/appointments' });

  const router = useRouter();
  const [saving, setSaving]         = useState(false);
  const [beneficiaries, setBeneficiaries] = useState<Array<{ value: string; label: string }>>([]);
  const [specialists, setSpecialists]     = useState<Array<{ value: string; label: string }>>([]);

  const { register, handleSubmit, formState: { errors, isDirty } } =
    useForm<FormData>({
      resolver: zodResolver(schema),
      defaultValues: { durationMinutes: 60, type: 'follow_up' },
    });

  // جلب قوائم المستفيدين والأخصائيين
  useEffect(() => {
    Promise.all([
      beneficiariesService.getAll({ status: 'active', limit: 100 }),
      apiClient.get<{ data: any[] }>('/users?role=specialist&limit=100'),
    ]).then(([bRes, sRes]) => {
      setBeneficiaries(
        bRes.data.data.map((b: Beneficiary) => ({
          value: b.id,
          label: `${b.firstName} ${b.lastName} (${b.fileNumber})`,
        })),
      );
      setSpecialists(
        (sRes.data.data ?? []).map((s: any) => ({
          value: s.id,
          label: `${s.firstName} ${s.lastName}`,
        })),
      );
    }).catch(() => toast.error('فشل تحميل البيانات'));
  }, []);

  const onSubmit = async (data: FormData) => {
    setSaving(true);
    try {
      const res = await appointmentsService.create({
        ...data,
        scheduledAt: new Date(data.scheduledAt).toISOString(),
      });
      toast.success('تم إنشاء الموعد بنجاح');
      router.push(`/dashboard/appointments/${res.data.data.id}`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'فشل إنشاء الموعد');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 rounded-2xl hover:bg-surface-secondary text-text-secondary transition">
          <ArrowRight size={18} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-text-primary">موعد جديد</h1>
          <p className="text-sm text-text-muted mt-0.5">جدولة موعد لمستفيد</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <Card>
          <SectionHeader icon={Calendar} title="تفاصيل الموعد" iconColor="text-primary" />
          <div className="space-y-4">
            <Select
              label="المستفيد"
              required
              placeholder="اختر المستفيد"
              options={beneficiaries}
              error={errors.beneficiaryId?.message}
              {...register('beneficiaryId')}
            />
            <Select
              label="الأخصائي"
              required
              placeholder="اختر الأخصائي"
              options={specialists}
              error={errors.specialistId?.message}
              {...register('specialistId')}
            />
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Input
                  label="التاريخ والوقت"
                  type="datetime-local"
                  required
                  error={errors.scheduledAt?.message}
                  min={(() => {
                    const n = new Date();
                    const pad = (v: number) => String(v).padStart(2, '0');
                    return `${n.getFullYear()}-${pad(n.getMonth() + 1)}-${pad(n.getDate())}T${pad(n.getHours())}:${pad(n.getMinutes())}`;
                  })()}
                  {...register('scheduledAt')}
                />
              </div>
              <Select
                label="مدة الجلسة"
                options={DURATION_OPTIONS}
                {...register('durationMinutes')}
              />
              <Select
                label="نوع الجلسة"
                options={TYPE_OPTIONS}
                {...register('type')}
              />
            </div>
            <Input
              label="الموقع"
              placeholder="غرفة 1، العيادة الرئيسية..."
              {...register('location')}
            />
            <Textarea
              label="ملاحظات"
              placeholder="أي ملاحظات إضافية..."
              rows={3}
              {...register('notes')}
            />
          </div>
        </Card>

        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => router.back()}
            className="px-5 py-2.5 text-sm border border-border rounded-lg hover:bg-surface-secondary">
            إلغاء
          </button>
          <button type="submit" disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 text-sm font-semibold bg-primary text-white rounded-lg hover:bg-primary-hover disabled:opacity-60 transition">
            {saving
              ? <><Loader2 size={15} className="animate-spin" /> جاري الحفظ...</>
              : <><Save size={15} /> حفظ الموعد</>}
          </button>
        </div>
      </form>
    </div>
  );
}
